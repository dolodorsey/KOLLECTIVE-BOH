import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Session } from "@supabase/supabase-js";
import { View, Text, StyleSheet } from "react-native";

import { trpc, trpcClient } from "@/lib/trpc";
import { getSupabase, SUPABASE_CONFIG_OK } from "@/lib/supabase";
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
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!SUPABASE_CONFIG_OK) {
      console.error('Supabase configuration missing');
      setLoading(false);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      console.log('No session, redirecting to login');
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      console.log('Session exists, redirecting to app');
      router.replace('/(tabs)');
    }
  }, [session, segments, loading, router]);

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
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
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