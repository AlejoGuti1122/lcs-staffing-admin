export default {
  expo: {
    name: "lcs-staffing-admin",
    slug: "lcs-staffing-admin",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "lcsstaffingadmin",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      eas: {
        projectId: "880263a9-eee8-479e-ab9b-88b6b0f21d40",
      },
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lcs.staffingadmin",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: "com.lcs.staffingadmin",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "La aplicación necesita acceso a tus fotos para agregar imágenes a los empleos.",
          cameraPermission:
            "La aplicación necesita acceso a la cámara para tomar fotos de los empleos.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
}
