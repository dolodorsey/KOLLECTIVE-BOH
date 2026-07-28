import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trpc } from '@/lib/trpc';

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#8B2635',
  high: '#7A5C00',
  normal: '#2F4858',
  low: '#333',
};

const STATUS_LABEL: Record<string, string> = {
  queued: 'Queued',
  in_progress: 'In progress',
  scheduled: 'Scheduled',
  blocked: 'Blocked',
  delegated: 'Delegated',
  complete: 'Complete',
  cancelled: 'Cancelled',
};

/** The signed-in member's assigned work, read from the live task queue. */
export default function TeamTasksScreen() {
  const { data: me } = trpc.roster.me.useQuery();
  const assignee = me?.preferred_name ?? me?.full_name;

  const tasksQuery = trpc.tasks.list.useQuery(
    { assignee: assignee ?? undefined },
    { enabled: !!assignee }
  );

  const open = (tasksQuery.data ?? []).filter(
    (t: any) => t.status !== 'complete' && t.status !== 'cancelled'
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={tasksQuery.isFetching}
              onRefresh={() => tasksQuery.refetch()}
              tintColor="#FFD700"
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Tasks</Text>
            <Text style={styles.subtitle}>
              {me ? `Welcome back, ${me.preferred_name ?? me.full_name}` : 'Loading your roster record...'}
            </Text>
            {me?.boh_role ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{String(me.boh_role).toUpperCase()}</Text>
              </View>
            ) : null}
          </View>

          {!me ? (
            <View style={styles.content}>
              <Text style={styles.emptyText}>Not on the BOH roster</Text>
              <Text style={styles.emptySubtext}>
                This account is signed in but has no roster record. Ask an admin to add you.
              </Text>
            </View>
          ) : tasksQuery.isLoading ? (
            <View style={styles.content}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : open.length === 0 ? (
            <View style={styles.content}>
              <Text style={styles.emptyText}>Nothing assigned</Text>
              <Text style={styles.emptySubtext}>You have no open tasks right now.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <Text style={styles.countLine}>{open.length} open</Text>
              {open.map((t: any) => (
                <View key={t.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{t.title}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: PRIORITY_COLOR[t.priority] ?? '#333' },
                      ]}
                    >
                      <Text style={styles.priorityText}>{t.priority}</Text>
                    </View>
                  </View>

                  {t.description ? (
                    <Text style={styles.taskDesc} numberOfLines={3}>{t.description}</Text>
                  ) : null}

                  <View style={styles.taskMeta}>
                    {t.brand ? <Text style={styles.taskBrand}>{t.brand}</Text> : null}
                    <Text style={styles.taskStatus}>{STATUS_LABEL[t.status] ?? t.status}</Text>
                  </View>

                  {t.status === 'blocked' && t.blocker_reason ? (
                    <Text style={styles.blocker}>{t.blocker_reason}</Text>
                  ) : null}
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
  badge: {
    alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 12,
    paddingVertical: 5, borderRadius: 999, backgroundColor: '#262626',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFD700', letterSpacing: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 400 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#555', textAlign: 'center' },
  listContainer: { padding: 16 },
  countLine: {
    fontSize: 13, color: '#888', marginBottom: 12, marginLeft: 4,
    textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700',
  },
  taskCard: {
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#262626',
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1, marginRight: 10 },
  taskDesc: { fontSize: 13, color: '#BBB', marginTop: 8, lineHeight: 18 },
  taskMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  taskBrand: { fontSize: 12, color: '#777' },
  taskStatus: { fontSize: 12, color: '#999', fontWeight: '600' },
  blocker: { fontSize: 12, color: '#C77', marginTop: 8, fontStyle: 'italic' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  priorityText: { fontSize: 11, fontWeight: '700', color: '#EEE', textTransform: 'uppercase' },
});
