import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { trpc, trpcClient } from "@/lib/trpc";
import { UserContext } from "@/hooks/user-context";
import { TasksContext } from "@/hooks/tasks-context";
import { BrandsContext } from "@/hooks/brands-context";
import { AgentsContext } from "@/hooks/agents-context";
import { CultureContext } from "@/hooks/culture-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 Bypassing auth - navigating directly to tabs');
    router.replace('/(tabs)');
  }, [router]);

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