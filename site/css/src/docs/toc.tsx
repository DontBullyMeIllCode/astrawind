import * as React from "react"
import type { ScrollView, View } from "react-native"

/**
 * "On this page": headings register their position in the page's scroll view,
 * the table of contents scrolls to them and highlights the one in view.
 */

export interface TocItem {
  id: string
  title: string
  level: 2 | 3
  y: number
}

interface TocContextValue {
  items: TocItem[]
  activeId?: string
  register: (item: TocItem) => void
  unregister: (id: string) => void
  scrollTo: (id: string) => void
  /** The scroll view's content, which headings measure themselves against. */
  contentRef: React.RefObject<View | null>
}

const TocContext = React.createContext<TocContextValue | null>(null)

/** Offset below the top of the scroll view a heading scrolls to. */
const SCROLL_MARGIN = 24

export function useTocState(scrollRef: React.RefObject<ScrollView | null>) {
  const contentRef = React.useRef<View | null>(null)
  const [items, setItems] = React.useState<TocItem[]>([])
  const [scrollY, setScrollY] = React.useState(0)

  const register = React.useCallback((item: TocItem) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.id === item.id)
      if (i >= 0 && prev[i].y === item.y && prev[i].title === item.title) return prev
      const next = i >= 0 ? prev.map((p, j) => (j === i ? item : p)) : [...prev, item]
      return next.sort((a, b) => a.y - b.y)
    })
  }, [])
  const unregister = React.useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), [])
  const scrollTo = React.useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id)
      if (item) scrollRef.current?.scrollTo({ y: Math.max(0, item.y - SCROLL_MARGIN), animated: true })
    },
    [items, scrollRef]
  )

  // The active heading is the last one scrolled past (or the first).
  let activeId = items[0]?.id
  for (const item of items) if (item.y - SCROLL_MARGIN * 2 <= scrollY) activeId = item.id

  const value = React.useMemo<TocContextValue>(
    () => ({ items, activeId, register, unregister, scrollTo, contentRef }),
    [items, activeId, register, unregister, scrollTo]
  )
  return { value, onScroll: setScrollY, contentRef }
}

export const TocProvider = TocContext.Provider

export function useToc() {
  return React.useContext(TocContext)
}

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

/** Registers a heading, measured relative to the scroll content. */
export function useTocHeading(title: string, level: 2 | 3, id = slugify(title)) {
  const toc = useToc()
  const ref = React.useRef<View | null>(null)
  const measure = React.useCallback(() => {
    const node = ref.current
    const content = toc?.contentRef.current
    if (!node || !content || !toc) return
    node.measureLayout(content, (_x, y) => toc.register({ id, title, level, y }), () => {})
  }, [toc, id, title, level])
  const unregister = toc?.unregister
  React.useEffect(() => () => unregister?.(id), [unregister, id])
  return { ref, onLayout: measure, id }
}
