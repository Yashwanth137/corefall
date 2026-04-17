/**
 * GameOverScene.js
 * Death screen with stats and restart option.
 */

import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0000);

    // Scan lines
    const gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.15);
    for (let y = 0; y < height; y += 3) {
      gfx.fillRect(0, y, width, 1);
    }

    // Glitch header
    const header = this.add.text(width / 2, 140, 'SYSTEM FAILURE', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ff2244',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Glitch effect on header
    this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        header.setX(width / 2 + (Math.random() - 0.5) * 4);
        header.setAlpha(0.85 + Math.random() * 0.15);
      }
    });

    this.add.text(width / 2, 185, 'CORE DESTROYED', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#882233'
    }).setOrigin(0.5);

    // Stats
    const stats = [
      `LEVEL REACHED    ${gameState.level}/10`,
      `TOTAL KILLS      ${gameState.totalKills}`,
      `FINAL SCORE      ${gameState.score}`,
      '',
      `FINAL BUILD`,
      `  Arms: ${gameState.parts.arms || 'basic'}`,
      `  Legs: ${gameState.parts.legs || 'basic'}`,
      `  Core: ${gameState.parts.core || 'basic'}`
    ];

    stats.forEach((line, i) => {
      const isHeader = line === 'FINAL BUILD';
      this.add.text(width / 2, 240 + i * 22, line, {
        fontFamily: '"Courier New", monospace',
        fontSize: isHeader ? '14px' : '13px',
        fontStyle: isHeader ? 'bold' : 'normal',
        color: isHeader ? '#ff4466' : '#667788'
      }).setOrigin(0.5);
    });

    // Restart button
    const btnBg = this.add.rectangle(width / 2, height - 100, 200, 44, 0x1a1122);
    btnBg.setStrokeStyle(2, 0xff2244, 0.6);
    btnBg.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, height - 100, 'REBOOT CORE', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ff4466'
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setStrokeStyle(2, 0xff4466, 1);
      btnBg.setFillStyle(0x220011, 1);
    });
    btnBg.on('pointerout', () => {
      btnBg.setStrokeStyle(2, 0xff2244, 0.6);
      btnBg.setFillStyle(0x1a1122, 1);
    });
    btnBg.on('pointerdown', () => {
      gameState.reset();
      this.scene.start('MenuScene');
    });

    // Entrance animation
    this.cameras.main.fadeIn(500, 10, 0, 0);
  }
}
