/**
 * TerrainSystem.js
 * A minimal geometric rendering system replacing the organic terrain.
 * Focuses on Ketchapp-style sparse arena lines, boundaries, and subtle lanes.
 */

import gameState from '../managers/GameState.js';

const COLORS = {
  background: 0x0a0a0c, // Deep dark neon backdrop
  grid: 0x111122,
  lane: 0x223344,
  bounds: 0x44ffff,
  hazard: 0xff3333
};

export default class TerrainSystem {
  constructor(scene) {
    this.scene = scene;
    this.walls = scene.physics.add.staticGroup();
    this.lanes = [];
    
    this.build(gameState.level);
  }

  build(level) {
    // Generate scale based on level progression to give feeling of larger arenas
    const growth = Math.min(4, Math.floor((level - 1) / 2));
    this.bounds = {
      w: 1200 + (growth * 200),
      h: 1200 + (growth * 200)
    };
    
    this.spawnPoint = { x: this.bounds.w / 2, y: this.bounds.h / 2 };

    this.createStaticGeometry(level);
  }

  createStaticGeometry(level) {
    // We don't render them into graphics here. 
    // They are logically registered here, and GameScene draws them!
    
    // 1. Center crossing lanes
    this.lanes.push({
      x1: 0, y1: this.bounds.h / 2,
      x2: this.bounds.w, y2: this.bounds.h / 2,
      width: 40, color: COLORS.lane
    });
    this.lanes.push({
      x1: this.bounds.w / 2, y1: 0,
      x2: this.bounds.w / 2, y2: this.bounds.h,
      width: 40, color: COLORS.lane
    });

    // 2. Additional lanes for higher levels
    if (level > 4) {
      this.lanes.push({
        x1: 0, y1: 0, x2: this.bounds.w, y2: this.bounds.h,
        width: 20, color: COLORS.grid
      });
      this.lanes.push({
        x1: 0, y1: this.bounds.h, x2: this.bounds.w, y2: 0,
        width: 20, color: COLORS.grid
      });
    }

    // Border blockers so physics handles it natively
    const bW = 100; // border depth
    this.createBlocker(-bW, -bW, this.bounds.w + bW * 2, bW); // Top
    this.createBlocker(-bW, this.bounds.h, this.bounds.w + bW * 2, bW); // Bottom
    this.createBlocker(-bW, 0, bW, this.bounds.h); // Left
    this.createBlocker(this.bounds.w, 0, bW, this.bounds.h); // Right
  }

  createBlocker(x, y, width, height) {
    const blocker = this.scene.add.rectangle(x + width/2, y + height/2, width, height, 0x000000, 0);
    this.scene.physics.add.existing(blocker, true);
    blocker.visible = false;
    this.walls.add(blocker);
  }

  setupCollisions(player, enemies, bullets) {
    if (!this.walls) return;
    this.scene.physics.add.collider(player, this.walls);
    this.scene.physics.add.collider(enemies, this.walls);
    this.scene.physics.add.collider(bullets, this.walls, (bullet) => {
      if (bullet.active && !bullet.pierce) {
        bullet.destroy();
      }
    });
  }

  checkHazards(player, damageCallback) {
    // Minimal geometry mode doesn't rely heavily on hazard pools,
    // but if we wanted to add glowing red boundary edges that hurt...
    if (
      player.x < 10 || player.x > this.bounds.w - 10 || 
      player.y < 10 || player.y > this.bounds.h - 10
    ) {
      damageCallback(5); // Touch the electric fence, get zapped.
    }
  }

  render(gfx) {
    // Invoked by GameScene each frame onto the centralized graphics context.

    // Background base
    gfx.fillStyle(COLORS.background, 1);
    gfx.fillRect(-500, -500, this.bounds.w + 1000, this.bounds.h + 1000);

    // Draw Lanes
    this.lanes.forEach(lane => {
      gfx.lineStyle(lane.width, lane.color, 0.4);
      gfx.beginPath();
      gfx.moveTo(lane.x1, lane.y1);
      gfx.lineTo(lane.x2, lane.y2);
      gfx.strokePath();

      // Core line
      gfx.lineStyle(2, lane.color, 0.8);
      gfx.beginPath();
      gfx.moveTo(lane.x1, lane.y1);
      gfx.lineTo(lane.x2, lane.y2);
      gfx.strokePath();
    });

    // Draw Bound Box (Arena limit)
    gfx.lineStyle(4, COLORS.bounds, 0.8);
    gfx.strokeRect(0, 0, this.bounds.w, this.bounds.h);
    
    // Electric inner ring
    gfx.lineStyle(1, COLORS.hazard, 0.5 + Math.sin(Date.now() * 0.005) * 0.2);
    gfx.strokeRect(10, 10, this.bounds.w - 20, this.bounds.h - 20);
  }

  getVisualLift(x, y) {
    // Legacy support to prevent crash where it expects toIso
    return 0; 
  }
}
