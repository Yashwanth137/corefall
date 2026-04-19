/**
 * HUD.js
 * In-game heads-up display: HP bar, level indicator, kill counter,
 * equipped parts icons, dash cooldown, boss HP bar.
 */

import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(100).setScrollFactor(0);

    // Level text
    this.levelText = scene.add.text(400, 12, '', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '14px',
      color: '#8899bb',
      align: 'center'
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Kill counter
    this.killText = scene.add.text(780, 12, '', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '12px',
      color: '#667788',
      align: 'right'
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    // Score
    this.scoreText = scene.add.text(780, 28, '', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '12px',
      color: '#44ff88',
      align: 'right'
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    // Wave indicator
    this.waveText = scene.add.text(400, 30, '', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '11px',
      color: '#556677',
      align: 'center'
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Parts display
    this.partsText = scene.add.text(16, 570, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#445566',
      align: 'left'
    }).setOrigin(0, 1).setDepth(100).setScrollFactor(0);

    // Boss HP bar (hidden by default)
    this.bossHpVisible = false;
    this.bossHp = 0;
    this.bossMaxHp = 0;
    this.bossName = '';
  }

  showBossHp(name, hp, maxHp) {
    this.bossHpVisible = true;
    this.bossName = name;
    this.bossHp = hp;
    this.bossMaxHp = maxHp;
  }

  hideBossHp() {
    this.bossHpVisible = false;
  }

  updateBossHp(hp) {
    this.bossHp = hp;
  }

  update(waveSystem, movementSystem) {
    this.graphics.clear();

    // --- HP Bar ---
    const hpX = 16, hpY = 16, hpW = 160, hpH = 14;
    const hpPercent = gameState.hp / gameState.maxHp;

    // HP border (Dark)
    this.graphics.lineStyle(2, 0x334455, 0.6);
    this.graphics.strokeRoundedRect(hpX - 2, hpY - 2, hpW + 4, hpH + 4, 3);

    // HP Fill (Wireframe stroke)
    const hpColor = hpPercent > 0.5 ? 0x00ff88 : hpPercent > 0.25 ? 0xffaa00 : 0xff3333;
    // We represent 'fill' via parallel lines or just a solid line
    this.graphics.lineStyle(hpH, hpColor, 0.8);
    this.graphics.beginPath();
    this.graphics.moveTo(hpX, hpY + hpH/2);
    this.graphics.lineTo(hpX + (hpW * hpPercent), hpY + hpH/2);
    this.graphics.strokePath();

    // HP text overlay
    this.graphics.fillStyle(0xffffff, 0.9);

    // --- Shield indicator ---
    if (gameState.shieldActive) {
      this.graphics.lineStyle(2, 0x4488ff, 0.6);
      this.graphics.strokeCircle(96, hpY + hpH + 14, 6);
      this.graphics.strokeCircle(96, hpY + hpH + 14, 3);
    }

    // --- Dash cooldown ---
    if (movementSystem && gameState.dashSpeed > 0) {
      const dashPct = movementSystem.dashCooldownPercent;
      const dashX = 16, dashY = hpY + hpH + 8, dashW = 60, dashH = 4;
      
      this.graphics.lineStyle(1, 0x222233, 0.8);
      this.graphics.strokeRect(dashX, dashY, dashW, dashH);
      
      this.graphics.lineStyle(dashH, dashPct >= 1 ? 0xff8844 : 0x553322, 0.9);
      this.graphics.beginPath();
      this.graphics.moveTo(dashX, dashY + dashH/2);
      this.graphics.lineTo(dashX + (dashW * dashPct), dashY + dashH/2);
      this.graphics.strokePath();
    }

    // --- Boss HP Bar ---
    if (this.bossHpVisible && this.bossMaxHp > 0) {
      const bx = 200, by = 570, bw = 400, bh = 12;
      const bPercent = this.bossHp / this.bossMaxHp;

      this.graphics.lineStyle(1, 0xff4466, 0.5);
      this.graphics.strokeRoundedRect(bx - 2, by - 2, bw + 4, bh + 4, 3);

      this.graphics.lineStyle(bh, 0xff2244, 0.9);
      this.graphics.beginPath();
      this.graphics.moveTo(bx, by + bh/2);
      this.graphics.lineTo(bx + (bw * bPercent), by + bh/2);
      this.graphics.strokePath();
    }

    // --- Text updates ---
    const cfg = waveSystem ? waveSystem.config : null;
    this.levelText.setText(cfg ? `LV ${gameState.level} — ${cfg.name}` : `LV ${gameState.level}`);
    this.killText.setText(`KILLS ${gameState.totalKills}`);
    this.scoreText.setText(`${gameState.score}`);

    if (waveSystem) {
      const waveInfo = `WAVE ${waveSystem.currentWaveIndex + 1}/${waveSystem.config.waves.length}`;
      this.waveText.setText(waveInfo);
    }

    // Parts display
    const p = gameState.parts;
    const parts = [
      `🔫 ${p.arms || 'basic'}`,
      `🦿 ${p.legs || 'basic'}`,
      `⚡ ${p.core || 'basic'}`
    ].join('  ');
    this.partsText.setText(parts);
  }

  destroy() {
    this.graphics.destroy();
    this.levelText.destroy();
    this.killText.destroy();
    this.scoreText.destroy();
    this.waveText.destroy();
    this.partsText.destroy();
  }
}
