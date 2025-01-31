import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],

  manifest: {
    permissions: ["storage", "tabs", "webNavigation"],
    "content_security_policy": {
      "extension_pages": "style-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com; script-src 'self' 'wasm-unsafe-eval'; default-src 'self' data:; connect-src 'self' data: ws://localhost:3000 http://localhost:8000 https://huggingface.co https://cdn-lfs.huggingface.co https://cdn-lfs-us-1.huggingface.co https://raw.githubusercontent.com https://cdn-lfs-us-1.hf.co"
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
