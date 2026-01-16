import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { trpc } from '@/lib/trpc';

export default function EntitiesScreen() {
  const { activeOrgId } = useAuth();
  const { data: entities, isLoading } = trpc.entities.list.useQuery();

  const entitiesList = entities || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Entities</Text>
            <Text style={styles.subtitle}>Manage your brands and ventures</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : entitiesList.length === 0 ? (
            <View style={styles.content}>
              <Text style={styles.emptyText}>No entities yet</Text>
              <Text style={styles.emptySubtext}>
                Entity management for org {activeOrgId?.slice(0, 8)}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {entitiesList.map((entity) => (
                <View key={entity.id} style={styles.entityCard}>
                  <View style={styles.entityHeader}>
                    <Text style={styles.entityName}>{entity.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      entity.status === 'active' && styles.statusActive,
                      entity.status === 'inactive' && styles.statusInactive,
                    ]}>
                      <Text style={styles.statusText}>{entity.status}</Text>
                    </View>
                  </View>
                  <View style={styles.entityMeta}>
                    <Text style={styles.entityType}>{entity.type}</Text>
                    <Text style={styles.entityDate}>{formatDate(entity.created_at)}</Text>
                  </View>
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#555',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  entityCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  entityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'capitalize',
  },
  entityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entityType: {
    fontSize: 14,
    color: '#FFD700',
    textTransform: 'capitalize',
  },
  entityDate: {
    fontSize: 12,
    color: '#666',
  },
});
