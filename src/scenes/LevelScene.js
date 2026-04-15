import Phaser from 'phaser';
import Player from '../entities/Player.js';

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x16213e);

    this.player = new Player(this, width / 2, height / 2, 'player');

    this.add
      .text(16, 16, 'Level Scene', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setDepth(1);
  }
}
