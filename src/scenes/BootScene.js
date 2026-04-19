import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Show a simple loading indicator
    const { width, height } = this.scale;
    const loadText = this.add.text(width / 2, height / 2, 'BOOTING SYSTEM...', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '18px',
      color: '#00ffcc'
    }).setOrigin(0.5);

    this.time.delayedCall(500, () => {
      loadText.destroy();
      this.scene.start('MenuScene');
    });
  }

  create() {
    // Wireframe visuals rely entirely on real-time graphics rendering.
    // No textures or spritesheets needed.
  }
}

