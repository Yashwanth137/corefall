/**
 * main.js
 * Phaser game bootstrap — registers all scenes.
 * BootScene generates textures, then MenuScene → GameScene → UpgradeScene loop.
 */

import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import UpgradeScene from './scenes/UpgradeScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#060a14',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, UpgradeScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
