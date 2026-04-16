import * as Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#111',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
};


let game = null;

function startGame() {
  if (!game) {
    game = new Phaser.Game(config);
  } else {
    game.scene.resume('GameScene');
  }
}

function stopGame() {
  if (game) {
    game.scene.pause('GameScene');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startBtn').onclick = startGame;
  document.getElementById('stopBtn').onclick = stopGame;
  startGame(); // auto-start on load
});
