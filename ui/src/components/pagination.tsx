import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react-native"
import { Pressable, Text, View } from "@astrawind/css"
import { renderTextChildren } from "../lib/children"
import { cn } from "../lib/utils"
import { buttonVariants, type Button } from "./button"
import { Icon } from "./icon"

type ViewProps = React.ComponentProps<typeof View>

function Pagination({ className, ...props }: ViewProps) {
  return (
    <View
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: ViewProps) {
  return <View role="list" data-slot="pagination-content" className={cn("flex flex-row items-center gap-1", className)} {...props} />
}

function PaginationItem({ ...props }: ViewProps) {
  return <View role="listitem" data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  Omit<React.ComponentProps<typeof Pressable>, "children"> & { children?: React.ReactNode }

// A pressable in place of `<a>`: navigate in `onPress`.
function PaginationLink({ className, isActive, size = "icon", children, ...props }: PaginationLinkProps) {
  return (
    <Pressable
      role="link"
      // `aria-current="page"`
      aria-selected={isActive}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    >
      {renderTextChildren(children, undefined, { numberOfLines: 1 })}
    </Pressable>
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 px-2.5 sm:pl-2.5", className)} {...props}>
      <Icon as={ChevronLeftIcon} />
      <Text className="hidden sm:block">Previous</Text>
    </PaginationLink>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 px-2.5 sm:pr-2.5", className)} {...props}>
      <Text className="hidden sm:block">Next</Text>
      <Icon as={ChevronRightIcon} />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: ViewProps) {
  return (
    <View
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <Icon as={MoreHorizontalIcon} className="size-4" />
      <Text className="sr-only">More pages</Text>
    </View>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
