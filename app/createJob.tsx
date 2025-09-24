import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router" // Cambiar a Expo Router
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
import React, { useState } from "react"
import { TextInput } from "react-native"
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
  // Remover props de navigation
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

  const handleCreateJob = async (): Promise<void> => {
    // Validar campos requeridos
    const newErrors: FormErrors = {
      title: validateField("title", formData.title),
      description: validateField("description", formData.description),
      company: validateField("company", formData.company),
    }

    setErrors(newErrors)

    // Verificar si hay errores
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
        createdBy: "admin", // Temporal - puedes cambiar esto por el usuario actual
        status: "active",
      }

      // Guardar en Firestore
      await addDoc(collection(db, "jobs"), jobData)

      elegantToast.success({
        title: "¡Éxito!",
        description: "Empleo creado correctamente",
        duration: 4000,
      })

      // Volver a la lista usando Expo Router
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
        flex={1}
        px={6}
        py={4}
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
            <Input
              placeholder="ej. Medellín, Colombia"
              placeholderTextColor="gray.400"
              bg="gray.800"
              borderColor="gray.700"
              borderWidth={1}
              borderRadius="lg"
              color="white"
              fontSize="md"
              py={4}
              _focus={{
                borderColor: "primary.500",
                bg: "gray.800",
              }}
              style={{ backgroundColor: "#262626" }}
              InputLeftElement={
                <Icon
                  as={MaterialIcons}
                  name="location-on"
                  ml={4}
                  color="gray.400"
                  size="md"
                />
              }
              value={formData.location}
              onChangeText={(value: string) =>
                handleFieldChange("location", value)
              }
            />
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
            <Input
              placeholder="ej. $2,000,000 - $3,500,000 COP"
              placeholderTextColor="gray.400"
              bg="gray.800"
              borderColor="gray.700"
              borderWidth={1}
              borderRadius="lg"
              color="white"
              fontSize="md"
              py={4}
              _focus={{
                borderColor: "primary.500",
                bg: "gray.800",
              }}
              style={{ backgroundColor: "#262626" }}
              InputLeftElement={
                <Icon
                  as={MaterialIcons}
                  name="attach-money"
                  ml={4}
                  color="gray.400"
                  size="md"
                />
              }
              value={formData.salary}
              onChangeText={(value: string) =>
                handleFieldChange("salary", value)
              }
            />
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
                  borderWidth: 0, // Eliminar borde
                  outline: "none",
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
                placeholder="ej. React Native, Firebase, 2 años de experiencia, Inglés intermedio"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                style={{
                  color: "white",
                  fontSize: 16,
                  minHeight: 100,
                  textAlignVertical: "top",
                  borderWidth: 0, // Eliminar borde
                  outline: "none",
                }}
                value={formData.requirements}
                onChangeText={(value: string) =>
                  handleFieldChange("requirements", value)
                }
              />
            </Box>
          </Box>

          {/* Botón Crear */}
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
            mt={4}
            onPress={handleCreateJob}
            isLoading={isLoading}
            isDisabled={!isFormValid || isLoading}
            _loading={{
              bg: "primary.500",
              _text: { color: "white" },
            }}
          >
            {isLoading ? "Creando..." : "Crear Empleo"}
          </Button>

          {/* Espaciado inferior */}
          <Box h={8} />
        </VStack>
      </ScrollView>
    </Box>
  )
}
