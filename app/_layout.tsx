import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { trpc, trpcClient } from "@/lib/trpc";
import { AuthContext } from "@/hooks/auth-context";
import { BrandsContext } from "@/hooks/brands-context";
import { AgentsContext } from "@/hooks/agents-context";
import { TasksProvider } from "@/hooks/tasks-context";
import { CultureContext } from "@/hooks/culture-context";
import { ThemeProvider } from "@/src/ui/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

console.log('🔧 [React Query] Configured with retry: 2 for queries, 1 for mutations');

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
  console.log('✅ RootLayout mounted');
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    console.log('🔄 App booting...');
    const timer = setTimeout(() => {
      console.log('✅ Boot complete');
      setIsBooting(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isBooting) {
    return (
      <View style={bootStyles.container}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={bootStyles.text}>Booting…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
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
          </trpc.Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const bootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});