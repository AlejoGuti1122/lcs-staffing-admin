import { MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import {
  AspectRatio,
  Box,
  Button,
  HStack,
  Icon,
  Image,
  Pressable,
  Text,
} from "native-base"
import React, { useCallback } from "react"
import { Alert, Platform } from "react-native"

interface ImagePickerComponentProps {
  imageUri?: string
  onImageSelected: (uri: string) => void
  onImageRemoved: () => void
}

// Componente para Web con mejor UX
const WebImagePicker: React.FC<{
  onImageSelected: (uri: string) => void
  imageUri?: string
  onImageRemoved: () => void
}> = ({ onImageSelected, imageUri, onImageRemoved }) => {
  const handleFileSelect = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (event: any) => {
      const file = event.target.files?.[0]
      if (file) {
        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("La imagen es muy grande. Máximo 5MB.")
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          onImageSelected(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }, [onImageSelected])

  if (imageUri) {
    return (
      <Box>
        <AspectRatio
          ratio={16 / 9}
          maxH="200"
        >
          <Image
            source={{ uri: imageUri }}
            alt="Preview imagen empleo"
            borderRadius="lg"
          />
        </AspectRatio>
        <HStack
          space={2}
          mt={2}
        >
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.600"
            _text={{ color: "white" }}
            onPress={handleFileSelect}
            flex={1}
          >
            Cambiar
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="red.500"
            _text={{ color: "red.500" }}
            onPress={onImageRemoved}
            flex={1}
          >
            Eliminar
          </Button>
        </HStack>
      </Box>
    )
  }

  return (
    <Pressable onPress={handleFileSelect}>
      <Box
        bg="gray.800"
        borderColor="gray.600"
        borderWidth={2}
        borderStyle="dashed"
        borderRadius="lg"
        p={8}
        alignItems="center"
        justifyContent="center"
        minH="120"
      >
        <Icon
          as={MaterialIcons}
          name="cloud-upload"
          color="gray.400"
          size="xl"
          mb={2}
        />
        <Text
          color="gray.400"
          textAlign="center"
          fontSize="sm"
        >
          Haz clic para seleccionar una imagen{"\n"}
          <Text
            color="gray.500"
            fontSize="xs"
            mt={1}
          >
            PNG, JPG hasta 5MB
          </Text>
        </Text>
      </Box>
    </Pressable>
  )
}

// Componente para Móvil
const MobileImagePicker: React.FC<{
  onImageSelected: (uri: string) => void
  imageUri?: string
  onImageRemoved: () => void
}> = ({ onImageSelected, imageUri, onImageRemoved }) => {
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

  const pickImage = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri)
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
      onImageSelected(result.assets[0].uri)
    }
  }

  const showImageOptions = () => {
    Alert.alert(
      "Agregar Imagen",
      "Selecciona una opción",
      [
        { text: "Galería", onPress: pickImage },
        { text: "Cámara", onPress: takePhoto },
        { text: "Cancelar", style: "cancel" },
      ],
      { cancelable: true }
    )
  }

  if (imageUri) {
    return (
      <Box>
        <AspectRatio
          ratio={16 / 9}
          maxH="200"
        >
          <Image
            source={{ uri: imageUri }}
            alt="Preview imagen empleo"
            borderRadius="lg"
          />
        </AspectRatio>
        <HStack
          space={2}
          mt={2}
        >
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.600"
            _text={{ color: "white" }}
            onPress={showImageOptions}
            flex={1}
          >
            Cambiar
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="red.500"
            _text={{ color: "red.500" }}
            onPress={onImageRemoved}
            flex={1}
          >
            Eliminar
          </Button>
        </HStack>
      </Box>
    )
  }

  return (
    <Pressable onPress={showImageOptions}>
      <Box
        bg="gray.800"
        borderColor="gray.600"
        borderWidth={2}
        borderStyle="dashed"
        borderRadius="lg"
        p={8}
        alignItems="center"
        justifyContent="center"
        minH="120"
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
          textAlign="center"
          fontSize="sm"
        >
          Toca para agregar una imagen{"\n"}
          <Text
            color="gray.500"
            fontSize="xs"
          >
            (Opcional - Galería o Cámara)
          </Text>
        </Text>
      </Box>
    </Pressable>
  )
}

// Componente principal que decide cuál usar
const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  imageUri,
  onImageSelected,
  onImageRemoved,
}) => {
  return (
    <Box>
      <Text
        color="white"
        mb={3}
        fontSize="md"
      >
        Imagen del Empleo
      </Text>

      {Platform.OS === "web" ? (
        <WebImagePicker
          imageUri={imageUri}
          onImageSelected={onImageSelected}
          onImageRemoved={onImageRemoved}
        />
      ) : (
        <MobileImagePicker
          imageUri={imageUri}
          onImageSelected={onImageSelected}
          onImageRemoved={onImageRemoved}
        />
      )}
    </Box>
  )
}

export default ImagePickerComponent
