import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'


// https://vitejs.dev/config/
export default defineConfig({
  root: './',
  build: {
    outDir: './dist',
    rollupOptions: {
      input: './index.html'
    },
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: [{ find: '@', replacement: fileURLToPath(new URL('./src/library', import.meta.url)) }]
  },
  publicDir: './public',
  envDir: './', // Use this dir for env vars, not 'src'.
  optimizeDeps: {
    // Don't optimize these packages as they contain web workers and WASM files.
    // https://github.com/vitejs/vite/issues/11672#issuecomment-1415820673
    exclude: ["@electric-sql/pglite"],
    // include: [],
    // include: ['@powersync/web > js-logger'], // <-- Include `js-logger` when it isn't installed and imported.
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    TanStackRouterVite(),
    react(),
    VitePWA({
      srcDir: './src',
      outDir: './dist',

      workbox: {
        sourcemap: true,
        globPatterns: ['**/*.{js,css,html,ico,wasm,png,svg,json,vue,txt,woff2}'],
        maximumFileSizeToCacheInBytes: 500000000,
      },
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      includeAssets: ['powersync-logo.svg', 'supabase-logo.png', 'favicon.ico'],
      manifest: {
        theme_color: '#c44eff',
        background_color: '#c44eff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        name: 'LocalFirstChat',
        short_name: 'LocalFirstChat',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: '/pwa-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()]
  },
  css: {
    devSourcemap: true
  }
});
