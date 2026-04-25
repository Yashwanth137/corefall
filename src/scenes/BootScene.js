import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Show a simple loading indicator
    const { width, height } = this.scale;
    this.loadText = this.add.text(width / 2, height / 2, 'BOOTING SYSTEM...', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '18px',
      color: '#00ffcc'
    }).setOrigin(0.5);
  }

  create() {
    this.createGeneratedTextures();

    this.time.delayedCall(500, () => {
      this.loadText.destroy();
      this.scene.start('MenuScene');
    });
  }

  createGeneratedTextures() {
    if (this.textures.exists('player_evolved')) return;

    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    const cx = 32;
    const cy = 32;

    gfx.lineStyle(2, 0x00ffcc, 1);
    gfx.strokeCircle(cx, cy, 14);
    gfx.strokeCircle(cx, cy, 7);

    gfx.lineStyle(2, 0xff00ff, 0.9);
    gfx.beginPath();
    gfx.arc(cx, cy, 22, -0.85, 0.85);
    gfx.strokePath();

    gfx.lineStyle(2, 0x44ddff, 0.75);
    gfx.strokeEllipse(cx, cy + 5, 44, 30);

    gfx.lineStyle(2, 0xffff66, 0.9);
    gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = cx + Math.cos(a) * 18;
      const y = cy + Math.sin(a) * 18;
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    }
    gfx.closePath();
    gfx.strokePath();

    gfx.lineStyle(3, 0xff44ff, 1);
    gfx.lineBetween(cx + 10, cy - 10, cx + 30, cy - 30);
    gfx.lineStyle(1, 0xffffff, 0.8);
    gfx.lineBetween(cx + 30, cy - 30, cx + 36, cy - 36);

    gfx.generateTexture('player_evolved', 64, 64);
    gfx.destroy();
  }
}
