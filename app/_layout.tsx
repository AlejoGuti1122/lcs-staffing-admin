import { Stack } from "expo-router"
import { NativeBaseProvider, extendTheme } from "native-base"

// Mueve el tema aquí para que esté disponible globalmente
const theme = extendTheme({
  colors: {
    primary: {
      50: "#fee2e2",
      500: "#E53E3E", // Tu rojo principal
      600: "#C53030",
    },
    gray: {
      900: "#171717", // Fondo oscuro
      800: "#262626", // Para cards/inputs
      700: "#404040", // Bordes
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
