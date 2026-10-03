import * as React from "react"
import * as AvatarPrimitive from "@rn-primitives/avatar"
import { styled, View, type ClassNameProps } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"

type AvatarSize = "default" | "sm" | "lg"

const AvatarRoot = styled(AvatarPrimitive.Root)
const AvatarImageRoot = styled(AvatarPrimitive.Image) as unknown as React.ComponentType<
  AvatarPrimitive.ImageProps & ClassNameProps & { alt?: string }
>
const AvatarFallbackRoot = styled(AvatarPrimitive.Fallback)

const AvatarSizeContext = React.createContext<AvatarSize>("default")

type ViewProps = React.ComponentProps<typeof View>

function Avatar({
  className,
  size = "default",
  alt = "",
  ...props
}: Omit<React.ComponentProps<typeof AvatarRoot>, "alt"> & {
  size?: "default" | "sm" | "lg"
  /** Label for the fallback (rn-primitives keeps `alt` on the root; AvatarImage takes its own). */
  alt?: string
}) {
  return (
    <AvatarSizeContext.Provider value={size}>
      <AvatarRoot
        data-slot="avatar"
        data-size={size}
        alt={alt}
        className={cn(
          "group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6",
          className
        )}
        {...props}
      />
    </AvatarSizeContext.Provider>
  )
}

function AvatarImage({
  className,
  src,
  source,
  ...props
}: React.ComponentProps<typeof AvatarImageRoot> & {
  /** Image URL, as on the web. Shorthand for `source={{ uri: src }}`. */
  src?: string
}) {
  // Memoized: the primitive resets its loading status whenever `source` changes identity.
  const srcSource = React.useMemo(() => (src ? { uri: src } : undefined), [src])
  return (
    <AvatarImageRoot
      data-slot="avatar-image"
      source={source ?? srcSource}
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, children, ...props }: React.ComponentProps<typeof AvatarFallbackRoot>) {
  return (
    <AvatarFallbackRoot
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </AvatarFallbackRoot>
  )
}

function AvatarBadge({ className, children, ...props }: ViewProps) {
  const size = React.useContext(AvatarSizeContext)
  return (
    <View
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    >
      {/* `[&>svg]:hidden` for `sm`: icon defaults carry size and color only. */}
      {size === "sm" ? null : children}
    </View>
  )
}

function AvatarGroup({ className, children, ...props }: ViewProps) {
  // `group-has-data-[size=*]/avatar-group:*` (AvatarGroupCount) matches the avatars' `data-size`,
  // which `has-*` reads from JSX props: pass each Avatar's `size` as `data-size` too.
  const items = React.Children.map(children, (child) =>
    React.isValidElement<{ size?: AvatarSize }>(child) && child.type === Avatar
      ? React.cloneElement(child, { "data-size": child.props.size ?? "default" } as object)
      : child
  )
  return (
    <View
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    >
      {items}
    </View>
  )
}

function AvatarGroupCount({ className, children, ...props }: ViewProps) {
  return (
    <View
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    >
      {renderTextChildren(children)}
    </View>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount }
