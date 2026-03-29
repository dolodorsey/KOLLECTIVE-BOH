import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
} from 'react-native';
import {
  Clock,
  Paperclip,
  Users,
  AlertCircle,
  CheckCircle,
  Archive,
  UserPlus,
  Bot,
  Play,
  Pause,
  MoreHorizontal,
  Calendar,
  Filter,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-react-native';
import { format, parseISO, differenceInHours, isAfter } from 'date-fns';

import { PRIORITY_COLORS } from '@/constants/colors';
import { useTasks } from '@/hooks/tasks-context';
import { useBrands } from '@/hooks/brands-context';
import { useUser } from '@/hooks/user-context';
import { Task, TaskPriority } from '@/types/task';

type SortOption = 'urgency' | 'dueDate' | 'brand' | 'status';
type FilterOption = 'all' | 'urgent' | 'medium' | 'flexible' | 'agent-created';

interface TaskCardProps {
  task: Task;
  onExpand: (task: Task) => void;
  isExpanded: boolean;
}

interface CountdownRingProps {
  dueDate: string;
  priority: TaskPriority;
  size: number;
}



const CountdownRing: React.FC<CountdownRingProps> = ({ dueDate, priority, size }) => {
  const now = new Date();
  const due = parseISO(dueDate);
  const hoursLeft = differenceInHours(due, now);
  const isOverdue = isAfter(now, due);
  
  const urgencyLevel = useMemo(() => {
    if (isOverdue) return 'overdue';
    if (hoursLeft <= 2) return 'critical';
    if (hoursLeft <= 24) return 'urgent';
    if (hoursLeft <= 72) return 'warning';
    return 'normal';
  }, [hoursLeft, isOverdue]);

  const ringColor = useMemo(() => {
    switch (urgencyLevel) {
      case 'overdue': return '#FF0000';
      case 'critical': return '#FF4136';
      case 'urgent': return '#FF851B';
      case 'warning': return '#FFDC00';
      default: return PRIORITY_COLORS[priority];
    }
  }, [urgencyLevel, priority]);

  const progress = useMemo(() => {
    if (isOverdue) return 1;
    const totalHours = priority === 'urgent' ? 24 : priority === 'medium' ? 72 : 168;
    return Math.min(1, (totalHours - hoursLeft) / totalHours);
  }, [hoursLeft, priority, isOverdue]);



  return (
    <View style={[styles.countdownContainer, { width: size, height: size }]}>
      {Platform.OS !== 'web' ? (
        <Animated.View style={styles.ringContainer}>
          <View style={[styles.ringBackground, { width: size, height: size, borderRadius: size / 2 }]} />
          <View 
            style={[
              styles.ringProgress, 
              { 
                width: size, 
                height: size, 
                borderRadius: size / 2,
                borderColor: ringColor,
                transform: [{ rotate: `${progress * 360}deg` }]
              }
            ]} 
          />
        </Animated.View>
      ) : (
        <View style={[styles.webRing, { width: size, height: size, borderColor: ringColor }]} />
      )}
      <View style={styles.countdownText}>
        <Text style={[styles.timeLeft, { color: ringColor }]}>
          {isOverdue ? 'OVERDUE' : hoursLeft < 24 ? `${hoursLeft}h` : `${Math.ceil(hoursLeft / 24)}d`}
        </Text>
      </View>
    </View>
  );
};

const EnhancedTaskCard: React.FC<TaskCardProps> = ({ task, onExpand, isExpanded }) => {
  const { updateTaskStatus } = useTasks();
  const { brands } = useBrands();
  const { user } = useUser();
  
  const brand = brands.find(b => b.id === task.brandId);
  const priorityColor = PRIORITY_COLORS[task.priority];
  const brandColor = brand?.color || '#FFD700';
  
  const formattedDueDate = useMemo(() => {
    try {
      return format(parseISO(task.dueDate), 'MMM d, h:mm a');
    } catch {
      return 'Invalid date';
    }
  }, [task.dueDate]);

  const isOverdue = useMemo(() => {
    return isAfter(new Date(), parseISO(task.dueDate));
  }, [task.dueDate]);

  const handleComplete = useCallback(() => {
    updateTaskStatus(task.id, 'completed');
  }, [task.id, updateTaskStatus]);

  const handleArchive = useCallback(() => {
    updateTaskStatus(task.id, 'archived');
  }, [task.id, updateTaskStatus]);

  const canControlAgents = user?.role === 'Super Admin' || user?.role === 'Inner Circle' || user?.role === 'Brand Lead';

  return (
    <TouchableOpacity 
      style={[
        styles.taskCard, 
        { borderLeftColor: brandColor },
        isOverdue && styles.overdueCard,
        task.priority === 'urgent' && styles.urgentGlow
      ]} 
      onPress={() => onExpand(task)}
      testID={`task-card-${task.id}`}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <CountdownRing dueDate={task.dueDate} priority={task.priority} size={48} />
          
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
            
            <View style={styles.taskMeta}>
              <View style={styles.brandTag}>
                <Text style={styles.brandEmoji}>{brand?.mascot}</Text>
                <Text style={[styles.brandName, { color: brandColor }]}>{brand?.name}</Text>
              </View>
              
              {task.agentOrigin && (
                <View style={styles.agentTag}>
                  <Bot size={12} color="#FFD700" />
                  <Text style={styles.agentText}>{task.agentOrigin}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.taskActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={handleComplete}>
            <CheckCircle size={20} color="#2ECC40" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={handleArchive}>
            <Archive size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <MoreHorizontal size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.taskDetails}>
        <View style={styles.detailRow}>
          <Clock size={14} color="#aaa" />
          <Text style={[styles.detailText, isOverdue && styles.overdueText]}>
            {formattedDueDate}
          </Text>
        </View>
        
        {task.attachments.length > 0 && (
          <View style={styles.detailRow}>
            <Paperclip size={14} color="#aaa" />
            <Text style={styles.detailText}>{task.attachments.length} files</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Target size={14} color={priorityColor} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {task.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      {task.collaborators.length > 0 && (
        <View style={styles.collaboratorsRow}>
          <Users size={14} color="#aaa" />
          <View style={styles.avatarStack}>
            {task.collaborators.slice(0, 3).map((collaborator, index) => (
              <View 
                key={collaborator.id} 
                style={[styles.avatar, { zIndex: 10 - index, marginLeft: index > 0 ? -8 : 0 }]}
              >
                {collaborator.profileImage ? (
                  <Image source={{ uri: collaborator.profileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{collaborator.name.charAt(0)}</Text>
                  </View>
                )}
              </View>
            ))}
            {task.collaborators.length > 3 && (
              <View style={[styles.avatar, { zIndex: 7, marginLeft: -8 }]}>
                <View style={styles.avatarMore}>
                  <Text style={styles.avatarText}>+{task.collaborators.length - 3}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {task.agentOrigin && canControlAgents && (
        <View style={styles.agentControls}>
          <TouchableOpacity style={styles.agentButton}>
            <Play size={14} color="#2ECC40" />
            <Text style={styles.agentButtonText}>Trigger Agent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.agentButton}>
            <Pause size={14} color="#FF851B" />
            <Text style={styles.agentButtonText}>Pause</Text>
          </TouchableOpacity>
        </View>
      )}

      {task.automationTrail && task.automationTrail.length > 0 && (
        <View style={styles.automationTrail}>
          <AlertCircle size={12} color="#FFD700" />
          <Text style={styles.trailText}>
            {task.automationTrail[task.automationTrail.length - 1]}
          </Text>
        </View>
      )}

      {isExpanded && (
        <View style={styles.expandedContent}>
          {task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}
          
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <UserPlus size={16} color="#FFD700" />
              <Text style={styles.quickActionText}>Add Collaborator</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Paperclip size={16} color="#FFD700" />
              <Text style={styles.quickActionText}>Upload File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Calendar size={16} color="#FFD700" />
              <Text style={styles.quickActionText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MissionHQ: React.FC = () => {
  const { tasks, isLoading } = useTasks();
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<SortOption>('urgency');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => task.status !== 'completed' && task.status !== 'archived');
    
    // Apply filters
    switch (filterBy) {
      case 'urgent':
        filtered = filtered.filter(task => task.priority === 'urgent');
        break;
      case 'medium':
        filtered = filtered.filter(task => task.priority === 'medium');
        break;
      case 'flexible':
        filtered = filtered.filter(task => task.priority === 'flexible');
        break;
      case 'agent-created':
        filtered = filtered.filter(task => task.agentOrigin);
        break;
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          const priorityOrder = { urgent: 3, medium: 2, flexible: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'brand':
          return a.brandId.localeCompare(b.brandId);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [tasks, sortBy, filterBy]);

  const missionStats = useMemo(() => {
    const activeTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'archived');
    const urgentTasks = activeTasks.filter(task => task.priority === 'urgent');
    const overdueTasks = activeTasks.filter(task => isAfter(new Date(), parseISO(task.dueDate)));
    const agentTasks = activeTasks.filter(task => task.agentOrigin);
    
    return {
      total: activeTasks.length,
      urgent: urgentTasks.length,
      overdue: overdueTasks.length,
      agentAssisted: agentTasks.length,
    };
  }, [tasks]);

  const handleTaskExpand = useCallback((task: Task) => {
    setExpandedTask(expandedTask === task.id ? null : task.id);
  }, [expandedTask]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Zap size={32} color="#FFD700" />
        <Text style={styles.loadingText}>Loading Mission Control...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Target size={24} color="#FFD700" />
          <Text style={styles.title}>MY MISSION HQ</Text>
          <TrendingUp size={20} color="#2ECC40" />
        </View>
        
        <Text style={styles.subtitle}>
          Welcome back, {user?.name} • {user?.rank || 'Operative'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{missionStats.total}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, styles.urgentStat]}>
          <Text style={styles.statNumber}>{missionStats.urgent}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={[styles.statCard, styles.overdueStat]}>
          <Text style={styles.statNumber}>{missionStats.overdue}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{missionStats.agentAssisted}</Text>
          <Text style={styles.statLabel}>AI-Assisted</Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {(['all', 'urgent', 'medium', 'flexible', 'agent-created'] as FilterOption[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, filterBy === filter && styles.activeFilterChip]}
              onPress={() => setFilterBy(filter)}
            >
              <Text style={[styles.filterText, filterBy === filter && styles.activeFilterText]}>
                {filter.replace('-', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => {
            const options: SortOption[] = ['urgency', 'dueDate', 'brand', 'status'];
            const currentIndex = options.indexOf(sortBy);
            setSortBy(options[(currentIndex + 1) % options.length]);
          }}
        >
          <Filter size={16} color="#FFD700" />
          <Text style={styles.sortText}>{sortBy.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.tasksList} 
        contentContainerStyle={styles.tasksContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredAndSortedTasks.length > 0 ? (
          filteredAndSortedTasks.map((task) => (
            <EnhancedTaskCard
              key={task.id}
              task={task}
              onExpand={handleTaskExpand}
              isExpanded={expandedTask === task.id}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#2ECC40" />
            <Text style={styles.emptyTitle}>Mission Complete!</Text>
            <Text style={styles.emptySubtitle}>
              {filterBy === 'all' 
                ? 'No active missions. Outstanding work!' 
                : `No ${filterBy} missions found.`
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  urgentStat: {
    borderWidth: 1,
    borderColor: '#FF4136',
  },
  overdueStat: {
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtersScroll: {
    flex: 1,
  },
  filterChip: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#000',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  sortText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 4,
    fontWeight: '600',
  },
  tasksList: {
    flex: 1,
  },
  tasksContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderColor: '#FF0000',
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  urgentGlow: {
    shadowColor: '#FF4136',
    shadowOpacity: 0.5,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  brandTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  brandEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
  },
  agentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  agentText: {
    fontSize: 10,
    color: '#FFD700',
    marginLeft: 4,
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 4,
  },
  taskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 6,
  },
  overdueText: {
    color: '#FF0000',
    fontWeight: '600',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  collaboratorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  avatarMore: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  agentControls: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  agentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  agentButtonText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  automationTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  trailText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 6,
    flex: 1,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 6,
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
    color: '#2ECC40',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  countdownContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    position: 'absolute',
  },
  ringBackground: {
    borderWidth: 2,
    borderColor: '#333',
    position: 'absolute',
  },
  ringProgress: {
    borderWidth: 2,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
  },
  webRing: {
    borderWidth: 2,
    borderRadius: 24,
    position: 'absolute',
  },
  countdownText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLeft: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MissionHQ;