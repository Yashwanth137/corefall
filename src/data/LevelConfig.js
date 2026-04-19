/**
 * LevelConfig.js
 * Defines all 10 levels: wave composition, enemy types, boss flags, and scaling.
 */

export const LEVEL_CONFIG = [
  {
    level: 1,
    name: 'Awakening',
    subtitle: 'The core stirs...',
    waves: [
      { enemyType: 'scrap_fiend', count: 6, delay: 1200 },
      { enemyType: 'drone', count: 5, delay: 1000 }
    ],
    boss: null,
    arenaColor: 0x0a0e1a
  },
  {
    level: 2,
    name: 'First Steps',
    subtitle: 'Restricted Paths',
    waves: [
      { enemyType: 'drone', count: 8, delay: 1000 },
      { enemyType: 'scrap_fiend', count: 10, delay: 800 }
    ],
    boss: null,
    arenaColor: 0x0c1220
  },
  {
    level: 3,
    name: 'Predators',
    subtitle: 'They learn to shoot',
    waves: [
      { enemyType: 'drone', count: 6, delay: 900 },
      { enemyType: 'ranged', count: 4, delay: 1200 },
      { enemyType: 'scrap_fiend', count: 8, delay: 800 }
    ],
    boss: null,
    arenaColor: 0x0e1428
  },
  {
    level: 4,
    name: 'Rush Hour',
    subtitle: 'Relentless assault',
    waves: [
      { enemyType: 'dasher', count: 6, delay: 1000 },
      { enemyType: 'ranged', count: 5, delay: 700 },
      { enemyType: 'dasher', count: 8, delay: 900 }
    ],
    boss: null,
    arenaColor: 0x10182e
  },
  {
    level: 5,
    name: 'The Sentinel',
    subtitle: 'A guardian blocks the path',
    waves: [
      { enemyType: 'scrap_fiend', count: 8, delay: 800 },
      { enemyType: 'ranged', count: 5, delay: 900 }
    ],
    boss: { type: 'sentinel', hp: 35, speed: 60 },
    arenaColor: 0x141c34
  },
  {
    level: 6,
    name: 'Diagonal Shift',
    subtitle: 'Grid expansion acquired',
    waves: [
      { enemyType: 'shielder', count: 4, delay: 1400 },
      { enemyType: 'drone', count: 10, delay: 700 },
      { enemyType: 'dasher', count: 6, delay: 800 }
    ],
    boss: null,
    arenaColor: 0x161e38
  },
  {
    level: 7,
    name: 'Convergence',
    subtitle: 'All types unite',
    waves: [
      { enemyType: 'shielder', count: 5, delay: 1200 },
      { enemyType: 'dasher', count: 8, delay: 700 },
      { enemyType: 'ranged', count: 8, delay: 600 },
      { enemyType: 'shielder', count: 3, delay: 1000 }
    ],
    boss: null,
    arenaColor: 0x18203c
  },
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
  {
    level: 9,
    name: 'Gauntlet',
    subtitle: 'The final test',
    waves: [
      { enemyType: 'dasher', count: 10, delay: 600 },
      { enemyType: 'shielder', count: 6, delay: 800 },
      { enemyType: 'swarm', count: 25, delay: 250 },
      { enemyType: 'ranged', count: 15, delay: 500 }
    ],
    boss: null,
    arenaColor: 0x1c2444
  },
  {
    level: 10,
    name: 'TITAN',
    subtitle: 'The machine god awaits',
    waves: [
      { enemyType: 'ranged', count: 8, delay: 600 },
      { enemyType: 'dasher', count: 6, delay: 700 },
      { enemyType: 'shielder', count: 4, delay: 900 }
    ],
    boss: { type: 'titan', hp: 75, speed: 40 },
    arenaColor: 0x200020
  }
];

export function getLevelConfig(level) {
  return LEVEL_CONFIG[level - 1] || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
}
