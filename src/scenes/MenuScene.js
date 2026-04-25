import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    // Ensure fresh state
    gameState.reset();

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x060a14);

    // Grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00ffcc, 0.04);
    for (let x = 0; x <= width; x += 40) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += 40) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }
    grid.strokePath();

    // Animated background particles
    this.gfx = this.add.graphics();
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.3
      });
    }

    // Central effects visual
    this.coreGfx = this.add.graphics().setDepth(5);

    // Title
    const title = this.add.text(width / 2, 160, 'COREFALL', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#00ffcc',
      stroke: '#002211',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(10);

    // Subtitle
    this.add.text(width / 2, 210, 'REBUILD. EVOLVE. SURVIVE.', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '13px',
      color: '#446655',
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(10);

    // Tagline
    this.add.text(width / 2, 240, 'A damaged cyborg core fights to reconstruct its body', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#334444',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(10);

    // Start button
    const btnY = 460;
    const btnBg = this.add.rectangle(width / 2, btnY, 240, 50, 0x0a1a14).setDepth(10);
    btnBg.setStrokeStyle(2, 0x00ffcc, 0.5);
    btnBg.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, btnY, '[ INITIALIZE ]', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5).setDepth(10);

    // Button pulse
    this.tweens.add({
      targets: btnText,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    btnBg.on('pointerover', () => {
      btnBg.setStrokeStyle(2, 0x00ffcc, 1);
      btnBg.setFillStyle(0x0a2a1e, 1);
      btnText.setAlpha(1);
    });
    btnBg.on('pointerout', () => {
      btnBg.setStrokeStyle(2, 0x00ffcc, 0.5);
      btnBg.setFillStyle(0x0a1a14, 1);
    });
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start('GameScene');
      });
    });

    // Controls hint
    this.add.text(width / 2, height - 50, 'WASD Constrained Move  •  Mouse Aim  •  Click Shoot  •  Space Dash', {
      fontFamily: '"Courier morphological", monospace',
      fontSize: '10px',
      color: '#223333'
    }).setOrigin(0.5).setDepth(10);

    // Version
    this.add.text(width - 10, height - 10, 'v0.2', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#1a2222'
    }).setOrigin(1, 1).setDepth(10);

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.elapsed = 0;
  }

  update(time, delta) {
    this.elapsed += delta;
    const t = this.elapsed;
    const cx = 400, cy = 340;

    // Animate particles (Wireframe drops)
    this.gfx.clear();
    this.particles.forEach(p => {
      p.x += p.vx * (delta / 1000);
      p.y += p.vy * (delta / 1000);
      if (p.x < 0) p.x = 800;
      if (p.x > 800) p.x = 0;
      if (p.y < 0) p.y = 600;
      if (p.y > 600) p.y = 0;
      this.gfx.lineStyle(1, 0x00ffcc, p.alpha);
      this.gfx.strokeCircle(p.x, p.y, p.size);
    });

    // Animate core effects
    this.coreGfx.clear();
    const pulse = 18 + Math.sin(t * 0.003) * 4;

    // Drawn Hexagon Core Base
    this.coreGfx.lineStyle(3, 0x00ffcc, 1);
    this.coreGfx.beginPath();
    for (let i = 0; i < 6; i++) {
       let a = (i/6) * Math.PI*2 + (t * 0.001);
       if (i===0) this.coreGfx.moveTo(cx + Math.cos(a)*20, cy + Math.sin(a)*20);
       else this.coreGfx.lineTo(cx + Math.cos(a)*20, cy + Math.sin(a)*20);
    }
    this.coreGfx.closePath();
    this.coreGfx.strokePath();

    // Outer wireframe scan ring
    this.coreGfx.lineStyle(2, 0x00ffcc, 0.4);
    this.coreGfx.beginPath();
    this.coreGfx.arc(cx, cy, pulse + 25, t * 0.002, t * 0.002 + Math.PI * 1.5);
    this.coreGfx.strokePath();

    // Orbiting nodes (simulating parts evolving)
    for (let i = 0; i < 3; i++) {
      const angle = -t * 0.002 + (i * Math.PI * 2 / 3);
      const r = pulse + 35;
      this.coreGfx.lineStyle(3, 0x00ffcc, 0.8);
      this.coreGfx.strokeCircle(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 4);
    }
  }
}

