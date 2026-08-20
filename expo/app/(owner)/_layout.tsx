import { Tabs } from "expo-router";
import { Home, ListChecks, CalendarDays, BellRing, MoreHorizontal } from "lucide-react-native";
import React from "react";

const GOLD = '#E0A700';

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: '#7E7A72',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B0B0B',
          borderTopColor: '#25231F',
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Home", tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="operations" options={{ title: "Execute", tabBarIcon: ({ color }) => <ListChecks color={color} size={22} /> }} />
      <Tabs.Screen name="workflows" options={{ title: "Calendar", tabBarIcon: ({ color }) => <CalendarDays color={color} size={22} /> }} />
      <Tabs.Screen name="compose" options={{ title: "Actions", tabBarIcon: ({ color }) => <BellRing color={color} size={22} /> }} />
      <Tabs.Screen name="entities" options={{ title: "More", tabBarIcon: ({ color }) => <MoreHorizontal color={color} size={22} /> }} />
      <Tabs.Screen name="people" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
