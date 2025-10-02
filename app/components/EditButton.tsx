import { MaterialIcons } from "@expo/vector-icons"
import { Button, Icon } from "native-base"
import React from "react"

interface EditJobButtonProps {
  onPress: () => void
  isDisabled?: boolean
}

export const EditJobButton: React.FC<EditJobButtonProps> = ({
  onPress,
  isDisabled = false,
}) => {
  return (
    <Button
      variant="outline"
      colorScheme="blue"
      size="sm"
      leftIcon={
        <Icon
          as={MaterialIcons}
          name="edit"
          size="xs"
        />
      }
      onPress={onPress}
      isDisabled={isDisabled}
      _text={{
        fontSize: "xs",
        fontWeight: "medium",
      }}
      _pressed={{
        opacity: 0.7,
        bg: "blue.900",
        borderColor: "blue.400",
      }}
      _hover={{
        bg: "blue.800",
        borderColor: "blue.400",
      }}
      borderWidth={1.5}
      borderColor="blue.500"
    >
      Editar
    </Button>
  )
}
