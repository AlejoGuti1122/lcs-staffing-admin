import { Stack } from "expo-router"
import { NativeBaseProvider, extendTheme } from "native-base"
import { BackHandler } from "react-native"

// PATCH MÍNIMO - Solo silenciar el warning
const originalConsoleWarn = console.warn
console.warn = (...args: any[]) => {
  const message = String(args[0] || "")
  if (message.includes("BackHandler.removeEventListener")) {
    // Ignorar este warning específico
    return
  }
  originalConsoleWarn(...args)
}

// Patch directo al objeto BackHandler
;(BackHandler as any).removeEventListener = function () {
  // Método dummy para prevenir crashes
  return undefined
}

const theme = extendTheme({
  colors: {
    primary: {
      50: "#fee2e2",
      500: "#E53E3E",
      600: "#C53030",
    },
    gray: {
      900: "#171717",
      800: "#262626",
      700: "#404040",
    },
  },
  config: {
    initialColorMode: "dark",
  },
})

export default function RootLayout() {
  return (
    <NativeBaseProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </NativeBaseProvider>
  )
}
