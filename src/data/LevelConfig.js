/**
 * LevelConfig.js
 * Defines all 10 levels: wave composition, enemy types, boss flags, and scaling.
 */

export const LEVEL_CONFIG = [
  // Level 1: Tutorial — basic drones
  {
    level: 1,
    name: 'Awakening',
    subtitle: 'The core stirs...',
    waves: [
      { enemyType: 'scrap_fiend', count: 5, delay: 1200 },
      { enemyType: 'drone', count: 7, delay: 1000 }
    ],
    boss: null,
    arenaColor: 0x0a0e1a
  },
  // Level 2: More drones, faster
  {
    level: 2,
    name: 'First Steps',
    subtitle: 'Legs acquired',
    waves: [
      { enemyType: 'drone', count: 8, delay: 1000 },
      { enemyType: 'drone', count: 10, delay: 800 }
    ],
    boss: null,
    arenaColor: 0x0c1220
  },
  // Level 3: Introduce dashers
  {
    level: 3,
    name: 'Predators',
    subtitle: 'They learn to charge',
    waves: [
      { enemyType: 'drone', count: 6, delay: 900 },
      { enemyType: 'dasher', count: 4, delay: 1200 },
      { enemyType: 'drone', count: 8, delay: 800 }
    ],
    boss: null,
    arenaColor: 0x0e1428
  },
  // Level 4: Dasher swarms
  {
    level: 4,
    name: 'Rush Hour',
    subtitle: 'Relentless assault',
    waves: [
      { enemyType: 'dasher', count: 6, delay: 1000 },
      { enemyType: 'drone', count: 10, delay: 700 },
      { enemyType: 'dasher', count: 8, delay: 900 }
    ],
    boss: null,
    arenaColor: 0x10182e
  },
  // Level 5: Mini-boss — Sentinel
  {
    level: 5,
    name: 'The Sentinel',
    subtitle: 'A guardian blocks the path',
    waves: [
      { enemyType: 'drone', count: 8, delay: 800 },
      { enemyType: 'dasher', count: 5, delay: 900 }
    ],
    boss: { type: 'sentinel', hp: 30, speed: 60 },
    arenaColor: 0x141c34
  },
  // Level 6: Introduce shielders
  {
    level: 6,
    name: 'Iron Wall',
    subtitle: 'Shields up',
    waves: [
      { enemyType: 'shielder', count: 4, delay: 1400 },
      { enemyType: 'drone', count: 10, delay: 700 },
      { enemyType: 'dasher', count: 6, delay: 800 }
    ],
    boss: null,
    arenaColor: 0x161e38
  },
  // Level 7: Mixed assault
  {
    level: 7,
    name: 'Convergence',
    subtitle: 'All types unite',
    waves: [
      { enemyType: 'shielder', count: 5, delay: 1200 },
      { enemyType: 'dasher', count: 8, delay: 700 },
      { enemyType: 'drone', count: 12, delay: 600 },
      { enemyType: 'shielder', count: 3, delay: 1000 }
    ],
    boss: null,
    arenaColor: 0x18203c
  },
  // Level 8: Introduce swarm type
  {
    level: 8,
    name: 'The Swarm',
    subtitle: 'Tiny. Fast. Deadly.',
    waves: [
      { enemyType: 'swarm', count: 15, delay: 400 },
      { enemyType: 'dasher', count: 6, delay: 800 },
      { enemyType: 'swarm', count: 20, delay: 300 },
      { enemyType: 'shielder', count: 4, delay: 1000 }
    ],
    boss: null,
    arenaColor: 0x1a2240
  },
  // Level 9: Gauntlet
  {
    level: 9,
    name: 'Gauntlet',
    subtitle: 'The final test',
    waves: [
      { enemyType: 'dasher', count: 10, delay: 600 },
      { enemyType: 'shielder', count: 6, delay: 800 },
      { enemyType: 'swarm', count: 25, delay: 250 },
      { enemyType: 'drone', count: 15, delay: 500 }
    ],
    boss: null,
    arenaColor: 0x1c2444
  },
  // Level 10: Final Boss — Titan
  {
    level: 10,
    name: 'TITAN',
    subtitle: 'The machine god awaits',
    waves: [
      { enemyType: 'drone', count: 8, delay: 600 },
      { enemyType: 'dasher', count: 6, delay: 700 },
      { enemyType: 'shielder', count: 4, delay: 900 }
    ],
    boss: { type: 'titan', hp: 60, speed: 40 },
    arenaColor: 0x200020
  }
];

export function getLevelConfig(level) {
  return LEVEL_CONFIG[level - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
}
