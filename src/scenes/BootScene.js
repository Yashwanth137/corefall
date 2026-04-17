/**
 * BootScene.js
 * Generates all game textures programmatically using Phaser Graphics.
 * No external image files needed — everything is self-contained.
 * Creates: player sprites, enemy sprites, boss sprites, terrain tiles, bullets, UI elements.
 */

import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // --- Player Core ---
    this.generateTexture('player_core', 48, 48, (gfx) => {
      // Outer glow
      gfx.fillStyle(0x00ffcc, 0.12);
      gfx.fillCircle(24, 24, 22);
      // Ring
      gfx.lineStyle(2, 0x00ffcc, 0.4);
      gfx.strokeCircle(24, 24, 18);
      // Body shell
      gfx.fillStyle(0x1a3a3a, 1);
      gfx.fillCircle(24, 24, 14);
      // Tech lines
      gfx.lineStyle(1, 0x00ffcc, 0.5);
      gfx.lineBetween(10, 24, 38, 24);
      gfx.lineBetween(24, 10, 24, 38);
      // Core
      gfx.fillStyle(0x00ffcc, 1);
      gfx.fillCircle(24, 24, 7);
      gfx.fillStyle(0xffffff, 0.7);
      gfx.fillCircle(24, 24, 3);
      // Corner nodes
      gfx.fillStyle(0x00ffcc, 0.6);
      gfx.fillCircle(10, 10, 2);
      gfx.fillCircle(38, 10, 2);
      gfx.fillCircle(10, 38, 2);
      gfx.fillCircle(38, 38, 2);
    });

    // --- Player with Dual Blasters ---
    this.generateTexture('player_dual', 56, 56, (gfx) => {
      this.drawPlayerBase(gfx, 28, 28);
      // Dual barrels
      gfx.fillStyle(0x00ff88, 1);
      gfx.fillRect(38, 20, 12, 3);
      gfx.fillRect(38, 33, 12, 3);
      gfx.fillStyle(0x00ff88, 0.4);
      gfx.fillCircle(50, 21, 3);
      gfx.fillCircle(50, 35, 3);
    });

    // --- Player with Shotgun ---
    this.generateTexture('player_shotgun', 56, 56, (gfx) => {
      this.drawPlayerBase(gfx, 28, 28);
      // Wide barrel
      gfx.fillStyle(0xff8800, 1);
      gfx.fillRect(36, 18, 14, 20);
      gfx.fillStyle(0x332200, 1);
      gfx.fillRect(38, 20, 10, 4);
      gfx.fillRect(38, 26, 10, 4);
      gfx.fillRect(38, 32, 10, 4);
    });

    // --- Player with Laser ---
    this.generateTexture('player_laser', 56, 56, (gfx) => {
      this.drawPlayerBase(gfx, 28, 28);
      // Laser emitter
      gfx.lineStyle(3, 0x00ffff, 0.8);
      gfx.lineBetween(28, 28, 50, 28);
      gfx.fillStyle(0x00ffff, 1);
      gfx.fillCircle(50, 28, 5);
      gfx.fillStyle(0x00ffff, 0.2);
      gfx.fillCircle(50, 28, 10);
    });

    // --- Player with Missile ---
    this.generateTexture('player_missile', 56, 56, (gfx) => {
      this.drawPlayerBase(gfx, 28, 28);
      // Missile pod
      gfx.fillStyle(0xff4444, 1);
      gfx.fillRect(36, 22, 16, 12);
      gfx.fillStyle(0x881111, 1);
      gfx.fillCircle(44, 28, 4);
      gfx.fillStyle(0xff8888, 0.5);
      gfx.fillCircle(52, 28, 3);
    });

    // --- Player with Katana ---
    this.generateTexture('player_katana', 64, 64, (gfx) => {
      this.drawPlayerBase(gfx, 32, 32);
      // Katana blade
      gfx.lineStyle(3, 0xff00ff, 0.9);
      gfx.lineBetween(32, 32, 60, 12);
      gfx.fillStyle(0xff88ff, 0.6);
      gfx.fillCircle(60, 12, 3);
      // Handle
      gfx.fillStyle(0x884488, 1);
      gfx.fillRect(30, 30, 6, 6);
      // Energy trail
      gfx.lineStyle(1, 0xff00ff, 0.3);
      gfx.lineBetween(36, 28, 58, 8);
      gfx.lineBetween(36, 36, 58, 16);
    });

    // --- Evolved Cyborg (Victory) ---
    this.generateTexture('player_evolved', 72, 72, (gfx) => {
      // Outer energy field
      gfx.fillStyle(0x00ffcc, 0.06);
      gfx.fillCircle(36, 36, 34);
      gfx.lineStyle(1, 0x00ffcc, 0.3);
      gfx.strokeCircle(36, 36, 34);
      // Armor plating
      gfx.fillStyle(0x1a3a3a, 1);
      gfx.fillCircle(36, 36, 20);
      // Shoulder pads
      gfx.fillStyle(0x2a4a4a, 1);
      gfx.fillRect(10, 26, 12, 20);
      gfx.fillRect(50, 26, 12, 20);
      // Core
      gfx.fillStyle(0x00ffcc, 1);
      gfx.fillCircle(36, 36, 8);
      gfx.fillStyle(0xffffff, 0.7);
      gfx.fillCircle(36, 36, 4);
      // Jet thrusters
      gfx.fillStyle(0xff8844, 0.7);
      gfx.fillCircle(28, 58, 5);
      gfx.fillCircle(44, 58, 5);
      // Katana
      gfx.lineStyle(3, 0xff00ff, 0.9);
      gfx.lineBetween(36, 36, 64, 8);
      gfx.fillStyle(0xff88ff, 0.6);
      gfx.fillCircle(64, 8, 3);
      // Tech lines
      gfx.lineStyle(1, 0x00ffcc, 0.4);
      gfx.lineBetween(16, 36, 56, 36);
      gfx.lineBetween(36, 16, 36, 56);
    });

    // ============ ENEMIES ============

    // --- Drone ---
    this.generateTexture('enemy_drone', 32, 32, (gfx) => {
      // Glow
      gfx.fillStyle(0xff0000, 0.1);
      gfx.fillCircle(16, 16, 15);
      // Body
      gfx.fillStyle(0x442222, 1);
      gfx.fillCircle(16, 16, 10);
      // Inner ring
      gfx.lineStyle(1, 0xff3333, 0.7);
      gfx.strokeCircle(16, 16, 8);
      // Eye
      gfx.fillStyle(0xff3333, 1);
      gfx.fillCircle(16, 16, 4);
      gfx.fillStyle(0xff8888, 0.8);
      gfx.fillCircle(16, 16, 2);
      // Antennae
      gfx.lineStyle(1, 0xff3333, 0.5);
      gfx.lineBetween(8, 8, 4, 4);
      gfx.lineBetween(24, 8, 28, 4);
    });

    // --- Dasher ---
    this.generateTexture('enemy_dasher', 32, 32, (gfx) => {
      // Motion trail
      gfx.fillStyle(0xff8800, 0.15);
      gfx.fillCircle(10, 16, 8);
      // Diamond body
      gfx.fillStyle(0x443311, 1);
      gfx.beginPath();
      gfx.moveTo(16, 4);
      gfx.lineTo(28, 16);
      gfx.lineTo(16, 28);
      gfx.lineTo(4, 16);
      gfx.closePath();
      gfx.fillPath();
      // Edge glow
      gfx.lineStyle(1, 0xff8800, 0.7);
      gfx.beginPath();
      gfx.moveTo(16, 4);
      gfx.lineTo(28, 16);
      gfx.lineTo(16, 28);
      gfx.lineTo(4, 16);
      gfx.closePath();
      gfx.strokePath();
      // Core
      gfx.fillStyle(0xff8800, 1);
      gfx.fillCircle(16, 16, 4);
      // Thrust lines
      gfx.lineStyle(2, 0xff6600, 0.4);
      gfx.lineBetween(4, 16, -2, 14);
      gfx.lineBetween(4, 16, -2, 18);
    });

    // --- Shielder ---
    this.generateTexture('enemy_shielder', 40, 40, (gfx) => {
      // Shield arc
      gfx.lineStyle(3, 0x4488ff, 0.6);
      gfx.beginPath();
      gfx.arc(20, 20, 18, -0.9, 0.9);
      gfx.strokePath();
      gfx.lineStyle(1, 0x88bbff, 0.3);
      gfx.beginPath();
      gfx.arc(20, 20, 16, -0.7, 0.7);
      gfx.strokePath();
      // Body
      gfx.fillStyle(0x223344, 1);
      gfx.fillCircle(20, 20, 12);
      // Armor plates
      gfx.fillStyle(0x334466, 1);
      gfx.fillRect(14, 12, 12, 6);
      gfx.fillRect(14, 22, 12, 6);
      // Eye
      gfx.fillStyle(0x4488ff, 1);
      gfx.fillCircle(20, 20, 4);
      gfx.fillStyle(0x88bbff, 0.6);
      gfx.fillCircle(20, 20, 2);
    });

    // --- Swarmling ---
    this.generateTexture('enemy_swarm', 20, 20, (gfx) => {
      // Glow
      gfx.fillStyle(0xaaff00, 0.15);
      gfx.fillCircle(10, 10, 9);
      // Triangle body
      gfx.fillStyle(0x334400, 1);
      gfx.beginPath();
      gfx.moveTo(10, 2);
      gfx.lineTo(18, 16);
      gfx.lineTo(2, 16);
      gfx.closePath();
      gfx.fillPath();
      // Edge
      gfx.lineStyle(1, 0xaaff00, 0.5);
      gfx.beginPath();
      gfx.moveTo(10, 2);
      gfx.lineTo(18, 16);
      gfx.lineTo(2, 16);
      gfx.closePath();
      gfx.strokePath();
      // Eye
      gfx.fillStyle(0xaaff00, 1);
      gfx.fillCircle(10, 10, 2);
    });

    // --- Boss: Sentinel ---
    this.generateTexture('boss_sentinel', 64, 64, (gfx) => {
      // Energy field
      gfx.fillStyle(0xff0066, 0.08);
      gfx.fillCircle(32, 32, 30);
      gfx.lineStyle(1, 0xff0066, 0.3);
      gfx.strokeCircle(32, 32, 30);
      // Hexagonal body
      gfx.fillStyle(0x331122, 1);
      this.drawPolygonGfx(gfx, 32, 32, 22, 6, 0);
      // Inner ring
      gfx.lineStyle(2, 0xff4488, 0.5);
      gfx.strokeCircle(32, 32, 16);
      // Core eye
      gfx.fillStyle(0xff4488, 1);
      gfx.fillCircle(32, 32, 8);
      gfx.fillStyle(0xff88aa, 0.8);
      gfx.fillCircle(32, 32, 4);
      // Turrets
      gfx.fillStyle(0xff4488, 0.7);
      gfx.fillRect(0, 28, 8, 8);
      gfx.fillRect(56, 28, 8, 8);
      gfx.fillRect(28, 0, 8, 8);
      gfx.fillRect(28, 56, 8, 8);
      // Turret barrels
      gfx.lineStyle(2, 0xff2266, 0.6);
      gfx.lineBetween(4, 32, -4, 32);
      gfx.lineBetween(60, 32, 68, 32);
    });

    // --- Boss: Titan ---
    this.generateTexture('boss_titan', 84, 84, (gfx) => {
      // Energy field
      gfx.fillStyle(0x8800ff, 0.06);
      gfx.fillCircle(42, 42, 40);
      gfx.lineStyle(1, 0x8800ff, 0.25);
      gfx.strokeCircle(42, 42, 40);
      // Outer armor ring
      gfx.fillStyle(0x221133, 1);
      gfx.fillCircle(42, 42, 35);
      // Armor segments
      gfx.lineStyle(2, 0x6600cc, 0.4);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        gfx.lineBetween(
          42 + Math.cos(a) * 15, 42 + Math.sin(a) * 15,
          42 + Math.cos(a) * 33, 42 + Math.sin(a) * 33
        );
      }
      // Inner body
      gfx.fillStyle(0x331144, 1);
      gfx.fillCircle(42, 42, 18);
      // Core vortex
      gfx.fillStyle(0x8800ff, 1);
      gfx.fillCircle(42, 42, 10);
      gfx.fillStyle(0xbb44ff, 0.7);
      gfx.fillCircle(42, 42, 5);
      gfx.fillStyle(0xffffff, 0.5);
      gfx.fillCircle(42, 42, 2);
      // Arms
      gfx.fillStyle(0x442266, 1);
      gfx.fillRect(0, 34, 14, 16);
      gfx.fillRect(70, 34, 14, 16);
      gfx.fillRect(34, 0, 16, 14);
      gfx.fillRect(34, 70, 16, 14);
      // Claws
      gfx.fillStyle(0x8800ff, 0.6);
      gfx.fillCircle(4, 42, 5);
      gfx.fillCircle(80, 42, 5);
      gfx.fillCircle(42, 4, 5);
      gfx.fillCircle(42, 80, 5);
    });

    // ============ TERRAIN ============

    // --- Floor tile (metal) ---
    this.generateTexture('tile_floor', 80, 80, (gfx) => {
      gfx.fillStyle(0x0c1220, 1);
      gfx.fillRect(0, 0, 80, 80);
      // Grid lines
      gfx.lineStyle(1, 0x1a2844, 0.4);
      gfx.lineBetween(0, 40, 80, 40);
      gfx.lineBetween(40, 0, 40, 80);
      gfx.lineStyle(1, 0x1a2844, 0.2);
      gfx.lineBetween(0, 20, 80, 20);
      gfx.lineBetween(0, 60, 80, 60);
      gfx.lineBetween(20, 0, 20, 80);
      gfx.lineBetween(60, 0, 60, 80);
      // Corner accents
      gfx.fillStyle(0x00ffcc, 0.08);
      gfx.fillCircle(0, 0, 3);
      gfx.fillCircle(80, 0, 3);
      gfx.fillCircle(0, 80, 3);
      gfx.fillCircle(80, 80, 3);
      // Random tech dots
      gfx.fillStyle(0x00ffcc, 0.05);
      gfx.fillCircle(20, 20, 1);
      gfx.fillCircle(60, 60, 1);
    });

    // --- Wall tile ---
    this.generateTexture('tile_wall', 40, 40, (gfx) => {
      gfx.fillStyle(0x1a2844, 1);
      gfx.fillRect(0, 0, 40, 40);
      // Border
      gfx.lineStyle(2, 0x2a3a5a, 0.6);
      gfx.strokeRect(2, 2, 36, 36);
      // Warning stripes
      gfx.fillStyle(0x444400, 0.4);
      for (let i = 0; i < 8; i++) {
        gfx.fillRect(i * 10 - 5, 16, 5, 8);
      }
      // Bolts
      gfx.fillStyle(0x3a4a6a, 1);
      gfx.fillCircle(6, 6, 2);
      gfx.fillCircle(34, 6, 2);
      gfx.fillCircle(6, 34, 2);
      gfx.fillCircle(34, 34, 2);
    });

    // --- Hazard tile ---
    this.generateTexture('tile_hazard', 40, 40, (gfx) => {
      gfx.fillStyle(0x1a0808, 1);
      gfx.fillRect(0, 0, 40, 40);
      // Lava cracks
      gfx.lineStyle(2, 0xff4400, 0.5);
      gfx.lineBetween(5, 20, 20, 15);
      gfx.lineBetween(20, 15, 35, 25);
      gfx.lineBetween(10, 30, 30, 10);
      // Glow
      gfx.fillStyle(0xff2200, 0.15);
      gfx.fillCircle(20, 20, 18);
      // X marks
      gfx.lineStyle(1, 0xff0000, 0.3);
      gfx.lineBetween(8, 8, 14, 14);
      gfx.lineBetween(14, 8, 8, 14);
      gfx.lineBetween(28, 28, 34, 34);
      gfx.lineBetween(34, 28, 28, 34);
    });

    // --- Tech floor tile ---
    this.generateTexture('tile_tech', 80, 80, (gfx) => {
      gfx.fillStyle(0x080c1a, 1);
      gfx.fillRect(0, 0, 80, 80);
      // Circuit traces
      gfx.lineStyle(1, 0x003366, 0.4);
      gfx.lineBetween(10, 10, 40, 10);
      gfx.lineBetween(40, 10, 40, 40);
      gfx.lineBetween(40, 40, 70, 40);
      gfx.lineBetween(10, 50, 30, 50);
      gfx.lineBetween(30, 50, 30, 70);
      gfx.lineBetween(50, 20, 70, 20);
      gfx.lineBetween(70, 20, 70, 60);
      // Nodes
      gfx.fillStyle(0x0066aa, 0.4);
      gfx.fillCircle(40, 10, 2);
      gfx.fillCircle(40, 40, 2);
      gfx.fillCircle(70, 40, 2);
      gfx.fillCircle(30, 50, 2);
      gfx.fillCircle(70, 20, 2);
    });

    // ============ BULLETS ============

    this.generateTexture('bullet_default', 10, 10, (gfx) => {
      gfx.fillStyle(0xffffff, 0.3);
      gfx.fillCircle(5, 5, 5);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(5, 5, 2);
    });

    this.generateTexture('bullet_laser', 14, 6, (gfx) => {
      gfx.fillStyle(0x00ffff, 0.2);
      gfx.fillRect(0, 0, 14, 6);
      gfx.fillStyle(0x00ffff, 1);
      gfx.fillRect(2, 1, 10, 4);
      gfx.fillStyle(0xffffff, 0.7);
      gfx.fillRect(4, 2, 6, 2);
    });

    this.generateTexture('bullet_missile', 12, 8, (gfx) => {
      gfx.fillStyle(0xff4444, 0.3);
      gfx.fillCircle(6, 4, 6);
      gfx.fillStyle(0xff4444, 1);
      gfx.fillRect(2, 1, 8, 6);
      gfx.fillStyle(0xff8888, 0.7);
      gfx.fillCircle(9, 4, 2);
      // Exhaust
      gfx.fillStyle(0xff8844, 0.5);
      gfx.fillCircle(0, 4, 3);
    });

    this.generateTexture('bullet_enemy', 10, 10, (gfx) => {
      gfx.fillStyle(0xff4466, 0.2);
      gfx.fillCircle(5, 5, 5);
      gfx.fillStyle(0xff4466, 1);
      gfx.fillCircle(5, 5, 3);
    });

    // ============ PARTICLES ============

    this.generateTexture('particle', 8, 8, (gfx) => {
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(4, 4, 3);
      gfx.fillStyle(0xffffff, 0.3);
      gfx.fillCircle(4, 4, 4);
    });

    // All textures generated — go to menu
    this.scene.start('MenuScene');
  }

  /**
   * Helper: Generate a texture from graphics commands.
   */
  generateTexture(key, width, height, drawFn) {
    const gfx = this.add.graphics();
    drawFn(gfx);
    gfx.generateTexture(key, width, height);
    gfx.destroy();
  }

  /**
   * Helper: Draw the standard player base shape.
   */
  drawPlayerBase(gfx, cx, cy) {
    // Outer glow
    gfx.fillStyle(0x00ffcc, 0.1);
    gfx.fillCircle(cx, cy, 20);
    // Ring
    gfx.lineStyle(1, 0x00ffcc, 0.3);
    gfx.strokeCircle(cx, cy, 16);
    // Body
    gfx.fillStyle(0x1a3a3a, 1);
    gfx.fillCircle(cx, cy, 13);
    // Core
    gfx.fillStyle(0x00ffcc, 1);
    gfx.fillCircle(cx, cy, 6);
    gfx.fillStyle(0xffffff, 0.6);
    gfx.fillCircle(cx, cy, 3);
  }

  /**
   * Helper: Draw a polygon.
   */
  drawPolygonGfx(gfx, x, y, radius, sides, rotation) {
    gfx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2 + rotation;
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) gfx.moveTo(px, py);
      else gfx.lineTo(px, py);
    }
    gfx.fillPath();
  }
}
