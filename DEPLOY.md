# Deployment

This project is a static web game built with Vite. The production build outputs to the `dist/` folder. Below are recommended deploy options (quick, CI, and hosts).

**Quick local build & preview**

```bash
npm install
npm run build
npm run preview
```

**Important:** If you see broken asset links (404s) when hosted under a repository subpath (e.g., `https://username.github.io/repo/`), set Vite's `base` to `./` (see `vite.config.js`) or to the repo path (e.g., `/repo/`).

---

**GitHub Pages (simple)**

1. Install the `gh-pages` tool:

```bash
npm install --save-dev gh-pages
```

2. Add these scripts to `package.json`:

```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

3. Run:

```bash
npm run deploy
```

This publishes the `dist/` folder to the `gh-pages` branch.

**GitHub Pages (GitHub Actions automatic)**

You can use the included GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) to build and publish on push to `main`. Change the branch in the workflow if your default branch is different.

---

**Netlify**

- Connect your repository in Netlify, set the build command to `npm run build`, and the publish directory to `dist`.
- Alternatively drag-and-drop the `dist/` folder to a Netlify site from the UI.

**Vercel**

- Connect the repo in Vercel, set the build command to `npm run build` and output directory to `dist` (Vercel often detects this automatically).

**Surge (quick static host)**

```bash
npm run build
npx surge dist
```

**Firebase Hosting**

1. Install and login the CLI:

```bash
npm install -g firebase-tools
firebase login
```

2. Initialize and choose `dist` as the public directory:

```bash
firebase init hosting
```

3. Deploy:

```bash
npm run build
firebase deploy
```

---

**Wavedash (Browser Gaming Platform)**

1. Install the CLI:
   - **Windows (PowerShell):**
     ```powershell
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; irm https://wavedash.com/cli/install.ps1 | iex
     ```
   - **macOS/Linux:**
     ```bash
     curl -fsSL https://wavedash.com/cli/install.sh | sh
     ```

2. Authenticate:
   ```bash
   wavedash auth login
   ```

3. Configure `wavedash.toml`:
   Ensure `game_id` is set to your project ID from the Wavedash Developer Portal.

4. Test locally:
   ```bash
   wavedash dev
   ```

5. Push build:
   ```bash
   npm run build
   wavedash build push
   ```

6. Promote the build to live in the [Wavedash Developer Portal](https://docs.wavedash.com).

---

**Local static serve alternatives**

- Preview with Vite: `npm run build && npm run preview`
- Serve `dist/` with `npx serve dist` or `python -m http.server --directory dist 8080`.

---

**Assets & index.html notes**

- `index.html` currently references `src/main.js` which Vite will handle during build.
- The file links to `/favicon.svg` with an absolute path; when deploying to a subpath (like GitHub repo pages) change that to a relative path (`./favicon.svg`) or add a `public/favicon.svg` file so the asset is available in `dist/`.

**Troubleshooting**

- 404 for assets: set `base` in `vite.config.js` to `./` or to your repo path.
- Wrong branch for Pages: update the workflow branch or change GitHub Pages settings.

---

If you'd like, I can commit these files and push them, create a `gh-pages` deploy script, or wire up a GitHub Actions secret for a custom domain. Tell me which host you prefer and I will proceed.
