import { Calendar, FileUp, Plus, Video, Users, Bot } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  testID?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, testID }) => {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} testID={testID}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const ActionPanel: React.FC = () => {
  const handleNewTask = () => {
    console.log('Create new task');
  };
  
  const handleUploadSOP = () => {
    console.log('Upload SOP');
  };
  
  const handleTriggerAgent = () => {
    console.log('Trigger agent');
  };
  
  const handleJoinZoom = () => {
    console.log('Join Zoom');
  };
  
  const handleAddCollaborator = () => {
    console.log('Add collaborator');
  };
  
  return (
    <View style={styles.container} testID="action-panel">
      <Text style={styles.title}>Quick Actions</Text>
      
      <View style={styles.actionsContainer}>
        <ActionButton 
          icon={<Plus color="#fff" size={24} />} 
          label="New Task" 
          onPress={handleNewTask}
          testID="new-task-button"
        />
        
        <ActionButton 
          icon={<FileUp color="#fff" size={24} />} 
          label="Upload SOP" 
          onPress={handleUploadSOP}
          testID="upload-sop-button"
        />
        
        <ActionButton 
          icon={<Bot color="#fff" size={24} />} 
          label="Trigger Agent" 
          onPress={handleTriggerAgent}
          testID="trigger-agent-button"
        />
        
        <ActionButton 
          icon={<Video color="#fff" size={24} />} 
          label="Join Zoom" 
          onPress={handleJoinZoom}
          testID="join-zoom-button"
        />
        
        <ActionButton 
          icon={<Users color="#fff" size={24} />} 
          label="Add Collaborator" 
          onPress={handleAddCollaborator}
          testID="add-collaborator-button"
        />
        
        <ActionButton 
          icon={<Calendar color="#fff" size={24} />} 
          label="Calendar" 
          onPress={() => console.log('Open calendar')}
          testID="calendar-button"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ActionPanel;