import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { trpc, trpcClient } from "@/lib/trpc";
import { AuthContext } from "@/hooks/auth-context";
import { BrandsContext } from "@/hooks/brands-context";
import { AgentsContext } from "@/hooks/agents-context";
import { TasksProvider } from "@/hooks/tasks-context";
import { CultureContext } from "@/hooks/culture-context";

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#121212' }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(owner)" options={{ headerShown: false }} />
      <Stack.Screen name="(team)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthContext>
            <BrandsContext>
              <AgentsContext>
                <TasksProvider>
                  <CultureContext>
                    <StatusBar style="light" />
                    <RootLayoutNav />
                  </CultureContext>
                </TasksProvider>
              </AgentsContext>
            </BrandsContext>
          </AuthContext>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}