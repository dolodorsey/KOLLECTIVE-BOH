import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { trpc, trpcClient } from "@/lib/trpc";
import { UserContext } from "@/hooks/user-context";
import { TasksContext } from "@/hooks/tasks-context";
import { BrandsContext } from "@/hooks/brands-context";
import { AgentsContext } from "@/hooks/agents-context";
import { CultureContext } from "@/hooks/culture-context";
import { getSupabase, SUPABASE_CONFIG_OK } from "@/lib/supabase";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      console.log('🔐 Checking authentication...');

      if (!SUPABASE_CONFIG_OK) {
        console.error('❌ Supabase not configured');
        if (isMounted) {
          setIsReady(true);
          router.replace('/auth/login');
        }
        return;
      }

      try {
        const supabase = getSupabase();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Session error:', error);
          if (isMounted) {
            setIsReady(true);
            router.replace('/auth/login');
          }
          return;
        }

        if (!session) {
          console.log('⚠️ No session - redirecting to login');
          if (isMounted) {
            setIsReady(true);
            router.replace('/auth/login');
          }
        } else {
          console.log('✅ Session found - redirecting to app');
          if (isMounted) {
            setIsReady(true);
            router.replace('/(tabs)');
          }
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        if (isMounted) {
          setIsReady(true);
          router.replace('/auth/login');
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
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



const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
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