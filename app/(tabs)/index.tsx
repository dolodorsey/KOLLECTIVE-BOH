import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native';

import TopNavBar from '@/components/TopNavBar';
import HeroCommandStrip from '@/components/HeroCommandStrip';
import MissionControl from '@/components/MissionControl';
import KollectivePulse from '@/components/KollectivePulse';
import EntityHubSnapshots from '@/components/EntityHubSnapshots';
import LeaderboardIncentives from '@/components/LeaderboardIncentives';
import ToolsShortcutsPanel from '@/components/ToolsShortcutsPanel';

import { useUser } from '@/hooks/user-context';
import { useTasks } from '@/hooks/tasks-context';
import { useBrands } from '@/hooks/brands-context';
import { useAgents } from '@/hooks/agents-context';

export default function DashboardScreen() {
  const { isLoading: isUserLoading } = useUser();
  const { isLoading: isTasksLoading } = useTasks();
  const { isLoading: isBrandsLoading } = useBrands();
  const { isLoading: isAgentsLoading } = useAgents();
  
  const isLoading = isUserLoading || isTasksLoading || isBrandsLoading || isAgentsLoading;
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinner} />
          <View style={styles.loadingTextContainer}>
            <Text style={styles.loadingTitle}>KOLLECTIVE OS</Text>
            <Text style={styles.loadingSubtitle}>Initializing your command center...</Text>
          </View>
        </View>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <TopNavBar />
      
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Command Strip - Always Visible */}
        <HeroCommandStrip />
        
        {/* Mission Control - Primary Task Engine */}
        <View style={styles.section}>
          <MissionControl />
        </View>
        
        {/* The Kollective Pulse - Live Activity & Culture Feed */}
        <View style={styles.section}>
          <KollectivePulse />
        </View>
        
        {/* Entity Hub Snapshots - Permission-Based */}
        <View style={styles.section}>
          <EntityHubSnapshots />
        </View>
        
        {/* Leaderboard & Incentives Center */}
        <View style={styles.section}>
          <LeaderboardIncentives />
        </View>
        
        {/* Tools & Shortcuts Panel */}
        <View style={styles.section}>
          <ToolsShortcutsPanel />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderTopColor: '#FFD700',
    marginBottom: 24,
  },
  loadingTextContainer: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#aaa',
    fontStyle: 'italic',
  },
});