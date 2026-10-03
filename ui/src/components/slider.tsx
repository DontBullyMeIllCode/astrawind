import * as React from "react"
import {
  PanResponder,
  View as RNView,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native"
import { View } from "@astrawind/css"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"

type SliderProps = Omit<React.ComponentProps<typeof View>, "children"> & {
  value?: number[]
  defaultValue?: number[]
  /** Called while dragging. */
  onValueChange?: (value: number[]) => void
  /** Called when a drag ends with a changed value, like Radix's `onValueCommit`. */
  onValueCommit?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  /** Minimum number of steps between thumbs. */
  minStepsBetweenThumbs?: number
  orientation?: "horizontal" | "vertical"
  disabled?: boolean
  /** Maximum at the start (left, or top when vertical). */
  inverted?: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function roundToStep(value: number, step: number, min: number) {
  const n = Math.round((value - min) / step) * step + min
  const decimals = (String(step).split(".")[1] ?? "").length
  return Number(n.toFixed(decimals))
}

/** A larger touch target around the thin track. */
const HIT_SLOP_H = { top: 12, bottom: 12, left: 4, right: 4 }
const HIT_SLOP_V = { top: 4, bottom: 4, left: 12, right: 12 }

/**
 * Radix's Slider on a PanResponder: press anywhere on the slider to move the closest thumb
 * there, then drag. Thumbs can pass each other (values stay sorted), as in Radix.
 */
function Slider({
  className,
  defaultValue,
  value: valueProp,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 0,
  orientation = "horizontal",
  disabled = false,
  inverted = false,
  onLayout,
  ...props
}: SliderProps) {
  const [values, setValues] = useControllableState<number[]>({
    prop: valueProp,
    defaultProp: defaultValue ?? [min, max],
    onChange: onValueChange,
  })

  const vertical = orientation === "vertical"
  const rootRef = React.useRef<RNView>(null)
  const size = React.useRef({ width: 0, height: 0 })
  const [thumbSize, setThumbSize] = React.useState(16)
  const origin = React.useRef({ x: 0, y: 0 })
  const active = React.useRef(-1)
  const startValues = React.useRef<number[]>(values)
  const [dragging, setDragging] = React.useState(-1)

  const latest = React.useRef({ values, setValues, vertical, inverted, min, max, step, disabled, minStepsBetweenThumbs, onValueCommit })
  latest.current = { values, setValues, vertical, inverted, min, max, step, disabled, minStepsBetweenThumbs, onValueCommit }

  const valueAt = (pageX: number, pageY: number) => {
    const l = latest.current
    const length = l.vertical ? size.current.height : size.current.width
    if (length <= 0) return undefined
    let pct = l.vertical ? 1 - (pageY - origin.current.y) / length : (pageX - origin.current.x) / length
    if (l.inverted) pct = 1 - pct
    return clamp(roundToStep(l.min + clamp(pct, 0, 1) * (l.max - l.min), l.step, l.min), l.min, l.max)
  }

  /** Radix's updateValues: set a value, keep values sorted, enforce the minimum gap. */
  const update = (index: number, raw: number) => {
    const l = latest.current
    const current = l.values
    if (current[index] === raw) return
    const next = [...current]
    next[index] = raw
    next.sort((a, b) => a - b)
    const gap = l.minStepsBetweenThumbs * l.step
    for (let i = 1; i < next.length; i++) if (next[i] - next[i - 1] < gap) return
    active.current = next.indexOf(raw)
    setDragging(active.current)
    l.setValues(next)
  }

  const closestThumb = (v: number) => {
    const current = latest.current.values
    let best = 0
    for (let i = 1; i < current.length; i++) {
      if (Math.abs(current[i] - v) < Math.abs(current[best] - v)) best = i
    }
    return best
  }

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !latest.current.disabled,
        onMoveShouldSetPanResponder: () => !latest.current.disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          const { pageX, pageY } = e.nativeEvent
          startValues.current = latest.current.values
          rootRef.current?.measure((_x, _y, width, height, px, py) => {
            size.current = { width, height }
            origin.current = { x: px, y: py }
            const v = valueAt(pageX, pageY)
            if (v === undefined) return
            active.current = closestThumb(v)
            setDragging(active.current)
            update(active.current, v)
          })
        },
        onPanResponderMove: (_e, g) => {
          if (active.current < 0) return
          const v = valueAt(g.moveX, g.moveY)
          if (v !== undefined) update(active.current, v)
        },
        onPanResponderRelease: () => {
          const { values: end, onValueCommit: commit } = latest.current
          if (active.current >= 0 && end.some((v, i) => v !== startValues.current[i])) commit?.(end)
          active.current = -1
          setDragging(-1)
        },
        onPanResponderTerminate: () => {
          active.current = -1
          setDragging(-1)
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const pct = (v: number) => {
    const p = max === min ? 0 : (clamp(v, min, max) - min) / (max - min)
    return inverted ? 1 - p : p
  }

  // Range: from the lowest value (or the start, for one thumb) to the highest.
  const lo = values.length > 1 ? pct(Math.min(...values)) : pct(min)
  const hi = pct(Math.max(...values))
  const [start, end] = lo <= hi ? [lo, hi] : [hi, lo]
  const rangeStyle = vertical
    ? { bottom: `${start * 100}%` as const, top: `${(1 - end) * 100}%` as const }
    : { left: `${start * 100}%` as const, right: `${(1 - end) * 100}%` as const }

  const state = {
    "data-orientation": orientation,
    "data-disabled": disabled ? "" : undefined,
  }

  const onAction = (index: number) => (e: AccessibilityActionEvent) => {
    const current = latest.current.values[index]
    const { actionName } = e.nativeEvent
    if (actionName !== "increment" && actionName !== "decrement") return
    const next = clamp(roundToStep(current + (actionName === "increment" ? step : -step), step, min), min, max)
    update(index, next)
    onValueCommit?.(latest.current.values.map((v, i) => (i === index ? next : v)).sort((a, b) => a - b))
  }

  return (
    <View
      ref={rootRef}
      data-slot="slider"
      {...state}
      aria-disabled={disabled || undefined}
      hitSlop={vertical ? HIT_SLOP_V : HIT_SLOP_H}
      {...responder.panHandlers}
      onLayout={(e: LayoutChangeEvent) => {
        size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height }
        onLayout?.(e)
      }}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <View
        data-slot="slider-track"
        {...state}
        className={cn(
          "relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <View
          data-slot="slider-range"
          {...state}
          style={rangeStyle}
          className={cn("absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full")}
        />
      </View>
      {values.map((v, index) => {
        const p = pct(v)
        // Radix keeps thumbs inside the slider: the thumb's center runs from half a thumb
        // in from one end to half a thumb in from the other.
        const position = vertical
          ? { bottom: `${p * 100}%` as const, marginBottom: -p * thumbSize, left: "50%" as const, marginLeft: -thumbSize / 2 }
          : { left: `${p * 100}%` as const, marginLeft: -p * thumbSize, top: "50%" as const, marginTop: -thumbSize / 2 }
        return (
          <View
            key={index}
            data-slot="slider-thumb"
            {...state}
            data-dragging={dragging === index ? "" : undefined}
            role="slider"
            aria-orientation={orientation}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
            aria-disabled={disabled || undefined}
            accessible
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={onAction(index)}
            onLayout={
              index === 0
                ? (e: LayoutChangeEvent) => {
                    const { width, height } = e.nativeEvent.layout
                    const s = vertical ? height : width
                    if (s > 0 && s !== thumbSize) setThumbSize(s)
                  }
                : undefined
            }
            style={{ position: "absolute", pointerEvents: "none", ...position }}
            // `data-[dragging]:ring-4` shows the `hover:ring-4` ring while the thumb is dragged on touch devices.
            className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 data-[dragging]:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          />
        )
      })}
    </View>
  )
}

export { Slider, type SliderProps }
