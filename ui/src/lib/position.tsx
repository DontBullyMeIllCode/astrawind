import * as React from "react"

/**
 * Native stand-in for `first:` / `last:`: a parent wraps its direct element
 * children with their position, and items read it with `usePosition()`.
 */
export interface Position {
  scope: string
  index: number
  count: number
  first: boolean
  last: boolean
}

const PositionContext = React.createContext<Position | null>(null)

export function withPositions(children: React.ReactNode, scope: string): React.ReactNode {
  const items = React.Children.toArray(children)
  const elements = items.filter(React.isValidElement)
  const count = elements.length
  let index = 0
  return items.map((child) => {
    if (!React.isValidElement(child)) return child
    const i = index++
    return (
      <PositionContext.Provider key={child.key ?? i} value={{ scope, index: i, count, first: i === 0, last: i === count - 1 }}>
        {child}
      </PositionContext.Provider>
    )
  })
}

export function usePosition(scope: string): Position | null {
  const pos = React.useContext(PositionContext)
  return pos?.scope === scope ? pos : null
}
