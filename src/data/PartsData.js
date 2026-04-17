/**
 * PartsData.js
 * Data-driven definitions for all modular body parts.
 * Each part modifies gameplay mechanics, not just stats.
 */

export const PART_CATEGORIES = ['arms', 'legs', 'core'];

export const PARTS = {
  arms: {
    label: 'Arms',
    icon: '🔫',
    options: [
      {
        id: 'dual_blaster',
        name: 'Dual Blasters',
        desc: 'Fire 2 parallel shots',
        tier: 1,
        color: 0x00ff88,
        apply: (state) => {
          state.bulletPattern = 'dual';
          state.bulletCount = 2;
          state.spread = 0.08;
        }
      },
      {
        id: 'shotgun',
        name: 'Shotgun Arms',
        desc: '5-bullet spread blast',
        tier: 2,
        color: 0xff8800,
        apply: (state) => {
          state.bulletPattern = 'shotgun';
          state.bulletCount = 5;
          state.spread = 0.15;
          state.fireRate = Math.max(state.fireRate, 350);
        }
      },
      {
        id: 'laser',
        name: 'Laser Cannon',
        desc: 'Piercing beam, high speed',
        tier: 2,
        color: 0x00ffff,
        apply: (state) => {
          state.bulletPattern = 'laser';
          state.bulletSpeed = 800;
          state.bulletPierce = true;
          state.bulletColor = 0x00ffff;
        }
      },
      {
        id: 'missile',
        name: 'Missile Launcher',
        desc: 'Homing projectiles',
        tier: 3,
        color: 0xff4444,
        apply: (state) => {
          state.bulletPattern = 'missile';
          state.bulletSpeed = 350;
          state.bulletHoming = true;
          state.fireRate = Math.max(state.fireRate, 500);
          state.bulletColor = 0xff4444;
        }
      },
      {
        id: 'katana',
        name: '⚔️ Katana Arms',
        desc: 'Devastating melee sweep',
        tier: 4,
        color: 0xff00ff,
        apply: (state) => {
          state.bulletPattern = 'katana';
          state.meleeDamage = 3;
          state.meleeRange = 80;
          state.meleeArc = Math.PI * 0.8;
          state.fireRate = 300;
          state.bulletColor = 0xff00ff;
        }
      }
    ]
  },

  legs: {
    label: 'Legs',
    icon: '🦿',
    options: [
      {
        id: 'wheels',
        name: 'Cyber Wheels',
        desc: '+40% movement speed',
        tier: 1,
        color: 0x88ff00,
        apply: (state) => {
          state.speed = 280;
        }
      },
      {
        id: 'jump_jets',
        name: 'Jump Jets',
        desc: 'Dash with i-frames',
        tier: 2,
        color: 0xff8844,
        apply: (state) => {
          state.speed = 220;
          state.dashSpeed = 600;
          state.dashDuration = 150;
          state.dashCooldown = 800;
          state.dashInvincible = true;
        }
      },
      {
        id: 'heavy_treads',
        name: 'Heavy Treads',
        desc: 'Slow but knockback enemies',
        tier: 2,
        color: 0x888888,
        apply: (state) => {
          state.speed = 140;
          state.knockbackPower = 300;
          state.maxHp = state.maxHp + 30;
        }
      },
      {
        id: 'hover',
        name: 'Hover Drives',
        desc: 'Float over hazards, smooth drift',
        tier: 3,
        color: 0x44ddff,
        apply: (state) => {
          state.speed = 250;
          state.hoverDrift = true;
          state.friction = 0.92;
        }
      }
    ]
  },

  core: {
    label: 'Core',
    icon: '⚡',
    options: [
      {
        id: 'reactor',
        name: 'Reactor Core',
        desc: '-40% fire cooldown',
        tier: 1,
        color: 0xffff00,
        apply: (state) => {
          state.fireRate = Math.floor(state.fireRate * 0.6);
        }
      },
      {
        id: 'shield',
        name: 'Shield Core',
        desc: 'Absorb 1 hit every 5s',
        tier: 2,
        color: 0x4488ff,
        apply: (state) => {
          state.shieldActive = true;
          state.shieldCooldown = 5000;
          state.shieldHits = 1;
        }
      },
      {
        id: 'regen',
        name: 'Nano Regen',
        desc: 'Heal 1 HP every 3s',
        tier: 2,
        color: 0x00ff44,
        apply: (state) => {
          state.regenRate = 3000;
          state.regenAmount = 1;
        }
      },
      {
        id: 'overcharge',
        name: 'Overcharge Core',
        desc: '2x damage for 3s on kill streak',
        tier: 3,
        color: 0xff00ff,
        apply: (state) => {
          state.overchargeKills = 5;
          state.overchargeDuration = 3000;
          state.overchargeDamageMultiplier = 2;
        }
      },
      {
        id: 'berserker',
        name: '🔥 Berserker Core',
        desc: 'Katana rage: speed + damage burst',
        tier: 4,
        color: 0xff0044,
        apply: (state) => {
          state.berserkerMode = true;
          state.speed = state.speed + 60;
          state.meleeDamage = (state.meleeDamage || 1) + 2;
          state.fireRate = Math.floor(state.fireRate * 0.7);
        }
      }
    ]
  }
};

/**
 * Get 3 random part options for a given level.
 * Ensures variety by picking from different categories when possible,
 * and respecting tier unlocks based on level.
 */
export function getUpgradeChoices(level, equippedParts) {
  const maxTier = Math.ceil(level / 2.5);
  const choices = [];
  const usedCategories = [];

  // Shuffle categories
  const cats = [...PART_CATEGORIES].sort(() => Math.random() - 0.5);

  for (const cat of cats) {
    if (choices.length >= 3) break;
    const available = PARTS[cat].options.filter(p =>
      p.tier <= maxTier && p.id !== equippedParts[cat]
    );
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      choices.push({ ...pick, category: cat, categoryLabel: PARTS[cat].label, categoryIcon: PARTS[cat].icon });
      usedCategories.push(cat);
    }
  }

  // Fill remaining slots from any category
  while (choices.length < 3) {
    const cat = PART_CATEGORIES[Math.floor(Math.random() * PART_CATEGORIES.length)];
    const available = PARTS[cat].options.filter(p =>
      p.tier <= maxTier &&
      !choices.find(c => c.id === p.id)
    );
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      choices.push({ ...pick, category: cat, categoryLabel: PARTS[cat].label, categoryIcon: PARTS[cat].icon });
    } else {
      break; // Avoid infinite loop
    }
  }

  return choices;
}
