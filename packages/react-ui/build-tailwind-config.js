import esbuild from "esbuild"

esbuild
  .build({
    entryPoints: ["./tailwind.config.js"],
    outfile: "dist/tailwind.config.bundled.cjs",
    bundle: true,
    platform: "node",
    format: "cjs"
  })
  .catch(() => process.exit(1))
