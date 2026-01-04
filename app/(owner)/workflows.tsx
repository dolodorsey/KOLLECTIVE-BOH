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
import { useWorkflowExecutions } from '@/hooks/webhooks-context';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Zap,
} from 'lucide-react-native';

type StatusFilter = 'all' | 'pending' | 'success' | 'failed' | 'timeout';

export default function WorkflowsScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { data: executions, isLoading, refetch } = useWorkflowExecutions(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="#00FF00" size={20} />;
      case 'failed':
        return <XCircle color="#FF4444" size={20} />;
      case 'pending':
        return <Clock color="#FFD700" size={20} />;
      case 'timeout':
        return <AlertCircle color="#FF8C00" size={20} />;
      default:
        return <Clock color="#999" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#00FF00';
      case 'failed':
        return '#FF4444';
      case 'pending':
        return '#FFD700';
      case 'timeout':
        return '#FF8C00';
      default:
        return '#999';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'success', label: 'Success' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'timeout', label: 'Timeout' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Zap color="#FFD700" size={28} />
          <Text style={styles.headerTitle}>Workflow Executions</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Real-time automation intelligence
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              statusFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Processing the vision...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
            />
          }
        >
          {executions && executions.length > 0 ? (
            executions.map((execution: any) => (
              <View key={execution.id} style={styles.executionCard}>
                <View style={styles.executionHeader}>
                  <View style={styles.executionTitleRow}>
                    {getStatusIcon(execution.status)}
                    <Text style={styles.executionWorkflow}>
                      {execution.webhook_registry?.workflow_name || 'Unknown'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(execution.status)}22`,
                        borderColor: getStatusColor(execution.status),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(execution.status) },
                      ]}
                    >
                      {execution.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.executionMeta}>
                  {execution.webhook_registry?.brand && (
                    <Text style={styles.metaText}>
                      Brand: {execution.webhook_registry.brand}
                    </Text>
                  )}
                  {execution.webhook_registry?.channel && (
                    <Text style={styles.metaText}>
                      Channel: {execution.webhook_registry.channel}
                    </Text>
                  )}
                </View>

                <View style={styles.executionStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Duration</Text>
                    <Text style={styles.statValue}>
                      {formatDuration(execution.execution_time_ms)}
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Executed</Text>
                    <Text style={styles.statValue}>
                      {formatDate(execution.created_at)}
                    </Text>
                  </View>
                </View>

                {execution.error_message && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      {execution.error_message}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Filter color="#666" size={48} />
              <Text style={styles.emptyText}>No executions found</Text>
              <Text style={styles.emptySubtext}>
                Workflows will appear here once executed
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFD700',
    fontStyle: 'italic',
  },
  filterContainer: {
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  filterTextActive: {
    color: '#000',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFD700',
    fontStyle: 'italic',
  },
  executionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  executionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  executionTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  executionWorkflow: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  executionMeta: {
    gap: 4,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#999',
  },
  executionStats: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#2A1515',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#FF8888',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
  },
});
