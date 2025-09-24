// components/ElegantToast.tsx
import { MaterialIcons } from "@expo/vector-icons"
import { Box, HStack, Icon, Text, VStack } from "native-base"
import React from "react"

interface ElegantToastProps {
  type: "success" | "error" | "info" | "warning"
  title: string
  description?: string
  onClose?: () => void
}

export const ElegantToast: React.FC<ElegantToastProps> = ({
  type,
  title,
  description,
  onClose,
}) => {
  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          bg: "rgba(16, 185, 129, 0.95)", // green-500 with opacity
          borderColor: "green.400",
          icon: "check-circle",
          iconColor: "white",
        }
      case "error":
        return {
          bg: "rgba(239, 68, 68, 0.95)", // red-500 with opacity
          borderColor: "red.400",
          icon: "error",
          iconColor: "white",
        }
      case "warning":
        return {
          bg: "rgba(245, 158, 11, 0.95)", // amber-500 with opacity
          borderColor: "amber.400",
          icon: "warning",
          iconColor: "white",
        }
      case "info":
        return {
          bg: "rgba(59, 130, 246, 0.95)", // blue-500 with opacity
          borderColor: "blue.400",
          icon: "info",
          iconColor: "white",
        }
      default:
        return {
          bg: "rgba(107, 114, 128, 0.95)", // gray-500 with opacity
          borderColor: "gray.400",
          icon: "info",
          iconColor: "white",
        }
    }
  }

  const config = getToastConfig()

  return (
    <Box
      bg={config.bg}
      borderWidth={1}
      borderColor={config.borderColor}
      borderRadius="xl"
      px={4}
      py={3}
      mx={4}
      mt={2}
      shadow={6}
      style={{
        backdropFilter: "blur(10px)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <HStack
        alignItems="flex-start"
        space={3}
      >
        {/* Icon */}
        <Box
          bg="rgba(255, 255, 255, 0.2)"
          p={1.5}
          borderRadius="full"
          mt={0.5}
        >
          <Icon
            as={MaterialIcons}
            name={config.icon}
            size="sm"
            color={config.iconColor}
          />
        </Box>

        {/* Content */}
        <VStack
          flex={1}
          space={1}
        >
          <Text
            color="white"
            fontWeight="semibold"
            fontSize="md"
            lineHeight="sm"
          >
            {title}
          </Text>
          {description && (
            <Text
              color="rgba(255, 255, 255, 0.9)"
              fontSize="sm"
              lineHeight="sm"
            >
              {description}
            </Text>
          )}
        </VStack>

        {/* Close button */}
        {onClose && (
          <Box
            bg="rgba(255, 255, 255, 0.2)"
            p={1}
            borderRadius="full"
            onTouchStart={onClose}
          >
            <Icon
              as={MaterialIcons}
              name="close"
              size="xs"
              color="white"
            />
          </Box>
        )}
      </HStack>
    </Box>
  )
}
