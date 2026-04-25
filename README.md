# Corefall

Corefall is a Phaser 4 vertical-slice arena shooter built with Vite and ES modules. You play a damaged cyborg core fighting through a geometric grid arena, rebuilding with modular arms, legs, and cores after each cleared level.

## Current Slice

- Ten-level progression with wave compositions, upgrade breaks, mid-game boss, and final Titan victory path.
- Grid-constrained player movement with dash, hover drift, and build-specific movement perks.
- Multiple weapons: single shot, dual blasters, shotgun, laser, missile, and katana sweep.
- Enemy archetypes: grid-bound scrap fiends, chasers, dashers, shielders, swarm units, ranged attackers, and bosses.
- Mechanical arena geometry with lane hazards, internal blockers, wall collision, and hover hazard immunity.
- HUD support for health, score, kills, wave state, cooldowns, and boss HP.

## Project Structure

- `src/main.js` bootstraps Phaser and registers scenes.
- `src/scenes/BootScene.js` generates runtime textures and starts the menu.
- `src/scenes/GameScene.js` orchestrates gameplay systems, collisions, rendering, and scene transitions.
- `src/systems/MovementSystem.js` handles player movement, dash, and grid projection.
- `src/systems/CombatSystem.js` handles weapons, bullets, melee, homing, and overcharge.
- `src/systems/WaveSystem.js` handles spawning, enemy behavior, bosses, and level completion.
- `src/systems/TerrainSystem.js` builds lane geometry, hazards, blockers, and wall collisions.
- `src/data` contains level, enemy, and part definitions.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for deployment options and CI samples.

## License

- Code is licensed under the MIT License. See `LICENSE`.
- Assets are licensed separately. See `ASSET_LICENSE.md`.
- In short: all art/audio and other non-code assets are copyright the project author and not for reuse without permission.
