import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { THEME_META_COLORS, themeInitScript } from './src/lib/theme';

/**
 * Writes the theme into <head> at build time: the blocking script that resolves the
 * reader's environment before first paint (no flash of the void for a MANUSCRIPT
 * reader), and the browser chrome colour for each scheme.
 */
const themeHead = (): Plugin => ({
  name: 'triyan-theme-head',
  transformIndexHtml: (html) =>
    html.replace(
      '<!--theme-head-->',
      [
        `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${THEME_META_COLORS.void}" />`,
        `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${THEME_META_COLORS.manuscript}" />`,
        `<script>${themeInitScript}</script>`,
      ].join('\n    '),
    ),
});

/** In development the Express API runs beside Vite; its routes are proxied through. */
const api = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss(), themeHead()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 3000,
    strictPort: true,
    // On the Windows drive (WSL's /mnt/…), edits made from Windows raise no file events:
    // poll instead, so changes still appear.
    watch: { usePolling: process.cwd().startsWith('/mnt/') },
    proxy: { '/api': api, '/sitemap.xml': api, '/robots.txt': api },
  },
  preview: { port: 3000, proxy: { '/api': api, '/sitemap.xml': api, '/robots.txt': api } },
  build: { outDir: 'dist', sourcemap: false },
});
