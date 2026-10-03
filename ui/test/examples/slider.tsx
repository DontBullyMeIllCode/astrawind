import * as React from "react"
import { View } from "@astrawind/css"
import { Slider } from "@astrawind/ui/slider"

export default function SliderExample() {
  const [value, setValue] = React.useState([0.3, 0.7])
  return (
    <View className="flex w-full max-w-sm flex-col gap-6">
      <Slider defaultValue={[50]} max={100} step={1} className="w-[60%]" />
      <Slider defaultValue={[25, 50]} max={100} step={5} />
      <Slider value={value} onValueChange={setValue} min={0} max={1} step={0.1} minStepsBetweenThumbs={1} />
      <Slider defaultValue={[10, 20, 70]} max={100} step={10} />
      <Slider defaultValue={[50]} max={100} disabled />
      <View className="flex h-40 flex-row gap-6">
        <Slider defaultValue={[50]} max={100} orientation="vertical" />
        <Slider defaultValue={[25]} max={100} orientation="vertical" inverted />
      </View>
    </View>
  )
}
