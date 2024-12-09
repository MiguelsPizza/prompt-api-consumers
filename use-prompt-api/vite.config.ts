import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'usePromptApi',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'dom-chromium-ai'],
      output: {
        preserveModules: false,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        globals: {
          react: 'React',
        },
      },
    },
    minify: 'esbuild',
    sourcemap: true,

  },
  resolve: { alias: { src: resolve('src/') } },
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
      insertTypesEntry: true,
      copyDtsFiles: true,
      bundledPackages: ['dom-chromium-ai']
    })
  ],
});