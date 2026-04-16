
import * as Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.lastShotTime = 0;
    this.hp = 100;
    this.gameOver = false;
  }

  preload() {}

  create() {
    // Player
    this.player = this.physics.add.sprite(400, 300, null);
    this.player.setCircle(16);
    this.player.setCollideWorldBounds(true);
    this.player.setTint(0x00ffcc);
    this.player.speed = 200;

    // Input
    this.cursors = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D'
    });

    // Bullets
    this.bullets = this.physics.add.group();
    this.lastShotTime = 0;

    // Enemies
    this.enemies = this.physics.add.group();

    // HP
    this.hp = 100;
    this.hpText = this.add.text(16, 16, 'HP: 100', { font: '20px Arial', fill: '#fff' });

    // Kills and Modular Parts
    this.kills = 0;
    this.parts = {
      arms: 'single', // single, dual_blaster, shotgun, laser
      legs: 'normal', // normal, wheels, jump_jets, heavy
      core: 'basic',  // basic, reactor, shield, magnet
    };
    this.fireRate = 200;
    this.bulletCount = 1;
    this.upgradePopup = null;
    this.upgradeActive = false;

    // Upgrade part options
    this.partOptions = {
      arms: [
        { id: 'dual_blaster', name: 'Dual Arms', desc: 'Shoot 2 bullets', apply: () => this.equipPart('arms', 'dual_blaster') },
        { id: 'shotgun', name: 'Shotgun Arms', desc: 'Spread shot', apply: () => this.equipPart('arms', 'shotgun') },
        { id: 'laser', name: 'Laser Arm', desc: 'Piercing shot', apply: () => this.equipPart('arms', 'laser') }
      ],
      legs: [
        { id: 'wheels', name: 'Wheels', desc: 'Faster movement', apply: () => this.equipPart('legs', 'wheels') },
        { id: 'jump_jets', name: 'Jump Jets', desc: 'Dash ability (todo)', apply: () => this.equipPart('legs', 'jump_jets') },
        { id: 'heavy', name: 'Heavy Legs', desc: 'Slower, tanky', apply: () => this.equipPart('legs', 'heavy') }
      ],
      core: [
        { id: 'reactor', name: 'Reactor Core', desc: 'Faster fire rate', apply: () => this.equipPart('core', 'reactor') },
        { id: 'shield', name: 'Shield Core', desc: 'Damage reduction (todo)', apply: () => this.equipPart('core', 'shield') },
        { id: 'magnet', name: 'Magnet Core', desc: 'Attract pickups (todo)', apply: () => this.equipPart('core', 'magnet') }
      ]
    };

    // Graphics for drawing
    this.graphics = this.add.graphics();

    // Shooting
    this.input.on('pointerdown', () => {
      const now = this.time.now;
      if (now - this.lastShotTime < this.fireRate) return;
      this.lastShotTime = now;
      // Arms logic
      if (this.parts.arms === 'dual_blaster') {
        // Two bullets, slight spread
        [-0.08, 0.08].forEach(spread => {
          const angle = Phaser.Math.Angle.Between(
            this.player.x,
            this.player.y,
            this.input.activePointer.worldX,
            this.input.activePointer.worldY
          ) + spread;
          const bullet = this.bullets.create(this.player.x, this.player.y, null);
          bullet.setCircle(4);
          bullet.setTint(0xffffff);
          const speed = 500;
          bullet.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          );
          bullet.lifespan = 2000;
          bullet.spawnTime = now;
        });
      } else if (this.parts.arms === 'shotgun') {
        // 5 bullets, wide spread
        for (let i = 0; i < 5; i++) {
          const spread = (i - 2) * 0.15;
          const angle = Phaser.Math.Angle.Between(
            this.player.x,
            this.player.y,
            this.input.activePointer.worldX,
            this.input.activePointer.worldY
          ) + spread;
          const bullet = this.bullets.create(this.player.x, this.player.y, null);
          bullet.setCircle(4);
          bullet.setTint(0xffffff);
          const speed = 500;
          bullet.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          );
          bullet.lifespan = 2000;
          bullet.spawnTime = now;
        }
      } else if (this.parts.arms === 'laser') {
        // Laser: single, piercing (todo: implement pierce)
        const angle = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          this.input.activePointer.worldX,
          this.input.activePointer.worldY
        );
        const bullet = this.bullets.create(this.player.x, this.player.y, null);
        bullet.setCircle(4);
        bullet.setTint(0x00ffff);
        const speed = 700;
        bullet.body.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
        bullet.lifespan = 2000;
        bullet.spawnTime = now;
        bullet.pierce = true; // for future
      } else {
        // Default: single bullet
        const angle = Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          this.input.activePointer.worldX,
          this.input.activePointer.worldY
        );
        const bullet = this.bullets.create(this.player.x, this.player.y, null);
        bullet.setCircle(4);
        bullet.setTint(0xffffff);
        const speed = 500;
        bullet.body.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
        bullet.lifespan = 2000;
        bullet.spawnTime = now;
      }
    });

    // Enemy spawn
    this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        if (side === 0) { x = 0; y = Phaser.Math.Between(0, 600); }
        if (side === 1) { x = 800; y = Phaser.Math.Between(0, 600); }
        if (side === 2) { x = Phaser.Math.Between(0, 800); y = 0; }
        if (side === 3) { x = Phaser.Math.Between(0, 800); y = 600; }
        const enemy = this.enemies.create(x, y, null);
        enemy.setCircle(10);
        enemy.setTint(0xff0000);
        enemy.speed = 100;
      }
    });

    // Bullet-enemy collision
    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
      b.destroy();
      e.destroy();
      this.kills++;
      if (this.kills % 10 === 0) {
        this.upgradeActive = true;
        this.showPartChoices();
      }
    });

    // Equip part
    this.equipPart = (type, id) => {
      this.parts[type] = id;
      // Map part to behavior
      if (type === 'arms') {
        if (id === 'dual_blaster') {
          // handled in shooting logic
        } else if (id === 'shotgun') {
          // handled in shooting logic
        } else if (id === 'laser') {
          // handled in shooting logic
        } else {
          // fallback
        }
      } else if (type === 'legs') {
        if (id === 'wheels') {
          this.player.speed = 300;
        } else if (id === 'jump_jets') {
          // TODO: dash ability
        } else if (id === 'heavy') {
          this.player.speed = 120;
        } else {
          this.player.speed = 200;
        }
      } else if (type === 'core') {
        if (id === 'reactor') {
          this.fireRate = 100;
        } else if (id === 'shield') {
          // TODO: damage reduction
        } else if (id === 'magnet') {
          // TODO: pickup attract
        } else {
          this.fireRate = 200;
        }
      }
      if (this.upgradePopup) this.upgradePopup.destroy();
      this.upgradeActive = false;
    };

    // Show modular part choices
    this.showPartChoices = () => {
      if (this.upgradePopup) this.upgradePopup.destroy();
      // Randomly pick a part type to offer (arms, legs, core)
      const types = ['arms', 'legs', 'core'];
      const type = types[Math.floor(Math.random() * types.length)];
      const options = this.partOptions[type];
      const w = 340, h = 220;
      const bg = this.add.rectangle(400, 300, w, h, 0x222222, 0.97).setOrigin(0.5);
      const title = this.add.text(400, 220, `Choose ${type.charAt(0).toUpperCase() + type.slice(1)}`, { font: '24px Arial', fill: '#fff' }).setOrigin(0.5);
      const buttons = [];
      options.forEach((opt, i) => {
        const btn = this.add.text(400, 270 + i * 40, `${opt.name} - ${opt.desc}`, { font: '18px Arial', fill: '#0ff', backgroundColor: '#111' })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.equipPart(type, opt.id));
        buttons.push(btn);
      });
      this.upgradePopup = this.add.container(0, 0, [bg, title, ...buttons]);
    };

    // Player-enemy collision
    this.damageCooldown = 0;
    this.physics.add.overlap(this.player, this.enemies, () => {
      const now = this.time.now;
      if (now - this.damageCooldown < 500) return;
      this.damageCooldown = now;
      this.hp -= 20;
      this.hpText.setText('HP: ' + this.hp);
      if (this.hp <= 0 && !this.gameOver) {
        this.gameOver = true;
        this.add.text(400, 300, 'GAME OVER', { font: '32px Arial', fill: '#fff' }).setOrigin(0.5);
        this.scene.pause();
      }
    });
  }

  update(time, delta) {
    if (this.gameOver || this.upgradeActive) return;
    // Player movement
    this.player.body.setVelocity(0);
    const speed = this.player.speed;
    if (this.cursors.left.isDown) this.player.body.setVelocityX(-speed);
    if (this.cursors.right.isDown) this.player.body.setVelocityX(speed);
    if (this.cursors.up.isDown) this.player.body.setVelocityY(-speed);
    if (this.cursors.down.isDown) this.player.body.setVelocityY(speed);
    this.player.body.velocity.normalize().scale(speed);
    // Player aim
    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      pointer.worldX,
      pointer.worldY
    );
    this.player.setRotation(angle);

    // Enemy AI
    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const speed = enemy.speed || 100;
      enemy.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    });

    // Bullet cleanup
    const now = this.time.now;
    this.bullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
      if (
        bullet.x < 0 || bullet.x > 800 ||
        bullet.y < 0 || bullet.y > 600 ||
        (now - bullet.spawnTime > bullet.lifespan)
      ) {
        bullet.destroy();
      }
    });

    // Redraw
    this.graphics.clear();
    // Player base
    this.graphics.fillStyle(0x00ffcc, 1);
    this.graphics.fillCircle(this.player.x, this.player.y, 16);
    // Arms visual
    if (this.parts.arms === 'dual_blaster') {
      // Draw two small nodes beside player
      this.graphics.fillStyle(0xffffff, 1);
      this.graphics.fillCircle(this.player.x + 18, this.player.y, 5);
      this.graphics.fillCircle(this.player.x - 18, this.player.y, 5);
    } else if (this.parts.arms === 'shotgun') {
      // Draw three nodes in arc
      this.graphics.fillStyle(0xffffff, 1);
      this.graphics.fillCircle(this.player.x + 16, this.player.y - 8, 4);
      this.graphics.fillCircle(this.player.x + 16, this.player.y + 8, 4);
      this.graphics.fillCircle(this.player.x - 16, this.player.y, 4);
    } else if (this.parts.arms === 'laser') {
      // Draw a cyan node in front
      this.graphics.fillStyle(0x00ffff, 1);
      this.graphics.fillCircle(this.player.x + 20, this.player.y, 6);
    }
    // Bullets
    this.bullets.getChildren().forEach(bullet => {
      if (bullet.active) {
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(bullet.x, bullet.y, 4);
      }
    });
    // Enemies
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) {
        this.graphics.fillStyle(0xff0000, 1);
        this.graphics.fillCircle(enemy.x, enemy.y, 10);
      }
    });
    // HP text
    this.hpText.setText('HP: ' + this.hp);
  }
}

