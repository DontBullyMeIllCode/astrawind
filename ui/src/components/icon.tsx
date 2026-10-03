import * as React from "react"
import type { LucideIcon, LucideProps } from "lucide-react-native"
import { styled } from "@astrawind/css"

const cache = new WeakMap<LucideIcon, React.ComponentType<any>>()

function styledIcon(icon: LucideIcon) {
  let C = cache.get(icon)
  if (!C) {
    C = styled(icon as React.ComponentType<LucideProps>, { kind: "icon" }) as React.ComponentType<any>
    cache.set(icon, C)
  }
  return C
}

type IconProps = Omit<LucideProps, "ref"> & {
  as: LucideIcon
  className?: string
}

/**
 * Renders a lucide-react-native icon with className support. Size and color
 * default to the surrounding component's, as `[&_svg]:size-4` and
 * `currentColor` do on the web.
 *
 *   <Icon as={ChevronRightIcon} className="size-4 text-muted-foreground" />
 */
function Icon({ as, ...props }: IconProps) {
  const C = styledIcon(as)
  return <C {...props} />
}

export { Icon, type IconProps }
