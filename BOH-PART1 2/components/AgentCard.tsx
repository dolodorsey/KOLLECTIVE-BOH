import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { Agent, AgentStatus } from '@/types/agent';

interface AgentCardProps {
  agent: Agent;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getStatusColor = (status: AgentStatus): string => {
    switch (status) {
      case 'active':
        return '#2ECC40';
      case 'paused':
        return '#FFDC00';
      case 'failed':
        return '#FF4136';
      default:
        return '#aaa';
    }
  };
  
  const handlePress = () => {
    // In a real app, this would open agent details or controls
    console.log(`Open agent ${agent.name} controls`);
  };
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      testID={`agent-card-${agent.id}`}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>{agent.avatar}</Text>
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor(agent.status) }
          ]} 
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{agent.name}</Text>
        <Text style={styles.stats}>{agent.completedTasks} tasks completed</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 24,
    width: 40,
    height: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    bottom: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  stats: {
    color: '#aaa',
    fontSize: 12,
  },
});

export default AgentCard;