import { format, parseISO } from 'date-fns';
import { Clock, Paperclip, Users, AlertCircle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

import { PRIORITY_COLORS } from '@/constants/colors';
import { useTasks } from '@/hooks/tasks-context';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { updateTaskStatus } = useTasks();
  
  const priorityColor = PRIORITY_COLORS[task.priority];
  
  const formattedDueDate = useMemo(() => {
    try {
      return format(parseISO(task.dueDate), 'MMM d, h:mm a');
    } catch {
      return 'Invalid date';
    }
  }, [task.dueDate]);

  const handleComplete = () => {
    updateTaskStatus(task.id, 'completed');
  };

  const handleArchive = () => {
    updateTaskStatus(task.id, 'archived');
  };

  return (
    <View style={[styles.container, { borderLeftColor: priorityColor }]} testID={`task-card-${task.id}`}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        {task.agentOrigin && (
          <View style={styles.agentTag}>
            <Text style={styles.agentText}>{task.agentOrigin}</Text>
          </View>
        )}
      </View>
      
      {task.description && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      )}
      
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Clock size={16} color="#fff" />
          <Text style={styles.metaText}>{formattedDueDate}</Text>
        </View>
        
        {task.attachments.length > 0 && (
          <View style={styles.metaItem}>
            <Paperclip size={16} color="#fff" />
            <Text style={styles.metaText}>{task.attachments.length}</Text>
          </View>
        )}
        
        {task.collaborators.length > 0 && (
          <View style={styles.metaItem}>
            <Users size={16} color="#fff" />
            <Text style={styles.metaText}>{task.collaborators.length}</Text>
          </View>
        )}
        
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>
      </View>
      
      {task.collaborators.length > 0 && (
        <View style={styles.collaboratorsContainer}>
          {task.collaborators.slice(0, 3).map((collaborator, index) => (
            <View key={collaborator.id} style={[styles.avatarContainer, { zIndex: 10 - index, marginLeft: index > 0 ? -10 : 0 }]}>
              {collaborator.profileImage ? (
                <Image source={{ uri: collaborator.profileImage }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{collaborator.name.charAt(0)}</Text>
                </View>
              )}
            </View>
          ))}
          {task.collaborators.length > 3 && (
            <View style={[styles.avatarContainer, { zIndex: 7, marginLeft: -10 }]}>
              <View style={[styles.avatar, styles.avatarMore]}>
                <Text style={styles.avatarText}>+{task.collaborators.length - 3}</Text>
              </View>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.completeButton]} 
          onPress={handleComplete}
          testID={`complete-task-${task.id}`}
        >
          <Text style={styles.actionButtonText}>Complete</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.archiveButton]} 
          onPress={handleArchive}
          testID={`archive-task-${task.id}`}
        >
          <Text style={styles.actionButtonText}>Archive</Text>
        </TouchableOpacity>
      </View>
      
      {task.automationTrail && task.automationTrail.length > 0 && (
        <View style={styles.automationContainer}>
          <AlertCircle size={14} color="#aaa" />
          <Text style={styles.automationText}>{task.automationTrail[task.automationTrail.length - 1]}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  agentTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  agentText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    color: '#ccc',
    marginBottom: 12,
    fontSize: 14,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  collaboratorsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMore: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  completeButton: {
    backgroundColor: '#2ECC40',
  },
  archiveButton: {
    backgroundColor: '#555',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  automationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  automationText: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default TaskCard;