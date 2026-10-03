import { useWindowDimensions } from "react-native"

const MOBILE_BREAKPOINT = 768

/** Whether the window is narrower than `md`, as shadcn's `useIsMobile`. */
export function useIsMobile() {
  return useWindowDimensions().width < MOBILE_BREAKPOINT
}
