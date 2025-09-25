import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { Box, Button, HStack, Text, VStack } from "native-base"
import React, { useState } from "react"
import { StyleSheet, TextInput, View } from "react-native"
import { auth, db } from "../config/firebase"
import { useElegantToast } from "./hooks/useElegantToast"

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  const [passwordError, setPasswordError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const elegantToast = useElegantToast()

  // Validación de email
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      return "El correo es requerido"
    }
    if (!emailRegex.test(email)) {
      return "Ingresa un correo válido"
    }
    return ""
  }

  // Validación de contraseña
  const validatePassword = (password: string): string => {
    if (!password) {
      return "La contraseña es requerida"
    }
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres"
    }
    return ""
  }

  // Manejar cambio de email - SOLO limpiar errores
  const handleEmailChange = (value: string): void => {
    setEmail(value)
    if (emailError) {
      setEmailError("")
    }
  }

  // Manejar cambio de contraseña - SOLO limpiar errores
  const handlePasswordChange = (value: string): void => {
    setPassword(value)
    if (passwordError) {
      setPasswordError("")
    }
  }

  // Validar solo en onBlur
  const handleEmailBlur = (): void => {
    setEmailError(validateEmail(email))
  }

  const handlePasswordBlur = (): void => {
    setPasswordError(validatePassword(password))
  }

  // Función de login original
  const handleLogin = async (): Promise<void> => {
    // Validar campos
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)

    setEmailError(emailErr)
    setPasswordError(passwordErr)

    // Si hay errores, no continuar
    if (emailErr || passwordErr) {
      return
    }

    setIsLoading(true)

    try {
      // Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      console.log("Usuario autenticado:", user.uid)

      // Guardar datos reales de login en Firestore
      try {
        console.log("Guardando datos de login en Firestore...")

        await setDoc(
          doc(db, "user_logins", user.uid),
          {
            userId: user.uid,
            email: user.email,
            lastLogin: new Date().toISOString(),
            loginCount: 1,
            userAgent:
              (typeof navigator !== "undefined" && navigator.userAgent) ||
              "unknown",
            device: "web",
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        )

        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            email: user.email,
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )

        console.log("Datos de login guardados exitosamente en Firestore")
      } catch (firestoreError) {
        console.error("Error guardando en Firestore:", firestoreError)
      }

      // Mostrar mensaje de éxito
      elegantToast.success({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
        duration: 4000,
      })

      // Navegar a la lista de empleos usando Expo Router
      router.push("/jobList")
    } catch (error: any) {
      console.error("Error completo en login:", error)

      let errorMessage = "Error al iniciar sesión"

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con este correo"
          break
        case "auth/wrong-password":
          errorMessage = "Contraseña incorrecta"
          break
        case "auth/invalid-email":
          errorMessage = "Formato de correo inválido"
          break
        case "auth/user-disabled":
          errorMessage = "Esta cuenta ha sido deshabilitada"
          break
        case "auth/too-many-requests":
          errorMessage = "Demasiados intentos. Intenta más tarde"
          break
        case "auth/network-request-failed":
          errorMessage = "Error de conexión. Verifica tu internet"
          break
        case "auth/invalid-credential":
          errorMessage =
            "Credenciales inválidas. Verifica tu correo y contraseña"
          break
        case "auth/operation-not-allowed":
          errorMessage =
            "Método de autenticación no habilitado. Contacta al administrador"
          break
        default:
          errorMessage = "Error inesperado. Intenta nuevamente"
      }

      elegantToast.error({
        title: "Error de autenticación",
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid: boolean = !!(
    email &&
    password &&
    !emailError &&
    !passwordError
  )

  return (
    <Box
      flex={1}
      bg="gray.900"
      px={6}
      justifyContent="center"
      safeArea
    >
      <StatusBar style="light" />

      <VStack
        alignItems="center"
        mb={10}
      >
        <HStack
          alignItems="center"
          mb={2}
        >
          <Box
            bg="primary.500"
            px={2}
            py={1}
            borderRadius="sm"
          >
            <Text
              color="white"
              fontWeight="bold"
              fontSize="sm"
            >
              LCS
            </Text>
          </Box>
          <Text
            color="white"
            fontSize="xl"
            ml={3}
            fontWeight="medium"
          >
            Iniciar Sesión
          </Text>
        </HStack>
      </VStack>

      <VStack space={6}>
        {/* Correo con TextInput nativo */}
        <Box>
          <Text
            color="white"
            mb={3}
            fontSize="md"
          >
            Correo
          </Text>
          <View
            style={[
              styles.inputContainer,
              { borderColor: emailError ? "#ef4444" : "#404040" },
            ]}
          >
            <MaterialIcons
              name="email"
              size={20}
              color={emailError ? "#ef4444" : "#9ca3af"}
              style={styles.icon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="tu@correo.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>
          {emailError ? (
            <Text
              color="red.500"
              fontSize="sm"
              mt={1}
            >
              {emailError}
            </Text>
          ) : null}
        </Box>

        {/* Contraseña con TextInput nativo */}
        <Box>
          <Text
            color="white"
            mb={3}
            fontSize="md"
          >
            Contraseña
          </Text>
          <View
            style={[
              styles.inputContainer,
              { borderColor: passwordError ? "#ef4444" : "#404040" },
            ]}
          >
            <MaterialIcons
              name="lock"
              size={20}
              color={passwordError ? "#ef4444" : "#9ca3af"}
              style={styles.icon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={handlePasswordBlur}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />
          </View>
          {passwordError ? (
            <Text
              color="red.500"
              fontSize="sm"
              mt={1}
            >
              {passwordError}
            </Text>
          ) : null}
        </Box>

        {/* Botón de login */}
        <Button
          bg={isFormValid ? "primary.500" : "gray.600"}
          _pressed={{ bg: isFormValid ? "primary.600" : "gray.700" }}
          _text={{
            fontWeight: "medium",
            fontSize: "md",
            color: "white",
          }}
          borderRadius="lg"
          py={4}
          mt={6}
          onPress={handleLogin}
          isLoading={isLoading}
          isDisabled={!isFormValid || isLoading}
          _loading={{
            bg: "primary.500",
            _text: { color: "white" },
          }}
        >
          {isLoading ? "Iniciando..." : "Iniciar Sesión"}
        </Button>
      </VStack>
    </Box>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
    padding: 0, // Importante para evitar padding extra
  },
})
