import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
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
import { FlatList, ListRenderItem } from "react-native"
import { db } from "../config/firebase"
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
}

export default function JobsListScreen() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const { isOpen, onOpen, onClose } = useDisclose()
  const cancelRef = useRef<any>(null)
  const elegantToast = useElegantToast()

  // ✅ FIX: Remover elegantToast de las dependencias para evitar loop infinito
  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const jobsData: Job[] = []
        querySnapshot.forEach((doc) => {
          jobsData.push({ id: doc.id, ...doc.data() } as Job)
        })
        setJobs(jobsData)
        setLoading(false)
      },
      (error) => {
        console.error("Error obteniendo empleos:", error)
        // El toast sigue funcionando, solo no está en las dependencias
        elegantToast.error({
          title: "Error",
          description: "No se pudieron cargar los empleos",
          duration: 3000,
        })
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, []) // ✅ Array vacío - esto evita el loop infinito

  // ✅ Función de eliminación con toast
  const handleDeleteJob = async (): Promise<void> => {
    if (!selectedJob || isDeleting) return

    setIsDeleting(true)

    try {
      await deleteDoc(doc(db, "jobs", selectedJob.id))

      // ✅ Toast de éxito
      elegantToast.success({
        title: "¡Éxito!",
        description: "Empleo eliminado correctamente",
        duration: 3000,
      })

      onClose()
      setSelectedJob(null)
    } catch (error) {
      console.error("Error eliminando empleo:", error)

      // ✅ Toast de error
      elegantToast.error({
        title: "Error",
        description: "No se pudo eliminar el empleo",
        duration: 3000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // ✅ Función para abrir modal
  const openDeleteDialog = (job: Job): void => {
    if (isDeleting) return
    setSelectedJob(job)
    onOpen()
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

  const JobCard = ({ item }: { item: Job }) => (
    <Box
      bg="gray.800"
      p={4}
      mb={3}
      borderRadius="lg"
      borderLeftWidth={4}
      borderLeftColor="primary.500"
    >
      {/* Header del empleo */}
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
          colorScheme="green"
          variant="subtle"
        >
          {item.status === "active" ? "Activo" : "Inactivo"}
        </Badge>
      </HStack>

      {/* Salario si existe */}
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

      {/* Descripción truncada */}
      <Text
        color="gray.300"
        fontSize="sm"
        mb={3}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      {/* Requisitos si existen */}
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
              >
                <Text fontSize="xs">+{item.requirements.length - 3} más</Text>
              </Badge>
            )}
          </HStack>
        </VStack>
      )}

      {/* Fecha de creación */}
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

      {/* Botones de acción */}
      <HStack
        justifyContent="space-between"
        alignItems="center"
      >
        <HStack space={2}>
          {/* ✅ Botón que abre el modal */}
          <Button
            variant="outline"
            colorScheme="red"
            size="sm"
            leftIcon={
              <Icon
                as={MaterialIcons}
                name="delete"
                size="xs"
              />
            }
            onPress={() => openDeleteDialog(item)}
            _text={{ fontSize: "xs" }}
            _pressed={{ opacity: 0.7 }}
            isDisabled={isDeleting}
          >
            Eliminar
          </Button>
        </HStack>
      </HStack>
    </Box>
  )

  const renderItem: ListRenderItem<Job> = ({ item }) => <JobCard item={item} />

  return (
    <Box
      flex={1}
      bg="gray.900"
      safeArea
    >
      <StatusBar style="light" />

      {/* Header */}
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

      {/* Lista de empleos */}
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ✅ Modal hermoso con toast funcionando */}
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
              Eliminar Empleo
            </Text>
          </AlertDialog.Header>
          <AlertDialog.Body bg="gray.800">
            <Text color="gray.300">
              ¿Estás seguro de que deseas eliminar el empleo
              {selectedJob?.title}? Esta acción no se puede deshacer.
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
              {/* ✅ Botón que ejecuta eliminación con toast */}
              <Button
                bg="red.600"
                _pressed={{ bg: "red.700" }}
                onPress={handleDeleteJob}
                isLoading={isDeleting}
                isDisabled={isDeleting}
                _loading={{
                  bg: "red.600",
                  _text: { color: "white" },
                }}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  )
}
