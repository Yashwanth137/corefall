/**
 * WaveSystem.js
 * Manages enemy wave spawning per level.
 * Tracks wave completion and signals level-complete.
 */

import * as Phaser from 'phaser';
import { getLevelConfig } from '../data/LevelConfig.js';
import { getEnemyData } from '../data/EnemyData.js';
import gameState from '../managers/GameState.js';

export default class WaveSystem {
  constructor(scene, enemies, player) {
    this.scene = scene;
    this.enemies = enemies;
    this.player = player;

    this.config = getLevelConfig(gameState.level);
    this.currentWaveIndex = 0;
    this.spawnTimer = null;
    this.spawned = 0;
    this.totalToSpawn = 0;
    this.totalKilledThisLevel = 0;
    this.totalEnemiesThisLevel = 0;
    this.waveActive = false;
    this.levelComplete = false;
    this.bossSpawned = false;
    this.bossAlive = false;

    // Calculate total enemies across all waves
    this.totalEnemiesThisLevel = this.config.waves.reduce((sum, w) => sum + w.count, 0);
    if (this.config.boss) {
      this.totalEnemiesThisLevel += 1; // Boss counts as 1
    }
  }

  start() {
    this.currentWaveIndex = 0;
    this.totalKilledThisLevel = 0;
    this.levelComplete = false;
    this.bossSpawned = false;
    this.bossAlive = false;
    this.startWave(0);
  }

  startWave(index) {
    if (index >= this.config.waves.length) {
      // All normal waves done — spawn boss if applicable
      if (this.config.boss && !this.bossSpawned) {
        this.spawnBoss();
      }
      return;
    }

    this.currentWaveIndex = index;
    this.waveActive = true;
    this.spawned = 0;

    const wave = this.config.waves[index];
    this.totalToSpawn = wave.count;

    this.spawnTimer = this.scene.time.addEvent({
      delay: wave.delay,
      repeat: wave.count - 1,
      callback: () => {
        this.spawnEnemy(wave.enemyType);
        this.spawned++;
        if (this.spawned >= this.totalToSpawn) {
          this.waveActive = false;
        }
      }
    });
  }

  spawnEnemy(type) {
    const data = getEnemyData(type);
    const { x, y } = this.getSpawnPosition();

    const enemy = this.enemies.create(x, y, null);
    if (!enemy) return;

    enemy.setCircle(data.radius);
    enemy.enemyType = type;
    enemy.enemyData = data;
    enemy.hp = data.hp;
    enemy.maxHp = data.hp;
    enemy.speed = data.speed;
    enemy.damage = data.damage;
    enemy.score = data.score;
    enemy.isBoss = data.isBoss || false;
    enemy.behavior = data.behavior;
    enemy.deathParticles = data.deathParticles;
    enemy.enemyColor = data.color;
    enemy.glowColor = data.glowColor;

    // Behavior-specific state
    if (data.behavior === 'dash_charge') {
      enemy.dashCooldownTimer = data.dashCooldown;
      enemy.dashDuration = data.dashDuration;
      enemy.dashSpeed = data.dashSpeed;
      enemy.isDashing = false;
      enemy.dashTimer = 0;
    }
    if (data.behavior === 'shielded') {
      enemy.shieldArc = data.shieldArc;
    }
    if (data.behavior === 'swarm') {
      enemy.jitter = data.jitter;
    }
    if (data.behavior === 'boss_sentinel') {
      enemy.shootRate = data.shootRate;
      enemy.lastShot = 0;
      enemy.bulletSpeed = data.bulletSpeed;
    }
    if (data.behavior === 'boss_titan') {
      enemy.phase = 1;
      enemy.phase2Hp = data.phase2Hp;
      enemy.summonType = data.summonType;
      enemy.summonCount = data.summonCount;
      enemy.summonCooldown = data.summonCooldown;
      enemy.lastSummon = 0;
      enemy.spinTimer = 0;
    }

    return enemy;
  }

  spawnBoss() {
    this.bossSpawned = true;
    this.bossAlive = true;
    const { x, y } = this.getSpawnPosition();
    const boss = this.spawnEnemy(this.config.boss.type);
    if (boss) {
      boss.hp = this.config.boss.hp;
      boss.maxHp = this.config.boss.hp;
      boss.speed = this.config.boss.speed;
      this.scene.events.emit('boss-spawn', boss);
    }
  }

  getSpawnPosition() {
    const side = Phaser.Math.Between(0, 3);
    let x, y;
    const margin = 30;
    switch (side) {
      case 0: x = -margin; y = Phaser.Math.Between(0, 600); break;
      case 1: x = 800 + margin; y = Phaser.Math.Between(0, 600); break;
      case 2: x = Phaser.Math.Between(0, 800); y = -margin; break;
      case 3: x = Phaser.Math.Between(0, 800); y = 600 + margin; break;
    }
    return { x, y };
  }

