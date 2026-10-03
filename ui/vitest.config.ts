import { createRequire } from "node:module"
import path from "node:path"
import { defineConfig } from "vitest/config"

const require = createRequire(import.meta.url)
const rnWeb = path.dirname(require.resolve("react-native-web/package.json"))

// Tests run on react-native-web, against @astrawind/css's source (no build needed).
export default defineConfig({
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: rnWeb },
      { find: /^@astrawind\/ui$/, replacement: path.resolve(__dirname, "src/index.ts") },
      { find: /^@astrawind\/ui\/(.+)$/, replacement: path.resolve(__dirname, "src/components/$1.tsx") },
      { find: /^@astrawind\/css\/core$/, replacement: path.resolve(__dirname, "../css/src/core/index.ts") },
      { find: /^@astrawind\/css$/, replacement: path.resolve(__dirname, "../css/src/index.ts") },
    ],
    mainFields: ["module", "main"],
    extensions: [".web.tsx", ".web.ts", ".web.mjs", ".web.js", ".tsx", ".ts", ".mjs", ".js", ".jsx", ".json"],
  },
  ssr: { resolve: { mainFields: ["module", "main"] } },
  define: { __DEV__: "false" },
  // @rn-primitives and friends ship JSX in .mjs/.js files.
  esbuild: { include: /\.[cm]?[jt]sx?$/, exclude: [], loader: "tsx", jsx: "automatic" },
  test: {
    server: { deps: { inline: [/@rn-primitives/, /lucide-react-native/, /react-native-svg/, /react-native-web/] } },
  },
})
