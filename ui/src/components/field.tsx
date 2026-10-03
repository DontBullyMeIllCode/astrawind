import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { FieldControlContext, useFieldControlScope } from "../lib/field-control"
import { cn, hasClass } from "../lib/utils"
import { Label } from "./label"
import { Separator } from "./separator"

type ViewProps = React.ComponentProps<typeof View>
type TextProps = React.ComponentProps<typeof Text>
type ChildProps = { className?: string; role?: string; "data-slot"?: string; variant?: string }
type FieldOrientation = "vertical" | "horizontal" | "responsive"

function elementsOf(children: React.ReactNode) {
  return React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<ChildProps>[]
}

const typeName = (el: React.ReactElement) => {
  const t = el.type as { displayName?: string; name?: string } | string
  return typeof t === "string" ? t : (t.displayName ?? t.name ?? "")
}

/** Whether a direct child is (or renders) the given `data-slot`. */
function hasSlotChild(children: React.ReactNode, slot: string, type?: string) {
  return elementsOf(children).some((el) => el.props["data-slot"] === slot || (!!type && typeName(el) === type))
}

/**
 * Where a FieldDescription sits among its siblings: the native stand-in for
 * `last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5`.
 */
interface SiblingInfo {
  last: boolean
  secondLast: boolean
  afterLegend: boolean
}
const SiblingContext = React.createContext<SiblingInfo | null>(null)

function withSiblingInfo(children: React.ReactNode): React.ReactNode {
  const items = React.Children.toArray(children)
  const elements = items.filter(React.isValidElement) as React.ReactElement<ChildProps>[]
  const count = elements.length
  let index = 0
  let prev: React.ReactElement<ChildProps> | undefined
  return items.map((child) => {
    if (!React.isValidElement(child)) return child
    const i = index++
    const afterLegend = !!prev && prev.type === FieldLegend && (prev.props.variant ?? "legend") === "legend"
    prev = child as React.ReactElement<ChildProps>
    return (
      <SiblingContext.Provider
        key={child.key ?? i}
        value={{ last: i === count - 1, secondLast: i === count - 2, afterLegend }}
      >
        {child}
      </SiblingContext.Provider>
    )
  })
}

// `has-[>[data-slot=checkbox-group]]` / `has-[>[data-slot=radio-group]]` only see a `data-slot`
// written in JSX, so the children are checked here as well.
function FieldSet({ className, children, ...props }: ViewProps) {
  const choices =
    hasSlotChild(children, "checkbox-group") || hasSlotChild(children, "radio-group", "RadioGroup")
  return (
    <View
      role="group"
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        choices && "gap-3",
        className
      )}
      {...props}
    >
      <FieldGroupContext.Provider value={false}>{withSiblingInfo(children)}</FieldGroupContext.Provider>
    </View>
  )
}

function FieldLegend({ className, variant = "legend", ...props }: TextProps & { variant?: "legend" | "label" }) {
  return (
    <Text
      role="heading"
      data-slot="field-legend"
      data-variant={variant}
      className={cn("mb-3 font-medium", "data-[variant=legend]:text-base", "data-[variant=label]:text-sm", className)}
      {...props}
    />
  )
}

/** `[&>[data-slot=field-group]]:gap-4`: a FieldGroup directly inside another one. */
const FieldGroupContext = React.createContext(false)

function FieldGroup({ className, children, ...props }: ViewProps) {
  const nested = React.useContext(FieldGroupContext)
  return (
    <View
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3",
        nested && "gap-4",
        className
      )}
      {...props}
    >
      <FieldGroupContext.Provider value={true}>{children}</FieldGroupContext.Provider>
    </View>
  )
}

