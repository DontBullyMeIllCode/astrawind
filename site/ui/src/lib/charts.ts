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
  { type: "area", label: "Area Charts" },
  { type: "bar", label: "Bar Charts" },
  { type: "line", label: "Line Charts" },
  { type: "pie", label: "Pie Charts" },
  { type: "radar", label: "Radar Charts" },
  { type: "radial", label: "Radial Charts" },
  { type: "tooltip", label: "Tooltips" },
] as const
