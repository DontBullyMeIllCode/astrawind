import { Redirect } from "expo-router"

/** /docs opens the first page, as on tailwindcss.com. */
export default function DocsIndex() {
  return <Redirect href="/docs/installation" />
}
