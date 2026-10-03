import type * as React from "react"
import {
  ActivityIndicator as RNActivityIndicator,
  FlatList as RNFlatList,
  Image as RNImage,
  ImageBackground as RNImageBackground,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  SectionList as RNSectionList,
  Switch as RNSwitch,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  View as RNView,
} from "react-native"
import { styled } from "./styled"

export const View = styled(RNView)
export const Text = styled(RNText, { kind: "text" })
export const Pressable = styled(RNPressable, { interactive: true })
export const TouchableOpacity = styled(RNTouchableOpacity, { interactive: true })
export const TextInput = styled(RNTextInput, { kind: "input", interactive: true })
export const ScrollView = styled(RNScrollView, {
  classNameProps: { contentContainerClassName: "contentContainerStyle" },
}) as unknown as ReturnType<typeof styled<React.ComponentProps<typeof RNScrollView> & { contentContainerClassName?: string }>>
export const Image = styled(RNImage)
export const ImageBackground = styled(RNImageBackground)
export const KeyboardAvoidingView = styled(RNKeyboardAvoidingView)
export const ActivityIndicator = styled(RNActivityIndicator, {
  mapStyle: (style, props) => {
    if (style.color !== undefined) props.color ??= style.color
  },
})
export const Switch = styled(RNSwitch)
export const FlatList = styled(RNFlatList, {
  classNameProps: {
    contentContainerClassName: "contentContainerStyle",
    columnWrapperClassName: "columnWrapperStyle",
  },
}) as unknown as typeof RNFlatList & {
  <T>(
    props: React.ComponentProps<typeof RNFlatList<T>> & {
      className?: string
      contentContainerClassName?: string
      columnWrapperClassName?: string
    }
  ): React.ReactElement
}
export const SectionList = styled(RNSectionList, {
  classNameProps: { contentContainerClassName: "contentContainerStyle" },
}) as unknown as typeof RNSectionList
