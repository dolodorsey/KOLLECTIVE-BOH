import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Session } from "@supabase/supabase-js";
import { View, Text, StyleSheet } from "react-native";

import { trpc, trpcClient } from "@/lib/trpc";
import { getSupabase, SUPABASE_CONFIG_OK, DIAGNOSTIC_INFO } from "@/lib/supabase";
import { UserContext } from "@/hooks/user-context";
import { TasksContext } from "@/hooks/tasks-context";
import { BrandsContext } from "@/hooks/brands-context";
import { AgentsContext } from "@/hooks/agents-context";
import { CultureContext } from "@/hooks/culture-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 RootLayoutNav mounting');
    
    if (!SUPABASE_CONFIG_OK) {
      console.error('❌ Supabase configuration missing');
      setIsReady(true);
      return;
    }

    const supabase = getSupabase();
    console.log('✅ Supabase client initialized');

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('📱 Initial session:', session?.user?.email || 'none');
        setSession(session);
        setIsReady(true);
      })
      .catch((error) => {
        console.error('❌ Session fetch error:', error);
        setIsReady(true);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event, session?.user?.email || 'none');
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isReady) {
      console.log('⏳ Not ready yet, waiting...');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    console.log('🧭 Navigation check - segments:', segments, 'session:', !!session, 'inAuthGroup:', inAuthGroup);

    if (!session && !inAuthGroup) {
      console.log('➡️ No session, redirecting to login');
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      console.log('➡️ Session exists, redirecting to app');
      router.replace('/(tabs)');
    }
  }, [session, segments, isReady, router]);

  if (!SUPABASE_CONFIG_OK) {
    return (
      <View style={configErrorStyles.container}>
        <Text style={configErrorStyles.title}>Configuration Error</Text>
        <Text style={configErrorStyles.message}>
          Supabase configuration is missing.{"\n\n"}
          Please set the following environment variables:{"\n"}
          - EXPO_PUBLIC_SUPABASE_URL{"\n"}
          - EXPO_PUBLIC_SUPABASE_ANON_KEY
        </Text>
        
        <View style={configErrorStyles.diagnosticBox}>
          <Text style={configErrorStyles.diagnosticTitle}>🔍 RUNTIME DIAGNOSTICS</Text>
          <Text style={configErrorStyles.diagnosticText}>hasUrl: {String(DIAGNOSTIC_INFO.hasUrl)}</Text>
          <Text style={configErrorStyles.diagnosticText}>hasKey: {String(DIAGNOSTIC_INFO.hasKey)}</Text>
          <Text style={configErrorStyles.diagnosticText}>url: {DIAGNOSTIC_INFO.url}</Text>
          <Text style={configErrorStyles.diagnosticText}>keyPreview: {DIAGNOSTIC_INFO.keyPreview}</Text>
        </View>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={configErrorStyles.container}>
        <Text style={[configErrorStyles.title, { color: '#10B981' }]}>Starting...</Text>
        <Text style={configErrorStyles.message}>Initializing app...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: '#121212' }
    }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const configErrorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#EF4444',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  diagnosticBox: {
    marginTop: 32,
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    width: '100%',
  },
  diagnosticTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10B981',
    marginBottom: 12,
  },
  diagnosticText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace' as const,
    marginBottom: 6,
  },
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UserContext>
          <TasksContext>
            <BrandsContext>
              <AgentsContext>
                <CultureContext>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <StatusBar style="light" />
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </CultureContext>
              </AgentsContext>
            </BrandsContext>
          </TasksContext>
        </UserContext>
      </QueryClientProvider>
    </trpc.Provider>
  );
}