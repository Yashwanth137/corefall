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
    gameState.wave = index + 1;
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

    // Create an invisible Arcade physics ghost
    const enemy = this.enemies.create(x, y, null);
    if (!enemy) return;
    enemy.setVisible(false);

    // The physics body should match the visual size
    enemy.setCircle(data.radius || 12);
    enemy.setOffset(16 - (data.radius || 12), 16 - (data.radius || 12));

    // Assign rendering configs directly onto enemy
    enemy.renderData = {
      shape: data.shape || 'triangle',
      thick: data.thick || false,
      color: data.color || 0xff0000,
      radius: data.radius || 12
    };

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
    if (data.behavior === 'line_runner') {
      const terrain = this.scene.terrainSystem;
      const snapped = terrain?.getClosestPointOnGrid(enemy.x, enemy.y);
      if (snapped) {
        enemy.setPosition(snapped.x, snapped.y);
      }
      enemy.nextGridRetarget = 0;
    }
    if (data.behavior === 'ranged') {
      enemy.shootRate = data.shootRate;
      enemy.lastShot = 0;
      enemy.bulletSpeed = data.bulletSpeed;
      enemy.stopDistance = data.stopDistance;
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
    
    // Dynamically fetch from terrain system if present, otherwise default
    const b = (this.scene.terrainSystem && this.scene.terrainSystem.bounds) 
        ? this.scene.terrainSystem.bounds 
        : { w: 800, h: 600 };

    switch (side) {
      case 0: x = -margin; y = Phaser.Math.Between(0, b.h); break; // Left
      case 1: x = b.w + margin; y = Phaser.Math.Between(0, b.h); break; // Right
      case 2: x = Phaser.Math.Between(0, b.w); y = -margin; break; // Top
      case 3: x = Phaser.Math.Between(0, b.w); y = b.h + margin; break; // Bottom
    }
    return { x, y };
  }

  onEnemyKilled(enemy) {
    this.totalKilledThisLevel++;
    gameState.addKill(enemy.score || 10);
    gameState.enemiesRemaining = this.enemies.countActive();

    if (enemy.isBoss) {
      this.bossAlive = false;
      this.scene.events.emit('boss-killed', enemy);
    }
    
    // Strict FSM: prevent multi-triggering
    if (this.levelComplete) return;

    // Check level complete
    if (this.isLevelComplete()) {
      this.levelComplete = true;
      
      gameState.level++; // Only increment here!
      gameState.wave = 1;
      gameState.isUpgradePhase = true;
      gameState.enemiesRemaining = 0;
      
      console.log("=== LEVEL PROGRESSION TRACE ===");
      console.log("LEVEL:", gameState.level);
      console.log("WAVE:", gameState.wave);
      console.log("ENEMIES LEFT:", gameState.enemiesRemaining);
      console.log("UPGRADE PHASE:", gameState.isUpgradePhase);
      
      this.scene.events.emit('level-complete');
    } else if (!this.waveActive && this.enemies.countActive() === 0) {
      // Start the next beat only after the arena is fully cleared.
      if (this.currentWaveIndex < this.config.waves.length - 1) {
        this.scene.time.delayedCall(1000, () => {
          this.startWave(this.currentWaveIndex + 1);
        });
      } else if (this.config.boss && !this.bossSpawned) {
        this.scene.time.delayedCall(1000, () => {
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

      case 'line_runner':
        this.moveEnemyAlongGrid(enemy, px, py, delta);
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

      case 'ranged':
        if (dist > enemy.stopDistance + 30) {
          enemy.body.setVelocity(
            Math.cos(angle) * enemy.speed,
            Math.sin(angle) * enemy.speed
          );
        } else if (dist < enemy.stopDistance - 60) {
          enemy.body.setVelocity(
            -Math.cos(angle) * enemy.speed,
            -Math.sin(angle) * enemy.speed
          );
        } else {
          enemy.body.setVelocity(0, 0);
        }
        enemy.facingAngle = angle;

        if (time - enemy.lastShot > enemy.shootRate && dist < 500) {
          enemy.lastShot = time;
          this.scene.events.emit('boss-shoot', enemy, angle);
        }
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

  moveEnemyAlongGrid(enemy, targetX, targetY, delta) {
    const terrain = this.scene.terrainSystem;
    if (!terrain || delta <= 0) {
      enemy.body.setVelocity(0, 0);
      return;
    }

    const enemyGrid = terrain.getClosestPointOnGrid(enemy.x, enemy.y);
    const targetGrid = terrain.getClosestPointOnGrid(targetX, targetY);
    const angle = Phaser.Math.Angle.Between(enemyGrid.x, enemyGrid.y, targetGrid.x, targetGrid.y);
    const dt = delta / 1000;
    const step = enemy.speed * dt;
    const next = terrain.getClosestPointOnGrid(
      enemyGrid.x + Math.cos(angle) * step,
      enemyGrid.y + Math.sin(angle) * step
    );

    enemy.body.setVelocity(
      (next.x - enemy.x) / dt,
      (next.y - enemy.y) / dt
    );
    enemy.facingAngle = Math.atan2(next.y - enemy.y, next.x - enemy.x);
  }

  destroy() {
    if (this.spawnTimer) this.spawnTimer.destroy();
  }
}
