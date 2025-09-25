import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import {
  Box,
  Button,
  HStack,
  Icon,
  Input,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "native-base"
import React, { useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import { db } from "../config/firebase"
import { useElegantToast } from "./hooks/useElegantToast"

interface FormData {
  title: string
  description: string
  company: string
  location: string
  salary: string
  requirements: string
}

interface FormErrors {
  title?: string
  description?: string
  company?: string
}

export default function CreateJobScreen() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    company: "",
    location: "",
    salary: "",
    requirements: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Referencias para scroll automático
  const scrollViewRef = useRef<any>(null)
  const requirementsRef = useRef<any>(null)

  const elegantToast = useElegantToast()

  // Validaciones
  const validateField = (field: keyof FormData, value: string): string => {
    switch (field) {
      case "title":
        return !value ? "El título es requerido" : ""
      case "description":
        return !value ? "La descripción es requerida" : ""
      case "company":
        return !value ? "El nombre de la empresa es requerido" : ""
      default:
        return ""
    }
  }

  const handleFieldChange = (field: keyof FormData, value: string): void => {
    setFormData({ ...formData, [field]: value })
    if (errors[field as keyof FormErrors]) {
      setErrors({
        ...errors,
        [field as keyof FormErrors]: validateField(field, value),
      })
    }
  }

  // Función para hacer scroll cuando se enfoca un campo
  const handleRequirementsFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 300) // Pequeño delay para que el teclado aparezca primero
  }

  const handleCreateJob = async (): Promise<void> => {
    const newErrors: FormErrors = {
      title: validateField("title", formData.title),
      description: validateField("description", formData.description),
      company: validateField("company", formData.company),
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error !== "")) {
      return
    }

    setIsLoading(true)

    try {
      const jobData = {
        ...formData,
        requirements: formData.requirements
          ? formData.requirements
              .split(",")
              .map((req) => req.trim())
              .filter((req) => req !== "")
          : [],
        createdAt: serverTimestamp(),
        createdBy: "admin",
        status: "active",
      }

      await addDoc(collection(db, "jobs"), jobData)

      elegantToast.success({
        title: "¡Éxito!",
        description: "Empleo creado correctamente",
        duration: 4000,
      })

      router.back()
    } catch (error) {
      console.error("Error creando empleo:", error)
      elegantToast.error({
        title: "Error",
        description: "No se pudo crear el empleo. Intenta nuevamente.",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid: boolean = !!(
    formData.title &&
    formData.description &&
    formData.company
  )

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Box
        flex={1}
        bg="gray.900"
        safeArea
      >
        <StatusBar style="light" />

        {/* Header */}
        <HStack
          alignItems="center"
          px={6}
          py={4}
          borderBottomWidth={1}
          borderBottomColor="gray.700"
        >
          <Pressable onPress={() => router.back()}>
            <Icon
              as={MaterialIcons}
              name="arrow-back"
              color="white"
              size="lg"
            />
          </Pressable>
          <HStack
            alignItems="center"
            ml={4}
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
              Crear Empleo
            </Text>
          </HStack>
        </HStack>

        <ScrollView
          ref={scrollViewRef}
          flex={1}
          px={6}
          py={4}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <VStack space={6}>
            {/* Título del Empleo */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Título del Empleo *
              </Text>
              <Input
                placeholder="ej. Desarrollador Frontend"
                placeholderTextColor="gray.400"
                bg="gray.800"
                borderColor={errors.title ? "red.500" : "gray.700"}
                borderWidth={1}
                borderRadius="lg"
                color="white"
                fontSize="md"
                py={4}
                _focus={{
                  borderColor: errors.title ? "red.500" : "primary.500",
                  bg: "gray.800",
                }}
                style={{ backgroundColor: "#262626" }}
                InputLeftElement={
                  <Icon
                    as={MaterialIcons}
                    name="work"
                    ml={4}
                    color={errors.title ? "red.500" : "gray.400"}
                    size="md"
                  />
                }
                value={formData.title}
                onChangeText={(value: string) =>
                  handleFieldChange("title", value)
                }
                onBlur={() =>
                  setErrors({
                    ...errors,
                    title: validateField("title", formData.title),
                  })
                }
                isInvalid={!!errors.title}
              />
              {errors.title ? (
                <Text
                  color="red.500"
                  fontSize="sm"
                  mt={1}
                >
                  {errors.title}
                </Text>
              ) : null}
            </Box>

            {/* Empresa */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Empresa *
              </Text>
              <Input
                placeholder="ej. Tech Solutions"
                placeholderTextColor="gray.400"
                bg="gray.800"
                borderColor={errors.company ? "red.500" : "gray.700"}
                borderWidth={1}
                borderRadius="lg"
                color="white"
                fontSize="md"
                py={4}
                _focus={{
                  borderColor: errors.company ? "red.500" : "primary.500",
                  bg: "gray.800",
                }}
                style={{ backgroundColor: "#262626" }}
                InputLeftElement={
                  <Icon
                    as={MaterialIcons}
                    name="business"
                    ml={4}
                    color={errors.company ? "red.500" : "gray.400"}
                    size="md"
                  />
                }
                value={formData.company}
                onChangeText={(value: string) =>
                  handleFieldChange("company", value)
                }
                onBlur={() =>
                  setErrors({
                    ...errors,
                    company: validateField("company", formData.company),
                  })
                }
                isInvalid={!!errors.company}
              />
              {errors.company ? (
                <Text
                  color="red.500"
                  fontSize="sm"
                  mt={1}
                >
                  {errors.company}
                </Text>
              ) : null}
            </Box>

            {/* Ubicación */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Ubicación
              </Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color="#9ca3af"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="ej. Medellín, Colombia"
                  placeholderTextColor="#9ca3af"
                  value={formData.location}
                  onChangeText={(value: string) =>
                    handleFieldChange("location", value)
                  }
                />
              </View>
            </Box>

            {/* Salario */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Salario
              </Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="attach-money"
                  size={20}
                  color="#9ca3af"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="ej. $2,000,000 - $3,500,000 COP"
                  placeholderTextColor="#9ca3af"
                  value={formData.salary}
                  onChangeText={(value: string) =>
                    handleFieldChange("salary", value)
                  }
                />
              </View>
            </Box>

            {/* Descripción */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Descripción *
              </Text>
              <Box
                bg="gray.800"
                borderColor={errors.description ? "red.500" : "gray.700"}
                borderWidth={1}
                borderRadius="lg"
                p={4}
                style={{ backgroundColor: "#262626" }}
              >
                <TextInput
                  placeholder="Describe las responsabilidades del cargo, beneficios, modalidad de trabajo, etc."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={5}
                  style={{
                    color: "white",
                    fontSize: 16,
                    minHeight: 120,
                    textAlignVertical: "top",
                    borderWidth: 0,
                  }}
                  value={formData.description}
                  onChangeText={(value: string) =>
                    handleFieldChange("description", value)
                  }
                  onBlur={() =>
                    setErrors({
                      ...errors,
                      description: validateField(
                        "description",
                        formData.description
                      ),
                    })
                  }
                  onFocus={() => {
                    // Scroll moderado para descripción
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({
                        y: 400,
                        animated: true,
                      })
                    }, 300)
                  }}
                />
              </Box>
              {errors.description ? (
                <Text
                  color="red.500"
                  fontSize="sm"
                  mt={1}
                >
                  {errors.description}
                </Text>
              ) : null}
            </Box>

            {/* Requisitos */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Requisitos
              </Text>
              <Text
                color="gray.400"
                fontSize="sm"
                mb={2}
              >
                Separa cada requisito con una coma
              </Text>
              <Box
                bg="gray.800"
                borderColor="gray.700"
                borderWidth={1}
                borderRadius="lg"
                p={4}
                style={{ backgroundColor: "#262626" }}
              >
                <TextInput
                  ref={requirementsRef}
                  placeholder="ej. React Native, Firebase, 2 años de experiencia, Inglés intermedio"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  style={{
                    color: "white",
                    fontSize: 16,
                    minHeight: 100,
                    textAlignVertical: "top",
                    borderWidth: 0,
                  }}
                  value={formData.requirements}
                  onChangeText={(value: string) =>
                    handleFieldChange("requirements", value)
                  }
                  onFocus={handleRequirementsFocus}
                />
              </Box>
            </Box>

            {/* Botón Crear */}
            <Button
              bg={isFormValid ? "primary.500" : "gray.600"}
              _pressed={{
                bg: isFormValid ? "primary.600" : "gray.700",
                opacity: 0.8,
              }}
              _disabled={{
                bg: "gray.600",
                opacity: 0.6,
                _text: { color: "gray.400" },
              }}
              _text={{
                fontWeight: "medium",
                fontSize: "md",
                color: "white",
              }}
              _loading={{
                bg: "primary.500",
                _text: { color: "white" },
                opacity: 0.8,
              }}
              borderRadius="lg"
              py={4}
              mt={4}
              mb={2}
              onPress={handleCreateJob}
              isLoading={isLoading}
              isDisabled={!isFormValid || isLoading}
              accessibilityRole="button"
              accessibilityLabel={
                isLoading ? "Creando empleo..." : "Crear empleo"
              }
            >
              {isLoading ? "Creando..." : "Crear Empleo"}
            </Button>

            {/* Espaciado extra para el teclado */}
            <Box h={200} />
          </VStack>
        </ScrollView>
      </Box>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#404040",
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
    padding: 0,
  },
})
