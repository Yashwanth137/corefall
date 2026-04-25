import gameState from '../managers/GameState.js';

const COLORS = {
  background: 0x0a0a0c, 
  grid: 0x111122,
  lane: 0x223344,
  bounds: 0x44ffff,
  hazard: 0xff3333
};

export default class TerrainSystem {
  constructor(scene) {
    this.scene = scene;
    this.walls = scene.physics.add.staticGroup();
    
    this.navigationLines = [];
    this.lanes = [];
    this.hazardZones = [];
    this.blockerZones = [];
    
    this.build(gameState.level);
  }

  build(level) {
    const growth = Math.min(4, Math.floor((level - 1) / 2));
    this.bounds = {
      w: 800 + (growth * 50),
      h: 600 + (growth * 38)
    };
    this.navigationLines = [];
    this.lanes = [];
    this.hazardZones = [];
    this.blockerZones = [];
    
    this.spawnPoint = { x: this.bounds.w / 2, y: this.bounds.h / 2 };
    this.createStaticGeometry(level);
  }

  addNavigationLine(x1, y1, x2, y2, width, color) {
    this.lanes.push({ x1, y1, x2, y2, width, color });
    this.navigationLines.push({ p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } });
  }

  addHazardZone(x, y, width, height) {
    this.hazardZones.push({ x, y, width, height });
  }

  addBlockerZone(x, y, width, height) {
    this.blockerZones.push({ x, y, width, height });
    this.createBlocker(x, y, width, height);
  }

  createStaticGeometry(level) {
    const segments = 6;
    const stepX = this.bounds.w / segments;
    const stepY = this.bounds.h / segments;

    // Outer ring (Square boundaries) Let's make sure the bounds are walkable
    this.addNavigationLine(stepX, stepY, this.bounds.w - stepX, stepY, 20, COLORS.grid);
    this.addNavigationLine(stepX, this.bounds.h - stepY, this.bounds.w - stepX, this.bounds.h - stepY, 20, COLORS.grid);
    this.addNavigationLine(stepX, stepY, stepX, this.bounds.h - stepY, 20, COLORS.grid);
    this.addNavigationLine(this.bounds.w - stepX, stepY, this.bounds.w - stepX, this.bounds.h - stepY, 20, COLORS.grid);

    // Inner Grid
    for (let i = 2; i < segments - 1; i++) {
       this.addNavigationLine(i * stepX, stepY, i * stepX, this.bounds.h - stepY, 20, COLORS.grid);
       this.addNavigationLine(stepX, i * stepY, this.bounds.w - stepX, i * stepY, 20, COLORS.grid);
    }
    
    // Thicker center cross
    this.addNavigationLine(this.bounds.w/2, stepY, this.bounds.w/2, this.bounds.h - stepY, 40, COLORS.lane);
    this.addNavigationLine(stepX, this.bounds.h/2, this.bounds.w - stepX, this.bounds.h/2, 40, COLORS.lane);

    // Map 2: Diagonals
    if (level > 5) {
      this.addNavigationLine(stepX, stepY, this.bounds.w - stepX, this.bounds.h - stepY, 15, COLORS.lane);
      this.addNavigationLine(this.bounds.w - stepX, stepY, stepX, this.bounds.h - stepY, 15, COLORS.lane);
    }

    // Damage strips make the lane layout matter mechanically.
    if (level >= 2) {
      this.addHazardZone(this.bounds.w / 2 - 90, stepY * 2 - 12, 180, 24);
      this.addHazardZone(this.bounds.w / 2 - 90, this.bounds.h - stepY * 2 - 12, 180, 24);
    }
    if (level >= 4) {
      this.addHazardZone(stepX * 2 - 12, this.bounds.h / 2 - 90, 24, 180);
      this.addHazardZone(this.bounds.w - stepX * 2 - 12, this.bounds.h / 2 - 90, 24, 180);
    }
    if (level >= 7) {
      this.addHazardZone(this.bounds.w / 2 - 12, this.bounds.h / 2 - 180, 24, 120);
      this.addHazardZone(this.bounds.w / 2 - 12, this.bounds.h / 2 + 60, 24, 120);
    }

    // Internal blocks occupy cell centers, shaping direct enemy approaches without
    // closing the navigation lines the player and line-runners use.
    if (level >= 3) {
      const blockW = Math.min(120, stepX * 0.45);
      const blockH = Math.min(120, stepY * 0.45);
      this.addBlockerZone(stepX * 1.5 - blockW / 2, stepY * 1.5 - blockH / 2, blockW, blockH);
      this.addBlockerZone(this.bounds.w - stepX * 1.5 - blockW / 2, this.bounds.h - stepY * 1.5 - blockH / 2, blockW, blockH);
    }
    if (level >= 6) {
      const blockW = Math.min(110, stepX * 0.4);
      const blockH = Math.min(110, stepY * 0.4);
      this.addBlockerZone(this.bounds.w - stepX * 1.5 - blockW / 2, stepY * 1.5 - blockH / 2, blockW, blockH);
      this.addBlockerZone(stepX * 1.5 - blockW / 2, this.bounds.h - stepY * 1.5 - blockH / 2, blockW, blockH);
    }

    // Border blockers natively outside the lines
    const bW = 100; 
    this.createBlocker(-bW, -bW, this.bounds.w + bW * 2, bW); 
    this.createBlocker(-bW, this.bounds.h, this.bounds.w + bW * 2, bW);
    this.createBlocker(-bW, 0, bW, this.bounds.h);
    this.createBlocker(this.bounds.w, 0, bW, this.bounds.h);
  }

  createBlocker(x, y, width, height) {
    const blocker = this.scene.add.rectangle(x + width/2, y + height/2, width, height, 0x000000, 0);
    this.scene.physics.add.existing(blocker, true);
    blocker.visible = false;
    this.walls.add(blocker);
  }

  setupCollisions(player, enemies, bullets, enemyBullets) {
    if (!this.walls) return;
    this.scene.physics.add.collider(player, this.walls);
    this.scene.physics.add.collider(enemies, this.walls);
    this.scene.physics.add.collider(bullets, this.walls, (bullet) => {
      if (bullet.active && !bullet.pierce) {
        bullet.destroy();
      }
    });
    if (enemyBullets) {
      this.scene.physics.add.collider(enemyBullets, this.walls, (bullet) => {
        if (bullet.active) {
          bullet.destroy();
        }
      });
    }
  }

  checkHazards(player, damageCallback) {
    if (gameState.hoverDrift) return;

    if (player.x < 10 || player.x > this.bounds.w - 10 || player.y < 10 || player.y > this.bounds.h - 10) {
      damageCallback(5); 
      return;
    }

    for (const zone of this.hazardZones) {
      if (
        player.x >= zone.x &&
        player.x <= zone.x + zone.width &&
        player.y >= zone.y &&
        player.y <= zone.y + zone.height
      ) {
        damageCallback(5);
        return;
      }
    }
  }

  // --- Grid Graph Projection ---
  getClosestPointOnGrid(x, y) {
    let minDistance = Infinity;
    let closestPoint = { x, y };

    this.navigationLines.forEach(line => {
      const proj = this.projectPointOnLineSegment(x, y, line.p1, line.p2);
      const dist = (x - proj.x) * (x - proj.x) + (y - proj.y) * (y - proj.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = proj;
      }
    });

    return closestPoint;
  }

  projectPointOnLineSegment(x, y, p1, p2) {
    const l2 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
    if (l2 === 0) return { x: p1.x, y: p1.y };
    let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y)
    };
  }

  render(gfx) {
    gfx.fillStyle(COLORS.background, 1);
    gfx.fillRect(-500, -500, this.bounds.w + 1000, this.bounds.h + 1000);

    // Draw Lanes
    this.lanes.forEach(lane => {
      // Outer track glow
      gfx.lineStyle(lane.width, lane.color, 0.4);
      gfx.beginPath();
      gfx.moveTo(lane.x1, lane.y1);
      gfx.lineTo(lane.x2, lane.y2);
      gfx.strokePath();

      // Core electric track
      gfx.lineStyle(2, lane.color, 0.8);
      gfx.beginPath();
      gfx.moveTo(lane.x1, lane.y1);
      gfx.lineTo(lane.x2, lane.y2);
      gfx.strokePath();
    });

    // Bound Box
    gfx.lineStyle(4, COLORS.bounds, 0.8);
    gfx.strokeRect(0, 0, this.bounds.w, this.bounds.h);

    this.blockerZones.forEach(blocker => {
      gfx.fillStyle(0x071015, 0.95);
      gfx.fillRect(blocker.x, blocker.y, blocker.width, blocker.height);
      gfx.lineStyle(2, COLORS.bounds, 0.45);
      gfx.strokeRect(blocker.x, blocker.y, blocker.width, blocker.height);
    });

    this.hazardZones.forEach(zone => {
      gfx.fillStyle(COLORS.hazard, 0.12);
      gfx.fillRect(zone.x, zone.y, zone.width, zone.height);
      gfx.lineStyle(2, COLORS.hazard, 0.65);
      gfx.strokeRect(zone.x, zone.y, zone.width, zone.height);
    });
  }

  getVisualLift(x, y) { return 0; }
}
