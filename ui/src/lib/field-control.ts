import * as React from "react"

/**
 * Lets `Field` / `FieldLabel` act on the control they contain, like a web
 * `<label>`: pressing the label toggles a checkbox/switch/radio or focuses an
 * input, and `FieldLabel` can style itself on the control's checked state
 * (the native stand-in for `has-data-[state=checked]:`).
 *
 * Controls opt in with `useFieldControl({ press, focus, checked, disabled })`.
 */
export interface FieldControl {
  /** Toggle/select the control (checkbox, switch, radio). */
  press?: () => void
  /** Focus the control (inputs). */
  focus?: () => void
  checked?: boolean
  disabled?: boolean
}

type ControlRef = React.RefObject<FieldControl>

export interface FieldControlScope {
  register(id: symbol, control: ControlRef): () => void
  changed(): void
  /** Presses (or focuses) the first registered control. Returns whether one handled it. */
  activate(): boolean
}

export interface FieldControlState {
  checked: boolean
  disabled: boolean
  count: number
}

export const FieldControlContext = React.createContext<FieldControlScope | null>(null)

/** Creates a scope that collects the controls rendered below it and forwards them to parent scopes. */
export function useFieldControlScope(): { scope: FieldControlScope; state: FieldControlState } {
  const parent = React.useContext(FieldControlContext)
  const controls = React.useRef(new Map<symbol, ControlRef>())
  const [state, setState] = React.useState<FieldControlState>({ checked: false, disabled: false, count: 0 })

  const scope = React.useMemo<FieldControlScope>(() => {
    const recompute = () => {
      let checked = false
      let disabled = false
      for (const ref of controls.current.values()) {
        checked ||= !!ref.current?.checked
        disabled ||= !!ref.current?.disabled
      }
      const count = controls.current.size
      setState((prev) =>
        prev.checked === checked && prev.disabled === disabled && prev.count === count ? prev : { checked, disabled, count }
      )
    }
    return {
      register(id, control) {
        controls.current.set(id, control)
        const unregisterParent = parent?.register(id, control)
        recompute()
        return () => {
          controls.current.delete(id)
          unregisterParent?.()
          recompute()
        }
      },
      changed() {
        recompute()
        parent?.changed()
      },
      activate() {
        for (const ref of controls.current.values()) {
          const c = ref.current
          if (!c || c.disabled) continue
          if (c.press) {
            c.press()
            return true
          }
          if (c.focus) {
            c.focus()
            return true
          }
        }
        return false
      },
    }
  }, [parent])

  return { scope, state }
}

/** Controls by their `nativeID`, for `<Label htmlFor>`. */
const controlsById = new Map<string, ControlRef>()

/** Presses (or focuses) the control with this `nativeID`, like a web `<label for>`. Returns whether one handled it. */
export function activateControl(id: string): boolean {
  const c = controlsById.get(id)?.current
  if (!c || c.disabled) return false
  if (c.press) {
    c.press()
    return true
  }
  if (c.focus) {
    c.focus()
    return true
  }
  return false
}

/**
 * Registers a control with the enclosing Field / FieldLabel, if any, and under its
 * `nativeID` (when given) for `<Label htmlFor>`.
 */
export function useFieldControl(control: FieldControl, nativeID?: string) {
  const scope = React.useContext(FieldControlContext)
  const id = React.useRef<symbol | null>(null)
  if (!id.current) id.current = Symbol("field-control")
  const ref = React.useRef<FieldControl>(control)
  ref.current = control
  React.useEffect(() => scope?.register(id.current!, ref), [scope])
  React.useEffect(() => {
    if (!nativeID) return
    controlsById.set(nativeID, ref)
    return () => {
      if (controlsById.get(nativeID) === ref) controlsById.delete(nativeID)
    }
  }, [nativeID])
  React.useEffect(() => {
    scope?.changed()
  }, [scope, control.checked, control.disabled])
}
