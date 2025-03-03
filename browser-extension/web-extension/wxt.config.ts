import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  vite: (env) => ({
    plugins: [TanStackRouterVite({
      routesDirectory: './entrypoints/sidepanel/routes'
    }), tailwindcss()] as any
  }),
  manifestVersion: 3,
  manifest: {
    permissions: [
      "storage",
      "unlimitedStorage",
      "tabs",
      "sidePanel",
      "webNavigation",
      "scripting",
      "offscreen"
    ],
    "content_security_policy": {
      "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; style-src 'self' 'unsafe-inline' https: http:; font-src 'self' https: data:; connect-src 'self' data: ws: wss: http: https:; img-src 'self' data: https: http:;"
    },
    web_accessible_resources: [
      {
        resources: ['injectPolyfill.js', 'injectDownloadTracker.js'],
        matches: ['*://*/*'],
      },
    ],
    action: {
      default_title: "Open Side Panel",
      default_icon: {
        "16": "icon/16.png",
        "24": "icon/48.png",
        "32": "icon/32.png",
        "48": "icon/48.png",
        "128": "icon/128.png"
      }
    },
    side_panel: {
      default_path: "sidepanel.html"
    }
  },
  runner: {
    openConsole: true,
    startUrls: ['http://localhost:5173'],
  },
});
