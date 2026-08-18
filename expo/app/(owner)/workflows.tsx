import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { CheckCircle, XCircle, Clock, AlertCircle, Filter, Zap } from 'lucide-react-native';

type StatusFilter = 'all' | 'pending' | 'running' | 'completed' | 'skipped' | 'failed';

export default function ExecutionsScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: runs, isLoading: runsLoading, refetch } = trpc.executions.runs.useQuery();
  const { data: definitions, isLoading: definitionsLoading } = trpc.executions.definitions.useQuery();

  const executionRuns = runs || [];
  const executions = executionRuns.filter((run: any) =>
    statusFilter === 'all' ? true : run.status === statusFilter
  );
  const isLoading = runsLoading || definitionsLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="#00FF88" size={20} />;
      case 'failed':
        return <XCircle color="#FF4444" size={20} />;
      case 'skipped':
        return <AlertCircle color="#FF8C00" size={20} />;
      case 'running':
        return <Zap color="#4DA3FF" size={20} />;
      default:
        return <Clock color="#FFD700" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00FF88';
      case 'failed': return '#FF4444';
      case 'skipped': return '#FF8C00';
      case 'running': return '#4DA3FF';
      default: return '#FFD700';
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'running', label: 'Running' },
    { key: 'completed', label: 'Completed' },
    { key: 'skipped', label: 'Skipped' },
    { key: 'failed', label: 'Failed' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Zap color="#FFD700" size={28} />
          <Text style={styles.headerTitle}>Execution Queue</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {definitions?.length || 0} live channel plans · direct BOH execution
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterButton, statusFilter === filter.key && styles.filterButtonActive]}
            onPress={() => setStatusFilter(filter.key)}
          >
            <Text style={[styles.filterText, statusFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading current execution state…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
        >
          {executions.length ? (
            executions.map((execution: any) => (
              <View key={execution.id} style={styles.executionCard}>
                <View style={styles.executionHeader}>
                  <View style={styles.executionTitleRow}>
                    {getStatusIcon(execution.status)}
                    <View style={styles.titleBlock}>
                      <Text style={styles.executionTitle}>{execution.execution_name || 'Untitled execution'}</Text>
                      <Text style={styles.entityText}>
                        {execution.entity?.entity_name || 'Enterprise'} · {execution.channel || 'channel'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: getStatusColor(execution.status) }]}> 
                    <Text style={[styles.statusText, { color: getStatusColor(execution.status) }]}>
                      {String(execution.status || 'pending').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.executionStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Scheduled</Text>
                    <Text style={styles.statValue}>{formatDate(execution.scheduled_at)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Approval</Text>
                    <Text style={styles.statValue}>{execution.approval_status || 'N/A'}</Text>
                  </View>
                </View>

                {execution.result_summary ? (
                  <Text style={styles.resultText}>{execution.result_summary}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Filter color="#666" size={48} />
              <Text style={styles.emptyText}>No executions found</Text>
              <Text style={styles.emptySubtext}>Current BOH channel-plan executions will appear here.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#FFD700' },
  filterContainer: { backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#333', maxHeight: 70 },
  filterContent: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333' },
  filterButtonActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#999' },
  filterTextActive: { color: '#000' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: '#FFD700' },
  executionCard: { marginHorizontal: 20, marginTop: 16, padding: 16, backgroundColor: '#121212', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  executionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  executionTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleBlock: { flex: 1 },
  executionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  entityText: { marginTop: 4, fontSize: 12, color: '#999' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800' },
  executionStats: { flexDirection: 'row', gap: 16 },
  stat: { flex: 1 },
  statLabel: { fontSize: 10, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 13, color: '#DDD' },
  resultText: { marginTop: 12, color: '#BBB', fontSize: 13, lineHeight: 18 },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 30 },
  emptyText: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#FFF' },
  emptySubtext: { marginTop: 8, textAlign: 'center', color: '#777', lineHeight: 20 },
});
