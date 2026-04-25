import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    modulePreload: {
      polyfill: false
    }
  },
  plugins: [
    {
      name: 'remove-crossorigin',
      enforce: 'post',
      transformIndexHtml(html) {
        return html.replace(/crossorigin/g, '');
      }
    }
  ]
});
