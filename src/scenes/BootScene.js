import Phaser from 'phaser';
import heroSprite from '../assets/hero.png';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('player', heroSprite);
  }

  create() {
    this.scene.start('MenuScene');
  }
}
