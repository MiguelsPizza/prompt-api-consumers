/** @typedef {import("tsup").Options} TsupOptions */

/** @type { TsupOptions } */
const baseConfig = {
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false, // Combine all code into one file per format
  minify: false, // Minify output in production
}

export default baseConfig;
