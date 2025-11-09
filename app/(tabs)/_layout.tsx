import { Ionicons } from "@expo/vector-icons"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import React from "react"
import { Platform } from "react-native"
import AdminManagement from "../admin"
import createJob from "../createJob"
import JobList from "../jobList"

const Tab = createBottomTabNavigator()

const tabs = [
  {
    name: "Dashboard",
    component: JobList,
    icon: "grid-outline",
    label: "Inicio",
  },
  {
    name: "Jobs",
    component: createJob,
    icon: "briefcase-outline",
    label: "Empleos",
  },
  {
    name: "Admins",
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
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 28 : 12, // 👈 Más espacio
          paddingTop: 12, // 👈 Más espacio arriba
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4, // 👈 Separación entre ícono y texto
        },
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label, // 👈 Simple string
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={tab.icon as any}
                size={24} // 👈 Tamaño consistente
                color={focused ? "#3b82f6" : color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  )
}
