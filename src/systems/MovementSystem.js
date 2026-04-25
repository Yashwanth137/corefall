import * as Phaser from 'phaser';
import gameState from '../managers/GameState.js';

export default class MovementSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Input
    this.cursors = scene.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      dash: 'SPACE'
    });

    // Dash state
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.dashVelX = 0;
    this.dashVelY = 0;

    // Velocity for hover drift
    this.velX = 0;
    this.velY = 0;
  }

  update(time, delta) {
    const player = this.player;
    if (!player || !player.active) return;

    const speed = gameState.speed;
    const dt = delta / 1000;

    // --- Dash logic ---
    if (this.isDashing) {
      this.dashTimer -= delta;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        player._invincible = false;
      } else {
        // Dash directly sets constant velocity along the grid
        this.applyGridConstrainedMovement(player, this.dashVelX * dt, this.dashVelY * dt, dt);
        return;
      }
    }

    // Dash trigger
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= delta;
    if (gameState.dashSpeed > 0 &&
        Phaser.Input.Keyboard.JustDown(this.cursors.dash) &&
        this.dashCooldownTimer <= 0) {
      this.triggerDash();
      return;
    }

    // --- Normal movement ---
    let mx = 0, my = 0;
    if (this.cursors.left.isDown) mx = -1;
    if (this.cursors.right.isDown) mx = 1;
    if (this.cursors.up.isDown) my = -1;
    if (this.cursors.down.isDown) my = 1;

    // Normalize diagonal
    const len = Math.sqrt(mx * mx + my * my);
    if (len > 0) { mx /= len; my /= len; }

    if (gameState.hoverDrift) {
      const accel = 600;
      const friction = gameState.friction || 0.92;
      this.velX += mx * accel * dt;
      this.velY += my * accel * dt;
      this.velX *= friction;
      this.velY *= friction;
      
      const mag = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
      if (mag > speed) {
        this.velX = (this.velX / mag) * speed;
        this.velY = (this.velY / mag) * speed;
      }
      this.applyGridConstrainedMovement(player, this.velX * dt, this.velY * dt, dt);
    } else {
      this.applyGridConstrainedMovement(player, mx * speed * dt, my * speed * dt, dt);
    }

    // --- Aim toward mouse ---
    const pointer = this.scene.input.activePointer;
    const angle = Phaser.Math.Angle.Between(
      player.x, player.y,
      pointer.worldX, pointer.worldY
    );
    player.aimAngle = angle;
  }

  applyGridConstrainedMovement(player, moveX, moveY, dt) {
    if (moveX === 0 && moveY === 0) {
       player.body.setVelocity(0, 0);
       return;
    }

    const targetX = player.x + moveX;
    const targetY = player.y + moveY;
    
    // Project the intended next position onto the strict navigation grid
    const terrain = this.scene.terrainSystem;
    if (!terrain) return;

    const snapped = terrain.getClosestPointOnGrid(targetX, targetY);

    // Apply the constrained velocity to allow Arcade Physics to move us smoothly
    // and naturally handle bounds/collisions with enemies if needed.
    player.body.setVelocity(
      (snapped.x - player.x) / dt,
      (snapped.y - player.y) / dt
    );
  }

  triggerDash() {
    let mx = 0, my = 0;
    if (this.cursors.left.isDown) mx = -1;
    if (this.cursors.right.isDown) mx = 1;
    if (this.cursors.up.isDown) my = -1;
    if (this.cursors.down.isDown) my = 1;

    const len = Math.sqrt(mx * mx + my * my);
    if (len === 0) {
      // Dash in aim direction
      const pointer = this.scene.input.activePointer;
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y,
        pointer.worldX, pointer.worldY
      );
      mx = Math.cos(angle);
      my = Math.sin(angle);
    } else {
      mx /= len;
      my /= len;
    }

    this.isDashing = true;
    this.dashTimer = gameState.dashDuration;
    this.dashCooldownTimer = gameState.dashCooldown;
    this.dashVelX = mx * gameState.dashSpeed;
    this.dashVelY = my * gameState.dashSpeed;

    if (gameState.dashInvincible) {
      this.player._invincible = true;
    }

    // Visual: dash trail
    this.scene.events.emit('player-dash', this.player.x, this.player.y);
  }

  get canDash() {
    return gameState.dashSpeed > 0 && this.dashCooldownTimer <= 0 && !this.isDashing;
  }

  get dashCooldownPercent() {
    if (gameState.dashCooldown <= 0) return 1;
    return Math.max(0, 1 - (this.dashCooldownTimer / gameState.dashCooldown));
  }
}

