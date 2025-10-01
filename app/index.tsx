import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { Box, Button, HStack, Text, VStack } from "native-base"
import React, { useRef, useState } from "react"
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { TextInput as PaperTextInput } from "react-native-paper"
import { auth, db } from "../config/firebase"
import { useElegantToast } from "./hooks/useElegantToast"

// Componente de Input para WEB
const WebInput = ({
  inputRef,
  placeholder,
  value,
  onChangeText,
  onBlur,
  type = "text",
  error,
  onSubmitEditing,
  icon,
}: any) => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 20,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {icon}
      </div>
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmitEditing) {
            onSubmitEditing()
          }
        }}
        style={{
          width: "100%",
          padding: "14px 16px 14px 44px",
          fontSize: 16,
          borderRadius: 12,
          border: `2px solid ${error ? "#ef4444" : "#d1d5db"}`,
          outline: "none",
          backgroundColor: "white",
          color: "#000",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "#3b82f6"
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = error ? "#ef4444" : "#d1d5db"
        }}
      />
    </div>
  )
}

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  const [passwordError, setPasswordError] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [resetKey, setResetKey] = useState<number>(0)

  // Referencias para los inputs
  const emailInputRef = useRef<any>(null)
  const passwordInputRef = useRef<any>(null)

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

  // Manejar cambio de email
  const handleEmailChange = (value: string): void => {
    setEmail(value)
    if (emailError) {
      setEmailError("")
    }
  }

  // Manejar cambio de contraseña
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

  // Función para cerrar el teclado
  const dismissKeyboard = (): void => {
    Keyboard.dismiss()
  }

  // Función de login
  const handleLogin = async (): Promise<void> => {
    dismissKeyboard()

    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)

    setEmailError(emailErr)
    setPasswordError(passwordErr)

    if (emailErr || passwordErr) {
      return
    }

    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      console.log("Usuario autenticado:", user.uid)

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
            device: Platform.OS,
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

      elegantToast.success({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
        duration: 4000,
      })

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
        case "auth/invalid-credential":
          errorMessage =
            "Credenciales inválidas. Verifica tu correo y contraseña"
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

      setResetKey((prev) => prev + 1)

      setTimeout(() => {
        emailInputRef.current?.focus()
      }, 200)
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
      safeArea
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
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
                {/* Input de Correo - Diferentes según plataforma */}
                <Box>
                  <Text
                    color="white"
                    mb={3}
                    fontSize="md"
                  >
                    Correo
                  </Text>
                  {Platform.OS === "web" ? (
                    <WebInput
                      inputRef={emailInputRef}
                      placeholder="tu@correo.com"
                      value={email}
                      onChangeText={handleEmailChange}
                      onBlur={handleEmailBlur}
                      type="email"
                      error={emailError}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      icon="📧"
                    />
                  ) : (
                    <PaperTextInput
                      ref={emailInputRef}
                      mode="outlined"
                      placeholder="tu@correo.com"
                      value={email}
                      onChangeText={handleEmailChange}
                      onBlur={handleEmailBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      left={<PaperTextInput.Icon icon="email" />}
                      error={!!emailError}
                      style={styles.paperInput}
                      outlineStyle={styles.paperOutline}
                      contentStyle={styles.paperInputContent}
                      theme={{
                        colors: {
                          primary: emailError ? "#ef4444" : "#3b82f6",
                          outline: emailError ? "#ef4444" : "#d1d5db",
                          onSurfaceVariant: "#9ca3af",
                        },
                      }}
                    />
                  )}
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

                {/* Input de Contraseña - Diferentes según plataforma */}
                <Box>
                  <Text
                    color="white"
                    mb={3}
                    fontSize="md"
                  >
                    Contraseña
                  </Text>
                  {Platform.OS === "web" ? (
                    <WebInput
                      inputRef={passwordInputRef}
                      placeholder="••••••••"
                      value={password}
                      onChangeText={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      type="password"
                      error={passwordError}
                      onSubmitEditing={handleLogin}
                      icon="🔒"
                    />
                  ) : (
                    <PaperTextInput
                      ref={passwordInputRef}
                      mode="outlined"
                      placeholder="••••••••"
                      value={password}
                      onChangeText={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      secureTextEntry
                      autoComplete="current-password"
                      textContentType="password"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      left={<PaperTextInput.Icon icon="lock" />}
                      error={!!passwordError}
                      style={styles.paperInput}
                      outlineStyle={styles.paperOutline}
                      contentStyle={styles.paperInputContent}
                      theme={{
                        colors: {
                          primary: passwordError ? "#ef4444" : "#3b82f6",
                          outline: passwordError ? "#ef4444" : "#d1d5db",
                          onSurfaceVariant: "#9ca3af",
                        },
                      }}
                    />
                  )}
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
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Box>
  )
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  paperInput: {
    backgroundColor: "white",
    fontSize: 16,
  },
  paperInputContent: {
    paddingLeft: 8,
  },
  paperOutline: {
    borderRadius: 12,
  },
})
