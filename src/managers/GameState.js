/**
 * GameState.js
 * Singleton game state manager. Persists across scenes.
 * Tracks level, equipped parts, player stats, and run state.
 */

const DEFAULT_STATE = {
  // Progression
  level: 1,
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
  maxHp: 100,
  hp: 100,
  speed: 200,
  fireRate: 250,         // ms between shots
  bulletSpeed: 500,
  bulletCount: 1,
  bulletPattern: 'single', // single, dual, shotgun, laser, missile, katana
  bulletColor: 0xffffff,
  bulletPierce: false,
  bulletHoming: false,
  spread: 0,

  // Legs modifiers
  dashSpeed: 0,
  dashDuration: 0,
  dashCooldown: 0,
  dashInvincible: false,
  knockbackPower: 0,
  hoverDrift: false,
  friction: 1,

  // Core modifiers
  shieldActive: false,
  shieldCooldown: 0,
  shieldHits: 0,
  regenRate: 0,
  regenAmount: 0,
  overchargeKills: 0,
  overchargeDuration: 0,
  overchargeDamageMultiplier: 1,
  berserkerMode: false,

  // Melee (katana)
  meleeDamage: 0,
  meleeRange: 0,
  meleeArc: 0
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
    // Apply the part's effects
    partDef.apply(this);
  }

  nextLevel() {
    this.level++;
    this.kills = 0;
  }

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