// Selectors on direct children (`[&>*]`, `[&>.sr-only]`, `[&>[data-slot=field-label]]`,
// `has-[>[data-slot=field-content]]`, `[&>[role=checkbox],[role=radio]]`) are applied by
// Field to its children; see `fieldChildClass`.
const fieldVariants = cva("group/field flex w-full gap-3 data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: ["flex-col"],
      horizontal: ["flex-row items-center"],
      responsive: ["flex-col @md/field-group:flex-row @md/field-group:items-center"],
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

const isLabelChild = (el: React.ReactElement<ChildProps>) =>
  el.type === FieldLabel || el.type === FieldTitle || el.props["data-slot"] === "field-label"

const isChoiceChild = (el: React.ReactElement<ChildProps>) =>
  el.props.role === "checkbox" || el.props.role === "radio" || /^(Checkbox|RadioGroupItem)$/.test(typeName(el))

/** Classes Field gives each direct child. */
function fieldChildClass(el: React.ReactElement<ChildProps>, orientation: FieldOrientation, hasContent: boolean) {
  const srOnly = hasClass(el.props.className, "sr-only")
  switch (orientation) {
    case "vertical":
      // `[&>*]:w-full [&>.sr-only]:w-auto`
      return srOnly ? undefined : "w-full"
    case "horizontal":
      // `[&>[data-slot=field-label]]:flex-auto`, `has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`
      return cn(isLabelChild(el) && "flex-auto", hasContent && isChoiceChild(el) && "mt-px") || undefined
    case "responsive":
      return (
        cn(
          !srOnly && "w-full @md/field-group:w-auto",
          isLabelChild(el) && "@md/field-group:flex-auto",
          hasContent && isChoiceChild(el) && "@md/field-group:mt-px"
        ) || undefined
      )
  }
}

function Field({
  className,
  orientation = "vertical",
  children,
  ...props
}: ViewProps & VariantProps<typeof fieldVariants>) {
  const { scope } = useFieldControlScope()
  const o = orientation ?? "vertical"
  const hasContent = hasSlotChild(children, "field-content") || elementsOf(children).some((el) => el.type === FieldContent)
  const mapped = React.Children.map(renderTextChildren(children), (child) => {
    if (!React.isValidElement<ChildProps>(child)) return child
    const extra = fieldChildClass(child, o, hasContent)
    return extra ? React.cloneElement(child, { className: cn(child.props.className, extra) }) : child
  })
  return (
    <FieldControlContext.Provider value={scope}>
      <View
        role="group"
        data-slot="field"
        data-orientation={o}
        className={cn(
          fieldVariants({ orientation: o }),
          // `has-[>[data-slot=field-content]]:items-start`
          hasContent && o === "horizontal" && "items-start",
          hasContent && o === "responsive" && "@md/field-group:items-start",
          className
        )}
        {...props}
      >
        <FieldGroupContext.Provider value={false}>{withSiblingInfo(mapped)}</FieldGroupContext.Provider>
      </View>
    </FieldControlContext.Provider>
  )
}

function FieldContent({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="field-content"
      className={cn("group/field-content flex flex-1 flex-col gap-1.5 leading-snug", className)}
      {...props}
    >
      {withSiblingInfo(renderTextChildren(children))}
    </View>
  )
}

type FieldLabelProps = React.ComponentProps<typeof Label>

/**
 * Pressing the label toggles the checkbox/switch/radio (or focuses the input) of its
 * Field, like a web `<label>`. Wrapping a whole `Field` makes a choice card.
 */
function FieldLabel({ className, children, onPress, ...props }: FieldLabelProps) {
  const parent = React.useContext(FieldControlContext)
  const { scope, state } = useFieldControlScope()
  // `has-[>[data-slot=field]]:*`: the Field child sets its data-slot itself, so it's matched by type.
  const wrapsField = elementsOf(children).some((el) => el.type === Field)
  return (
    <FieldControlContext.Provider value={scope}>
      <Label
        data-slot="field-label"
        onPress={(e) => {
          onPress?.(e)
          if (!scope.activate()) parent?.activate()
        }}
        className={cn(
          "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
          wrapsField && "w-full flex-col rounded-md border",
          "[&>*]:data-[slot=field]:p-4",
          // `has-data-[state=checked]:*`: matches a `data-state` written in JSX, and the checked
          // state of controls that report it (lib/field-control).
          "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10",
          state.checked && "border-primary bg-primary/5 dark:bg-primary/10",
          className
        )}
        {...props}
      >
        {children}
      </Label>
    </FieldControlContext.Provider>
  )
}

function FieldTitle({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

// `[&>a]:*` (links inside the description) is left out: nest a styled link instead.
function FieldDescription({ className, ...props }: TextProps) {
  const siblings = React.useContext(SiblingContext)
  return (
    <Text
      data-slot="field-description"
      className={cn(
        "text-sm leading-normal font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance",
        // `last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5`
        siblings?.last && "mt-0",
        siblings?.secondLast && "-mt-1",
        siblings?.afterLegend && "-mt-1.5",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({ children, className, ...props }: ViewProps & { children?: React.ReactNode }) {
  return (
    <View
      data-slot="field-separator"
      data-content={!!children}
      className={cn("relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2", className)}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children ? (
        // `self-center`: centers the label in the column like `mx-auto` does in a block.
        <View
          className="relative mx-auto block w-fit self-center bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {renderTextChildren(children)}
        </View>
      ) : null}
    </View>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: ViewProps & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = React.useMemo(() => {
    if (children) {
      return renderTextChildren(children)
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()]

    if (uniqueErrors?.length == 1) {
      const message = uniqueErrors[0]?.message
      return message ? <Text>{message}</Text> : null
    }

    // `list-disc`: bullets are drawn as text.
    return (
      <View role="list" className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && (
              <View key={index} role="listitem" className="flex-row gap-2">
                <Text aria-hidden>{"•"}</Text>
                <Text className="flex-1">{error.message}</Text>
              </View>
            )
        )}
      </View>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <View role="alert" data-slot="field-error" className={cn("text-sm font-normal text-destructive", className)} {...props}>
      {content}
    </View>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
