import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Bot,
  Calendar,
  ArrowRight,
  Zap,
} from 'lucide-react-native';

import { useUser } from '@/hooks/user-context';
import { useBrands } from '@/hooks/brands-context';
import { useTasks } from '@/hooks/tasks-context';
import { useAgents } from '@/hooks/agents-context';
import { Brand } from '@/types/brand';

interface EntityTileProps {
  brand: Brand;
  taskCompletion: number;
  activeAgents: number;
  recentUploads: number;
  status: 'good' | 'warning' | 'critical';
  onPress: () => void;
}

const EntityTile: React.FC<EntityTileProps> = ({
  brand,
  taskCompletion,
  activeAgents,
  recentUploads,
  status,
  onPress,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return '#2ECC40';
      case 'warning':
        return '#FFDC00';
      case 'critical':
        return '#FF4136';
      default:
        return '#666';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle size={16} color="#2ECC40" />;
      case 'warning':
        return <AlertTriangle size={16} color="#FFDC00" />;
      case 'critical':
        return <AlertTriangle size={16} color="#FF4136" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.entityTile,
        { borderColor: getStatusColor() }
      ]} 
      onPress={onPress}
    >
      {/* Status Pulse Border */}
      <View style={[styles.statusPulse, { borderColor: getStatusColor() }]} />
      
      {/* Header */}
      <View style={styles.tileHeader}>
        <View style={styles.brandInfo}>
          <Text style={styles.mascot}>{brand.mascot}</Text>
          <Text style={[styles.brandName, { color: brand.color }]}>
            {brand.name}
          </Text>
        </View>
        
        <View style={styles.statusIndicator}>
          {getStatusIcon()}
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{taskCompletion}%</Text>
          <Text style={styles.metricLabel}>Tasks</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${taskCompletion}%`,
                  backgroundColor: brand.color 
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{activeAgents}</Text>
          <Text style={styles.metricLabel}>Active Agents</Text>
          <Bot size={12} color={brand.color} />
        </View>
        
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{recentUploads}</Text>
          <Text style={styles.metricLabel}>Recent Uploads</Text>
          <TrendingUp size={12} color={brand.color} />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Calendar size={14} color="#666" />
          <Text style={styles.quickActionText}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction}>
          <Users size={14} color="#666" />
          <Text style={styles.quickActionText}>Team</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.accessButton, { backgroundColor: brand.color }]}
          onPress={onPress}
        >
          <Text style={styles.accessButtonText}>Access Hub</Text>
          <ArrowRight size={14} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Opportunity Alert */}
      {status === 'warning' && (
        <View style={styles.opportunityAlert}>
          <Zap size={12} color="#FFDC00" />
          <Text style={styles.opportunityText}>Join Campaign - Help Needed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const EntityHubSnapshots: React.FC = () => {
  const { user } = useUser();
  const { brands } = useBrands();
  const { tasks } = useTasks();
  const { agents } = useAgents();

  // Filter brands based on user permissions
  const userBrands = useMemo(() => {
    if (!user) return [];
    
    return brands.filter(brand => 
      user.assignedBrands?.includes(brand.id) ||
      user.role === 'Super Admin' ||
      user.role === 'Inner Circle'
    );
  }, [brands, user]);

  // Calculate metrics for each brand
  const brandMetrics = useMemo(() => {
    return userBrands.map(brand => {
      const brandTasks = tasks.filter(task => task.brandId === brand.id);
      const completedTasks = brandTasks.filter(task => task.status === 'completed');
      const taskCompletion = brandTasks.length > 0 
        ? Math.round((completedTasks.length / brandTasks.length) * 100)
        : 0;
      
      const brandAgents = agents.filter(agent => agent.brandId === brand.id);
      const activeAgents = brandAgents.filter(agent => agent.status === 'active').length;
      
      // Mock recent uploads (would come from real data)
      const recentUploads = Math.floor(Math.random() * 10) + 1;
      
      // Determine status based on metrics
      let status: 'good' | 'warning' | 'critical' = 'good';
      if (taskCompletion < 50) {
        status = 'critical';
      } else if (taskCompletion < 80 || activeAgents === 0) {
        status = 'warning';
      }
      
      return {
        brand,
        taskCompletion,
        activeAgents,
        recentUploads,
        status,
      };
    });
  }, [userBrands, tasks, agents]);

  const handleBrandPress = (brandId: string) => {
    console.log(`Navigate to ${brandId} hub`);
  };

  if (userBrands.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Building2 size={24} color="#FFD700" />
            <Text style={styles.title}>ENTITY HUB</Text>
          </View>
          
          <Text style={styles.subtitle}>
            No entities assigned to your role
          </Text>
        </View>
        
        <View style={styles.emptyState}>
          <Building2 size={48} color="#666" />
          <Text style={styles.emptyTitle}>No Access</Text>
          <Text style={styles.emptySubtitle}>
            Contact your administrator for entity access
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Building2 size={24} color="#FFD700" />
          <Text style={styles.title}>ENTITY HUB SNAPSHOTS</Text>
        </View>
        
        <Text style={styles.subtitle}>
          {userBrands.length} entities • Permission-based access
        </Text>
      </View>

      {/* Entity Grid */}
      <ScrollView 
        style={styles.entityGrid}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
      >
        <View style={styles.tilesContainer}>
          {brandMetrics.map(({ brand, taskCompletion, activeAgents, recentUploads, status }) => (
            <EntityTile
              key={brand.id}
              brand={brand}
              taskCompletion={taskCompletion}
              activeAgents={activeAgents}
              recentUploads={recentUploads}
              status={status}
              onPress={() => handleBrandPress(brand.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 36,
  },
  entityGrid: {
    flex: 1,
  },
  gridContent: {
    paddingBottom: 20,
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  entityTile: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  statusPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    borderWidth: 2,
    opacity: 0.3,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mascot: {
    fontSize: 24,
    marginRight: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusIndicator: {
    marginLeft: 8,
  },
  metricsGrid: {
    marginBottom: 16,
  },
  metric: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickActionText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  accessButtonText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold',
    marginRight: 4,
  },
  opportunityAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 220, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  opportunityText: {
    fontSize: 10,
    color: '#FFDC00',
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default EntityHubSnapshots;