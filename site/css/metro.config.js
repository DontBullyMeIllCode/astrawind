// @ts-check
const path = require("node:path")
const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// Use @astrawind/ui's and @astrawind/css's source on every platform, so changes to them show up
// without a build (Metro doesn't watch their dist/ folders). Native already gets @astrawind/ui's
// source through its `react-native` export condition; web resolves with `browser`.
const uiSource = path.resolve(__dirname, "../../ui/src")
const cssSource = path.resolve(__dirname, "../../css/src")
const defaultResolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@astrawind/ui") {
    return { type: "sourceFile", filePath: path.join(uiSource, "index.ts") }
  }
  if (moduleName === "@astrawind/css") {
    return { type: "sourceFile", filePath: path.join(cssSource, "index.ts") }
  }
  if (moduleName === "@astrawind/css/core") {
    return { type: "sourceFile", filePath: path.join(cssSource, "core/index.ts") }
  }
  const match = /^@astrawind\/ui\/([a-z-]+)$/.exec(moduleName)
  if (match) {
    return { type: "sourceFile", filePath: path.join(uiSource, "components", `${match[1]}.tsx`) }
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform)
}

module.exports = config
