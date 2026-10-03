import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/** Every shadcn component is ported, exported and has an example. */

const root = path.join(__dirname, "..")
const names = (dir: string) =>
  fs
    .readdirSync(path.join(root, dir))
    .filter((f) => f.endsWith(".tsx") && !f.startsWith("_"))
    .map((f) => f.replace(/\.tsx$/, ""))
    .sort()

const upstream = names("upstream/ui")
const ported = names("src/components")
const examples = names("test/examples")
const index = fs.readFileSync(path.join(root, "src/components/index.ts"), "utf8")

describe("coverage", () => {
  it("ports every upstream component", () => {
    expect(upstream.filter((n) => !ported.includes(n))).toEqual([])
  })
  it("exports every component from the index", () => {
    expect(ported.filter((n) => !index.includes(`"./${n}"`))).toEqual([])
  })
  it("has an example for every upstream component", () => {
    expect(upstream.filter((n) => !examples.includes(n))).toEqual([])
  })
})
