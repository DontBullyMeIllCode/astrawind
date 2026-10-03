import * as React from "react"
import { Animated, Easing, StyleSheet, type TextInput as RNTextInput } from "react-native"
import { MinusIcon } from "lucide-react-native"
import { Text, TextInput, View } from "@astrawind/css"
import { useFieldControl } from "../lib/field-control"
import { USE_NATIVE_DRIVER } from "../lib/overlay"
import { usePosition, withPositions } from "../lib/position"
import { useControllableState } from "../lib/use-controllable-state"
import { cn } from "../lib/utils"
import { Icon } from "./icon"

/**
 * React Native stand-in for the `input-otp` library: one invisible TextInput over the
 * slots takes the keyboard, paste and one-time-code autofill, and the slots render
 * its value from `OTPInputContext`, as the library does.
 */

/** Same values as the `input-otp` library's exports (kept out of ALL_CAPS literals, which the class audit reads). */
const patterns = { digits: "^\\d+$", chars: "^[a-zA-Z]+$", digitsAndChars: "^[a-zA-Z0-9]+$" }
const REGEXP_ONLY_DIGITS = patterns.digits
const REGEXP_ONLY_CHARS = patterns.chars
const REGEXP_ONLY_DIGITS_AND_CHARS = patterns.digitsAndChars

interface SlotProps {
  char: string | null
  placeholderChar: string | null
  isActive: boolean
  hasFakeCaret: boolean
}

interface OTPInputContextValue {
  slots: SlotProps[]
  isFocused: boolean
  isHovering: boolean
}

const OTPInputContext = React.createContext<OTPInputContextValue>({ slots: [], isFocused: false, isHovering: false })

type InputOTPProps = Omit<
  React.ComponentProps<typeof TextInput>,
  "value" | "defaultValue" | "onChange" | "onChangeText" | "maxLength" | "children" | "placeholder"
> & {
  maxLength: number
  value?: string
  defaultValue?: string
  onChange?: (newValue: string) => void
  onComplete?: (value: string) => void
  /** A regular expression (or its source) every value must match, e.g. `REGEXP_ONLY_DIGITS`. */
  pattern?: string | RegExp
  pasteTransformer?: (pasted: string) => string
  placeholder?: string
  disabled?: boolean
  containerClassName?: string
  children?: React.ReactNode
}

function InputOTP({
  className,
  containerClassName,
  maxLength,
  value: valueProp,
  defaultValue = "",
  onChange,
  onComplete,
  pattern,
  pasteTransformer,
  placeholder,
  disabled,
  onFocus,
  onBlur,
  ref,
  children,
  ...props
}: InputOTPProps) {
  const [value, setValue] = useControllableState({ prop: valueProp, defaultProp: defaultValue, onChange })
  const [isFocused, setFocused] = React.useState(false)
  const inputRef = React.useRef<RNTextInput | null>(null)
  const regexp = React.useMemo(
    () => (pattern ? (typeof pattern === "string" ? new RegExp(pattern) : pattern) : undefined),
    [pattern]
  )

  useFieldControl({ focus: () => inputRef.current?.focus(), disabled: !!disabled })

  const onChangeText = (text: string) => {
    let next = text
    // A paste (more than one new character) goes through pasteTransformer.
    if (pasteTransformer && text.length - value.length > 1) next = pasteTransformer(text)
    next = next.slice(0, maxLength)
    if (next.length > 0 && regexp && !regexp.test(next)) return
    setValue(next)
    if (next.length === maxLength && value.length !== maxLength) onComplete?.(next)
  }

  const activeIndex = Math.min(value.length, maxLength - 1)
  const slots = React.useMemo<SlotProps[]>(
    () =>
      Array.from({ length: maxLength }, (_, i) => {
        const isActive = isFocused && i === activeIndex
        const char = value[i] ?? null
        return {
          char,
          placeholderChar: char === null && placeholder ? (placeholder[i] ?? null) : null,
          isActive,
          hasFakeCaret: isActive && char === null,
        }
      }),
    [maxLength, value, isFocused, activeIndex, placeholder]
  )
  const ctx = React.useMemo(() => ({ slots, isFocused, isHovering: false }), [slots, isFocused])

  return (
    <OTPInputContext.Provider value={ctx}>
      <View
        data-slot="input-otp"
        className={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      >
        {children}
        {/* Invisible, over the slots: taps focus it and bring up the keyboard. */}
        <TextInput
          ref={(node: RNTextInput | null) => {
            inputRef.current = node
            if (typeof ref === "function") ref(node as never)
            else if (ref) (ref as React.RefObject<unknown>).current = node
          }}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          editable={!disabled}
          aria-disabled={disabled || undefined}
          inputMode="numeric"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          autoCorrect={false}
          spellCheck={false}
          caretHidden
          selection={{ start: value.length, end: value.length }}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          style={styles.input}
          className={cn("disabled:cursor-not-allowed", className)}
          {...props}
        />
      </View>
    </OTPInputContext.Provider>
  )
}

function InputOTPGroup({ className, children, ...props }: React.ComponentProps<typeof View>) {
  return (
    // `pointer-events-none` (added): touches go through the slots to the input over them.
    <View data-slot="input-otp-group" className={cn("pointer-events-none flex items-center", className)} {...props}>
      {withPositions(children, "input-otp-group")}
    </View>
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<typeof View> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, placeholderChar, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}
  // `first:*` / `last:*`: the group tells each slot its position.
  const pos = usePosition("input-otp-group")
  const first = pos?.first ?? true
  const last = pos?.last ?? true

  return (
    <View
      data-slot="input-otp-slot"
      data-active={!!isActive}
      className={cn(
        "pointer-events-none",
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md aria-invalid:border-destructive data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        first && "rounded-l-md border-l",
        last && "rounded-r-md",
        className
      )}
      {...props}
    >
      {char ? <Text>{char}</Text> : placeholderChar ? <Text className="text-muted-foreground">{placeholderChar}</Text> : null}
      {hasFakeCaret && (
        <View className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <CaretBlink>
            <View className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
          </CaretBlink>
        </View>
      )}
    </View>
  )
}

/** `animate-caret-blink` (shadcn's keyframes): visible, hidden from 20% to 50% of each second. */
function CaretBlink({ children }: { children: React.ReactNode }) {
  const opacity = React.useRef(new Animated.Value(1)).current
  React.useEffect(() => {
    const step = (toValue: number) =>
      Animated.timing(opacity, { toValue, duration: 1, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER })
    const loop = Animated.loop(
      Animated.sequence([Animated.delay(200), step(0), Animated.delay(300), step(1), Animated.delay(500)])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])
  return <Animated.View style={{ opacity }}>{children}</Animated.View>
}

function InputOTPSeparator({ ...props }: React.ComponentProps<typeof View>) {
  return (
    <View data-slot="input-otp-separator" role="separator" className="pointer-events-none" {...props}>
      <Icon as={MinusIcon} />
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    opacity: 0,
    color: "transparent",
    backgroundColor: "transparent",
  },
})

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  OTPInputContext,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
  type InputOTPProps,
}