  onEnemyKilled(enemy) {
    this.totalKilledThisLevel++;
    gameState.addKill(enemy.score || 10);

    if (enemy.isBoss) {
      this.bossAlive = false;
      this.scene.events.emit('boss-killed', enemy);
    }

    // Check level complete
    if (this.isLevelComplete()) {
      this.levelComplete = true;
      this.scene.events.emit('level-complete');
    } else if (!this.waveActive && this.enemies.countActive() <= 1) {
      // Start next wave when current enemies are nearly cleared
      if (this.currentWaveIndex < this.config.waves.length - 1) {
        this.scene.time.delayedCall(800, () => {
          this.startWave(this.currentWaveIndex + 1);
        });
      } else if (this.config.boss && !this.bossSpawned) {
        this.scene.time.delayedCall(1500, () => {
          this.spawnBoss();
        });
      }
    }
  }

  isLevelComplete() {
    if (this.config.boss) {
      return this.bossSpawned && !this.bossAlive && this.enemies.countActive() === 0;
    }
    return this.totalKilledThisLevel >= this.totalEnemiesThisLevel && this.enemies.countActive() === 0;
  }

  update(time, delta) {
    // Update enemy AI behaviors
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      this.updateEnemyBehavior(enemy, time, delta);
    });
  }

  updateEnemyBehavior(enemy, time, delta) {
    const px = this.player.x;
    const py = this.player.y;
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, px, py);
    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, px, py);

    switch (enemy.behavior) {
      case 'chase':
        enemy.body.setVelocity(
          Math.cos(angle) * enemy.speed,
          Math.sin(angle) * enemy.speed
        );
        break;

      case 'dash_charge':
        if (enemy.isDashing) {
          enemy.dashTimer -= delta;
          if (enemy.dashTimer <= 0) {
            enemy.isDashing = false;
          }
        } else {
          enemy.dashCooldownTimer -= delta;
          if (enemy.dashCooldownTimer <= 0 && dist < 250) {
            // Dash!
            enemy.isDashing = true;
            enemy.dashTimer = enemy.dashDuration;
            enemy.dashCooldownTimer = enemy.enemyData.dashCooldown;
            enemy.body.setVelocity(
              Math.cos(angle) * enemy.dashSpeed,
              Math.sin(angle) * enemy.dashSpeed
            );
          } else {
            // Slow approach
            enemy.body.setVelocity(
              Math.cos(angle) * (enemy.speed * 0.5),
              Math.sin(angle) * (enemy.speed * 0.5)
            );
          }
        }
        break;

      case 'shielded':
        enemy.body.setVelocity(
          Math.cos(angle) * enemy.speed,
          Math.sin(angle) * enemy.speed
        );
        enemy.facingAngle = angle;
        break;

      case 'swarm':
        const jx = (Math.random() - 0.5) * enemy.jitter;
        const jy = (Math.random() - 0.5) * enemy.jitter;
        enemy.body.setVelocity(
          Math.cos(angle) * enemy.speed + jx,
          Math.sin(angle) * enemy.speed + jy
        );
        break;

      case 'boss_sentinel':
        // Chase and shoot
        enemy.body.setVelocity(
          Math.cos(angle) * enemy.speed,
          Math.sin(angle) * enemy.speed
        );
        if (time - enemy.lastShot > enemy.shootRate && dist < 350) {
          enemy.lastShot = time;
          this.scene.events.emit('boss-shoot', enemy, angle);
        }
        break;

      case 'boss_titan':
        // Phase 1: slow chase, summon adds
        // Phase 2 (below half HP): faster, spin attack
        if (enemy.hp <= enemy.phase2Hp && enemy.phase === 1) {
          enemy.phase = 2;
          enemy.speed *= 1.5;
          this.scene.events.emit('titan-phase2', enemy);
        }
        enemy.body.setVelocity(
          Math.cos(angle) * enemy.speed,
          Math.sin(angle) * enemy.speed
        );
        // Summon adds
        if (time - enemy.lastSummon > enemy.summonCooldown) {
          enemy.lastSummon = time;
          this.scene.events.emit('titan-summon', enemy);
        }
        break;

      default:
        enemy.body.setVelocity(
          Math.cos(angle) * enemy.speed,
          Math.sin(angle) * enemy.speed
        );
    }
  }

  destroy() {
    if (this.spawnTimer) this.spawnTimer.destroy();
  }
}
