import { MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { doc, Firestore, updateDoc } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import {
  Badge,
  Box,
  Button,
  FormControl,
  HStack,
  Icon,
  Image,
  Input,
  Modal,
  Pressable,
  Spinner,
  Text,
  TextArea,
  VStack,
} from "native-base"
import React, { useEffect, useRef, useState } from "react"
import { Alert, Animated, Keyboard, Platform } from "react-native"

interface Job {
  id: string
  title: string
  description: string
  company: string
  location?: string
  salary?: string
  requirements?: string[]
  status: string
  imageURL?: string
}

interface EditJobModalProps {
  isOpen: boolean
  onClose: () => void
  job: Job | null
  db: Firestore
  storage: any
  onSuccess: (title: string, description: string) => void
  onError: (title: string, description: string) => void
}

export const EditJobModal: React.FC<EditJobModalProps> = ({
  isOpen,
  onClose,
  job,
  db,
  storage,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    imageUri: undefined as string | undefined,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const scaleAnim = React.useRef(new Animated.Value(1)).current
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        company: job.company || "",
        location: job.location || "",
        imageUri: job.imageURL || undefined,
      })
      setErrors({})
    }
  }, [job])

  // ============= FUNCIONES PARA IMAGEN =============
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

  const pickImageWeb = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChangeWeb = (event: any) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        onError("Archivo inválido", "Por favor selecciona una imagen")
        return
      }
      const imageUrl = URL.createObjectURL(file)
      setFormData({ ...formData, imageUri: imageUrl })
    }
  }

  const showImageOptions = () => {
    if (Platform.OS === "web") {
      // En web (desktop y móvil), usar input file
      pickImageWeb()
    } else {
      // Solo en app nativa mostrar opciones de galería/cámara
      Alert.alert(
        "Cambiar Imagen",
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

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.title.trim()) {
      newErrors.title = "El título es requerido"
    }
    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida"
    }
    if (!formData.company.trim()) {
      newErrors.company = "La empresa es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!job || isSubmitting) return

    if (!validateForm()) {
      onError(
        "Campos incompletos",
        "Por favor completa todos los campos requeridos"
      )
      return
    }

    setIsSubmitting(true)
    Keyboard.dismiss()

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    try {
      let imageURL = job.imageURL || null

      // Si hay una nueva imagen y es diferente a la existente
      if (formData.imageUri && formData.imageUri !== job.imageURL) {
        try {
          imageURL = await uploadImage(formData.imageUri)
        } catch (imageError) {
          console.error("Error subiendo imagen:", imageError)
          onError(
            "Error con la imagen",
            "No se pudo subir la imagen, pero el empleo se actualizará sin cambiarla."
          )
        }
      }

      // Si se eliminó la imagen
      if (!formData.imageUri) {
        imageURL = null
      }

      await updateDoc(doc(db, "jobs", job.id), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        imageURL: imageURL,
        updatedAt: new Date(),
      })

      onSuccess("¡Actualizado!", "El empleo se actualizó correctamente")
      onClose()
    } catch (error) {
      console.error("Error actualizando empleo:", error)
      onError("Error", "No se pudo actualizar el empleo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setErrors({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="full"
      animationPreset="slide"
    >
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

      <Modal.Content
        bg="gray.900"
        maxWidth="500px"
        width="95%"
        height="80%"
        marginTop={40}
        marginBottom="auto"
        marginX="auto"
      >
        {/* Header */}
        <Modal.CloseButton _icon={{ color: "white" }} />
        <Modal.Header
          bg="gray.800"
          borderBottomWidth={2}
          borderBottomColor="blue.500"
        >
          <HStack
            alignItems="center"
            space={2}
          >
            <Icon
              as={MaterialIcons}
              name="edit-note"
              color="blue.400"
              size="md"
            />
            <VStack>
              <Text
                color="white"
                fontSize="lg"
                fontWeight="bold"
              >
                Editar Empleo
              </Text>
              <Text
                color="gray.400"
                fontSize="xs"
              >
                Actualiza la información del empleo
              </Text>
            </VStack>
          </HStack>
        </Modal.Header>

        {/* Body con formulario */}
        <Modal.Body
          bg="gray.900"
          flex={1}
          _scrollview={{
            keyboardShouldPersistTaps: "handled",
            showsVerticalScrollIndicator: false,
          }}
        >
          <VStack
            space={4}
            pb={4}
            pt={4}
          >
            {/* Estado actual */}
            <Box
              bg="gray.800"
              p={3}
              borderRadius="md"
              borderLeftWidth={3}
              borderLeftColor={
                job?.status === "active" ? "green.500" : "orange.500"
              }
            >
              <HStack
                alignItems="center"
                justifyContent="space-between"
              >
                <Text
                  color="gray.300"
                  fontSize="sm"
                >
                  Estado actual:
                </Text>
                <Badge
                  colorScheme={job?.status === "active" ? "green" : "orange"}
                >
                  {job?.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </HStack>
            </Box>

            {/* Imagen */}
            <Box>
              <Text
                color="gray.300"
                mb={2}
                fontSize="sm"
                fontWeight="medium"
              >
                Imagen del empleo
              </Text>

              {formData.imageUri ? (
                <Box position="relative">
                  <Image
                    source={{ uri: formData.imageUri }}
                    alt="Imagen del empleo"
                    width="100%"
                    height={150}
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
                  <Pressable
                    position="absolute"
                    bottom={2}
                    right={2}
                    bg="blue.600"
                    p={2}
                    borderRadius="full"
                    onPress={showImageOptions}
                  >
                    <Icon
                      as={MaterialIcons}
                      name="edit"
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
                    py={8}
                    alignItems="center"
                  >
                    <Icon
                      as={MaterialIcons}
                      name="add-photo-alternate"
                      color="gray.400"
                      size="xl"
                      mb={2}
                    />
                    <Text
                      color="gray.400"
                      fontSize="sm"
                    >
                      {Platform.OS === "web"
                        ? "Seleccionar imagen"
                        : "Agregar imagen"}
                    </Text>
                  </Box>
                </Pressable>
              )}
            </Box>

            {/* Título */}
            <FormControl
              isRequired
              isInvalid={"title" in errors}
            >
              <FormControl.Label>
                <Text
                  color="gray.300"
                  fontWeight="medium"
                >
                  Título del empleo
                </Text>
              </FormControl.Label>
              <Input
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                placeholder="Ej: Desarrollador Full Stack"
                bg="gray.800"
                color="white"
                borderColor="gray.700"
                _focus={{
                  bg: "gray.800",
                  borderColor: "blue.500",
                }}
                placeholderTextColor="gray.500"
              />
              {"title" in errors && (
                <FormControl.ErrorMessage
                  leftIcon={
                    <Icon
                      as={MaterialIcons}
                      name="error"
                      size="xs"
                    />
                  }
                >
                  {errors.title}
                </FormControl.ErrorMessage>
              )}
            </FormControl>

            {/* Empresa */}
            <FormControl
              isRequired
              isInvalid={"company" in errors}
            >
              <FormControl.Label>
                <Text
                  color="gray.300"
                  fontWeight="medium"
                >
                  Empresa
                </Text>
              </FormControl.Label>
              <Input
                value={formData.company}
                onChangeText={(text) =>
                  setFormData({ ...formData, company: text })
                }
                placeholder="Ej: Tech Solutions S.A."
                bg="gray.800"
                color="white"
                borderColor="gray.700"
                _focus={{
                  bg: "gray.800",
                  borderColor: "blue.500",
                }}
                placeholderTextColor="gray.500"
              />
              {"company" in errors && (
                <FormControl.ErrorMessage
                  leftIcon={
                    <Icon
                      as={MaterialIcons}
                      name="error"
                      size="xs"
                    />
                  }
                >
                  {errors.company}
                </FormControl.ErrorMessage>
              )}
            </FormControl>

            {/* Ubicación */}
            <FormControl>
              <FormControl.Label>
                <Text
                  color="gray.300"
                  fontWeight="medium"
                >
                  Ubicación
                </Text>
              </FormControl.Label>
              <Input
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
                placeholder="Ej: Manizales, Colombia"
                bg="gray.800"
                color="white"
                borderColor="gray.700"
                _focus={{
                  bg: "gray.800",
                  borderColor: "blue.500",
                }}
                placeholderTextColor="gray.500"
              />
            </FormControl>

            {/* Descripción */}
            <FormControl
              isRequired
              isInvalid={"description" in errors}
            >
              <FormControl.Label>
                <Text
                  color="gray.300"
                  fontWeight="medium"
                >
                  Descripción
                </Text>
              </FormControl.Label>
              <TextArea
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Describe las responsabilidades y beneficios del puesto..."
                bg="gray.800"
                color="white"
                borderColor="gray.700"
                _focus={{
                  bg: "gray.800",
                  borderColor: "blue.500",
                }}
                placeholderTextColor="gray.500"
                h={20}
                autoCompleteType={undefined}
                tvParallaxProperties={undefined}
                onTextInput={undefined}
              />
              {"description" in errors && (
                <FormControl.ErrorMessage
                  leftIcon={
                    <Icon
                      as={MaterialIcons}
                      name="error"
                      size="xs"
                    />
                  }
                >
                  {errors.description}
                </FormControl.ErrorMessage>
              )}
            </FormControl>
          </VStack>
        </Modal.Body>

        {/* Footer con botones */}
        <Modal.Footer
          bg="gray.800"
          borderTopWidth={1}
          borderTopColor="gray.700"
        >
          <Button.Group
            space={2}
            width="100%"
          >
            <Button
              variant="outline"
              colorScheme="gray"
              onPress={handleClose}
              isDisabled={isSubmitting || imageUploading}
              flex={1}
              _text={{ color: "gray.300" }}
            >
              Cancelar
            </Button>
            <Animated.View
              style={{ transform: [{ scale: scaleAnim }], flex: 1 }}
            >
              <Button
                bg="blue.600"
                _pressed={{ bg: "blue.700" }}
                onPress={handleSave}
                isLoading={isSubmitting || imageUploading}
                isDisabled={isSubmitting || imageUploading}
                leftIcon={
                  imageUploading ? (
                    <Spinner
                      color="white"
                      size="sm"
                    />
                  ) : (
                    <Icon
                      as={MaterialIcons}
                      name="save"
                      color="white"
                    />
                  )
                }
                _loading={{
                  bg: "blue.600",
                  _text: { color: "white" },
                }}
                width="100%"
              >
                {imageUploading
                  ? "Subiendo imagen..."
                  : isSubmitting
                  ? "Guardando..."
                  : "Guardar Cambios"}
              </Button>
            </Animated.View>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  )
}
