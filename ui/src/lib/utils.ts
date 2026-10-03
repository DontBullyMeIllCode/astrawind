export { cn } from "cn"

/**
 * Whether a className contains a class, the native stand-in for class selectors
 * like `[.border-b]:pb-6`.
 */
export function hasClass(className: string | undefined, cls: string) {
  return !!className && className.split(/\s+/).includes(cls)
}
