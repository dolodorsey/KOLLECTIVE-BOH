import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: 'the Kollective BOH',
  slug: 'kollective-os-dashboard',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'kollectiveboh',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.rork.kollective-os-dashboard'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'app.rork.kollective-os-dashboard'
  },
  web: {
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    [
      'expo-router',
      {
        origin: 'https://rork.com/'
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    // Current direct BOH data plane.
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

    // Rork build/runtime values when provided by the platform.
    EXPO_PUBLIC_RORK_DB_ENDPOINT: process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT,
    EXPO_PUBLIC_RORK_DB_NAMESPACE: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE,
    EXPO_PUBLIC_RORK_DB_TOKEN: process.env.EXPO_PUBLIC_RORK_DB_TOKEN,
    EXPO_PUBLIC_RORK_API_BASE_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
    EXPO_PUBLIC_TOOLKIT_URL: process.env.EXPO_PUBLIC_TOOLKIT_URL,
    EXPO_PUBLIC_PROJECT_ID: process.env.EXPO_PUBLIC_PROJECT_ID,
    EXPO_PUBLIC_TEAM_ID: process.env.EXPO_PUBLIC_TEAM_ID,
  }
});
