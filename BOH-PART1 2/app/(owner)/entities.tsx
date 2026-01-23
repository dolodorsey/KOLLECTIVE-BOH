import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { trpc } from '@/lib/trpc';
import { computeHealth } from '@/src/utils/health';

export default function EntitiesScreen() {
  const { activeOrgId } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: entities, isLoading } = trpc.entities.list.useQuery({
    search: searchQuery,
    status: filterStatus,
  });

  const filteredEntities = (entities || []).map((e: any) => ({
    ...e,
    health: computeHealth(e),
  }));

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

          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Search size={18} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search entities..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {['all', 'active', 'inactive', 'archived'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    filterStatus === status && styles.filterChipActive,
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filterStatus === status && styles.filterChipTextActive,
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : filteredEntities.length === 0 ? (
            <View style={styles.content}>
              <Text style={styles.emptyText}>No entities yet</Text>
              <Text style={styles.emptySubtext}>
                Entity management for org {activeOrgId?.slice(0, 8)}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredEntities.map((entity) => (
                <View key={entity.id} style={styles.entityCard}>
                  <View style={styles.entityHeader}>
                    <Text style={styles.entityName}>{entity.name}</Text>
                    <View style={styles.badges}>
                      <View style={[
                        styles.healthBadge,
                        entity.health === 'healthy' && styles.healthHealthy,
                        entity.health === 'watch' && styles.healthWatch,
                        entity.health === 'down' && styles.healthDown,
                        entity.health === 'paused' && styles.healthPaused,
                      ]}>
                        <Text style={styles.healthText}>{entity.health}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        entity.status === 'active' && styles.statusActive,
                        entity.status === 'inactive' && styles.statusInactive,
                      ]}>
                        <Text style={styles.statusText}>{entity.status}</Text>
                      </View>
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
    paddingBottom: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 12,
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FFD700',
  },
  filterChipText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#000',
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
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  healthHealthy: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  healthWatch: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  healthDown: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  healthPaused: {
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
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
