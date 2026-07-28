import { Tabs } from "expo-router";
import { LayoutDashboard, Building2, Users, User, Zap, Sparkles, ClipboardCheck } from "lucide-react-native";
import React from "react";

import { trpc } from "@/lib/trpc";

/**
 * Tabs are role-aware.
 *
 * Previously every signed-in user saw all seven owner tabs. The BOH roster has
 * one owner, three admins, one manager and eighteen staff — showing People,
 * Workflows and Compose to staff exposes surfaces they cannot act on.
 */
const ROLE_TABS: Record<string, string[]> = {
  owner:   ["dashboard", "operations", "entities", "people", "workflows", "compose", "profile"],
  admin:   ["dashboard", "operations", "entities", "people", "workflows", "compose", "profile"],
  manager: ["dashboard", "operations", "entities", "workflows", "compose", "profile"],
  staff:   ["dashboard", "entities", "profile"],
};

export default function OwnerLayout() {
  const { data: me } = trpc.roster.me.useQuery();
  const role = (me?.boh_role as string) ?? "staff";
  const allowed = ROLE_TABS[role] ?? ROLE_TABS.staff;
  const show = (name: string) => (allowed.includes(name) ? undefined : null);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFD700',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#333',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Command Center",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: "Operations",
          href: show("operations"),
          tabBarIcon: ({ color }) => <ClipboardCheck color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="entities"
        options={{
          title: "Entities",
          tabBarIcon: ({ color }) => <Building2 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "People",
          href: show("people"),
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="workflows"
        options={{
          title: "Workflows",
          href: show("workflows"),
          tabBarIcon: ({ color }) => <Zap color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: "Compose",
          href: show("compose"),
          tabBarIcon: ({ color }) => <Sparkles color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
