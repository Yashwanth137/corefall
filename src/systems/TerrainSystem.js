/**
 * TerrainSystem.js
 * Generates arena terrain per level with floor tiles, walls, and hazards.
 * Each level has a different layout to keep gameplay fresh.
 */

import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';

// Arena layout templates — 0=floor, 1=wall, 2=hazard, 3=tech
// Each level uses a different layout
const LAYOUTS = {
  // Level 1-2: Open arena, minimal walls
  open: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 3-4: Corridors with cover
  corridors: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 5: Boss arena — pillars
  boss_arena: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0],
    [0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0],
    [0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 6-7: Hazard zones
  hazard: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0],
    [0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0],
    [0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 8-9: Dense combat arena
  dense: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 10: Final boss arena — ceremonial
  final_boss: [
    [3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3],
    [3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3],
    [3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3],
  ]
};

// Map level number to layout key
const LEVEL_LAYOUT_MAP = {
  1: 'open', 2: 'open',
  3: 'corridors', 4: 'corridors',
  5: 'boss_arena',
  6: 'hazard', 7: 'hazard',
  8: 'dense', 9: 'dense',
  10: 'final_boss'
};

const TILE_SIZE = 40;

export default class TerrainSystem {
  constructor(scene) {
    this.scene = scene;
    this.walls = scene.physics.add.staticGroup();
    this.hazards = [];
    this.build();
  }

  build() {
    const level = gameState.level;
    const layoutKey = LEVEL_LAYOUT_MAP[level] || 'open';
    const layout = LAYOUTS[layoutKey];

    // Floor tiles (visual only — under everything)
    for (let row = 0; row < layout.length; row++) {
      for (let col = 0; col < layout[row].length; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const tileType = layout[row][col];

        if (tileType === 0) {
          // Normal floor — use tile_floor texture
          const tile = this.scene.add.image(x, y, 'tile_floor').setDepth(0);
          tile.setDisplaySize(TILE_SIZE, TILE_SIZE);
          tile.setAlpha(0.6);
        } else if (tileType === 1) {
          // Wall — solid, collideable
          const tile = this.scene.add.image(x, y, 'tile_wall').setDepth(1);
          tile.setDisplaySize(TILE_SIZE, TILE_SIZE);

          // Create physics body for collision
          const wall = this.walls.create(x, y, 'tile_wall');
          wall.setDisplaySize(TILE_SIZE, TILE_SIZE);
          wall.setAlpha(0); // invisible — visual is the image above
          wall.refreshBody();
        } else if (tileType === 2) {
          // Hazard — damages player standing on it
          const tile = this.scene.add.image(x, y, 'tile_hazard').setDepth(0);
          tile.setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.hazards.push({ x, y, size: TILE_SIZE });
        } else if (tileType === 3) {
          // Tech floor — decorative
          const tile = this.scene.add.image(x, y, 'tile_tech').setDepth(0);
          tile.setDisplaySize(TILE_SIZE, TILE_SIZE);
          tile.setAlpha(0.7);
        }
      }
    }

    // Fill remaining floor area that's not covered by the grid
    // (The layout is 20x15, each tile 40px = 800x600, matches the game area)
  }

  /**
   * Setup collision with player and enemies.
   */
  setupCollisions(player, enemies, bullets) {
    if (this.walls.getLength() > 0) {
      this.scene.physics.add.collider(player, this.walls);
      this.scene.physics.add.collider(enemies, this.walls);
      // Bullets destroy on wall hit
      this.scene.physics.add.overlap(bullets, this.walls, (bullet) => {
        if (!bullet.pierce) {
          bullet.destroy();
        }
      });
    }
  }

  /**
   * Check if player is on a hazard tile. Called from GameScene update.
   */
  checkHazards(player, damageCallback) {
    for (const h of this.hazards) {
      const dx = Math.abs(player.x - h.x);
      const dy = Math.abs(player.y - h.y);
      if (dx < h.size / 2 && dy < h.size / 2) {
        damageCallback(2); // 2 damage per tick on hazard
        return;
      }
    }
  }
}
