import { MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { getAuth } from "firebase/auth"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import {
  Box,
  HStack,
  Icon,
  Image,
  Input,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base"
import React, { useEffect, useRef, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native"
import { db, storage } from "../../config/firebase"
import { useElegantToast } from "../hooks/useElegantToast"

interface FormData {
  title: string
  description: string
  company: string
  address: string
  imageUri?: string
}

interface FormErrors {
  title?: string
  description?: string
  company?: string
  address?: string
}

// ============= CONSTANTE DE API KEY =============
// Reemplaza con tu Google API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyC53W1HjEqO4UoUUxwqrjELEJZo9FJfvV0"

export default function CreateJobScreen() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    company: "",
    address: "",
    imageUri: undefined,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [imageUploading, setImageUploading] = useState<boolean>(false)
  const [isGeocodingAddress, setIsGeocodingAddress] = useState<boolean>(false)

  // Account Manager (usuario logueado)
  const [accountManagerId, setAccountManagerId] = useState<string>("")
  const [accountManagerName, setAccountManagerName] = useState<string>("")

  // Estados para responsabilidades dinámicas
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [currentResponsibility, setCurrentResponsibility] = useState<string>("")

  // Referencias para scroll automático y para el input de archivo en web
  const scrollViewRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const elegantToast = useElegantToast()
  const auth = getAuth()

  // Obtener el nombre del usuario logueado
  useEffect(() => {
    const user = auth.currentUser
    if (user) {
      setAccountManagerId(user.uid) // ✅ Guarda el ID para Firebase
      setAccountManagerName(user.displayName || user.email || "Admin") // ✅ Guarda el nombre para mostrar
    }
  }, [])

  // ============= FUNCIÓN PARA OBTENER COORDENADAS DE UNA DIRECCIÓN =============
  const getCoordinatesFromAddress = async (
    address: string
  ): Promise<{ latitude: number; longitude: number } | null> => {
    if (!address.trim()) return null

    try {
      const encodedAddress = encodeURIComponent(address)
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return {
          latitude: location.lat,
          longitude: location.lng,
        }
      } else {
        console.error("Geocoding error:", data.status)
        return null
      }
    } catch (error) {
      console.error("Error obteniendo coordenadas:", error)
      return null
    }
  }

  // Función para agregar responsabilidad
  const addResponsibility = () => {
    if (
      currentResponsibility.trim() &&
      !responsibilities.includes(currentResponsibility.trim())
    ) {
      setResponsibilities([...responsibilities, currentResponsibility.trim()])
      setCurrentResponsibility("")
    }
  }

  // Función para eliminar responsabilidad
  const removeResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index))
  }

  // ============= FUNCIONES PARA WEB =============
  const pickImageWeb = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChangeWeb = (event: any) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        elegantToast.error({
          title: "Archivo inválido",
          description: "Por favor selecciona una imagen",
          duration: 3000,
        })
        return
      }
      const imageUrl = URL.createObjectURL(file)
      setFormData({ ...formData, imageUri: imageUrl })
    }
  }

  // ============= FUNCIONES PARA MÓVIL =============
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert(
        "Permisos necesarios",
        "Necesitamos permisos para acceder a tu galería de fotos.",
        [{ text: "OK" }]
      )
      return false
    }
    return true
  }

  const pickImageMobile = async () => {
    try {
      const hasPermission = await requestPermissions()
      if (!hasPermission) return

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, imageUri: result.assets[0].uri })
      }
    } catch (error) {
      console.error("Error in pickImageMobile:", error)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") {
      Alert.alert(
        "Permisos necesarios",
        "Necesitamos permisos para usar la cámara.",
        [{ text: "OK" }]
      )
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, imageUri: result.assets[0].uri })
    }
  }

  const showImageOptions = () => {
    if (Platform.OS === "web") {
      pickImageWeb()
    } else {
      Alert.alert(
        "Agregar Imagen",
        "Selecciona una opción",
        [
          {
            text: "Galería",
            onPress: pickImageMobile,
          },
          {
            text: "Cámara",
            onPress: takePhoto,
          },
          {
            text: "Cancelar",
            style: "cancel",
          },
        ],
        { cancelable: true }
      )
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, imageUri: undefined })
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      setImageUploading(true)

      const timestamp = Date.now()
      const imageName = `jobs/${timestamp}_image.jpg`
      const imageRef = ref(storage, imageName)

      if (Platform.OS === "web") {
        const fileInput = fileInputRef.current
        if (fileInput?.files?.[0]) {
          const file = fileInput.files[0]
          await uploadBytes(imageRef, file)
        } else {
          throw new Error("No se encontró el archivo")
        }
      } else {
        const response = await fetch(uri)
        const blob = await response.blob()
        await uploadBytes(imageRef, blob)
      }

      const downloadURL = await getDownloadURL(imageRef)
      return downloadURL
    } catch (error) {
      console.error("Error subiendo imagen:", error)
      throw error
    } finally {
      setImageUploading(false)
    }
  }

  // Validaciones
  const validateField = (field: keyof FormData, value: string): string => {
    switch (field) {
      case "title":
        return !value ? "El título es requerido" : ""
      case "description":
        return !value ? "La descripción es requerida" : ""
      case "company":
        return !value ? "El cliente/empresa es requerido" : ""
      case "address":
        return !value
          ? "La dirección es requerida para calcular distancias"
          : ""
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
    const newErrors: FormErrors = {
      title: validateField("title", formData.title),
      description: validateField("description", formData.description),
      company: validateField("company", formData.company),
      address: validateField("address", formData.address),
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error !== "")) {
      elegantToast.error({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        duration: 3000,
      })
      return
    }

    setIsLoading(true)

    try {
      let imageURL = null

      // Subir imagen si existe
      if (formData.imageUri) {
        try {
          imageURL = await uploadImage(formData.imageUri)
          console.log("✅ Imagen subida exitosamente:", imageURL)
        } catch (imageError) {
          console.error("❌ Error subiendo imagen:", imageError)
          elegantToast.error({
            title: "Error con la imagen",
            description:
              "No se pudo subir la imagen, pero el empleo se creará sin ella.",
            duration: 5000,
          })
        }
      }

      // Obtener coordenadas de la dirección
      setIsGeocodingAddress(true)
      const coordinates = await getCoordinatesFromAddress(formData.address)
      setIsGeocodingAddress(false)

      if (!coordinates) {
        elegantToast.error({
          title: "Error con la dirección",
          description:
            "No se pudieron obtener las coordenadas de la dirección. Verifica que sea válida.",
          duration: 5000,
        })
        setIsLoading(false)
        return
      }

      console.log("📍 Coordenadas obtenidas:", coordinates)

      const jobData = {
        title: formData.title,
        description: formData.description,
        company: formData.company,
        location: formData.address, // Guardamos la dirección completa
        latitude: coordinates.latitude, // ✨ Coordenadas automáticas
        longitude: coordinates.longitude, // ✨ Coordenadas automáticas
        accountManager: accountManagerId,
        responsibilities: responsibilities,
        imageURL: imageURL,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || "unknown",
        status: "active",
      }

      console.log("📝 Datos del empleo a guardar:", jobData)

      const docRef = await addDoc(collection(db, "jobs"), jobData)

      console.log("✅ Empleo creado con ID:", docRef.id)

      elegantToast.success({
        title: "¡Éxito!",
        description: "Empleo creado correctamente con coordenadas",
        duration: 4000,
      })

      router.back()
    } catch (error) {
      console.error("❌ Error creando empleo:", error)
      elegantToast.error({
        title: "Error",
        description: "No se pudo crear el empleo. Intenta nuevamente.",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
      setIsGeocodingAddress(false)
    }
  }

  const isFormValid: boolean = !!(
    formData.title &&
    formData.description &&
    formData.company &&
    formData.address
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

        {/* Input file oculto para web */}
        {Platform.OS === "web" && (
          <input
            ref={fileInputRef as any}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChangeWeb}
          />
        )}

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
            <Image
              source={require("../../assets/images/logo.png")}
              alt="LCS Staffing"
              width={100}
              height={35}
              resizeMode="contain"
            />
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
                Título *
              </Text>
              <Input
                placeholder="ej. Landscapers"
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

            {/* Cliente/Empresa */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Cliente/Empresa *
              </Text>
              <Input
                placeholder="ej. Global Exchange"
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

            {/* Dirección */}
            <Box>
              <HStack
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Text
                  color="white"
                  fontSize="md"
                >
                  Dirección *
                </Text>
                {isGeocodingAddress && (
                  <HStack
                    alignItems="center"
                    space={2}
                  >
                    <Spinner
                      color="primary.500"
                      size="sm"
                    />
                    <Text
                      color="primary.500"
                      fontSize="xs"
                    >
                      Obteniendo coordenadas...
                    </Text>
                  </HStack>
                )}
              </HStack>
              <Input
                placeholder="ej. 123 Main St, Miami, FL 33101"
                placeholderTextColor="gray.400"
                bg="gray.800"
                borderColor={errors.address ? "red.500" : "gray.700"}
                borderWidth={1}
                borderRadius="lg"
                color="white"
                fontSize="md"
                py={4}
                _focus={{
                  borderColor: errors.address ? "red.500" : "primary.500",
                  bg: "gray.800",
                }}
                style={{ backgroundColor: "#262626" }}
                InputLeftElement={
                  <Icon
                    as={MaterialIcons}
                    name="location-on"
                    ml={4}
                    color={errors.address ? "red.500" : "gray.400"}
                    size="md"
                  />
                }
                value={formData.address}
                onChangeText={(value: string) =>
                  handleFieldChange("address", value)
                }
                onBlur={() =>
                  setErrors({
                    ...errors,
                    address: validateField("address", formData.address),
                  })
                }
                isInvalid={!!errors.address}
              />
              {errors.address ? (
                <Text
                  color="red.500"
                  fontSize="sm"
                  mt={1}
                >
                  {errors.address}
                </Text>
              ) : (
                <Text
                  color="gray.500"
                  fontSize="xs"
                  mt={1}
                >
                  Se obtendrán las coordenadas automáticamente
                </Text>
              )}
            </Box>

            {/* Account Manager (solo lectura) */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Account Manager
              </Text>
              <Box
                bg="gray.800"
                borderColor="gray.700"
                borderWidth={1}
                borderRadius="lg"
                px={4}
                py={4}
                style={{ backgroundColor: "#262626" }}
              >
                <HStack alignItems="center">
                  <Icon
                    as={MaterialIcons}
                    name="person"
                    color="primary.500"
                    size="md"
                    mr={3}
                  />
                  <Text
                    color="white"
                    fontSize="md"
                  >
                    {accountManagerName || "Cargando..."}
                  </Text>
                </HStack>
              </Box>
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
                  placeholder="Descripción general del empleo"
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

            {/* Imagen */}
            <Box>
              <Text
                color="white"
                mb={3}
                fontSize="md"
              >
                Imagen del empleo
              </Text>

              {formData.imageUri ? (
                <Box position="relative">
                  <Image
                    source={{ uri: formData.imageUri }}
                    alt="Imagen del empleo"
                    width="100%"
                    height={200}
                    borderRadius="lg"
                  />
                  <Pressable
                    position="absolute"
                    top={2}
                    right={2}
                    bg="red.500"
                    p={2}
                    borderRadius="full"
                    onPress={removeImage}
                  >
                    <Icon
                      as={MaterialIcons}
                      name="close"
                      color="white"
                      size="sm"
                    />
                  </Pressable>
                </Box>
              ) : (
                <Pressable onPress={showImageOptions}>
                  <Box
                    bg="gray.800"
                    borderWidth={2}
                    borderColor="gray.700"
                    borderStyle="dashed"
                    borderRadius="lg"
                    py={12}
                    alignItems="center"
                    style={{ backgroundColor: "#262626" }}
                  >
                    <Icon
                      as={MaterialIcons}
                      name="add-photo-alternate"
                      color="gray.400"
                      size="2xl"
                      mb={2}
                    />
                    <Text
                      color="gray.400"
                      fontSize="md"
                    >
                      {Platform.OS === "web"
                        ? "Seleccionar imagen"
                        : "Agregar imagen"}
                    </Text>
                    {Platform.OS !== "web" && (
                      <Text
                        color="gray.500"
                        fontSize="sm"
                        mt={1}
                      >
                        Galería o Cámara
                      </Text>
                    )}
                  </Box>
                </Pressable>
              )}
            </Box>

            {/* Botón Crear */}
            <Box pb={4}>
              <Pressable
                onPress={handleCreateJob}
                bg={isFormValid ? "primary.500" : "gray.700"}
                py={4}
                borderRadius="lg"
                opacity={
                  isLoading || imageUploading || isGeocodingAddress ? 0.6 : 1
                }
                disabled={
                  !isFormValid ||
                  isLoading ||
                  imageUploading ||
                  isGeocodingAddress
                }
              >
                {isLoading || imageUploading || isGeocodingAddress ? (
                  <HStack
                    justifyContent="center"
                    alignItems="center"
                    space={2}
                  >
                    <Spinner
                      color="white"
                      size="sm"
                    />
                    <Text
                      color="white"
                      fontSize="md"
                      fontWeight="bold"
                    >
                      {imageUploading
                        ? "Subiendo imagen..."
                        : isGeocodingAddress
                        ? "Obteniendo coordenadas..."
                        : "Creando..."}
                    </Text>
                  </HStack>
                ) : (
                  <Text
                    color="white"
                    fontSize="md"
                    fontWeight="bold"
                    textAlign="center"
                  >
                    Crear Empleo
                  </Text>
                )}
              </Pressable>
            </Box>
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
