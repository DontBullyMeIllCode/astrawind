import * as React from "react"
import { View } from "@astrawind/css"
import { Progress } from "@astrawind/ui/progress"

export default function ProgressExample() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View className="w-full gap-4">
      <Progress value={progress} className="w-[60%]" />
      <Progress value={0} />
      <Progress value={100} className="h-1" />
    </View>
  )
}
