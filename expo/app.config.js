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
    bundleIdentifier: 'com.kollective.boh'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.kollective.boh'
  },
  web: {
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    [
      'expo-router',
      {
        origin: 'https://thekollectivegroup.com/'
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    // Supabase Configuration
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    
    // API Configuration
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    
    // Automation (Supabase Edge Functions — replaces n8n)
    EXPO_PUBLIC_AUTOMATION_URL: process.env.EXPO_PUBLIC_AUTOMATION_URL,
    EXPO_PUBLIC_PROJECT_ID: process.env.EXPO_PUBLIC_PROJECT_ID,
    EXPO_PUBLIC_TEAM_ID: process.env.EXPO_PUBLIC_TEAM_ID,
  }
});
