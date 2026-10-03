import * as React from "react"
import { Text, View } from "@astrawind/css"
import { Card, CardContent } from "@astrawind/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@astrawind/ui/carousel"

export default function CarouselExample() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
    const onSelect = () => setCurrent(api.selectedScrollSnap() + 1)
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return (
    <View className="flex-col items-center gap-12 px-12 py-12">
      <Carousel className="w-full max-w-xs">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <View className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <Text className="text-4xl font-semibold">{index + 1}</Text>
                  </CardContent>
                </Card>
              </View>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      <Carousel opts={{ align: "start", loop: true }} setApi={setApi} className="w-full max-w-sm">
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className="basis-1/2 md:basis-1/3">
              <View className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <Text className="text-3xl font-semibold">{index + 1}</Text>
                  </CardContent>
                </Card>
              </View>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <Text className="py-2 text-center text-sm text-muted-foreground">
        Slide {current} of {count}
      </Text>

      <Carousel opts={{ align: "start" }} orientation="vertical" className="w-full max-w-xs">
        <CarouselContent className="-mt-1 h-[200px]">
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className="pt-1 md:basis-1/2">
              <View className="p-1">
                <Card>
                  <CardContent className="flex items-center justify-center p-6">
                    <Text className="text-3xl font-semibold">{index + 1}</Text>
                  </CardContent>
                </Card>
              </View>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </View>
  )
}
