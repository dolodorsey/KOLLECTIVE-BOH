import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

import { trpc, trpcClient } from "@/lib/trpc";
import { UserContext } from "@/hooks/user-context";
import { TasksContext } from "@/hooks/tasks-context";
import { BrandsContext } from "@/hooks/brands-context";
import { AgentsContext } from "@/hooks/agents-context";
import { CultureContext } from "@/hooks/culture-context";
import { getSupabase, SUPABASE_CONFIG_OK } from "@/lib/supabase";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    console.log('🚀 RootLayoutNav mounted - Starting session check...');

    const checkSession = async () => {
      console.log('🔐 Checking authentication session...');
      
      if (!SUPABASE_CONFIG_OK) {
        console.error('❌ Supabase not configured');
        if (mounted) {
          setSession(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Session check error:', error);
          if (mounted) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        console.log('✅ Session check complete:', data.session ? 'Authenticated' : 'Not authenticated');
        if (mounted) {
          setSession(data.session);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Unexpected error checking session:', error);
        if (mounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      console.warn('⏰ TIMEOUT: Forcing loading to complete after 1.5 seconds');
      if (mounted) {
        setSession(null);
        setIsLoading(false);
      }
    }, 1500);

    checkSession().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      console.log('🔄 No session, redirecting to login');
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      console.log('🔄 Session exists, redirecting to app');
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: '#121212' }
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}



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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
});