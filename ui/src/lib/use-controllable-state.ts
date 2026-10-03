import * as React from "react"

/** State that is controlled when `prop` is defined and uncontrolled otherwise. */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T
  defaultProp: T
  onChange?: (value: T) => void
}): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultProp)
  const controlled = prop !== undefined
  const value = controlled ? (prop as T) : uncontrolled
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  const valueRef = React.useRef(value)
  valueRef.current = value
  const setValue = React.useCallback(
    (next: T) => {
      if (Object.is(next, valueRef.current)) return
      if (!controlled) setUncontrolled(next)
      valueRef.current = next
      onChangeRef.current?.(next)
    },
    [controlled]
  )
  return [value, setValue]
}
