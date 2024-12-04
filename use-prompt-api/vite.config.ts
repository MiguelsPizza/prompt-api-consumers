import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'use-prompt-api', // Replace with your package name
      formats: ['es', 'cjs'], // Add CommonJS support
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
        },
      },
    },
  },
  resolve: { alias: { src: resolve('src/') } },
  plugins: [dts({ rollupTypes: true })],
});