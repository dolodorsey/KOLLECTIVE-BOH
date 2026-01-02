import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Target,
  Clock,
  CheckCircle,
  BarChart3,
  List,
  Grid3X3,
  TrendingUp,
  Zap,
  Users,
  Bot,
  Calendar,
  ArrowRight,
} from 'lucide-react-native';

import { useTasks } from '@/hooks/tasks-context';
import { useBrands } from '@/hooks/brands-context';
import { useUser } from '@/hooks/user-context';
import { Task } from '@/types/task';
import { PRIORITY_COLORS } from '@/constants/colors';

type ViewMode = 'list' | 'kanban';

interface PriorityTaskProps {
  task: Task;
  rank: number;
  onPress: () => void;
}

const PriorityTask: React.FC<PriorityTaskProps> = ({ task, rank, onPress }) => {
  const { brands } = useBrands();
  const brand = brands.find(b => b.id === task.brandId);
  
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#666';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  return (
    <TouchableOpacity style={styles.priorityTask} onPress={onPress}>
      <View style={styles.priorityRank}>
        <Text style={[styles.rankText, { color: getRankColor(rank) }]}>
          {getRankIcon(rank)}
        </Text>
      </View>
      
      <View style={styles.priorityContent}>
        <Text style={styles.priorityTitle} numberOfLines={2}>
          {task.title}
        </Text>
        
        <View style={styles.priorityMeta}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandEmoji}>{brand?.mascot}</Text>
            <Text style={[styles.brandText, { color: brand?.color }]}>
              {brand?.name}
            </Text>
          </View>
          
          <View style={styles.dueBadge}>
            <Clock size={12} color="#FF851B" />
            <Text style={styles.dueText}>
              {new Date(task.dueDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        {task.collaborators.length > 0 && (
          <View style={styles.collaborators}>
            <Users size={12} color="#aaa" />
            <Text style={styles.collaboratorCount}>
              {task.collaborators.length} collaborators
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.priorityActions}>
        <View style={[styles.priorityIndicator, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
        <ArrowRight size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );
};

const MissionControl: React.FC = () => {
  const { tasks } = useTasks();
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Get top 3 AI-prioritized tasks
  const topPriorities = useMemo(() => {
    const activeTasks = tasks.filter(task => 
      task.status !== 'completed' && task.status !== 'archived'
    );
    
    // AI prioritization logic (simplified)
    return activeTasks
      .sort((a, b) => {
        // Priority weight
        const priorityWeight = { urgent: 3, medium: 2, flexible: 1 };
        const aPriority = priorityWeight[a.priority];
        const bPriority = priorityWeight[b.priority];
        
        // Due date weight
        const now = new Date().getTime();
        const aDue = new Date(a.dueDate).getTime();
        const bDue = new Date(b.dueDate).getTime();
        const aUrgency = Math.max(0, (now - aDue) / (1000 * 60 * 60 * 24)); // Days overdue
        const bUrgency = Math.max(0, (now - bDue) / (1000 * 60 * 60 * 24));
        
        // Combined score
        const aScore = aPriority * 10 + aUrgency * 5;
        const bScore = bPriority * 10 + bUrgency * 5;
        
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [tasks]);

  // Performance tracking
  const performanceStats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= todayStart && taskDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    });
    
    const completedToday = todayTasks.filter(task => task.status === 'completed').length;
    const totalToday = todayTasks.length;
    const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
    
    const streak = 0;
    
    return {
      completionPercentage,
      completedToday,
      totalToday,
      streak,
    };
  }, [tasks]);

  const handleTaskPress = useCallback((task: Task) => {
    console.log('Navigate to task detail:', task.id);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Target size={24} color="#FFD700" />
          <Text style={styles.title}>MISSION CONTROL</Text>
          <TrendingUp size={20} color="#2ECC40" />
        </View>
        
        <Text style={styles.subtitle}>
          Your personal execution zone • {user?.rank || 'Operative'}
        </Text>
      </View>

      {/* Performance Tracking */}
      <View style={styles.performanceSection}>
        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <BarChart3 size={20} color="#FFD700" />
            <Text style={styles.performanceTitle}>Today&apos;s Performance</Text>
          </View>
          
          <View style={styles.performanceStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{performanceStats.completionPercentage}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{performanceStats.completedToday}/{performanceStats.totalToday}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Zap size={16} color="#FFD700" />
              <Text style={styles.statValue}>{performanceStats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${performanceStats.completionPercentage}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Top 3 Priorities */}
      <View style={styles.prioritiesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top 3 Priorities (AI-Prioritized)</Text>
          
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
              onPress={() => setViewMode('list')}
            >
              <List size={16} color={viewMode === 'list' ? '#000' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'kanban' && styles.activeToggle]}
              onPress={() => setViewMode('kanban')}
            >
              <Grid3X3 size={16} color={viewMode === 'kanban' ? '#000' : '#666'} />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.prioritiesList} showsVerticalScrollIndicator={false}>
          {topPriorities.length > 0 ? (
            topPriorities.map((task, index) => (
              <PriorityTask
                key={task.id}
                task={task}
                rank={index + 1}
                onPress={() => handleTaskPress(task)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Target size={48} color="#666" />
              <Text style={styles.emptyTitle}>
                {tasks.length === 0 ? 'No Tasks Yet' : 'All Clear!'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tasks.length === 0 
                  ? 'Tasks will appear here when they are assigned to you'
                  : 'No urgent priorities. Great work!'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Task Actions */}
      <View style={styles.actionsSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.actionButton}>
            <CheckCircle size={20} color="#2ECC40" />
            <Text style={styles.actionText}>Mark Complete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Users size={20} color="#FFD700" />
            <Text style={styles.actionText}>Request Assistance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Bot size={20} color="#FF851B" />
            <Text style={styles.actionText}>Delegate to Rork</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Calendar size={20} color="#0074D9" />
            <Text style={styles.actionText}>Reschedule</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 12,
    marginRight: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 36,
  },
  performanceSection: {
    marginBottom: 24,
  },
  performanceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  performanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  prioritiesSection: {
    flex: 1,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#FFD700',
  },
  prioritiesList: {
    flex: 1,
  },
  priorityTask: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  priorityRank: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  priorityContent: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  priorityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  brandEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueText: {
    fontSize: 12,
    color: '#FF851B',
    marginLeft: 4,
  },
  collaborators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collaboratorCount: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 4,
  },
  priorityActions: {
    alignItems: 'center',
    marginLeft: 12,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  actionsSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ECC40',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default MissionControl;