/**
 * UpgradeScene.js
 * Part selection screen shown between levels.
 * Offers 3 upgrade choices with visual cards.
 */

import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';
import { getUpgradeChoices } from '../data/PartsData.js';
import { getLevelConfig } from '../data/LevelConfig.js';

export default class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('UpgradeScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x080c18);

    // Scan lines effect
    const scanLines = this.add.graphics();
    scanLines.fillStyle(0x000000, 0.1);
    for (let y = 0; y < height; y += 4) {
      scanLines.fillRect(0, y, width, 2);
    }

    // Title
    this.add.text(width / 2, 60, 'SYSTEM UPGRADE', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#00ffcc'
    }).setOrigin(0.5);

    // Subtitle
    const nextCfg = getLevelConfig(gameState.level);
    this.add.text(width / 2, 95, `PREPARE FOR LEVEL ${gameState.level} — ${nextCfg.name}`, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '12px',
      color: '#556677'
    }).setOrigin(0.5);

    // Current build display
    const build = gameState.getBuildSummary();
    this.add.text(width / 2, 130, `CURRENT BUILD: 🔫 ${build.arms}  🦿 ${build.legs}  ⚡ ${build.core}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#334455'
    }).setOrigin(0.5);

    // Get upgrade choices
    const choices = getUpgradeChoices(gameState.level, gameState.parts);

    // Render cards
    const cardW = 200;
    const cardH = 240;
    const spacing = 30;
    const totalW = choices.length * cardW + (choices.length - 1) * spacing;
    const startX = (width - totalW) / 2 + cardW / 2;

    choices.forEach((choice, i) => {
      const cx = startX + i * (cardW + spacing);
      const cy = height / 2 + 30;

      this.createUpgradeCard(cx, cy, cardW, cardH, choice, i);
    });

    // Stats
    this.add.text(width / 2, height - 40, `TOTAL KILLS: ${gameState.totalKills}  |  SCORE: ${gameState.score}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#334455'
    }).setOrigin(0.5);

    // Heal player between levels
    gameState.heal(Math.floor(gameState.maxHp * 0.3));
  }

  createUpgradeCard(x, y, w, h, choice, index) {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.rectangle(0, 0, w, h, 0x111827, 0.95);
    bg.setStrokeStyle(1, 0x334455);
    container.add(bg);

    // Top color stripe
    const stripe = this.add.rectangle(0, -h / 2 + 4, w, 8, choice.color, 0.8);
    container.add(stripe);

    // Category icon + label
    const catText = this.add.text(0, -h / 2 + 30, `${choice.categoryIcon} ${choice.categoryLabel.toUpperCase()}`, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '11px',
      color: '#' + choice.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    container.add(catText);

    // Part name
    const nameText = this.add.text(0, -h / 2 + 60, choice.name, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameText);

    // Description
    const descText = this.add.text(0, -h / 2 + 90, choice.desc, {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#8899aa',
      wordWrap: { width: w - 24 },
      align: 'center'
    }).setOrigin(0.5);
    container.add(descText);

    // Tier indicator
    const tierStars = '★'.repeat(choice.tier) + '☆'.repeat(4 - choice.tier);
    const tierText = this.add.text(0, -h / 2 + 120, tierStars, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#' + choice.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    container.add(tierText);

    // Part visual preview circle
    const gfx = this.add.graphics();
    gfx.fillStyle(choice.color, 0.15);
    gfx.fillCircle(0, 20, 30);
    gfx.fillStyle(choice.color, 0.8);
    gfx.fillCircle(0, 20, 12);
    gfx.fillStyle(0xffffff, 0.5);
    gfx.fillCircle(0, 20, 5);
    container.add(gfx);

    // EQUIP button
    const btnBg = this.add.rectangle(0, h / 2 - 30, w - 24, 32, 0x1a2744);
    btnBg.setStrokeStyle(1, choice.color, 0.5);
    container.add(btnBg);

    const btnText = this.add.text(0, h / 2 - 30, 'EQUIP', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#' + choice.color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    container.add(btnText);

    // Interactive
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setStrokeStyle(2, choice.color, 0.8);
      container.setScale(1.05);
      btnBg.setFillStyle(choice.color, 0.2);
    });

    bg.on('pointerout', () => {
      bg.setStrokeStyle(1, 0x334455, 1);
      container.setScale(1);
      btnBg.setFillStyle(0x1a2744, 1);
    });

    bg.on('pointerdown', () => {
      this.selectUpgrade(choice);
    });

    // Entrance animation
    container.setAlpha(0);
    container.setY(y + 30);
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: y,
      duration: 400,
      delay: index * 150,
      ease: 'Back.easeOut'
    });
  }

  selectUpgrade(choice) {
    gameState.equipPart(choice.category, choice);

    // Flash and transition
    this.cameras.main.flash(300, 0, 255, 200);

    this.time.delayedCall(500, () => {
      this.scene.start('GameScene');
    });
  }
}
