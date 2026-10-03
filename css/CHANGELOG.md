# @astrawind/css

## 0.3.0

### Minor Changes

- d8ba967: Wide-gamut colors: Tailwind's oklch colors outside sRGB now render as Display P3 on the web (`color(display-p3 …)`) and on iOS instead of being clipped. Adds `displayColor()`, which returns the color a resolved style color stands for on the current platform (used by `@astrawind/ui`'s charts).
