// hooks/useElegantToast.tsx
import { useToast } from "native-base"
import { ElegantToast } from "../components/ElegantToast"

interface ToastOptions {
  title: string
  description?: string
  duration?: number
}

export const useElegantToast = () => {
  const toast = useToast()

  const showToast = (
    type: "success" | "error" | "info" | "warning",
    options: ToastOptions
  ) => {
    const { title, description, duration = 3000 } = options

    toast.show({
      placement: "top",
      duration,
      render: ({ id }) => (
        <ElegantToast
          type={type}
          title={title}
          description={description}
          onClose={() => toast.close(id)}
        />
      ),
    })
  }

  return {
    success: (options: ToastOptions) => showToast("success", options),
    error: (options: ToastOptions) => showToast("error", options),
    info: (options: ToastOptions) => showToast("info", options),
    warning: (options: ToastOptions) => showToast("warning", options),
  }
}
