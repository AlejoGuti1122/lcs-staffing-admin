import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore"
import {
  AlertDialog,
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Icon,
  Text,
  useDisclose,
  VStack,
} from "native-base"
import React, { useEffect, useRef, useState } from "react"
import { FlatList, ListRenderItem, Platform } from "react-native"

import { Image } from "expo-image"

import { db, storage } from "../config/firebase"

import { EditJobButton } from "./components/EditButton"

import { EditJobModal } from "./components/ModalEdit"
import { useElegantToast } from "./hooks/useElegantToast"

interface Job {
  id: string
  title: string
  description: string
  company: string
  location?: string
  salary?: string
  requirements?: string[]
  createdAt: any
  createdBy: string
  status: string
  imageURL?: string
}

export default function JobsListScreen() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const { isOpen, onOpen, onClose } = useDisclose()

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclose()

  const cancelRef = useRef<any>(null)
  const elegantToast = useElegantToast()

  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const jobsData: Job[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          console.log("📦 Job recibido:", doc.id, "imageURL:", data.imageURL) // Debug
          jobsData.push({ id: doc.id, ...data } as Job)
        })

        console.log(`🔄 Total de empleos cargados: ${jobsData.length}`) // Debug

        // Forzar actualización con un nuevo array
        setJobs([...jobsData])
        setLoading(false)
      },
      (error) => {
        console.error("Error obteniendo empleos:", error)
        elegantToast.error({
          title: "Error",
          description: "No se pudieron cargar los empleos",
          duration: 3000,
        })
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleDeactivateJob = async (): Promise<void> => {
    if (!selectedJob || isDeleting) return

    setIsDeleting(true)

    try {
      await updateDoc(doc(db, "jobs", selectedJob.id), {
        status: "inactive",
        deactivatedAt: new Date(),
      })

      elegantToast.success({
        title: "¡Éxito!",
        description: "Empleo desactivado correctamente",
        duration: 3000,
      })

      onClose()
      setSelectedJob(null)
    } catch (error) {
      console.error("Error desactivando empleo:", error)

      elegantToast.error({
        title: "Error",
        description: "No se pudo desactivar el empleo",
        duration: 3000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReactivateJob = async (job: Job): Promise<void> => {
    try {
      setIsDeleting(true)
      await updateDoc(doc(db, "jobs", job.id), {
        status: "active",
        reactivatedAt: new Date(),
      })

      elegantToast.success({
        title: "¡Éxito!",
        description: "Empleo reactivado correctamente",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error reactivando empleo:", error)
      elegantToast.error({
        title: "Error",
        description: "No se pudo reactivar el empleo",
        duration: 3000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeactivateDialog = (job: Job): void => {
    if (isDeleting) return
    setSelectedJob(job)
    onOpen()
  }

  // ✨ Nueva función para abrir el modal de edición
  const openEditModal = (job: Job): void => {
    if (isDeleting) return
    setJobToEdit(job)
    onEditOpen()
  }

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Fecha no disponible"

    try {
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString("es-CO")
      }
      if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleDateString("es-CO")
      }
      return "Fecha inválida"
    } catch (error) {
      return "Fecha inválida"
    }
  }

  const JobCard = ({ item }: { item: Job }) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    useEffect(() => {
      console.log(
        `🎴 JobCard montado - ID: ${item.id}, tiene imagen: ${!!item.imageURL}`
      )
      if (item.imageURL) {
        console.log(`📸 URL: ${item.imageURL}`)
      }
    }, [])

    return (
      <Box
        bg="gray.800"
        p={4}
        mb={3}
        borderRadius="lg"
        borderLeftWidth={4}
        borderLeftColor={
          item.status === "active" ? "primary.500" : "orange.500"
        }
      >
        {item.imageURL && !imageError && (
          <Box
            mb={3}
            position="relative"
          >
            {!imageLoaded && (
              <Box
                position="absolute"
                width="100%"
                height={150}
                bg="gray.700"
                justifyContent="center"
                alignItems="center"
                borderRadius={8}
                zIndex={1}
              >
                <Text color="gray.500">Cargando imagen...</Text>
              </Box>
            )}

            {Platform.OS === "web" ? (
              // Usar img nativo en web
              <img
                src={item.imageURL}
                alt={item.title}
                style={{
                  width: "100%",
                  height: 150,
                  borderRadius: 8,
                  objectFit: "cover",
                  display: imageLoaded ? "block" : "none",
                }}
                onLoad={() => {
                  console.log(`✅ Imagen cargada - ID: ${item.id}`)
                  setImageLoaded(true)
                }}
                onError={(error) => {
                  console.error(
                    `❌ Error cargando imagen - ID: ${item.id}`,
                    error
                  )
                  setImageError(true)
                }}
              />
            ) : (
              // Usar expo-image en móvil
              <Image
                source={{ uri: item.imageURL }}
                style={{
                  width: "100%",
                  height: 150,
                  borderRadius: 8,
                }}
                contentFit="cover"
                transition={300}
                onLoad={() => {
                  console.log(`✅ Imagen cargada - ID: ${item.id}`)
                  setImageLoaded(true)
                }}
                onError={(error) => {
                  console.error(
                    `❌ Error cargando imagen - ID: ${item.id}`,
                    error
                  )
                  setImageError(true)
                }}
              />
            )}
          </Box>
        )}

        {/* Resto del código igual... */}
        <HStack
          justifyContent="space-between"
          alignItems="flex-start"
          mb={3}
        >
          <VStack
            flex={1}
            mr={2}
          >
            <Text
              color="white"
              fontSize="lg"
              fontWeight="bold"
              mb={1}
            >
              {item.title}
            </Text>
            <HStack
              alignItems="center"
              mb={1}
            >
              <Icon
                as={MaterialIcons}
                name="business"
                color="gray.400"
                size="sm"
              />
              <Text
                color="gray.300"
                fontSize="md"
                ml={1}
              >
                {item.company}
              </Text>
            </HStack>
            {item.location && (
              <HStack alignItems="center">
                <Icon
                  as={MaterialIcons}
                  name="location-on"
                  color="gray.400"
                  size="sm"
                />
                <Text
                  color="gray.400"
                  fontSize="sm"
                  ml={1}
                >
                  {item.location}
                </Text>
              </HStack>
            )}
          </VStack>
          <Badge
            colorScheme={item.status === "active" ? "green" : "red"}
            variant="subtle"
          >
            {item.status === "active" ? "Activo" : "Desactivado"}
          </Badge>
        </HStack>

        {item.salary && (
          <HStack
            alignItems="center"
            mb={2}
          >
            <Icon
              as={MaterialIcons}
              name="attach-money"
              color="primary.400"
              size="sm"
            />
            <Text
              color="primary.400"
              fontSize="sm"
              fontWeight="medium"
              ml={1}
            >
              {item.salary}
            </Text>
          </HStack>
        )}

        <Text
          color="gray.300"
          fontSize="sm"
          mb={3}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        {item.requirements && item.requirements.length > 0 && (
          <VStack mb={3}>
            <Text
              color="gray.400"
              fontSize="xs"
              mb={1}
            >
              Requisitos principales:
            </Text>
            <HStack flexWrap="wrap">
              {item.requirements.slice(0, 3).map((req, index) => (
                <Badge
                  key={index}
                  colorScheme="gray"
                  variant="outline"
                  mr={1}
                  mb={1}
                >
                  <Text fontSize="xs">{req}</Text>
                </Badge>
              ))}
              {item.requirements.length > 3 && (
                <Badge
                  colorScheme="gray"
                  variant="outline"
                  mr={1}
                  mb={1}
                >
                  <Text fontSize="xs">+{item.requirements.length - 3} más</Text>
                </Badge>
              )}
            </HStack>
          </VStack>
        )}

        <Text
          color="gray.500"
          fontSize="xs"
          mb={3}
        >
          Publicado: {formatDate(item.createdAt)}
        </Text>

        <Divider
          bg="gray.700"
          mb={3}
        />

        <HStack
          justifyContent="space-between"
          alignItems="center"
        >
          <HStack space={2}>
            <EditJobButton
              onPress={() => openEditModal(item)}
              isDisabled={isDeleting}
            />

            {item.status === "active" ? (
              <Button
                variant="outline"
                colorScheme="orange"
                size="sm"
                leftIcon={
                  <Icon
                    as={MaterialIcons}
                    name="visibility-off"
                    size="xs"
                  />
                }
                onPress={() => openDeactivateDialog(item)}
                _text={{ fontSize: "xs" }}
                _pressed={{ opacity: 0.7 }}
                isDisabled={isDeleting}
              >
                Desactivar
              </Button>
            ) : (
              <Button
                variant="outline"
                colorScheme="green"
                size="sm"
                leftIcon={
                  <Icon
                    as={MaterialIcons}
                    name="visibility"
                    size="xs"
                  />
                }
                onPress={() => handleReactivateJob(item)}
                _text={{ fontSize: "xs" }}
                _pressed={{ opacity: 0.7 }}
                isDisabled={isDeleting}
              >
                Reactivar
              </Button>
            )}
          </HStack>
        </HStack>
      </Box>
    )
  }

  const renderItem: ListRenderItem<Job> = ({ item }) => <JobCard item={item} />

  return (
    <Box
      flex={1}
      bg="gray.900"
      safeArea
    >
      <StatusBar style="light" />

      <HStack
        justifyContent="space-between"
        alignItems="center"
        px={6}
        py={4}
        borderBottomWidth={1}
        borderBottomColor="gray.700"
      >
        <HStack alignItems="center">
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
          <VStack ml={3}>
            <Text
              color="white"
              fontSize="xl"
              fontWeight="medium"
            >
              Empleos Publicados
            </Text>
            <Text
              color="gray.400"
              fontSize="sm"
            >
              {jobs.length} {jobs.length === 1 ? "empleo" : "empleos"}
            </Text>
          </VStack>
        </HStack>

        <Button
          bg="green.600"
          _pressed={{ bg: "green.700" }}
          size="sm"
          leftIcon={
            <Icon
              as={MaterialIcons}
              name="add"
              color="white"
            />
          }
          onPress={() => router.push("/createJob")}
          _text={{ fontWeight: "medium", fontSize: "sm" }}
        >
          Crear
        </Button>
      </HStack>

      {loading ? (
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
        >
          <VStack
            alignItems="center"
            space={3}
          >
            <Icon
              as={MaterialIcons}
              name="work"
              color="gray.500"
              size="xl"
            />
            <Text
              color="gray.400"
              fontSize="md"
            >
              Cargando empleos...
            </Text>
          </VStack>
        </Box>
      ) : jobs.length === 0 ? (
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
          px={6}
        >
          <VStack
            alignItems="center"
            space={4}
          >
            <Icon
              as={MaterialIcons}
              name="work-off"
              color="gray.500"
              size="6xl"
            />
            <Text
              color="white"
              fontSize="xl"
              fontWeight="medium"
              textAlign="center"
            >
              No hay empleos publicados
            </Text>
            <Text
              color="gray.400"
              fontSize="md"
              textAlign="center"
            >
              Crea tu primer empleo para comenzar a recibir candidatos
            </Text>
            <Button
              bg="primary.500"
              _pressed={{ bg: "primary.600" }}
              leftIcon={
                <Icon
                  as={MaterialIcons}
                  name="add"
                  color="white"
                />
              }
              onPress={() => router.push("/createJob")}
              mt={2}
            >
              Crear Primer Empleo
            </Button>
          </VStack>
        </Box>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}-${item.imageURL || "no-image"}`} // Cambio aquí
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          extraData={jobs} // Agregar esto
        />
      )}

      {/* Modal de Desactivación */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <AlertDialog.Content
          bg="gray.800"
          borderColor="gray.700"
        >
          <AlertDialog.CloseButton _icon={{ color: "white" }} />
          <AlertDialog.Header
            bg="gray.800"
            borderBottomColor="gray.700"
          >
            <Text
              color="white"
              fontSize="lg"
              fontWeight="bold"
            >
              Desactivar Empleo
            </Text>
          </AlertDialog.Header>
          <AlertDialog.Body bg="gray.800">
            <Text color="gray.300">
              ¿Estás seguro de que deseas desactivar el empleo
              {selectedJob?.title}? El empleo dejará de ser visible para los
              candidatos, pero podrás reactivarlo cuando lo desees.
            </Text>
          </AlertDialog.Body>
          <AlertDialog.Footer
            bg="gray.800"
            borderTopColor="gray.700"
          >
            <Button.Group space={2}>
              <Button
                variant="outline"
                colorScheme="gray"
                onPress={onClose}
                ref={cancelRef}
                _text={{ color: "gray.300" }}
              >
                Cancelar
              </Button>
              <Button
                bg="orange.600"
                _pressed={{ bg: "orange.700" }}
                onPress={handleDeactivateJob}
                isLoading={isDeleting}
                isDisabled={isDeleting}
                _loading={{
                  bg: "orange.600",
                  _text: { color: "white" },
                }}
              >
                {isDeleting ? "Desactivando..." : "Desactivar"}
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>

      <EditJobModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        job={jobToEdit}
        db={db}
        onSuccess={(title: string, description: string) => {
          elegantToast.success({
            title,
            description,
            duration: 3000,
          })
        }}
        onError={(title: string, description: string) => {
          elegantToast.error({
            title,
            description,
            duration: 3000,
          })
        }}
        storage={storage}
      />
    </Box>
  )
}
