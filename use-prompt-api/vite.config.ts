import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es'] },
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
  plugins: [dts()],
});
