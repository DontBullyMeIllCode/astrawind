#!/usr/bin/env node
/**
 * Generates the site's registry from the ui package and src/registry/:
 *
 *   src/generated/components.json   each component: title, description and imports (from shadcn's
 *                                   docs in ui/upstream/docs), its example's source, and its extra
 *                                   examples (test/examples/<name>.<slug>.tsx, e.g. button.soft.tsx)
 *   src/generated/charts.json       each chart in src/registry/charts: type, export name, source
 *   src/generated/previews.ts       imports of every example and chart, by name, for live previews
 *
 *   node scripts/gen-registry.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ui = path.resolve(root, "../../ui")
const out = path.join(root, "src/generated")
fs.mkdirSync(out, { recursive: true })

const titleCase = (name) => name.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")

/**
 * Frontmatter, and the imports from the "Usage" section of a shadcn docs page. The
 * usage JSX there is web code (`<div>`, `<img>`), so the site shows the native example instead.
 */
function parseDocs(file) {
  if (!fs.existsSync(file)) return {}
  const text = fs.readFileSync(file, "utf8")
  const front = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? ""
  const field = (key) => new RegExp(`^${key}:\\s*(.+)$`, "m").exec(front)?.[1].trim()
  const usageSection = /\n## Usage\n([\s\S]*?)(?=\n## |$)/.exec(text)?.[1] ?? ""
  const imports = [...usageSection.matchAll(/```tsx[^\n]*\n([\s\S]*?)```/g)]
    .map((m) => m[1].trimEnd())
    .filter((code) => /^import /.test(code))
    .map((code) => code.replace(/@\/components\/ui\//g, "@astrawind/ui/"))
  return { title: field("title"), description: field("description"), imports }
}

/**
 * Where shadcn's description names a web library or platform this port doesn't use, the
 * native one. Everything else is shadcn's own wording.
 */
const DESCRIPTIONS = {
  carousel: "A carousel with motion and swipe, built on a paging ScrollView.",
  chart: "Beautiful charts. Built with react-native-svg and a recharts-style API. Copy and paste into your apps.",
  drawer: "A drawer component for React Native.",
  form: "Building forms with React Hook Form.",
  resizable: "Accessible resizable panel groups and layouts.",
  "scroll-area": "Augments native scroll functionality with shadcn's styling.",
  sonner: "An opinionated toast component for React Native.",
  tooltip: "A popup that displays information related to an element when it is long-pressed, hovered or focused.",
}

// Extra examples beyond shadcn's demo, `<name>.<slug>.tsx`, in a fixed order where it matters.
const EXTRA_ORDER = ["colors", "soft", "dash"]
const extraFiles = fs.readdirSync(path.join(ui, "test/examples")).filter((f) => /^[a-z-]+\.[a-z-]+\.tsx$/.test(f))
function extrasOf(name) {
  return extraFiles
    .filter((f) => f.startsWith(`${name}.`))
    .map((f) => {
      const slug = f.split(".")[1]
      return { slug, title: titleCase(slug), source: fs.readFileSync(path.join(ui, "test/examples", f), "utf8") }
    })
    .sort((a, b) => {
      const rank = (s) => (EXTRA_ORDER.includes(s) ? EXTRA_ORDER.indexOf(s) : EXTRA_ORDER.length)
      return rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug)
    })
}

// Components
const components = fs
  .readdirSync(path.join(ui, "upstream/ui"))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.replace(/\.tsx$/, ""))
  .sort()
  .map((name) => {
    const docs = parseDocs(path.join(ui, "upstream/docs", `${name}.mdx`))
    const exampleFile = path.join(ui, "test/examples", `${name}.tsx`)
    const example = fs.existsSync(exampleFile) ? fs.readFileSync(exampleFile, "utf8") : null
    // Pages without an import in their usage: take the component's import from the example.
    const fromExample = example?.match(new RegExp(`^import (?:type )?\\{[^}]*\\} from "@astrawind/ui/${name}"$`, "m"))?.[0]
    return {
      name,
      title: docs.title ?? titleCase(name),
      description: DESCRIPTIONS[name] ?? docs.description ?? "",
      imports: docs.imports?.length ? docs.imports : fromExample ? [fromExample] : [],
      example,
      extras: extrasOf(name),
    }
  })
fs.writeFileSync(path.join(out, "components.json"), JSON.stringify(components))

// Charts
const CHART_TYPES = ["area", "bar", "line", "pie", "radar", "radial", "tooltip"]
const chartDir = path.join(root, "src/registry/charts")
const charts = (fs.existsSync(chartDir) ? fs.readdirSync(chartDir) : [])
  .filter((f) => /^chart-[a-z]+-.+\.tsx$/.test(f))
  .map((f) => {
    const id = f.replace(/\.tsx$/, "")
    const source = fs.readFileSync(path.join(chartDir, f), "utf8")
    const exportName = /export function (\w+)/.exec(source)?.[1]
    return { id, type: id.split("-")[1], exportName, source, fullWidth: id.endsWith("-interactive") }
  })
  .filter((c) => CHART_TYPES.includes(c.type) && c.exportName)
  // As on ui.shadcn.com: the interactive chart first, then the default, then the rest.
  .sort((a, b) => {
    const rank = (c) => (c.fullWidth ? 0 : c.id.endsWith("-default") ? 1 : 2)
    return a.type.localeCompare(b.type) || rank(a) - rank(b) || a.id.localeCompare(b.id)
  })
fs.writeFileSync(path.join(out, "charts.json"), JSON.stringify(charts))

// Live preview imports
const ident = (name) => name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
const lines = [
  "// Generated by scripts/gen-registry.mjs. Do not edit.",
  'import type * as React from "react"',
]
const exampleNames = components.filter((c) => c.example).map((c) => c.name)
for (const name of exampleNames) lines.push(`import ${ident(name)}Example from "@examples/${name}"`)
const extraNames = components.flatMap((c) => c.extras.map((e) => `${c.name}.${e.slug}`))
for (const name of extraNames) lines.push(`import ${ident(name.replace(".", "-"))}Example from "@examples/${name}"`)
for (const c of charts) lines.push(`import { ${c.exportName} } from "@/registry/charts/${c.id}"`)
lines.push(
  "",
  "export const examples: Record<string, React.ComponentType> = {",
  ...exampleNames.map((name) => `  ${JSON.stringify(name)}: ${ident(name)}Example,`),
  "}",
  "",
  "/** Extra examples, by `<name>.<slug>`. */",
  "export const extraExamples: Record<string, React.ComponentType> = {",
  ...extraNames.map((name) => `  ${JSON.stringify(name)}: ${ident(name.replace(".", "-"))}Example,`),
  "}",
  "",
  "export const charts: Record<string, React.ComponentType> = {",
  ...charts.map((c) => `  ${JSON.stringify(c.id)}: ${c.exportName},`),
  "}",
  ""
)
fs.writeFileSync(path.join(out, "previews.ts"), lines.join("\n"))

console.log(
  `${components.length} components (${exampleNames.length} examples, ${extraNames.length} extra), ${charts.length} charts`
)
