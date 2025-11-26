import { Ionicons } from "@expo/vector-icons"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import React from "react"
import { LogBox, Platform } from "react-native"
import AdminManagement from "./Admin"
import CreateJob from "./CreateJob"
import JobList from "./JobList" // ← ÚNICO CAMBIO: mayúscula

// ← Agregar estas 3 líneas AQUÍ
LogBox.ignoreLogs([
  "VirtualizedLists should never be nested inside plain ScrollViews",
])

const Tab = createBottomTabNavigator()

const tabs = [
  {
    name: "JobList",
    component: JobList,
    icon: "grid-outline",
    label: "Inicio",
  },
  {
    name: "CreateJob",
    component: CreateJob,
    icon: "briefcase-outline",
    label: "Empleos",
  },
  {
    name: "Admin",
    component: AdminManagement,
    icon: "people-outline",
    label: "Admins",
  },
]

export default function TabsLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1f2937",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 95 : 75,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          marginTop: 0,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={focused ? "#3b82f6" : color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  )
}
