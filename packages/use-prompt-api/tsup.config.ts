import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"], // Build for both CommonJS and ES Modules
  experimentalDts: {
    entry: './src/index.ts'
  },
  splitting: true,
  bundle: true,
  sourcemap: true,
  clean: true, // Clean output directory before build
  minify: false,
  external: [], // Don't bundle express
});
