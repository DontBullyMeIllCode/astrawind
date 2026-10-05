import charts from "@/generated/charts.json"

export interface ChartDoc {
  id: string
  type: string
  exportName: string
  source: string
  fullWidth: boolean
}

export const chartDocs = charts as ChartDoc[]

/** The chart types, as on ui.shadcn.com/charts. */
export const chartTypes = [
  { type: "area", label: "Area Charts", description: "Area chart components for React Native: stacked, expanded, stepped, gradient and interactive area charts. Copy and paste into your apps." },
  { type: "bar", label: "Bar Charts", description: "Bar chart components for React Native: horizontal, stacked, grouped, negative, labeled and interactive bar charts. Copy and paste into your apps." },
  { type: "line", label: "Line Charts", description: "Line chart components for React Native: linear, stepped, dotted, labeled and interactive line charts. Copy and paste into your apps." },
  { type: "pie", label: "Pie Charts", description: "Pie and donut chart components for React Native, with labels, legends and active segments. Copy and paste into your apps." },
  { type: "radar", label: "Radar Charts", description: "Radar chart components for React Native, with dots, grids, legends and multiple series. Copy and paste into your apps." },
  { type: "radial", label: "Radial Charts", description: "Radial bar chart components for React Native, with labels, grids, text and stacked series. Copy and paste into your apps." },
  { type: "tooltip", label: "Tooltips", description: "Chart tooltip examples for React Native: indicators, labels, formatters, icons and advanced layouts. Copy and paste into your apps." },
] as const
