import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Calendar,
  MessageSquare,
  FileText,
  Bot,
  Building2,
  Plus,
  Upload,
  Users,
  Settings,
  Zap,
  Search,
  Clock,
} from 'lucide-react-native';

import { useUser } from '@/hooks/user-context';

interface ToolButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  isPrimary?: boolean;
  isDisabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  title,
  description,
  onPress,
  isPrimary = false,
  isDisabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.toolButton,
        isPrimary && styles.primaryButton,
        isDisabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <View style={styles.toolIcon}>
        {icon}
      </View>
      
      <View style={styles.toolContent}>
        <Text style={[
          styles.toolTitle,
          isPrimary && styles.primaryTitle,
          isDisabled && styles.disabledTitle,
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.toolDescription,
          isDisabled && styles.disabledDescription,
        ]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ToolsShortcutsPanel: React.FC = () => {
  const { user } = useUser();

  const handleToolPress = (tool: string) => {
    console.log(`Opening ${tool}`);
    // In a real app, this would navigate to the appropriate screen or trigger the action
  };

  const canAccessAgents = user?.role === 'Super Admin' || 
                         user?.role === 'Inner Circle' || 
                         user?.role === 'Brand Lead';

  const canAccessAllBrands = user?.role === 'Super Admin' || 
                            user?.role === 'Inner Circle';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Zap size={24} color="#FFD700" />
          <Text style={styles.title}>TOOLS & SHORTCUTS</Text>
        </View>
        
        <Text style={styles.subtitle}>
          One-click access to essential resources
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleToolPress('new-task')}
          >
            <Plus size={20} color="#FFD700" />
            <Text style={styles.quickActionText}>New Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleToolPress('upload')}
          >
            <Upload size={20} color="#FFD700" />
            <Text style={styles.quickActionText}>Upload File</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleToolPress('search')}
          >
            <Search size={20} color="#FFD700" />
            <Text style={styles.quickActionText}>Global Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => handleToolPress('schedule')}
          >
            <Clock size={20} color="#FFD700" />
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tools */}
      <ScrollView style={styles.toolsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Essential Tools</Text>
        
        <ToolButton
          icon={<Calendar size={24} color="#0074D9" />}
          title="Master Calendar"
          description="Syncs across all entities and user-specific events"
          onPress={() => handleToolPress('calendar')}
          isPrimary
        />
        
        <ToolButton
          icon={<MessageSquare size={24} color="#2ECC40" />}
          title="Messaging Hub"
          description="Direct messages and group discussions"
          onPress={() => handleToolPress('messages')}
          isPrimary
        />
        
        <ToolButton
          icon={<FileText size={24} color="#FF851B" />}
          title="Document Vault"
          description="SOPs, templates, contracts, and resources"
          onPress={() => handleToolPress('vault')}
          isPrimary
        />
        
        <ToolButton
          icon={<Bot size={24} color="#B10DC9" />}
          title="Rork Agent Console"
          description="Trigger and manage automations"
          onPress={() => handleToolPress('agents')}
          isDisabled={!canAccessAgents}
        />
        
        <ToolButton
          icon={<Building2 size={24} color="#FFD700" />}
          title="Brand Hub Access"
          description="Deep-dive into individual entity operations"
          onPress={() => handleToolPress('brands')}
        />
        
        <ToolButton
          icon={<Users size={24} color="#01FF70" />}
          title="Team Directory"
          description="Contact info and org chart"
          onPress={() => handleToolPress('team')}
        />
        
        <ToolButton
          icon={<Settings size={24} color="#666" />}
          title="Settings & Preferences"
          description="Customize your workspace experience"
          onPress={() => handleToolPress('settings')}
        />
      </ScrollView>

      {/* Role-Based Tools */}
      {(user?.role === 'Super Admin' || user?.role === 'Inner Circle') && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
          
          <View style={styles.adminTools}>
            <TouchableOpacity 
              style={styles.adminTool}
              onPress={() => handleToolPress('user-management')}
            >
              <Users size={16} color="#FF4136" />
              <Text style={styles.adminToolText}>User Management</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.adminTool}
              onPress={() => handleToolPress('system-logs')}
            >
              <FileText size={16} color="#FF4136" />
              <Text style={styles.adminToolText}>System Logs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.adminTool}
              onPress={() => handleToolPress('analytics')}
            >
              <Zap size={16} color="#FF4136" />
              <Text style={styles.adminToolText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recent Tools */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recently Used</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={styles.recentTool}
            onPress={() => handleToolPress('calendar')}
          >
            <Calendar size={16} color="#0074D9" />
            <Text style={styles.recentToolText}>Calendar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.recentTool}
            onPress={() => handleToolPress('vault')}
          >
            <FileText size={16} color="#FF851B" />
            <Text style={styles.recentToolText}>Vault</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.recentTool}
            onPress={() => handleToolPress('messages')}
          >
            <MessageSquare size={16} color="#2ECC40" />
            <Text style={styles.recentToolText}>Messages</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  quickActionsSection: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '23%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  quickActionText: {
    fontSize: 10,
    color: '#fff',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  toolsList: {
    flex: 1,
    marginBottom: 20,
  },
  toolButton: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryButton: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  primaryTitle: {
    color: '#FFD700',
  },
  disabledTitle: {
    color: '#666',
  },
  toolDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 18,
  },
  disabledDescription: {
    color: '#555',
  },
  adminSection: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  adminTools: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adminTool: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 65, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 65, 54, 0.3)',
  },
  adminToolText: {
    fontSize: 12,
    color: '#FF4136',
    marginLeft: 6,
    fontWeight: '600',
  },
  recentSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  recentTool: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  recentToolText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default ToolsShortcutsPanel;