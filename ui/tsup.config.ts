import { defineConfig } from "tsup"
import pkg from "./package.json"

export default defineConfig({
  entry: ["src/index.ts", "src/components/*.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies), "react-dom"],
  // dist is for web bundlers (native apps resolve src/ through the "react-native" condition).
  esbuildOptions(options) {
    options.resolveExtensions = [".web.tsx", ".web.ts", ".tsx", ".ts", ".mjs", ".js", ".json"]
  },
})
