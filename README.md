# Corefall

Corefall is a minimal Phaser 3 game starter built with Vite and ES modules.

## Current Direction

- Theme: cyborg rebuild game
- Engine: Phaser 3
- Core loop: Level -> Reward -> Upgrade
- Systems planned: movement, combat, parts, enemies

## Project Structure

- `src/main.js` bootstraps Phaser and registers scenes
- `src/scenes/BootScene.js` loads assets and starts the menu
- `src/scenes/MenuScene.js` shows a simple click-to-start screen
- `src/scenes/LevelScene.js` creates the first playable scene
- `src/entities/Player.js` defines the basic player sprite

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Add Phaser:

```bash
npm install phaser
```

3. Start the dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Notes

- The project uses ES6 modules.
- The current game setup is intentionally minimal so the loop can be expanded scene by scene.

## License

- Code is licensed under the MIT License. See `LICENSE`.
- Assets are licensed separately. See `ASSET_LICENSE.md`.
- In short: all art/audio and other non-code assets are © the project author and not for reuse without permission.
