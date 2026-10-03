// @vitest-environment happy-dom
/// <reference lib="dom" />
import * as React from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "../src/components/alert-dialog"
import { Dialog, DialogContent, DialogTitle } from "../src/components/dialog"
import { Drawer, DrawerContent, DrawerTitle } from "../src/components/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "../src/components/popover"
import { Sheet, SheetContent, SheetTitle } from "../src/components/sheet"
import { Text } from "@astrawind/css"
import { ThemeProvider } from "../src/theme"

/**
 * Mounts overlays open in a DOM. The server render in render.test.tsx renders them
 * closed, and their portal content only renders in the client, so this is where styles
 * that only fail when applied to a DOM element show up, like `pointerEvents: "box-none"`
 * in a plain React Native View's inline style (see AUTHORING.md, rule 11).
 */

// react-dom's act() environment flag.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/**
 * Browsers throw when a style is set by index ("Failed to set an indexed property [0] on
 * 'CSSStyleDeclaration'"), which is what happens when a style array reaches a DOM element.
 * happy-dom accepts it, so element styles here throw the same way.
 */
const styleDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "style")!
const strictStyles = new WeakMap<CSSStyleDeclaration, CSSStyleDeclaration>()
Object.defineProperty(HTMLElement.prototype, "style", {
  configurable: true,
  get(this: HTMLElement) {
    const style: CSSStyleDeclaration = styleDescriptor.get!.call(this)
    let strict = strictStyles.get(style)
    if (!strict) {
      strict = new Proxy(style, {
        get: (target, key) => {
          const value = Reflect.get(target, key, target)
          return typeof value === "function" ? value.bind(target) : value
        },
        set: (target, key, value) => {
          if (typeof key === "string" && /^\d+$/.test(key)) {
            throw new TypeError(`Failed to set an indexed property [${key}] on 'CSSStyleDeclaration'`)
          }
          return Reflect.set(target, key, value, target)
        },
      })
      strictStyles.set(style, strict)
    }
    return strict
  },
  set(this: HTMLElement, value: string) {
    styleDescriptor.set!.call(this, value)
  },
})

/** Warnings from third-party web builds, not from these components. */
const IGNORED = [/collapsable/, /pointerEvents is deprecated/]
const ignored = (args: unknown[]) => IGNORED.some((re) => args.some((a) => typeof a === "string" && re.test(a)))

const overlays: Record<string, () => React.ReactElement> = {
  sheet: () => (
    <Sheet defaultOpen>
      <SheetContent>
        <SheetTitle>Open overlay</SheetTitle>
      </SheetContent>
    </Sheet>
  ),
  drawer: () => (
    <Drawer defaultOpen>
      <DrawerContent>
        <DrawerTitle>Open overlay</DrawerTitle>
      </DrawerContent>
    </Drawer>
  ),
  dialog: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Open overlay</DialogTitle>
      </DialogContent>
    </Dialog>
  ),
  "alert-dialog": () => (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogTitle>Open overlay</AlertDialogTitle>
      </AlertDialogContent>
    </AlertDialog>
  ),
  popover: () => (
    <Popover defaultOpen>
      <PopoverTrigger>
        <Text>Trigger</Text>
      </PopoverTrigger>
      <PopoverContent>
        <Text>Open overlay</Text>
      </PopoverContent>
    </Popover>
  ),
}

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

describe("overlays open in the DOM", () => {
  for (const [name, Overlay] of Object.entries(overlays)) {
    it(name, async () => {
      const errors: unknown[] = []
      const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
        if (!ignored(args)) errors.push(args)
      })
      const container = document.createElement("div")
      document.body.appendChild(container)
      const root = createRoot(container, { onUncaughtError: (e) => errors.push(e), onCaughtError: (e) => errors.push(e) })
      cleanup = () => {
        act(() => root.unmount())
        container.remove()
        spy.mockRestore()
      }
      await act(async () => {
        root.render(
          <ThemeProvider forcedTheme="light">
            <Overlay />
          </ThemeProvider>
        )
      })
      // Popover opens from an effect (OpenSync), a tick after mounting.
      await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
      expect(errors).toEqual([])
      // Overlays render through the portal, outside the container.
      expect(document.body.textContent).toContain("Open overlay")
      // `box-none` and `box-only` aren't CSS values: inline, browsers drop them, and the
      // element catches the presses meant for what's behind it.
      const invalid = Array.from(document.body.querySelectorAll("[style]"))
        .map((el) => el.getAttribute("style") ?? "")
        .filter((style) => /pointer-events:\s*box-(none|only)/.test(style))
      expect(invalid).toEqual([])
    })
  }
})
