import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  vite: (env) => ({
    plugins: [tailwindcss()] as any
  }),
  manifest: {
    manifest: {
      permissions: ["storage", "unlimitedStorage", "tabs", "webNavigation"],
      "content_security_policy": {
        // Warning: This is not advisable in production
        // It's usually safer to "just" add the specific hosts that you truly need
        "extension_pages": `
          default-src 'self' blob: data: *;
          script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:3000 *;
          style-src-elem 'self' 'unsafe-inline' http://localhost:3000 https://cdnjs.cloudflare.com *;
          font-src 'self' https://cdnjs.cloudflare.com *;
          connect-src 'self' data: ws://localhost:3000 http://localhost:8000 https://huggingface.co https://cdn-lfs.huggingface.co https://cdn-lfs-us-1.huggingface.co https://raw.githubusercontent.com https://cdn-lfs-us-1.hf.co *;
        `
      },
    },
    // ...
    web_accessible_resources: [
      {
        resources: ['example-main-world.js'],
        matches: ['*://*/*'],
      },
    ],
  },
  runner: {
    openConsole: true,
    startUrls: ['http://localhost:5173'],
  },
});
