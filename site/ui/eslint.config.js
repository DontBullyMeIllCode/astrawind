// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    rules: {
      // Docs prose is full of apostrophes and quotes, which <Text> renders as-is. Still catch
      // the characters that usually mean a JSX typo.
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
    },
  },
])
