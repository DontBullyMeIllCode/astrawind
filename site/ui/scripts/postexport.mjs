// After `expo export --platform web`: writes dist/sitemap.xml from the canonical URL of every page
// (pages without one, like redirects and noindex pages, are left out), serves the not-found page
// as Vercel's 404.html, and removes Expo Router's development sitemap.
import { copyFile, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const dist = path.resolve(process.argv[2] ?? "dist")

const urls = new Set()
for (const file of await readdir(dist, { recursive: true })) {
  if (!file.endsWith(".html")) continue
  const html = await readFile(path.join(dist, file), "utf8")
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)
  if (canonical) urls.add(canonical[1])
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
  .sort()
  .map((url) => `  <url><loc>${url}</loc></url>`)
  .join("\n")}
</urlset>
`
await writeFile(path.join(dist, "sitemap.xml"), sitemap)
await copyFile(path.join(dist, "+not-found.html"), path.join(dist, "404.html"))
await rm(path.join(dist, "_sitemap.html"), { force: true })

console.log(`sitemap.xml: ${urls.size} URLs`)
