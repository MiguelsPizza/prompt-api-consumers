import { defineConfig } from 'tsup'


export default defineConfig({
  name: 'browser',
  platform: 'browser',
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  tsconfig: "./tsconfig.json",
  bundle: true,
  splitting: true,
  sourcemap: true,
  dts: true,
  clean: true,
})