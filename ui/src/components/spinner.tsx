import * as React from "react"
import { Loader2Icon } from "lucide-react-native"
import { cn } from "../lib/utils"
import { Icon, type IconProps } from "./icon"

function Spinner({ className, ...props }: Omit<IconProps, "as">) {
  return (
    <Icon
      as={Loader2Icon}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
