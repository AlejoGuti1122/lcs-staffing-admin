import { StatusBar } from "expo-status-bar"
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth"
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { Badge, Box, Button, HStack, Switch, Text, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { FlatList, Platform, StyleSheet, TouchableOpacity } from "react-native"
import { TextInput as PaperTextInput } from "react-native-paper"
import { auth, db } from "../config/firebase"
import { useElegantToast } from "./hooks/useElegantToast"

interface Admin {
  id: string
  email: string
  role?: string
  isSuperAdmin?: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const SUPER_ADMIN_EMAIL = "lcssstafing@gmail.com"

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
  const [admins, setAdmins] = useState<Admin[]>([])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useElegantToast()

  const loadAdmins = async () => {
    const snapshot = await getDocs(collection(db, "users"))
    const adminUsers = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Admin))
      .filter((user) => user.role === "admin")
    setAdmins(adminUsers)
  }

  useEffect(() => {
    loadAdmins()
  }, [])

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

  // ⭐ NUEVA FUNCIÓN: Resetear contraseña
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

  return (
    <Box
      flex={1}
      bg="gray.900"
      safeArea
    >
      <StatusBar style="light" />

      <VStack
        p={6}
        space={6}
      >
        <HStack
          alignItems="center"
          mb={4}
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
            {editingId ? "Editar" : "Crear"} Administrador
          </Text>
        </HStack>

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
              theme={{ colors: { primary: "#3b82f6", outline: "#d1d5db" } }}
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
                theme={{ colors: { primary: "#3b82f6", outline: "#d1d5db" } }}
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

        <Text
          color="white"
          fontSize="lg"
          mt={4}
          fontWeight="medium"
        >
          Lista de Administradores
        </Text>

        <FlatList
          data={admins}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Box
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
                <VStack flex={1}>
                  <HStack
                    alignItems="center"
                    space={2}
                  >
                    <Text
                      color="white"
                      fontSize="md"
                      fontWeight="medium"
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

                {/* ⭐ CONTROLES ACTUALIZADOS */}
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
                    >
                      {/* <Text
                        color="gray.500"
                        fontSize="xs"
                        fontWeight="medium"
                      >
                        Protegido
                      </Text> */}
                    </Box>
                  ) : (
                    <>
                      <Switch
                        isChecked={item.isActive}
                        onToggle={() => toggleActive(item.id, item.isActive)}
                        size="sm"
                      />

                      {/* Botón Reset Password */}
                      <TouchableOpacity
                        onPress={() => handleResetPassword(item.email)}
                        style={{
                          backgroundColor: "#f97316",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          color="white"
                          fontSize="xs"
                          fontWeight="medium"
                        >
                          🔑 Reset
                        </Text>
                      </TouchableOpacity>

                      {/* Botón Editar */}
                      <TouchableOpacity onPress={() => handleEdit(item)}>
                        <Text
                          color="primary.500"
                          fontSize="sm"
                          fontWeight="medium"
                        >
                          Editar
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </HStack>
              </HStack>
            </Box>
          )}
          style={{ maxHeight: 400 }}
        />
      </VStack>
    </Box>
  )
}

const styles = StyleSheet.create({
  paperInput: {
    backgroundColor: "white",
    fontSize: 16,
  },
})
