import * as Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    // Initial Physics Setup
    this.setSize(32, 32); 
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Configure internal Arcade Physics body
    this.body.setCircle(14, 2, 2); 
    this.body.setCollideWorldBounds(true);

    // Base Properties
    this.aimAngle = 0;
    this._invincible = false;
    this._hitFlashTimer = 0;
    this.baseTint = 0x00ffcc; // Default neon glow
  }

  // Effect helper
  applyColorTint(color) {
    this.currentTint = color;
  }

  clearColorTint() {
    this.currentTint = this.baseTint;
  }

  // Kept so GameScene can still invoke it, though we don't swap textures here anymore.
  updateVisuals(parts) {
    // Modify baseTint based on equipped core or arms
    if (parts.core === 'reactor') this.baseTint = 0xffff00;
    else if (parts.core === 'regen') this.baseTint = 0x00ff44;
    else if (parts.arms === 'laser') this.baseTint = 0x44ffff;
    else if (parts.arms === 'katana') this.baseTint = 0xff44ff;
    else this.baseTint = 0x00ffcc;

    if (!this._hitFlashTimer) this.currentTint = this.baseTint;
  }

  destroy(fromScene) {
    super.destroy(fromScene);
  }
}
