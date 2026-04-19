/**
 * EnemyData.js
 * Enemy type definitions: appearance, behavior, stats.
 */

export const ENEMY_TYPES = {
  scrap_fiend: {
    name: 'Scrap Fiend',
    hp: 1,
    speed: 80,
    damage: 10,
    radius: 12,
    color: 0xff4422,
    shape: 'jagged', // Will draw segmented/jagged lines
    behavior: 'chase',
    score: 15,
    deathParticles: 6
  },

  drone: {
    name: 'Drone',
    hp: 1,
    speed: 90,
    damage: 10,
    radius: 10,
    color: 0xff3333,
    shape: 'triangle',
    behavior: 'chase',
    score: 10,
    deathParticles: 4
  },

  dasher: {
    name: 'Dasher',
    hp: 2,
    speed: 70,
    damage: 15,
    radius: 11,
    color: 0xff8800,
    shape: 'arrow', // Stretched indicator
    thick: true,
    behavior: 'dash_charge',
    dashSpeed: 400,
    dashCooldown: 2000,
    dashDuration: 300,
    score: 25,
    deathParticles: 6
  },

  shielder: {
    name: 'Shielder',
    hp: 4,
    speed: 60,
    damage: 12,
    radius: 14,
    color: 0x4488ff,
    shape: 'square', // Tank heavy
    thick: true,
    behavior: 'shielded',
    shieldArc: Math.PI * 0.6,
    score: 35,
    deathParticles: 8
  },

  swarm: {
    name: 'Swarmling',
    hp: 1,
    speed: 140,
    damage: 5,
    radius: 4,
    color: 0xaaff00,
    shape: 'dots', // Flickering particles
    behavior: 'swarm',
    jitter: 50,
    score: 5,
    deathParticles: 2
  },

  // Bosses
  sentinel: {
    name: 'Sentinel',
    hp: 30,
    speed: 55,
    damage: 20,
    radius: 26,
    color: 0xff4488,
    shape: 'hex_core', // Nested rotating hex
    behavior: 'boss_sentinel',
    shootRate: 1500,
    bulletSpeed: 250,
    score: 200,
    deathParticles: 16,
    isBoss: true
  },

  titan: {
    name: 'Titan',
    hp: 60,
    speed: 35,
    damage: 30,
    radius: 40,
    color: 0x8800ff,
    shape: 'titan_core', // Huge multi-layer geometry
    behavior: 'boss_titan',
    phase2Hp: 30,
    summonType: 'drone',
    summonCount: 4,
    summonCooldown: 6000,
    score: 500,
    deathParticles: 24,
    isBoss: true
  }
};

export function getEnemyData(type) {
  return ENEMY_TYPES[type] || ENEMY_TYPES.drone;
}

