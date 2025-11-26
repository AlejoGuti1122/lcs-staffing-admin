import { MaterialIcons } from "@expo/vector-icons"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import {
  Badge,
  Box,
  Button,
  HStack,
  Image,
  Switch,
  Text,
  VStack,
} from "native-base"
import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native"
import { TextInput as PaperTextInput } from "react-native-paper"
import { auth, db } from "../../config/firebase"
import { useElegantToast } from "../hooks/useElegantToast"

interface Admin {
  id: string
  email: string
  role?: string
  isSuperAdmin?: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const SUPER_ADMIN_EMAIL = "app@lcsstaffing.com"

const WebInput = ({
  placeholder,
  value,
  onChangeText,
  type = "text",
  icon,
}: any) => (
  <div style={{ position: "relative", width: "100%" }}>
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
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      style={{
        width: "100%",
        padding: "14px 16px 14px 44px",
        fontSize: 16,
        borderRadius: 12,
        border: "2px solid #d1d5db",
        outline: "none",
        backgroundColor: "white",
        color: "#000",
        transition: "border-color 0.2s",
        boxSizing: "border-box",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
    />
  </div>
)

export default function AdminManagement() {
  // ⭐ ESTADOS DE PROTECCIÓN
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  const [admins, setAdmins] = useState<Admin[]>([])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useElegantToast()
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("")
  const [isCurrentUserSuperAdmin, setIsCurrentUserSuperAdmin] =
    useState<boolean>(false)

  // ⭐ PROTECCIÓN DE RUTA - Espera a que Firebase Auth se inicialice completamente
  useEffect(() => {
    let hasRedirected = false

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (hasRedirected) return // Evitar múltiples redirecciones

      if (!user) {
        console.log("❌ No autenticado, redirigiendo a login...")
        hasRedirected = true
        router.replace("/")
        setIsChecking(false)
        return
      }

      try {
        console.log("🔍 Verificando permisos para:", user.email)
        const userDoc = await getDoc(doc(db, "users", user.uid))

        if (!userDoc.exists()) {
          console.log("❌ Usuario no existe en Firestore")
          await auth.signOut()
          hasRedirected = true
          router.replace("/")
          setIsChecking(false)
          return
        }

        const userData = userDoc.data()

        if (userData.role !== "admin") {
          console.log("❌ Usuario no es admin")
          await auth.signOut()
          hasRedirected = true
          router.replace("/")
          setIsChecking(false)
          return
        }

        if (userData.isActive === false) {
          console.log("❌ Cuenta inactiva")
          await auth.signOut()
          hasRedirected = true
          router.replace("/")
          setIsChecking(false)
          return
        }

        // ✅ Todo OK - permitir acceso
        console.log("✅ Acceso autorizado para:", user.email)
        setIsAuthorized(true)
        setCurrentUserEmail(user.email || "")
        setIsCurrentUserSuperAdmin(user.email === SUPER_ADMIN_EMAIL)
        setIsChecking(false)
      } catch (error) {
        console.error("Error verificando permisos:", error)
        hasRedirected = true
        router.replace("/")
        setIsChecking(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const loadAdmins = async () => {
    const snapshot = await getDocs(collection(db, "users"))
    const adminUsers = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Admin))
      .filter((user) => user.role === "admin")
    setAdmins(adminUsers)
  }

  useEffect(() => {
    if (isAuthorized) {
      loadAdmins()
    }
  }, [isAuthorized])

  const handleSave = async () => {
    if (!email || (!editingId && !password))
      return toast.error({
        title: "Error",
        description: "Completa todos los campos",
      })

    if (!editingId && password.length < 6)
      return toast.error({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
      })

    setIsLoading(true)
    try {
      if (editingId) {
        await updateDoc(doc(db, "users", editingId), {
          email,
          updatedAt: new Date().toISOString(),
        })
        toast.success({
          title: "¡Actualizado!",
          description: "Admin actualizado correctamente",
        })
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )
        const isSuperAdmin = email === SUPER_ADMIN_EMAIL
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          role: "admin",
          isSuperAdmin,
          isActive: true,
          createdAt: new Date().toISOString(),
        })
        toast.success({
          title: "¡Creado!",
          description: "Admin creado correctamente",
        })
      }
      setEmail("")
      setPassword("")
      setEditingId(null)
      loadAdmins()
    } catch (error: any) {
      let errorMsg = error.message
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "Este correo ya está registrado"
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Formato de correo inválido"
      } else if (error.code === "auth/weak-password") {
        errorMsg = "La contraseña es muy débil"
      }
      toast.error({ title: "Error", description: errorMsg })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "users", id), { isActive: !currentStatus })
    loadAdmins()
    toast.success({ title: currentStatus ? "Desactivado" : "Activado" })
  }

