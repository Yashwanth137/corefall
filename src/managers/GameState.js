/**
 * GameState.js
 * Singleton game state manager. Persists across scenes.
 * Tracks level, equipped parts, player stats, and run state.
 */

import { PARTS, PART_CATEGORIES } from '../data/PartsData.js';

const BASE_STATS = {
  maxHp: 100,
  speed: 200,
  fireRate: 250,
  bulletSpeed: 500,
  bulletCount: 1,
  bulletPattern: 'single',
  bulletColor: 0xffffff,
  bulletPierce: false,
  bulletHoming: false,
  spread: 0,
  dashSpeed: 0,
  dashDuration: 0,
  dashCooldown: 0,
  dashInvincible: false,
  knockbackPower: 0,
  hoverDrift: false,
  friction: 1,
  shieldActive: false,
  shieldCooldown: 0,
  shieldHits: 0,
  regenRate: 0,
  regenAmount: 0,
  overchargeKills: 0,
  overchargeDuration: 0,
  overchargeDamageMultiplier: 1,
  berserkerMode: false,
  meleeDamage: 0,
  meleeRange: 0,
  meleeArc: 0
};

const DEFAULT_STATE = {
  // Progression
  level: 1,
  wave: 1,
  enemiesRemaining: 0,
  isUpgradePhase: false,
  kills: 0,
  totalKills: 0,
  score: 0,

  // Equipped parts
  parts: {
    arms: null,
    legs: null,
    core: null
  },

  // Player stats (modified by parts)
  ...BASE_STATS,
  hp: BASE_STATS.maxHp
};

class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    Object.assign(this, JSON.parse(JSON.stringify(DEFAULT_STATE)));
  }

  equipPart(category, partDef) {
    this.parts[category] = partDef.id;
    this.recomputeDerivedStats();
  }

  recomputeDerivedStats() {
    const previousHp = this.hp ?? BASE_STATS.maxHp;
    const previousMaxHp = this.maxHp || BASE_STATS.maxHp;
    const nextStats = { ...BASE_STATS };

    for (const category of PART_CATEGORIES) {
      const partId = this.parts[category];
      if (!partId) continue;

      const partDef = PARTS[category]?.options.find((option) => option.id === partId);
      if (partDef) {
        partDef.apply(nextStats);
      }
    }

    Object.assign(this, nextStats);

    if (!this.shieldActive) {
      delete this._shieldReady;
    }

    const hpRatio = previousMaxHp > 0 ? previousHp / previousMaxHp : 1;
    const scaledHp = previousHp <= 0 ? 0 : Math.max(1, Math.round(this.maxHp * hpRatio));
    this.hp = Math.min(this.maxHp, scaledHp);
  }

  // Removed nextLevel() as progression is strictly controlled by WaveSystem now.

  takeDamage(amount) {
    if (this.shieldActive && this._shieldReady) {
      this._shieldReady = false;
      return 0; // Shield absorbed
    }
    const actual = Math.max(0, amount);
    this.hp = Math.max(0, this.hp - actual);
    return actual;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addKill(score) {
    this.kills++;
    this.totalKills++;
    this.score += score;
  }

  get isAlive() {
    return this.hp > 0;
  }

  get isMaxLevel() {
    return this.level >= 10;
  }

  /**
   * Get a snapshot of current build for display.
   */
  getBuildSummary() {
    return {
      arms: this.parts.arms || 'Basic Blaster',
      legs: this.parts.legs || 'Core Hover',
      core: this.parts.core || 'Basic Core'
    };
  }
}

// Singleton
const gameState = new GameState();
export default gameState;
