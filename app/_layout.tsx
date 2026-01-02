import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { trpc, trpcClient } from "@/lib/trpc";
import { UserContext } from "@/hooks/user-context";
import { BrandsContext } from "@/hooks/brands-context";
import { AgentsContext } from "@/hooks/agents-context";
import { TasksContext } from "@/hooks/tasks-context";
import { CultureContext } from "@/hooks/culture-context";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack 
      initialRouteName="(tabs)"
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#121212' }
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <UserContext>
            <BrandsContext>
              <AgentsContext>
                <TasksContext>
                  <CultureContext>
                    <StatusBar style="light" />
                    <RootLayoutNav />
                  </CultureContext>
                </TasksContext>
              </AgentsContext>
            </BrandsContext>
          </UserContext>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}