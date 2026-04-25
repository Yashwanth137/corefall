import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';
import MovementSystem from '../systems/MovementSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import WaveSystem from '../systems/WaveSystem.js';
import TerrainSystem from '../systems/TerrainSystem.js';
import HUD from '../ui/HUD.js';
import { getLevelConfig } from '../data/LevelConfig.js';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;

    const cfg = getLevelConfig(gameState.level);
    this.cameras.main.setBackgroundColor(cfg.arenaColor);

    this.terrainSystem = new TerrainSystem(this);

    this.showLevelAnnouncement(cfg);

    const spawn = this.terrainSystem.spawnPoint || { x: width / 2, y: height / 2 };
    this.player = new Player(this, spawn.x, spawn.y);
    this.setupArenaBounds();

    this.bullets = this.physics.add.group({ runChildUpdate: false });
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.enemyBullets = this.physics.add.group({ runChildUpdate: false });

    this.movementSystem = new MovementSystem(this, this.player);
    this.combatSystem = new CombatSystem(this, this.player, this.bullets, this.enemies);
    this.waveSystem = new WaveSystem(this, this.enemies, this.player);
    this.hud = new HUD(this);

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
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      this.handleBulletEnemyCollision(bullet, enemy);
    });

    this.damageCooldown = 0;
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      this.handleEnemyPlayerCollision(player, enemy);
    });

    this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
      bullet.destroy();
      this.damagePlayer(15);
    });

    // Terrain collisions
    this.terrainSystem.setupCollisions(this.player, this.enemies, this.bullets, this.enemyBullets);

    // --- Game Events ---
    this.events.on('enemy-hit', (enemy, damage) => {
      this.damageEnemy(enemy, damage);
    });

    this.events.once('level-complete', () => {
      this.time.delayedCall(1000, () => {
        if (gameState.level > 10) {
          this.scene.start('VictoryScene');
        } else {
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
    this.hazardDamageCooldown = 0;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
  }

  showLevelAnnouncement(cfg) {
    const title = this.add.text(400, 260, `LEVEL ${cfg.level}`, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);

    const sub = this.add.text(400, 300, cfg.name, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '18px',
      color: '#88aacc',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);

    const sub2 = this.add.text(400, 325, cfg.subtitle, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '12px',
      color: '#556677',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);

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
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);

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

    if (enemy.behavior === 'shielded' && enemy.facingAngle !== undefined) {
      const hitAngle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
      const diff = Math.abs(Phaser.Math.Angle.Wrap(hitAngle - enemy.facingAngle));
      if (diff > enemy.shieldArc / 2) {
        this.damageEnemy(enemy, damage);
      } else {
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

    this.cameras.main.shake(80, enemy.isBoss ? 0.015 : 0.003);

    const enemyRef = { score: enemy.score, isBoss: enemy.isBoss, enemyData: enemy.enemyData };
    enemy.view?.destroy();
    enemy.view = null;
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

    this.movementSystem.update(time, delta);
    this.combatSystem.update(time, delta);
    this.waveSystem.update(time, delta);
    this.hud.update(this.waveSystem, this.movementSystem);

    if (this.player._hitFlashTimer > 0) {
      this.player._hitFlashTimer -= delta;
    }

    if (this.player._hitFlashTimer > 0) {
      this.player.applyColorTint(0xff4444);
    } else if (this.movementSystem.isDashing) {
      this.player.applyColorTint(0x88ffee);
    } else {
      this.player.clearColorTint();
    }

    this.hazardDamageCooldown -= delta;
    if (this.hazardDamageCooldown <= 0) {
      this.terrainSystem.checkHazards(this.player, (dmg) => {
        this.damagePlayer(dmg);
        this.hazardDamageCooldown = 500;
      });
    }

    this.enemyBullets.getChildren().forEach(b => {
      if (!b.active) return;
      const bounds = this.terrainSystem.bounds;
      const margin = 50;
      if (time - b.spawnTime > b.lifespan ||
          b.x < -margin || b.x > bounds.w + margin ||
          b.y < -margin || b.y > bounds.h + margin) {
        b.destroy();
      }
    });

    this.renderAll(time, delta);
  }

  setupArenaBounds() {
    const bounds = this.terrainSystem.bounds;
    this.physics.world.setBounds(0, 0, bounds.w, bounds.h);
    
    // Fixed camera: zoom to fit the entire arena in the 800x600 viewport
    const { width, height } = this.scale;
    const zoomX = width / bounds.w;
    const zoomY = height / bounds.h;
    const zoom = Math.min(zoomX, zoomY);
    
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setBounds(0, 0, bounds.w, bounds.h);
    
    // Center the camera on the arena instead of following the player
    this.cameras.main.centerOn(bounds.w / 2, bounds.h / 2);
  }

  renderAll(time, delta) {
    this.gfx.clear();

    // 1. Draw minimal terrain background geometry
    this.terrainSystem.render(this.gfx);

    // 2. Dash trails (long streak line for juice)
    this.dashTrails = this.dashTrails.filter((t, i, arr) => {
      t.alpha -= 0.02;
      if (t.alpha <= 0) return false;
      
      this.gfx.lineStyle(2, 0x00ffcc, t.alpha);
      this.gfx.beginPath();
      this.gfx.moveTo(t.x, t.y);
      if (arr[i+1]) {
        this.gfx.lineTo(arr[i+1].x, arr[i+1].y);
      } else {
         this.gfx.lineTo(t.x + 1, t.y + 1);
      }
      this.gfx.strokePath();
      return true;
    });

    // 3. Player Rendering
    this.renderPlayer(time);

    // 4. Enemy Rendering
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      this.renderEnemy(enemy, time);
    });

    // 5. Bullets Rendering
    this.bullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
      const color = bullet.bulletColor || 0xffffff;
      
      this.gfx.lineStyle(bullet.pierce ? 3 : 2, color, 1);
      this.gfx.strokeCircle(bullet.x, bullet.y, bullet.pierce ? 6 : 4);
      
      // small trail
      this.gfx.lineStyle(1, color, 0.4);
      this.gfx.beginPath();
      this.gfx.moveTo(bullet.x, bullet.y);
      this.gfx.lineTo(bullet.x - bullet.body.velocity.x * 0.03, bullet.y - bullet.body.velocity.y * 0.03);
      this.gfx.strokePath();
    });

    // 6. Enemy bullets
    this.enemyBullets.getChildren().forEach(b => {
      if (!b.active) return;
      this.gfx.lineStyle(2, b.bulletColor || 0xff4466, 1);
      this.gfx.strokeCircle(b.x, b.y, 4);
    });

    // 7. Events (Muzzle flash expanding ring, katana swing)
    if (this.muzzleFlash) {
      const m = this.muzzleFlash;
      m.timer -= delta;
      const alpha = m.timer / 60;
      const radius = 10 + (1 - alpha) * 15;
      
      const cartFlashX = m.x + Math.cos(m.angle) * 22;
      const cartFlashY = m.y + Math.sin(m.angle) * 22;
      
      this.gfx.lineStyle(2, 0xffffcc, alpha * 0.8);
      this.gfx.strokeCircle(cartFlashX, cartFlashY, radius);
      if (m.timer <= 0) this.muzzleFlash = null;
    }

    if (this.katanaSwingVisual) {
      const k = this.katanaSwingVisual;
      k.timer -= delta;
      const alpha = k.timer / 200;
      
      this.gfx.lineStyle(2, 0xff00ff, alpha * 0.8);
      this.gfx.beginPath();
      this.gfx.arc(k.x, k.y, k.range, k.angle - k.arc / 2, k.angle + k.arc / 2);
      this.gfx.strokePath();
      if (k.timer <= 0) this.katanaSwingVisual = null;
    }

    // 8. Hit Explosion Particles
    this.deathParticles = this.deathParticles.filter(p => {
      p.life -= delta;
      if (p.life <= 0) return false;
      p.x += p.vx * (delta / 1000);
      p.y += p.vy * (delta / 1000);
      p.vx *= 0.95;
      p.vy *= 0.95;
      const alpha = p.life / p.maxLife;
      
      this.gfx.lineStyle(1, p.color, alpha);
      this.gfx.beginPath();
      this.gfx.moveTo(p.x, p.y);
      this.gfx.lineTo(p.x + p.vx * 0.05, p.y + p.vy * 0.05);
      this.gfx.strokePath();
      return true;
    });

    // Damage numbers float up
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.life -= delta;
      if (d.life <= 0) return false;
      d.y -= 30 * (delta / 1000); 
      return true;
    });
    this.renderDamageNumbers();
  }

  renderPlayer(time) {
    const p = this.player;
    const isHit = p._hitFlashTimer > 0;
    const color = p.currentTint || 0x00ffcc;
    const level = gameState.level;
    
    // Glitch effect on hit
    let ox = 0, oy = 0;
    if (isHit && Math.random() < 0.3) {
      ox = (Math.random() - 0.5) * 10;
      oy = (Math.random() - 0.5) * 10;
    }

    const px = p.x + ox;
    const py = p.y + oy;
    const aim = p.aimAngle || 0;

    // --- BASE CYBORG EVOLUTION (Scales complexity 1 to 10) ---
    // Start with a small basic circle and evolve into a complex multi-layered machine
    const baseRadius = 8 + (level * 1.5);
    
    this.gfx.lineStyle(2, color, isHit ? 0.5 : 1);
    
    if (level < 3) {
      // Basic core
      this.gfx.strokeCircle(px, py, baseRadius);
    } else if (level < 6) {
      // Segmented plates
      this.drawBrokenPolygon(this.gfx, px, py, 6, baseRadius, aim, 0.2);
      this.gfx.strokeCircle(px, py, baseRadius * 0.6);
    } else {
      // Intricate rebuilt titan core
      this.drawPolygon(this.gfx, px, py, 8, baseRadius, time * 0.001);
      this.drawPolygon(this.gfx, px, py, 6, baseRadius * 0.7, -time * 0.0015);
      this.gfx.strokeCircle(px, py, baseRadius * 0.4);
    }

    const prts = gameState.parts;
    
    // --- CORE UPGRADES ---
    if (prts.core === 'reactor') {
      this.gfx.lineStyle(1, 0xffff00, 0.8 + Math.sin(time * 0.01) * 0.2);
      this.drawPolygon(this.gfx, px, py, 4, 6, time * 0.005);
    } else if (prts.core === 'shield') {
      this.gfx.lineStyle(2, 0x4488ff, 0.4 + Math.sin(time * 0.004) * 0.3);
      this.gfx.strokeCircle(px, py, baseRadius + 12);
    } else if (prts.core === 'regen') {
      this.gfx.lineStyle(2, 0x00ff44, 1);
      const ht = 4 + Math.abs(Math.sin(time * 0.005)) * 6;
      this.gfx.lineBetween(px, py - ht, px, py + ht);
      this.gfx.lineBetween(px - ht, py, px + ht, py);
    } else if (prts.core === 'overcharge') {
      this.gfx.lineStyle(1.5, 0xff00ff, 0.8 + Math.random() * 0.2);
      this.drawBrokenPolygon(this.gfx, px, py, 5, baseRadius + 4, time * -0.003, 0.5);
    } else if (prts.core === 'berserker') {
      this.gfx.lineStyle(2, 0xff0044, 0.9);
      this.drawPolygon(this.gfx, px, py, 3, baseRadius + 6, aim);
    }

    // --- LEGS UPGRADES ---
    if (prts.legs === 'wheels') {
      const vx1 = px + Math.cos(aim + Math.PI/2) * (baseRadius + 5);
      const vy1 = py + Math.sin(aim + Math.PI/2) * (baseRadius + 5);
      const vx2 = px + Math.cos(aim - Math.PI/2) * (baseRadius + 5);
      const vy2 = py + Math.sin(aim - Math.PI/2) * (baseRadius + 5);
      this.gfx.lineStyle(2, 0x88ff00, 1);
      this.gfx.strokeCircle(vx1, vy1, 4);
      this.gfx.strokeCircle(vx2, vy2, 4);
    } else if (prts.legs === 'jump_jets') {
      const bx = px + Math.cos(aim + Math.PI) * baseRadius;
      const by = py + Math.sin(aim + Math.PI) * baseRadius;
      this.gfx.lineStyle(2, 0xff8844, 0.5 + Math.random() * 0.5);
      this.gfx.lineBetween(bx, by, bx + Math.cos(aim + Math.PI)*12, by + Math.sin(aim + Math.PI)*12);
    } else if (prts.legs === 'heavy_treads') {
      this.gfx.lineStyle(3, 0x888888, 1);
      const tx1 = px + Math.cos(aim + Math.PI/2) * (baseRadius + 8);
      const ty1 = py + Math.sin(aim + Math.PI/2) * (baseRadius + 8);
      this.gfx.strokeRect(tx1 - 4, ty1 - 8, 8, 16);
      const tx2 = px + Math.cos(aim - Math.PI/2) * (baseRadius + 8);
      const ty2 = py + Math.sin(aim - Math.PI/2) * (baseRadius + 8);
      this.gfx.strokeRect(tx2 - 4, ty2 - 8, 8, 16);
    } else if (prts.legs === 'hover') {
      this.gfx.lineStyle(1, 0x44ddff, 0.5);
      this.gfx.strokeEllipse(px, py, baseRadius + 15, baseRadius + 20);
    }

    // --- ARMS UPGRADES (Aim indicators) ---
    this.gfx.lineStyle(2, color, 0.8);
    if (prts.arms === 'dual_blaster') {
      const cx1 = px + Math.cos(aim + 0.3)*baseRadius;
      const cy1 = py + Math.sin(aim + 0.3)*baseRadius;
      const cx2 = px + Math.cos(aim - 0.3)*baseRadius;
      const cy2 = py + Math.sin(aim - 0.3)*baseRadius;
      this.gfx.lineBetween(cx1, cy1, cx1 + Math.cos(aim)*10, cy1 + Math.sin(aim)*10);
      this.gfx.lineBetween(cx2, cy2, cx2 + Math.cos(aim)*10, cy2 + Math.sin(aim)*10);
    } else if (prts.arms === 'laser') {
      const cx = px + Math.cos(aim)*baseRadius;
      const cy = py + Math.sin(aim)*baseRadius;
      this.gfx.lineStyle(3, 0x00ffff, 0.8);
      this.gfx.lineBetween(cx, cy, cx + Math.cos(aim)*15, cy + Math.sin(aim)*15);
    } else if (prts.arms === 'shotgun') {
      for(let a = -0.4; a <= 0.4; a += 0.4) {
         const bx = px + Math.cos(aim + a)*baseRadius;
         const by = py + Math.sin(aim + a)*baseRadius;
         this.gfx.lineBetween(bx, by, bx + Math.cos(aim+a)*8, by + Math.sin(aim+a)*8);
      }
    } else if (prts.arms === 'missile') {
      const cx = px + Math.cos(aim)*baseRadius;
      const cy = py + Math.sin(aim)*baseRadius;
      this.gfx.strokeRect(cx - 5, cy - 5, 10, 10);
    } else if (prts.arms === 'katana') {
      this.gfx.beginPath();
      this.gfx.arc(px, py, baseRadius + 10, aim - 0.8, aim + 0.8);
      this.gfx.strokePath();
    } else {
      // Default single node
      this.gfx.lineBetween(px + Math.cos(aim)*baseRadius, py + Math.sin(aim)*baseRadius, px + Math.cos(aim)*(baseRadius + 10), py + Math.sin(aim)*(baseRadius + 10));
    }
  }

  renderEnemy(enemy, time) {
    const rData = enemy.renderData;
    if (!rData) return;

    let isHit = enemy._hitFlash > 0;
    if (isHit) enemy._hitFlash -= 16;

    let color = isHit ? 0xffffff : rData.color;
    let ox = 0, oy = 0;

    // Cypress cyborg glitch when highly damaged or on specific levels
    const isGlitchy = gameState.level >= 5 && (enemy.hp / enemy.maxHp < 0.4);
    if ((isHit || isGlitchy) && Math.random() < 0.2) {
      ox = (Math.random() - 0.5) * 12;
    }

    const ex = enemy.x + ox;
    const ey = enemy.y + oy;
    const size = rData.radius;
    const thickness = rData.thick ? 3 : 2;

    this.gfx.lineStyle(thickness, color, 1);

    // Calculate facing string for rotation
    const angle = enemy.behavior === 'shielded' && enemy.facingAngle !== undefined 
      ? enemy.facingAngle 
      : enemy.body.velocity ? Math.atan2(enemy.body.velocity.y, enemy.body.velocity.x) : 0;

    switch (rData.shape) {
      case 'triangle':
        this.drawPolygon(this.gfx, ex, ey, 3, size + 2, angle);
        break;
      case 'arrow':
        // Stretched triangle
        this.gfx.beginPath();
        this.gfx.moveTo(ex + Math.cos(angle)*size*1.5, ey + Math.sin(angle)*size*1.5);
        this.gfx.lineTo(ex + Math.cos(angle + 2.5)*size, ey + Math.sin(angle + 2.5)*size);
        this.gfx.lineTo(ex + Math.cos(angle - 2.5)*size, ey + Math.sin(angle - 2.5)*size);
        this.gfx.closePath();
        this.gfx.strokePath();
        break;
      case 'square':
        this.drawPolygon(this.gfx, ex, ey, 4, size, angle + Math.PI/4); // Diamond/Square
        break;
      case 'jagged':
        this.drawBrokenPolygon(this.gfx, ex, ey, 5, size, time * 0.005);
        break;
      case 'dots':
        if (Math.random() > 0.1) {
          this.gfx.strokeCircle(ex, ey, 3);
          this.gfx.strokeCircle(ex + (Math.random()-0.5)*10, ey + (Math.random()-0.5)*10, 1);
        }
        break;
      case 'hex_core':
        this.drawPolygon(this.gfx, ex, ey, 6, size, time * 0.002);
        this.drawPolygon(this.gfx, ex, ey, 3, size*0.5, -time * 0.004);
        break;
      case 'titan_core':
        this.drawPolygon(this.gfx, ex, ey, 8, size, time * 0.001);
        this.drawPolygon(this.gfx, ex, ey, 4, size*0.6, -time * 0.002);
        this.gfx.strokeCircle(ex, ey, size*0.3);
        break;
      default:
        this.gfx.strokeCircle(ex, ey, size);
    }

    // Boss HP bar (geometric)
    if (enemy.isBoss) {
      const hpPct = enemy.hp / enemy.maxHp;
      this.gfx.lineStyle(1, 0x330000, 0.8);
      this.gfx.strokeRect(ex - size, ey - size - 15, size*2, 4);
      this.gfx.fillStyle(0xff2244, 0.9);
      this.gfx.fillRect(ex - size, ey - size - 15, (size*2) * hpPct, 4);
    }

    // Dasher trail juice
    if (enemy.behavior === 'dash_charge' && enemy.isDashing) {
      this.gfx.lineStyle(1, color, 0.4);
      this.gfx.beginPath();
      this.gfx.moveTo(enemy.x, enemy.y);
      this.gfx.lineTo(enemy.x - enemy.body.velocity.x * 0.05, enemy.y - enemy.body.velocity.y * 0.05);
      this.gfx.strokePath();
    }

    // Shield Arc wireframe
    if (enemy.behavior === 'shielded' && enemy.facingAngle !== undefined) {
      this.gfx.lineStyle(3, 0x88ccff, 0.8);
      this.gfx.beginPath();
      this.gfx.arc(ex, ey, size + 6, enemy.facingAngle - enemy.shieldArc/2, enemy.facingAngle + enemy.shieldArc/2);
      this.gfx.strokePath();
    }
  }

  drawPolygon(gfx, x, y, sides, radius, rotation) {
    gfx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + rotation;
      if (i === 0) gfx.moveTo(x + Math.cos(a)*radius, y + Math.sin(a)*radius);
      else gfx.lineTo(x + Math.cos(a)*radius, y + Math.sin(a)*radius);
    }
    gfx.closePath();
    gfx.strokePath();
  }

  drawBrokenPolygon(gfx, x, y, sides, radius, rotation) {
    for (let i = 0; i < sides; i++) {
      if (Math.random() < 0.15) continue; // broken segment glitch
      const a1 = (i / sides) * Math.PI * 2 + rotation;
      const a2 = ((i+1) / sides) * Math.PI * 2 + rotation;
      gfx.beginPath();
      gfx.moveTo(x + Math.cos(a1)*radius, y + Math.sin(a1)*radius);
      gfx.lineTo(x + Math.cos(a2)*radius, y + Math.sin(a2)*radius);
      gfx.strokePath();
    }
  }

  renderDamageNumbers() {
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
    this.damageNumbers.forEach(d => {
      if (d._text) d._text.destroy();
    });
  }

  cleanupScene() {
    this.shutdown();
    this.combatSystem?.destroy();
    this.waveSystem?.destroy();
    this.hud?.destroy();
  }
}
