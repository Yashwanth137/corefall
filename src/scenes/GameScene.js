/**
 * GameScene.js
 * Core gameplay scene — SLIM orchestrator that delegates to systems.
 * Handles: player creation, physics groups, collision, rendering, game events.
 */

import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';
import MovementSystem from '../systems/MovementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import WaveSystem from '../systems/WaveSystem.js';
import HUD from '../ui/HUD.js';
import { getLevelConfig } from '../data/LevelConfig.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;

    // --- Arena background ---
    const cfg = getLevelConfig(gameState.level);
    this.add.rectangle(width / 2, height / 2, width, height, cfg.arenaColor);

    // Grid overlay
    this.drawGrid();

    // --- Level announcement ---
    this.showLevelAnnouncement(cfg);

    // --- Player ---
    this.player = this.physics.add.sprite(width / 2, height / 2, null);
    this.player.setCircle(16);
    this.player.setCollideWorldBounds(true);
    this.player.aimAngle = 0;
    this.player._invincible = false;
    this.player._hitFlashTimer = 0;

    // --- Physics groups ---
    this.bullets = this.physics.add.group({ runChildUpdate: false });
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.enemyBullets = this.physics.add.group({ runChildUpdate: false });

    // --- Systems ---
    this.movementSystem = new MovementSystem(this, this.player);
    this.combatSystem = new CombatSystem(this, this.player, this.bullets, this.enemies);
    this.waveSystem = new WaveSystem(this, this.enemies, this.player);
    this.hud = new HUD(this);

    // --- Graphics layer ---
    this.gfx = this.add.graphics().setDepth(10);

    // --- Regen timer ---
    if (gameState.regenRate > 0) {
      this.time.addEvent({
        delay: gameState.regenRate,
        loop: true,
        callback: () => gameState.heal(gameState.regenAmount)
      });
    }

    // --- Shield timer ---
    if (gameState.shieldActive) {
      gameState._shieldReady = true;
      this.time.addEvent({
        delay: gameState.shieldCooldown,
        loop: true,
        callback: () => { gameState._shieldReady = true; }
      });
    }

    // --- Collisions ---
    // Bullet → Enemy
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      this.handleBulletEnemyCollision(bullet, enemy);
    });

    // Enemy → Player
    this.damageCooldown = 0;
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      this.handleEnemyPlayerCollision(player, enemy);
    });

    // Enemy bullets → Player
    this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
      bullet.destroy();
      this.damagePlayer(15);
    });

    // --- Game Events ---
    this.events.on('enemy-hit', (enemy, damage) => {
      this.damageEnemy(enemy, damage);
    });

    this.events.on('level-complete', () => {
      this.time.delayedCall(1000, () => {
        if (gameState.level >= 10) {
          this.scene.start('VictoryScene');
        } else {
          gameState.nextLevel();
          this.scene.start('UpgradeScene');
        }
      });
    });

    this.events.on('boss-spawn', (boss) => {
      this.hud.showBossHp(boss.enemyData.name, boss.hp, boss.maxHp);
      this.showBossWarning(boss.enemyData.name);
    });

    this.events.on('boss-killed', () => {
      this.hud.hideBossHp();
    });

    this.events.on('boss-shoot', (boss, angle) => {
      this.createEnemyBullet(boss.x, boss.y, angle, boss.bulletSpeed || 200);
    });

    this.events.on('titan-summon', (titan) => {
      for (let i = 0; i < (titan.summonCount || 3); i++) {
        this.waveSystem.spawnEnemy(titan.summonType || 'drone');
      }
    });

    this.events.on('titan-phase2', () => {
      this.cameras.main.shake(300, 0.01);
    });

    this.events.on('katana-swing', (x, y, angle, range, arc) => {
      this.katanaSwingVisual = { x, y, angle, range, arc, timer: 200 };
    });

    this.events.on('muzzle-flash', (x, y, angle) => {
      this.muzzleFlash = { x, y, angle, timer: 60 };
    });

    this.events.on('overcharge-activated', () => {
      this.cameras.main.flash(200, 255, 200, 0);
    });

    this.events.on('player-dash', (x, y) => {
      this.dashTrails.push({ x, y, alpha: 0.6 });
    });

    // --- Particle/visual state ---
    this.deathParticles = [];
    this.damageNumbers = [];
    this.dashTrails = [];
    this.katanaSwingVisual = null;
    this.muzzleFlash = null;

    // --- Start waves ---
    this.time.delayedCall(1500, () => {
      this.waveSystem.start();
    });

    this.gameActive = true;
  }

  drawGrid() {
    const grid = this.add.graphics().setDepth(0);
    grid.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x <= 800; x += 40) {
      grid.moveTo(x, 0);
      grid.lineTo(x, 600);
    }
    for (let y = 0; y <= 600; y += 40) {
      grid.moveTo(0, y);
      grid.lineTo(800, y);
    }
    grid.strokePath();
  }

  showLevelAnnouncement(cfg) {
    const title = this.add.text(400, 260, `LEVEL ${cfg.level}`, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    const sub = this.add.text(400, 300, cfg.name, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '18px',
      color: '#88aacc',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    const sub2 = this.add.text(400, 325, cfg.subtitle, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '12px',
      color: '#556677',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    // Fade in-out animation
    this.tweens.add({
      targets: [title, sub, sub2],
      alpha: 1,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [title, sub, sub2],
          alpha: 0,
          duration: 600,
          delay: 800,
          ease: 'Quad.easeIn',
          onComplete: () => {
            title.destroy();
            sub.destroy();
            sub2.destroy();
          }
        });
      }
    });
  }

  showBossWarning(name) {
    const warn = this.add.text(400, 280, `⚠ ${name.toUpperCase()} ⚠`, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ff2244',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.cameras.main.shake(500, 0.008);

    this.tweens.add({
      targets: warn,
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => warn.destroy()
    });
  }

  createEnemyBullet(x, y, angle, speed) {
    const bullet = this.enemyBullets.create(x, y, null);
    if (!bullet) return;
    bullet.setCircle(4);
    bullet.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    bullet.spawnTime = this.time.now;
    bullet.lifespan = 3000;
    bullet.bulletColor = 0xff4466;
  }

  handleBulletEnemyCollision(bullet, enemy) {
    const damage = bullet.damage || 1;

    // Shielded enemy: check hit angle
    if (enemy.behavior === 'shielded' && enemy.facingAngle !== undefined) {
      const hitAngle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
      const diff = Math.abs(Phaser.Math.Angle.Wrap(hitAngle - enemy.facingAngle));
      if (diff > enemy.shieldArc / 2) {
        // Hit from behind/side — normal damage
        this.damageEnemy(enemy, damage);
      } else {
        // Shield blocked — bullet reflected
        this.spawnDamageNumber(enemy.x, enemy.y, 'BLOCKED', 0x4488ff);
      }
    } else {
      this.damageEnemy(enemy, damage);
    }

    if (!bullet.pierce) {
      bullet.destroy();
    }
  }

  damageEnemy(enemy, damage) {
    if (!enemy.active) return;
    enemy.hp -= damage;
    enemy._hitFlash = 100;

    this.spawnDamageNumber(enemy.x, enemy.y - 15, damage, 0xffffff);

    if (enemy.isBoss) {
      this.hud.updateBossHp(enemy.hp);
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    // Death particles
    const count = enemy.deathParticles || 4;
    for (let i = 0; i < count; i++) {
      this.deathParticles.push({
        x: enemy.x,
        y: enemy.y,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 400 + Math.random() * 200,
        maxLife: 400 + Math.random() * 200,
        color: enemy.enemyColor || 0xff3333,
        size: 2 + Math.random() * 3
      });
    }

    // Screen shake on kill
    this.cameras.main.shake(80, enemy.isBoss ? 0.015 : 0.003);

    // Save data before destroying — destroy FIRST so countActive() is accurate
    const enemyRef = { score: enemy.score, isBoss: enemy.isBoss, enemyData: enemy.enemyData };
    enemy.destroy();

    this.waveSystem.onEnemyKilled(enemyRef);
    this.combatSystem.onEnemyKilled();
  }

  handleEnemyPlayerCollision(player, enemy) {
    if (player._invincible) return;
    const now = this.time.now;
    if (now - this.damageCooldown < 500) return;
    this.damageCooldown = now;

    const damage = enemy.damage || 10;
    this.damagePlayer(damage);

    // Knockback
    if (gameState.knockbackPower > 0) {
      const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
      enemy.body.setVelocity(
        Math.cos(angle) * -gameState.knockbackPower,
        Math.sin(angle) * -gameState.knockbackPower
      );
    }
  }

  damagePlayer(amount) {
    const actual = gameState.takeDamage(amount);
    if (actual === 0) {
      // Shield blocked
      this.cameras.main.flash(100, 68, 136, 255, true);
      this.spawnDamageNumber(this.player.x, this.player.y - 20, 'SHIELD', 0x4488ff);
      return;
    }

    this.player._hitFlashTimer = 150;
    this.cameras.main.shake(100, 0.005);
    this.cameras.main.flash(80, 255, 50, 50, true);

    if (gameState.hp <= 0) {
      this.gameActive = false;
      this.time.delayedCall(500, () => {
        this.scene.start('GameOverScene');
      });
    }
  }

  spawnDamageNumber(x, y, text, color) {
    this.damageNumbers.push({
      x, y,
      text: String(text),
      color,
      life: 600,
      maxLife: 600
    });
  }

  update(time, delta) {
    if (!this.gameActive) return;

    // Systems update
    this.movementSystem.update(time, delta);
    this.combatSystem.update(time, delta);
    this.waveSystem.update(time, delta);
    this.hud.update(this.waveSystem, this.movementSystem);

    // Hit flash timer
    if (this.player._hitFlashTimer > 0) {
      this.player._hitFlashTimer -= delta;
    }

    // Clean up enemy bullets
    this.enemyBullets.getChildren().forEach(b => {
      if (!b.active) return;
      if (time - b.spawnTime > b.lifespan ||
          b.x < -50 || b.x > 850 || b.y < -50 || b.y > 650) {
        b.destroy();
      }
    });

    // --- Render everything ---
    this.renderAll(time, delta);
  }

  renderAll(time, delta) {
    this.gfx.clear();

    // --- Dash trails ---
    this.dashTrails = this.dashTrails.filter(t => {
      t.alpha -= 0.02;
      if (t.alpha <= 0) return false;
      this.gfx.fillStyle(0x00ffcc, t.alpha * 0.5);
      this.gfx.fillCircle(t.x, t.y, 12);
      return true;
    });

    // --- Player ---
    this.renderPlayer(time);

    // --- Katana swing visual ---
    if (this.katanaSwingVisual) {
      const k = this.katanaSwingVisual;
      k.timer -= delta;
      const alpha = k.timer / 200;
      this.gfx.lineStyle(3, 0xff00ff, alpha * 0.8);
      this.gfx.beginPath();
      this.gfx.arc(k.x, k.y, k.range, k.angle - k.arc / 2, k.angle + k.arc / 2);
      this.gfx.strokePath();
      // Inner arc
      this.gfx.lineStyle(6, 0xff88ff, alpha * 0.4);
      this.gfx.beginPath();
      this.gfx.arc(k.x, k.y, k.range * 0.6, k.angle - k.arc / 2, k.angle + k.arc / 2);
      this.gfx.strokePath();
      if (k.timer <= 0) this.katanaSwingVisual = null;
    }

    // --- Muzzle flash ---
    if (this.muzzleFlash) {
      const m = this.muzzleFlash;
      m.timer -= delta;
      const alpha = m.timer / 60;
      this.gfx.fillStyle(0xffffcc, alpha * 0.8);
      this.gfx.fillCircle(
        m.x + Math.cos(m.angle) * 22,
        m.y + Math.sin(m.angle) * 22,
        4 + alpha * 4
      );
      if (m.timer <= 0) this.muzzleFlash = null;
    }

    // --- Bullets ---
    this.bullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
      const color = bullet.bulletColor || 0xffffff;
      // Trail
      this.gfx.fillStyle(color, 0.3);
      this.gfx.fillCircle(
        bullet.x - bullet.body.velocity.x * 0.02,
        bullet.y - bullet.body.velocity.y * 0.02,
        3
      );
      // Main
      this.gfx.fillStyle(color, 1);
      this.gfx.fillCircle(bullet.x, bullet.y, bullet.pierce ? 5 : 3);
      // Glow
      this.gfx.fillStyle(color, 0.15);
      this.gfx.fillCircle(bullet.x, bullet.y, bullet.pierce ? 10 : 6);
    });

    // --- Enemy bullets ---
    this.enemyBullets.getChildren().forEach(b => {
      if (!b.active) return;
      this.gfx.fillStyle(b.bulletColor || 0xff4466, 1);
      this.gfx.fillCircle(b.x, b.y, 4);
      this.gfx.fillStyle(b.bulletColor || 0xff4466, 0.2);
      this.gfx.fillCircle(b.x, b.y, 8);
    });

    // --- Enemies ---
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      this.renderEnemy(enemy, time);
    });

    // --- Death particles ---
    this.deathParticles = this.deathParticles.filter(p => {
      p.life -= delta;
      if (p.life <= 0) return false;
      p.x += p.vx * (delta / 1000);
      p.y += p.vy * (delta / 1000);
      p.vx *= 0.95;
      p.vy *= 0.95;
      const alpha = p.life / p.maxLife;
      this.gfx.fillStyle(p.color, alpha);
      this.gfx.fillCircle(p.x, p.y, p.size * alpha);
      return true;
    });

    // --- Damage numbers ---
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.life -= delta;
      if (d.life <= 0) return false;
      d.y -= 30 * (delta / 1000);
      const alpha = d.life / d.maxLife;
      // Use text object would be expensive, use graphics
      // We'll use a simple text approach
      return true;
    });
    // Render damage numbers with text (cached)
    this.renderDamageNumbers();
  }

  renderPlayer(time) {
    const p = this.player;
    const angle = p.aimAngle || 0;
    const isHit = p._hitFlashTimer > 0;
    const isDashing = this.movementSystem.isDashing;

    // Outer glow
    const glowPulse = 0.15 + Math.sin(time * 0.003) * 0.05;
    this.gfx.fillStyle(0x00ffcc, glowPulse);
    this.gfx.fillCircle(p.x, p.y, 22);

    // Core body
    this.gfx.fillStyle(isHit ? 0xff4444 : (isDashing ? 0x88ffee : 0x00ffcc), 1);
    this.gfx.fillCircle(p.x, p.y, 14);

    // Inner core
    this.gfx.fillStyle(0xffffff, 0.6);
    this.gfx.fillCircle(p.x, p.y, 6);

    // Inner glow pulse
    const innerPulse = 4 + Math.sin(time * 0.005) * 2;
    this.gfx.fillStyle(0x00ffcc, 0.3);
    this.gfx.fillCircle(p.x, p.y, innerPulse);

    // --- Equipped parts visuals ---

    // Arms visual
    const arms = gameState.parts.arms;
    if (arms === 'dual_blaster') {
      const offsetAngle1 = angle + Math.PI * 0.35;
      const offsetAngle2 = angle - Math.PI * 0.35;
      this.gfx.fillStyle(0x00ff88, 1);
      this.gfx.fillCircle(p.x + Math.cos(offsetAngle1) * 18, p.y + Math.sin(offsetAngle1) * 18, 4);
      this.gfx.fillCircle(p.x + Math.cos(offsetAngle2) * 18, p.y + Math.sin(offsetAngle2) * 18, 4);
      // Barrels
      this.gfx.lineStyle(2, 0x00ff88, 0.8);
      this.gfx.lineBetween(
        p.x + Math.cos(offsetAngle1) * 18, p.y + Math.sin(offsetAngle1) * 18,
        p.x + Math.cos(angle) * 24, p.y + Math.sin(angle) * 24
      );
      this.gfx.lineBetween(
        p.x + Math.cos(offsetAngle2) * 18, p.y + Math.sin(offsetAngle2) * 18,
        p.x + Math.cos(angle) * 24, p.y + Math.sin(angle) * 24
      );
    } else if (arms === 'shotgun') {
      // Wide barrel
      const bx = p.x + Math.cos(angle) * 20;
      const by = p.y + Math.sin(angle) * 20;
      this.gfx.fillStyle(0xff8800, 1);
      this.gfx.fillRect(bx - 4, by - 6, 8, 12);
      this.gfx.lineStyle(1, 0xff8800, 0.6);
      this.gfx.lineBetween(p.x, p.y, bx, by);
    } else if (arms === 'laser') {
      // Laser emitter
      this.gfx.fillStyle(0x00ffff, 1);
      this.gfx.fillCircle(p.x + Math.cos(angle) * 22, p.y + Math.sin(angle) * 22, 5);
      this.gfx.fillStyle(0x00ffff, 0.2);
      this.gfx.fillCircle(p.x + Math.cos(angle) * 22, p.y + Math.sin(angle) * 22, 10);
    } else if (arms === 'missile') {
      // Launcher pod
      this.gfx.fillStyle(0xff4444, 1);
      this.gfx.fillCircle(p.x + Math.cos(angle) * 20, p.y + Math.sin(angle) * 20, 5);
      this.gfx.lineStyle(2, 0xff4444, 0.7);
      this.gfx.lineBetween(p.x, p.y, p.x + Math.cos(angle) * 20, p.y + Math.sin(angle) * 20);
    } else if (arms === 'katana') {
      // Katana blade
      const bladeLen = 35;
      const bx = p.x + Math.cos(angle) * bladeLen;
      const by = p.y + Math.sin(angle) * bladeLen;
      // Blade
      this.gfx.lineStyle(3, 0xff00ff, 0.9);
      this.gfx.lineBetween(p.x + Math.cos(angle) * 14, p.y + Math.sin(angle) * 14, bx, by);
      // Tip glow
      this.gfx.fillStyle(0xff88ff, 0.6);
      this.gfx.fillCircle(bx, by, 3);
      // Handle
      this.gfx.fillStyle(0x884488, 1);
      this.gfx.fillCircle(p.x + Math.cos(angle) * 14, p.y + Math.sin(angle) * 14, 3);
    } else {
      // Default: small barrel
      this.gfx.lineStyle(2, 0xaaaaaa, 0.7);
      this.gfx.lineBetween(p.x, p.y, p.x + Math.cos(angle) * 20, p.y + Math.sin(angle) * 20);
    }

    // Legs visual
    const legs = gameState.parts.legs;
    if (legs === 'wheels') {
      const perpAngle = angle + Math.PI / 2;
      this.gfx.fillStyle(0x88ff00, 0.8);
      this.gfx.fillCircle(p.x + Math.cos(perpAngle) * 14, p.y + Math.sin(perpAngle) * 14, 4);
      this.gfx.fillCircle(p.x - Math.cos(perpAngle) * 14, p.y - Math.sin(perpAngle) * 14, 4);
    } else if (legs === 'jump_jets') {
      const backAngle = angle + Math.PI;
      const jetFlicker = 6 + Math.sin(time * 0.02) * 3;
      this.gfx.fillStyle(0xff8844, 0.6);
      this.gfx.fillCircle(p.x + Math.cos(backAngle) * 16, p.y + Math.sin(backAngle) * 16, jetFlicker);
      this.gfx.fillStyle(0xffcc44, 0.3);
      this.gfx.fillCircle(p.x + Math.cos(backAngle) * 18, p.y + Math.sin(backAngle) * 18, jetFlicker + 3);
    } else if (legs === 'heavy_treads') {
      const perpAngle = angle + Math.PI / 2;
      this.gfx.fillStyle(0x888888, 0.9);
      this.gfx.fillRect(p.x + Math.cos(perpAngle) * 12 - 3, p.y + Math.sin(perpAngle) * 12 - 6, 6, 12);
      this.gfx.fillRect(p.x - Math.cos(perpAngle) * 12 - 3, p.y - Math.sin(perpAngle) * 12 - 6, 6, 12);
    } else if (legs === 'hover') {
      const hoverGlow = 0.3 + Math.sin(time * 0.004) * 0.15;
      this.gfx.fillStyle(0x44ddff, hoverGlow);
      this.gfx.fillCircle(p.x, p.y + 4, 18);
    }

    // Core visual
    const core = gameState.parts.core;
    if (core === 'reactor') {
      this.gfx.fillStyle(0xffff00, 0.3 + Math.sin(time * 0.006) * 0.15);
      this.gfx.fillCircle(p.x, p.y, 18);
    } else if (core === 'shield') {
      if (gameState._shieldReady) {
        this.gfx.lineStyle(2, 0x4488ff, 0.5 + Math.sin(time * 0.004) * 0.2);
        this.gfx.strokeCircle(p.x, p.y, 22);
      }
    } else if (core === 'regen') {
      this.gfx.fillStyle(0x00ff44, 0.1 + Math.sin(time * 0.003) * 0.05);
      this.gfx.fillCircle(p.x, p.y, 20);
    } else if (core === 'overcharge') {
      if (this.combatSystem.overchargeActive) {
        this.gfx.fillStyle(0xff00ff, 0.3 + Math.sin(time * 0.01) * 0.2);
        this.gfx.fillCircle(p.x, p.y, 24);
      }
    } else if (core === 'berserker') {
      const rage = 0.2 + Math.sin(time * 0.008) * 0.1;
      this.gfx.fillStyle(0xff0044, rage);
      this.gfx.fillCircle(p.x, p.y, 20);
      // Fire ring
      this.gfx.lineStyle(2, 0xff2200, rage);
      this.gfx.strokeCircle(p.x, p.y, 22 + Math.sin(time * 0.012) * 3);
    }

    // Aim direction indicator
    this.gfx.lineStyle(1, 0xffffff, 0.15);
    this.gfx.lineBetween(
      p.x + Math.cos(angle) * 25,
      p.y + Math.sin(angle) * 25,
      p.x + Math.cos(angle) * 40,
      p.y + Math.sin(angle) * 40
    );
  }

  renderEnemy(enemy, time) {
    const data = enemy.enemyData || {};
    const radius = data.radius || 10;
    const color = enemy.enemyColor || 0xff3333;
    const glow = enemy.glowColor || color;
    const isHit = enemy._hitFlash > 0;

    if (isHit) {
      enemy._hitFlash -= 16;
    }

    // Glow
    this.gfx.fillStyle(glow, 0.15);
    this.gfx.fillCircle(enemy.x, enemy.y, radius + 6);

    // Main body
    this.gfx.fillStyle(isHit ? 0xffffff : color, 1);

    if (enemy.isBoss) {
      // Boss: hexagonal shape
      this.drawPolygon(enemy.x, enemy.y, radius, 6, time * 0.001);
      // Inner ring
      this.gfx.lineStyle(2, 0xffffff, 0.3);
      this.gfx.strokeCircle(enemy.x, enemy.y, radius * 0.6);
      // HP bar above boss
      const hpPct = enemy.hp / enemy.maxHp;
      this.gfx.fillStyle(0x330000, 0.8);
      this.gfx.fillRect(enemy.x - radius, enemy.y - radius - 10, radius * 2, 4);
      this.gfx.fillStyle(0xff2244, 0.9);
      this.gfx.fillRect(enemy.x - radius, enemy.y - radius - 10, radius * 2 * hpPct, 4);
    } else if (enemy.behavior === 'shielded') {
      // Main body
      this.gfx.fillCircle(enemy.x, enemy.y, radius);
      // Shield arc facing player
      const facing = enemy.facingAngle || 0;
      this.gfx.lineStyle(3, 0x88bbff, 0.7);
      this.gfx.beginPath();
      this.gfx.arc(enemy.x, enemy.y, radius + 4, facing - enemy.shieldArc / 2, facing + enemy.shieldArc / 2);
      this.gfx.strokePath();
    } else if (enemy.behavior === 'dash_charge') {
      // Diamond shape
      this.drawPolygon(enemy.x, enemy.y, radius, 4, Math.PI / 4);
      if (enemy.isDashing) {
        // Motion blur
        this.gfx.fillStyle(color, 0.3);
        this.gfx.fillCircle(
          enemy.x - enemy.body.velocity.x * 0.03,
          enemy.y - enemy.body.velocity.y * 0.03,
          radius * 0.8
        );
      }
    } else if (enemy.behavior === 'swarm') {
      // Tiny triangle
      this.drawPolygon(enemy.x, enemy.y, radius, 3, time * 0.005);
    } else {
      // Default: circle
      this.gfx.fillCircle(enemy.x, enemy.y, radius);
    }

    // Enemy eye/core
    this.gfx.fillStyle(0x000000, 0.6);
    this.gfx.fillCircle(enemy.x, enemy.y, radius * 0.3);
  }

  drawPolygon(x, y, radius, sides, rotation) {
    this.gfx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2 + rotation;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) this.gfx.moveTo(px, py);
      else this.gfx.lineTo(px, py);
    }
    this.gfx.fillPath();
  }

  renderDamageNumbers() {
    // Render with text objects (create/destroy dynamically for simplicity)
    this.damageNumbers = this.damageNumbers.filter(d => {
      if (d.life <= 0) {
        if (d._text) d._text.destroy();
        return false;
      }
      if (!d._text) {
        d._text = this.add.text(d.x, d.y, d.text, {
          fontFamily: '"Orbitron", "Courier New", monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#' + d.color.toString(16).padStart(6, '0'),
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5).setDepth(150);
      }
      const alpha = d.life / d.maxLife;
      d._text.setPosition(d.x, d.y);
      d._text.setAlpha(alpha);
      return true;
    });
  }

  shutdown() {
    // Clean up damage number texts
    this.damageNumbers.forEach(d => {
      if (d._text) d._text.destroy();
    });
  }
}
