/**
 * VictoryScene.js
 * Win screen shown after completing Level 10 and defeating the Titan.
 * Shows the fully evolved cyborg with katana.
 */

import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000814);

    // Particle stars
    const gfx = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const s = 0.5 + Math.random() * 1.5;
      gfx.fillStyle(0xffffff, 0.2 + Math.random() * 0.6);
      gfx.fillCircle(sx, sy, s);
    }

    // Victory glow ring
    this.glowGfx = this.add.graphics().setDepth(5);

    // Title
    const title = this.add.text(width / 2, 80, 'CORE RESTORED', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#00ffcc',
      stroke: '#002211',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, 120, 'THE MACHINE LIVES AGAIN', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '14px',
      color: '#44aa88'
    }).setOrigin(0.5).setDepth(10);

    // Effects graphics
    this.cyborgGfx = this.add.graphics().setDepth(8);

    // Final Cyborg visual
    this.playerSprite = this.add.image(width / 2, 260, 'player_evolved').setDepth(9);
    this.playerSprite.setScale(3); // Bump up scale for victory screen

    // Stats
    const statsY = 400;
    const stats = [
      `FINAL SCORE      ${gameState.score}`,
      `TOTAL KILLS      ${gameState.totalKills}`,
      '',
      `FINAL FORM`,
      `  🔫 ${gameState.parts.arms || 'basic'}`,
      `  🦿 ${gameState.parts.legs || 'basic'}`,
      `  ⚡ ${gameState.parts.core || 'basic'}`
    ];

    stats.forEach((line, i) => {
      const isH = line === 'FINAL FORM';
      this.add.text(width / 2, statsY + i * 20, line, {
        fontFamily: '"Courier New", monospace',
        fontSize: isH ? '14px' : '12px',
        fontStyle: isH ? 'bold' : 'normal',
        color: isH ? '#00ffcc' : '#667788'
      }).setOrigin(0.5).setDepth(10);
    });

    // Play Again button
    const btnBg = this.add.rectangle(width / 2, height - 60, 200, 44, 0x0a1a14).setDepth(10);
    btnBg.setStrokeStyle(2, 0x00ffcc, 0.6);
    btnBg.setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height - 60, 'PLAY AGAIN', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5).setDepth(10);

    btnBg.on('pointerover', () => {
      btnBg.setStrokeStyle(2, 0x00ffcc, 1);
      btnBg.setFillStyle(0x0a2a1e, 1);
    });
    btnBg.on('pointerout', () => {
      btnBg.setStrokeStyle(2, 0x00ffcc, 0.6);
      btnBg.setFillStyle(0x0a1a14, 1);
    });
    btnBg.on('pointerdown', () => {
      gameState.reset();
      this.scene.start('MenuScene');
    });

    this.cameras.main.fadeIn(1000, 0, 8, 20);

    this.elapsed = 0;
  }

  update(time, delta) {
    this.elapsed += delta;
    const t = this.elapsed;
    const cx = 400;
    const cy = 260;

    this.cyborgGfx.clear();
    this.glowGfx.clear();

    // Bobbing animation for sprite
    this.playerSprite.setY(cy + Math.sin(t * 0.003) * 5);

    // Pulsing glow
    const glowSize = 50 + Math.sin(t * 0.002) * 10;
    this.glowGfx.fillStyle(0x00ffcc, 0.08);
    this.glowGfx.fillCircle(cx, cy, glowSize + 20);
    this.glowGfx.fillStyle(0x00ffcc, 0.05);
    this.glowGfx.fillCircle(cx, cy, glowSize + 40);

    // Pulse ring
    this.cyborgGfx.lineStyle(2, 0x00ffcc, 0.4 + Math.sin(t * 0.003) * 0.2);
    this.cyborgGfx.strokeCircle(cx, cy, 40 + Math.sin(t * 0.004) * 4);

    // Katana swing effect if has katana
    if (gameState.parts.arms === 'katana') {
      const angle = -Math.PI / 4 + Math.sin(t * 0.004) * 0.3;
      const bladeLen = 60;
      const bx = cx + Math.cos(angle) * bladeLen;
      const by = cy + Math.sin(angle) * bladeLen;
      this.cyborgGfx.lineStyle(3, 0xff00ff, 0.9);
      this.cyborgGfx.lineBetween(cx + Math.cos(angle) * 20, cy + Math.sin(angle) * 20, bx, by);
      this.cyborgGfx.fillStyle(0xff88ff, 0.6);
      this.cyborgGfx.fillCircle(bx, by, 3);
    }

    // Core ring
    if (gameState.parts.core === 'berserker') {
      this.cyborgGfx.lineStyle(2, 0xff0044, 0.5 + Math.sin(t * 0.006) * 0.3);
      this.cyborgGfx.strokeCircle(cx, cy, 46);
    }

    // Energy orbit
    const orbitAngle = t * 0.003;
    this.cyborgGfx.fillStyle(0x00ffcc, 0.6);
    this.cyborgGfx.fillCircle(
      cx + Math.cos(orbitAngle) * 50,
      cy + Math.sin(orbitAngle) * 50,
      3
    );
    this.cyborgGfx.fillCircle(
      cx + Math.cos(orbitAngle + Math.PI) * 50,
      cy + Math.sin(orbitAngle + Math.PI) * 50,
      3
    );
  }
}