  const handleEdit = (admin: any) => {
    setEmail(admin.email)
    setEditingId(admin.id)
  }

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success({
        title: "Email enviado",
        description: `Se envió un link de reseteo a ${email}`,
        duration: 5000,
      })
    } catch (error: any) {
      let errorMsg = "No se pudo enviar el email"
      if (error.code === "auth/user-not-found") {
        errorMsg = "Usuario no encontrado"
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Email inválido"
      }
      toast.error({ title: "Error", description: errorMsg })
    }
  }

  const isSuperAdmin = (admin: Admin) => {
    return admin.email === SUPER_ADMIN_EMAIL || admin.isSuperAdmin
  }

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
        performLogout()
      }
    } else {
      Alert.alert("Cerrar sesión", "¿Estás seguro que deseas salir?", [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Salir",
          style: "destructive",
          onPress: performLogout,
        },
      ])
    }
  }

  const performLogout = async () => {
    try {
      await signOut(auth)
      toast.success({
        title: "Sesión cerrada",
        description: "Hasta pronto",
      })
      router.replace("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast.error({
        title: "Error",
        description: "No se pudo cerrar la sesión",
      })
    }
  }

  // ⭐ MOSTRAR LOADING MIENTRAS VERIFICA (SIEMPRE, no mostrar contenido hasta verificar)
  if (isChecking || !isAuthorized) {
    return (
      <Box
        flex={1}
        bg="gray.900"
        justifyContent="center"
        alignItems="center"
      >
        <VStack
          space={4}
          alignItems="center"
        >
          <ActivityIndicator
            size="large"
            color="#3b82f6"
          />
          <Text
            color="white"
            fontSize="md"
          >
            Verificando permisos...
          </Text>
        </VStack>
      </Box>
    )
  }

  // ✅ USUARIO AUTORIZADO - MOSTRAR CONTENIDO
  return (
    <Box
      flex={1}
      bg="gray.900"
      safeArea
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space={6}>
          <VStack
            alignItems="center"
            mb={2}
            mt={-5}
          >
            <Image
              source={require("../../assets/images/logo.png")}
              alt="LCS Staffing"
              width={120}
              height={40}
              resizeMode="contain"
            />
            <Text
              color="white"
              fontSize="xl"
              fontWeight="medium"
            >
              {isCurrentUserSuperAdmin
                ? (editingId ? "Editar" : "Crear") + " Administrador"
                : "Gestión de Administradores"}
            </Text>
          </VStack>

          {isCurrentUserSuperAdmin && (
            <>
              <Box>
                <Text
                  color="white"
                  mb={2}
                >
                  Correo
                </Text>
                {Platform.OS === "web" ? (
                  <WebInput
                    placeholder="admin@correo.com"
                    value={email}
                    onChangeText={setEmail}
                    type="email"
                    icon="📧"
                  />
                ) : (
                  <PaperTextInput
                    mode="outlined"
                    placeholder="admin@correo.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    left={<PaperTextInput.Icon icon="email" />}
                    style={styles.paperInput}
                    theme={{
                      colors: { primary: "#3b82f6", outline: "#d1d5db" },
                    }}
                  />
                )}
              </Box>

              {!editingId && (
                <Box>
                  <Text
                    color="white"
                    mb={2}
                  >
                    Contraseña
                  </Text>
                  {Platform.OS === "web" ? (
                    <WebInput
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      type="password"
                      icon="🔒"
                    />
                  ) : (
                    <PaperTextInput
                      mode="outlined"
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      left={<PaperTextInput.Icon icon="lock" />}
                      style={styles.paperInput}
                      theme={{
                        colors: { primary: "#3b82f6", outline: "#d1d5db" },
                      }}
                    />
                  )}
                </Box>
              )}

              <HStack space={3}>
                <Button
                  flex={1}
                  bg="primary.500"
                  onPress={handleSave}
                  isLoading={isLoading}
                >
                  {editingId ? "Actualizar" : "Crear"}
                </Button>
                {editingId && (
                  <Button
                    flex={1}
                    bg="gray.600"
                    onPress={() => {
                      setEditingId(null)
                      setEmail("")
                      setPassword("")
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </HStack>
            </>
          )}

          <Text
            color="white"
            fontSize="lg"
            mt={4}
            fontWeight="medium"
          >
            Lista de Administradores
          </Text>

          {admins.map((item) => (
            <Box
              key={item.id}
              bg="gray.800"
              p={4}
              borderRadius="lg"
              mb={3}
              borderWidth={isSuperAdmin(item) ? 2 : 0}
              borderColor={isSuperAdmin(item) ? "yellow.500" : "transparent"}
            >
              <HStack
                justifyContent="space-between"
                alignItems="center"
              >
                <VStack
                  flex={1}
                  mr={4}
                >
                  <HStack
                    alignItems="center"
                    space={2}
                  >
                    <Text
                      color="white"
                      fontSize="md"
                      fontWeight="medium"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.email}
                    </Text>
                    {isSuperAdmin(item) && (
                      <Badge
                        colorScheme="warning"
                        variant="solid"
                        borderRadius="md"
                      >
                        <Text
                          fontSize="2xs"
                          fontWeight="bold"
                        >
                          SUPER ADMIN
                        </Text>
                      </Badge>
                    )}
                  </HStack>
                  <Text
                    color="gray.400"
                    fontSize="xs"
                    mt={1}
                  >
                    {item.isActive ? "Activo" : "Inactivo"}
                  </Text>
                </VStack>

                <HStack
                  space={2}
                  alignItems="center"
                >
                  {isSuperAdmin(item) ? (
                    <Box
                      px={1}
                      py={1}
                      bg="gray.700"
                      borderRadius="md"
                    />
                  ) : isCurrentUserSuperAdmin ? (
                    <>
                      <Switch
                        isChecked={item.isActive}
                        onToggle={() => toggleActive(item.id, item.isActive)}
                        size="sm"
                      />

                      <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderRadius: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MaterialIcons
                          name="edit"
                          size={18}
                          color="white"
                        />
                        <Text
                          color="white"
                          fontSize="xs"
                          fontWeight="medium"
                        ></Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </HStack>
              </HStack>
            </Box>
          ))}

          <Box mt={6}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="logout"
                size={20}
                color="#fff"
              />
              <Text
                color="white"
                fontSize="md"
                fontWeight="semibold"
              >
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  )
}

const styles = StyleSheet.create({
  paperInput: {
    backgroundColor: "white",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
