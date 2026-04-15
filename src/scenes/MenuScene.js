import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 24, 'Corefall', {
        fontFamily: 'Arial',
        fontSize: '40px',
        color: '#f5f7ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 28, 'Click anywhere to start', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#9fb3c8',
      })
      .setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('LevelScene');
    });
  }
}
