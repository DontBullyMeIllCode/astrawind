import * as React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@astrawind/ui/pagination"

export default function PaginationExample() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onPress={() => {}} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink onPress={() => {}}>1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink onPress={() => {}} isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink onPress={() => {}}>3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext onPress={() => {}} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
