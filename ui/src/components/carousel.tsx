import * as React from "react"
import {
  ScrollView as RNScrollView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import { ArrowLeft, ArrowRight } from "lucide-react-native"
import { ScrollView, useTw, View } from "@astrawind/css"
import { Button } from "./button"
import { Icon } from "./icon"
import { cn } from "../lib/utils"

/**
 * Native port of shadcn's Carousel. embla-carousel has no React Native build;
 * CarouselContent is a ScrollView that snaps to each slide, and `CarouselApi`
 * implements the Embla methods people use: scrollPrev/scrollNext/scrollTo,
 * canScrollPrev/canScrollNext, selectedScrollSnap/previousScrollSnap,
 * scrollSnapList, scrollProgress, slidesInView and on/off("init" | "reInit" |
 * "select" | "scroll" | "settle" | "destroy"). Options: loop, align,
 * startIndex, dragFree, watchDrag, axis. Plugins are ignored.
 */

type ViewProps = React.ComponentProps<typeof View>

type CarouselEvent = "init" | "reInit" | "select" | "scroll" | "settle" | "destroy"
type CarouselListener = (api: CarouselApi, event: CarouselEvent) => void

type CarouselApi = {
  scrollPrev: (jump?: boolean) => void
  scrollNext: (jump?: boolean) => void
  scrollTo: (index: number, jump?: boolean) => void
  canScrollPrev: () => boolean
  canScrollNext: () => boolean
  selectedScrollSnap: () => number
  previousScrollSnap: () => number
  /** Snap positions as scroll progress (0–1), one per snap point. */
  scrollSnapList: () => number[]
  scrollProgress: () => number
  /** Indexes of the slides at least partly in view. */
  slidesInView: () => number[]
  on: (event: CarouselEvent, listener: CarouselListener) => CarouselApi
  off: (event: CarouselEvent, listener: CarouselListener) => CarouselApi
}

/** The Embla options that apply on native. */
type CarouselOptions = {
  /** prev/next wrap around from the last snap to the first. Slides aren't cloned. */
  loop?: boolean
  align?: "start" | "center" | "end"
  startIndex?: number
  /** Free scrolling without snapping. */
  dragFree?: boolean
  /** `false` disables dragging (buttons and the API still work). */
  watchDrag?: boolean
  axis?: "x" | "y"
}

type CarouselPlugin = unknown

type CarouselProps = {
  opts?: CarouselOptions
  /** Embla plugins have no native equivalent and are ignored. */
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type SlideLayout = { offset: number; size: number }

type Engine = {
  scrollRef: React.RefObject<RNScrollView | null>
  viewport: number
  setViewport: (size: number) => void
  setContentSize: (size: number) => void
  registerSlide: (key: string, layout: SlideLayout | null) => void
  onScroll: (offset: number) => void
  onSettle: () => void
  snaps: number[]
  opts: CarouselOptions
}

type CarouselContextProps = {
  api: CarouselApi
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  engine: Engine
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  orientation = "horizontal",
  opts = {},
  setApi,
  plugins: _plugins,
  className,
  children,
  ...props
}: ViewProps & CarouselProps) {
  const horizontal = orientation === "horizontal"
  const scrollRef = React.useRef<RNScrollView>(null)
  const [viewport, setViewport] = React.useState(0)
  const [contentSize, setContentSize] = React.useState(0)
  const [slides, setSlides] = React.useState<Record<string, SlideLayout>>({})
  const [selected, setSelected] = React.useState(opts.startIndex ?? 0)

  const state = React.useRef({
    selected: opts.startIndex ?? 0,
    previous: 0,
    offset: 0,
    snaps: [0] as number[],
    max: 0,
    viewport: 0,
    slides: [] as SlideLayout[],
    loop: !!opts.loop,
  })
  const listeners = React.useRef(new Map<CarouselEvent, Set<CarouselListener>>())
  const apiRef = React.useRef<CarouselApi | null>(null)

  const registerSlide = React.useCallback((key: string, layout: SlideLayout | null) => {
    setSlides((prev) => {
      const cur = prev[key]
      if (layout && cur && cur.offset === layout.offset && cur.size === layout.size) return prev
      if (!layout && !cur) return prev
      const next = { ...prev }
      if (layout) next[key] = layout
      else delete next[key]
      return next
    })
  }, [])

  // Snap points: each slide's aligned position, clamped to the scroll range and
  // de-duplicated (Embla's default `containScroll: "trimSnaps"`).
  const sortedSlides = React.useMemo(() => Object.values(slides).sort((a, b) => a.offset - b.offset), [slides])
  const maxScroll = Math.max(0, contentSize - viewport)
  const snaps = React.useMemo(() => {
    const out: number[] = []
    for (const s of sortedSlides) {
      let pos = s.offset
      if (opts.align === "center") pos = s.offset + s.size / 2 - viewport / 2
      else if (opts.align === "end") pos = s.offset + s.size - viewport
      pos = Math.round(Math.min(Math.max(0, pos), maxScroll))
      if (!out.length || Math.abs(out[out.length - 1] - pos) > 1) out.push(pos)
    }
    return out.length ? out : [0]
  }, [sortedSlides, maxScroll, viewport, opts.align])

  state.current.snaps = snaps
  state.current.max = maxScroll
  state.current.viewport = viewport
  state.current.slides = sortedSlides
  state.current.loop = !!opts.loop

  const emit = React.useCallback((event: CarouselEvent) => {
    const api = apiRef.current
    if (api) listeners.current.get(event)?.forEach((l) => l(api, event))
  }, [])

  const select = React.useCallback(
    (index: number) => {
      if (index === state.current.selected) return
      state.current.previous = state.current.selected
      state.current.selected = index
      setSelected(index)
      emit("select")
    },
    [emit]
  )

  const api = React.useMemo<CarouselApi>(() => {
    const count = () => state.current.snaps.length
    const scrollTo = (index: number, jump?: boolean) => {
      const n = count()
      const i = state.current.loop ? ((index % n) + n) % n : Math.min(Math.max(index, 0), n - 1)
      const pos = state.current.snaps[i] ?? 0
      scrollRef.current?.scrollTo(horizontal ? { x: pos, animated: !jump } : { y: pos, animated: !jump })
      select(i)
    }
    const self: CarouselApi = {
      scrollTo,
      scrollPrev: (jump) => scrollTo(state.current.selected - 1, jump),
      scrollNext: (jump) => scrollTo(state.current.selected + 1, jump),
      canScrollPrev: () => (state.current.loop ? count() > 1 : state.current.selected > 0),
      canScrollNext: () => (state.current.loop ? count() > 1 : state.current.selected < count() - 1),
      selectedScrollSnap: () => state.current.selected,
      previousScrollSnap: () => state.current.previous,
      scrollSnapList: () => state.current.snaps.map((s) => (state.current.max ? s / state.current.max : 0)),
      scrollProgress: () => (state.current.max ? state.current.offset / state.current.max : 0),
      slidesInView: () => {
        const { offset, slides, viewport } = state.current
        return slides
          .map((s, i) => (s.offset + s.size > offset && s.offset < offset + viewport ? i : -1))
          .filter((i) => i >= 0)
      },
      on: (event, listener) => {
        let set = listeners.current.get(event)
        if (!set) listeners.current.set(event, (set = new Set()))
        set.add(listener)
        return self
      },
      off: (event, listener) => {
        listeners.current.get(event)?.delete(listener)
        return self
      },
    }
    return self
  }, [horizontal, select])
  apiRef.current = api

  // "init" once slides are measured, "reInit" when the snap list changes.
  const snapsKey = snaps.join(",")
  const initialised = React.useRef(false)
  React.useEffect(() => {
    if (!viewport || !sortedSlides.length) return
    if (!initialised.current) {
      initialised.current = true
      const start = Math.min(opts.startIndex ?? 0, snaps.length - 1)
      if (start > 0) {
        const pos = snaps[start]
        // Wait a frame so the ScrollView knows its content size.
        requestAnimationFrame(() =>
          scrollRef.current?.scrollTo(horizontal ? { x: pos, animated: false } : { y: pos, animated: false })
        )
      }
      state.current.selected = start
      setSelected(start)
      emit("init")
    } else {
      const i = Math.min(state.current.selected, snaps.length - 1)
      state.current.selected = i
      setSelected(i)
      emit("reInit")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapsKey, viewport])

  React.useEffect(() => {
    if (!setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => () => emit("destroy"), [emit])

  const nearest = (offset: number) => {
    const list = state.current.snaps
    let best = 0
    for (let i = 1; i < list.length; i++) {
      if (Math.abs(list[i] - offset) < Math.abs(list[best] - offset)) best = i
    }
    return best
  }

  const engine: Engine = {
    scrollRef,
    viewport,
    setViewport,
    setContentSize,
    registerSlide,
    snaps,
    opts,
    onScroll: (offset) => {
      state.current.offset = offset
      emit("scroll")
      select(nearest(offset))
    },
    onSettle: () => emit("settle"),
  }

  const count = snaps.length
  const canScrollPrev = opts.loop ? count > 1 : selected > 0
  const canScrollNext = opts.loop ? count > 1 : selected < count - 1

  return (
    <CarouselContext.Provider
      value={{
        api,
        engine,
        opts,
        orientation: orientation || (opts.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev: api.scrollPrev,
        scrollNext: api.scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <View
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </View>
    </CarouselContext.Provider>
  )
}

const SlideKey = React.createContext<string>("0")

function CarouselContent({ className, children, ...props }: React.ComponentProps<typeof ScrollView>) {
  const { orientation, engine } = useCarousel()
  const horizontal = orientation === "horizontal"
  const { opts } = engine

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    engine.setViewport(horizontal ? width : height)
    props.onLayout?.(e)
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = e.nativeEvent
    engine.onScroll(horizontal ? contentOffset.x : contentOffset.y)
    props.onScroll?.(e)
  }

  return (
    <View className="overflow-hidden" data-slot="carousel-content">
      {/* The web track (`flex -ml-4`) is the ScrollView here; its content is the row of slides. */}
      <ScrollView
        ref={engine.scrollRef}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={opts.watchDrag !== false}
        snapToOffsets={opts.dragFree ? undefined : engine.snaps}
        snapToStart
        snapToEnd
        disableIntervalMomentum={!opts.dragFree}
        decelerationRate={opts.dragFree ? "normal" : "fast"}
        scrollEventThrottle={16}
        className={cn(horizontal ? "-ml-4" : "-mt-4 flex-col", className)}
        contentContainerClassName={horizontal ? "flex-row" : "flex-col"}
        {...props}
        onLayout={onLayout}
        onScroll={onScroll}
        onContentSizeChange={(w: number, h: number) => {
          engine.setContentSize(horizontal ? w : h)
          props.onContentSizeChange?.(w, h)
        }}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          engine.onSettle()
          props.onMomentumScrollEnd?.(e)
        }}
      >
        {React.Children.map(children, (child, index) =>
          React.isValidElement(child) ? (
            <SlideKey.Provider key={child.key ?? index} value={String(child.key ?? index)}>
              {child}
            </SlideKey.Provider>
          ) : (
            child
          )
        )}
      </ScrollView>
    </View>
  )
}

function CarouselItem({ className, style, onLayout, ...props }: ViewProps) {
  const { orientation, engine } = useCarousel()
  const key = React.useContext(SlideKey)
  const horizontal = orientation === "horizontal"
  const classes = cn("min-w-0 shrink-0 grow-0 basis-full", horizontal ? "pl-4" : "pt-4", className)

  // A percentage `basis-*` has nothing to resolve against inside a ScrollView's
  // content, so it becomes a size relative to the viewport.
  const tw = useTw()
  const basis = tw(classes).flexBasis
  let size: number | undefined
  if (typeof basis === "string" && basis.endsWith("%") && engine.viewport) {
    size = (engine.viewport * parseFloat(basis)) / 100
  }

  const { registerSlide } = engine
  React.useEffect(() => () => registerSlide(key, null), [registerSlide, key])

  return (
    <View
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={classes}
      style={[size !== undefined && (horizontal ? { width: size, flexBasis: size } : { height: size, flexBasis: size }), style]}
      onLayout={(e) => {
        const { x, y, width, height } = e.nativeEvent.layout
        registerSlide(key, horizontal ? { offset: x, size: width } : { offset: y, size: height })
        onLayout?.(e)
      }}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      aria-label="Previous slide"
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal" ? "top-1/2 -left-12 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onPress={() => scrollPrev()}
      {...props}
    >
      <Icon as={ArrowLeft} />
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      aria-label="Next slide"
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal" ? "top-1/2 -right-12 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onPress={() => scrollNext()}
      {...props}
    >
      <Icon as={ArrowRight} />
    </Button>
  )
}

export {
  type CarouselApi,
  type CarouselOptions,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
