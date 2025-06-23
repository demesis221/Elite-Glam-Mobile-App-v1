module.exports = {
  name: "Elite Glam",
  slug: "elite-glam-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#7E57C2"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.eliteglam.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#7E57C2"
    },
    package: "com.eliteglam.app"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-router"
  ],
  extra: {
    eas: {
      projectId: "your-project-id"
    }
  },
  install: {
    exclude: [] // Optional list of dependencies to exclude from compatibility check
  }
}; 