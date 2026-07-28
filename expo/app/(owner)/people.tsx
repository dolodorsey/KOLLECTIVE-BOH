import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trpc } from '@/lib/trpc';

const ROLE_ORDER = ['owner', 'admin', 'manager', 'staff'] as const;
const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};

/** The real BOH roster, grouped by permission tier. */
export default function PeopleScreen() {
  const { data: roster, isLoading } = trpc.roster.list.useQuery();

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    members: (roster ?? []).filter((m: any) => m.boh_role === role),
  })).filter((g) => g.members.length > 0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>People</Text>
            <Text style={styles.subtitle}>
              {roster ? `${roster.length} on the roster` : 'Team roster and roles'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.content}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : grouped.length === 0 ? (
            <View style={styles.content}>
              <Text style={styles.emptyText}>No roster records</Text>
              <Text style={styles.emptySubtext}>Nobody is on the BOH roster yet.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {grouped.map((group) => (
                <View key={group.role} style={styles.group}>
                  <Text style={styles.groupTitle}>
                    {ROLE_LABEL[group.role]} · {group.members.length}
                  </Text>
                  {group.members.map((m: any) => (
                    <View key={m.member_code ?? m.full_name} style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <Text style={styles.memberName}>{m.preferred_name || m.full_name}</Text>
                        <View style={[styles.roleBadge, styles[`role_${group.role}` as keyof typeof styles] as object]}>
                          <Text style={styles.roleText}>{ROLE_LABEL[group.role]}</Text>
                        </View>
                      </View>
                      {m.role_title ? <Text style={styles.memberTitle}>{m.role_title}</Text> : null}
                      {m.primary_brand ? (
                        <Text style={styles.memberBrand}>{m.primary_brand.replace(/_/g, ' ')}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFD700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#999' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 400 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#555' },
  listContainer: { padding: 16 },
  group: { marginBottom: 24 },
  groupTitle: {
    fontSize: 13, fontWeight: '700', color: '#888',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4,
  },
  memberCard: {
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#262626',
  },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberName: { fontSize: 17, fontWeight: '700', color: '#FFF', flex: 1 },
  memberTitle: { fontSize: 13, color: '#BBB', marginTop: 6 },
  memberBrand: { fontSize: 12, color: '#777', marginTop: 4, textTransform: 'capitalize' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#333' },
  roleText: { fontSize: 11, fontWeight: '700', color: '#EEE' },
  role_owner: { backgroundColor: '#7A5C00' },
  role_admin: { backgroundColor: '#3D4A6B' },
  role_manager: { backgroundColor: '#2F5D46' },
  role_staff: { backgroundColor: '#333' },
});
