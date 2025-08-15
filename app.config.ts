import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: 'sensitivity161',
  name: 'Elite Glam',
  slug: 'elite-glam',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#7E57C2'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.eliteglam.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#7E57C2'
    },
    package: 'com.eliteglam.app'
  },
  web: {
    favicon: './assets/images/favicon.png',
    bundler: 'metro'
  },
  extra: {
    eas: {
      projectId: 'ad135dbb-6ebb-486f-a2db-a0cc3c8dcea0'
    }
  },
  
  plugins: [
    ['expo-router', {
      // Enable typed routes
      origin: 'http://localhost:19006',
      // Add other expo-router options here if needed
    }],
    'expo-asset'
  ],
  experiments: {
    // Keep typedRoutes enabled in experiments
    typedRoutes: true
  },
  scheme: 'eliteglam',
  updates: {
    fallbackToCacheTimeout: 0
  },
  jsEngine: 'hermes'
});