import { defineConfig } from 'tsup'


export default defineConfig({
  name: 'browser',
  platform: 'browser',
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  clean: true,
})