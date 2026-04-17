/**
 * EnemyData.js
 * Enemy type definitions: appearance, behavior, stats.
 */

export const ENEMY_TYPES = {
  drone: {
    name: 'Drone',
    hp: 1,
    speed: 90,
    damage: 10,
    radius: 10,
    color: 0xff3333,
    glowColor: 0xff0000,
    behavior: 'chase',       // Direct chase toward player
    score: 10,
    deathParticles: 4
  },

  dasher: {
    name: 'Dasher',
    hp: 2,
    speed: 70,
    damage: 15,
    radius: 9,
    color: 0xff8800,
    glowColor: 0xff6600,
    behavior: 'dash_charge', // Moves slowly, then charges in bursts
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
    glowColor: 0x2266ff,
    behavior: 'shielded',    // Has a frontal shield, must be hit from sides/back
    shieldArc: Math.PI * 0.6,
    score: 35,
    deathParticles: 8
  },

  swarm: {
    name: 'Swarmling',
    hp: 1,
    speed: 140,
    damage: 5,
    radius: 5,
    color: 0xaaff00,
    glowColor: 0x88cc00,
    behavior: 'swarm',       // Fast, erratic movement in clusters
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
    radius: 24,
    color: 0xff4488,
    glowColor: 0xff0066,
    behavior: 'boss_sentinel', // Shoots back, high HP, patrols then charges
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
    radius: 36,
    color: 0x8800ff,
    glowColor: 0x6600cc,
    behavior: 'boss_titan',    // Multi-phase: chase → spin attack → summon adds
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
