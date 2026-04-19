/**
 * CombatSystem.js
 * Handles all weapon types: single, dual, shotgun, laser, missile, katana.
 * Manages bullet creation, lifetime, piercing, homing.
 */

import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';

export default class CombatSystem {
  constructor(scene, player, bullets, enemies) {
    this.scene = scene;
    this.player = player;
    this.bullets = bullets;
    this.enemies = enemies;
    this.lastShotTime = 0;

    // Katana state
    this.katanaSwinging = false;
    this.katanaAngle = 0;
    this.katanaTimer = 0;

    // Overcharge state
    this.overchargeActive = false;
    this.overchargeTimer = 0;
    this.killStreak = 0;

    // Shooting on pointer down
    this.onPointerDown = () => this.tryShoot();
    scene.input.on('pointerdown', this.onPointerDown);
  }

  tryShoot() {
    const now = this.scene.time.now;
    if (now - this.lastShotTime < gameState.fireRate) return;
    if (!this.player || !this.player.active) return;
    this.lastShotTime = now;

    const px = this.player.x;
    const py = this.player.y;
    const pointer = this.scene.input.activePointer;
    
    // Pure 2D
    const baseAngle = Phaser.Math.Angle.Between(px, py, pointer.worldX, pointer.worldY);

    // Save aim angle back on player manually for smooth rotation
    this.player.aimAngle = baseAngle;
    
    const pattern = gameState.bulletPattern;

    if (pattern === 'katana') {
      this.swingKatana(baseAngle);
      return;
    }

    const speed = gameState.bulletSpeed;
    const color = gameState.bulletColor;

    switch (pattern) {
      case 'dual':
        this.createBullet(px, py, baseAngle - gameState.spread, speed, color);
        this.createBullet(px, py, baseAngle + gameState.spread, speed, color);
        break;

      case 'shotgun':
        for (let i = 0; i < gameState.bulletCount; i++) {
          const spread = (i - Math.floor(gameState.bulletCount / 2)) * gameState.spread;
          this.createBullet(px, py, baseAngle + spread, speed * (0.9 + Math.random() * 0.2), color);
        }
        break;

      case 'laser':
        this.createBullet(px, py, baseAngle, speed, color, { pierce: true, scale: 1.5 });
        break;

      case 'missile':
        this.createBullet(px, py, baseAngle, speed, color, { homing: true, scale: 1.2 });
        break;

      default: // single
        this.createBullet(px, py, baseAngle, speed, color);
        break;
    }

    // Muzzle flash event
    this.scene.events.emit('muzzle-flash', px, py, baseAngle);
  }

  createBullet(x, y, angle, speed, color, opts = {}) {
    const bullet = this.bullets.create(x, y, null);
    if (!bullet) return;
    bullet.setCircle(opts.scale ? 4 * opts.scale : 4);
    bullet.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    bullet.spawnTime = this.scene.time.now;
    bullet.lifespan = 2500;
    bullet.pierce = opts.pierce || false;
    bullet.homing = opts.homing || false;
    bullet.bulletColor = color;
    bullet.angle_rad = angle;
    bullet.damage = this.getDamage();
    return bullet;
  }

  swingKatana(angle) {
    this.katanaSwinging = true;
    this.katanaAngle = angle;
    this.katanaTimer = 200; // ms

    // Damage enemies in arc
    const range = gameState.meleeRange;
    const arc = gameState.meleeArc;
    const damage = this.getDamage() * gameState.meleeDamage;

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist > range) return;

      const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      let diff = Phaser.Math.Angle.Wrap(enemyAngle - angle);
      if (Math.abs(diff) <= arc / 2) {
        this.scene.events.emit('enemy-hit', enemy, damage);
      }
    });

    // Visual event
    this.scene.events.emit('katana-swing', this.player.x, this.player.y, angle, range, arc);
  }

  getDamage() {
    let dmg = 1;
    if (this.overchargeActive) {
      dmg *= gameState.overchargeDamageMultiplier;
    }
    return dmg;
  }

  update(time, delta) {
    const now = time;
    const bounds = this.scene.terrainSystem?.bounds || { w: 800, h: 600 };
    const margin = 50;

    // Katana timer
    if (this.katanaSwinging) {
      this.katanaTimer -= delta;
      if (this.katanaTimer <= 0) {
        this.katanaSwinging = false;
      }
    }

    // Overcharge tracking
    if (gameState.overchargeKills > 0) {
      if (this.overchargeActive) {
        this.overchargeTimer -= delta;
        if (this.overchargeTimer <= 0) {
          this.overchargeActive = false;
        }
      }
    }

    // Bullet updates
    this.bullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;

      // Lifetime
      if (now - bullet.spawnTime > bullet.lifespan ||
          bullet.x < -margin || bullet.x > bounds.w + margin ||
          bullet.y < -margin || bullet.y > bounds.h + margin) {
        bullet.destroy();
        return;
      }

      // Homing
      if (bullet.homing) {
        let closest = null;
        let closestDist = Infinity;
        this.enemies.getChildren().forEach(enemy => {
          if (!enemy.active) return;
          const d = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
          if (d < closestDist) {
            closestDist = d;
            closest = enemy;
          }
        });
        if (closest) {
          const targetAngle = Phaser.Math.Angle.Between(bullet.x, bullet.y, closest.x, closest.y);
          const currentAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
          const turnRate = 0.05;
          const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, turnRate);
          const speed = Math.sqrt(bullet.body.velocity.x ** 2 + bullet.body.velocity.y ** 2);
          bullet.body.setVelocity(
            Math.cos(newAngle) * speed,
            Math.sin(newAngle) * speed
          );
        }
      }
    });
  }

  onEnemyKilled() {
    if (gameState.overchargeKills > 0) {
      this.killStreak++;
      if (this.killStreak >= gameState.overchargeKills) {
        this.overchargeActive = true;
        this.overchargeTimer = gameState.overchargeDuration;
        this.killStreak = 0;
        this.scene.events.emit('overcharge-activated');
      }
    }
  }

  destroy() {
    this.scene.input.off('pointerdown', this.onPointerDown);
  }
}
