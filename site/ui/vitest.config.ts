import { createRequire } from "node:module"
import path from "node:path"
import { defineConfig } from "vitest/config"

const require = createRequire(import.meta.url)
const rnWeb = path.dirname(require.resolve("react-native-web/package.json"))
const repo = path.resolve(__dirname, "../..")

// Renders the site's registry items on react-native-web, against the packages' source.
export default defineConfig({
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: rnWeb },
      { find: /^@examples\/(.+)$/, replacement: path.join(repo, "ui/test/examples/$1.tsx") },
      { find: /^@\/(.+)$/, replacement: path.resolve(__dirname, "src/$1") },
      { find: /^@astrawind\/ui$/, replacement: path.join(repo, "ui/src/index.ts") },
      { find: /^@astrawind\/ui\/(.+)$/, replacement: path.join(repo, "ui/src/components/$1.tsx") },
      { find: /^@astrawind\/css\/core$/, replacement: path.join(repo, "css/src/core/index.ts") },
      { find: /^@astrawind\/css$/, replacement: path.join(repo, "css/src/index.ts") },
    ],
    mainFields: ["module", "main"],
    extensions: [".web.tsx", ".web.ts", ".web.mjs", ".web.js", ".tsx", ".ts", ".mjs", ".js", ".jsx", ".json"],
  },
  ssr: { resolve: { mainFields: ["module", "main"] } },
  define: { __DEV__: "false" },
  esbuild: { include: /\.[cm]?[jt]sx?$/, exclude: [], loader: "tsx", jsx: "automatic" },
  test: {
    server: { deps: { inline: [/@rn-primitives/, /lucide-react-native/, /react-native-svg/, /react-native-web/, /expo/] } },
  },
})
