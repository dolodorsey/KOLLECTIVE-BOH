import React from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView } from 'react-native';

import TopNavBar from '@/components/TopNavBar';
import HeroCommandStrip from '@/components/HeroCommandStrip';
import MissionControl from '@/components/MissionControl';
import KollectivePulse from '@/components/KollectivePulse';
import EntityHubSnapshots from '@/components/EntityHubSnapshots';
import LeaderboardIncentives from '@/components/LeaderboardIncentives';
import ToolsShortcutsPanel from '@/components/ToolsShortcutsPanel';

export default function DashboardScreen() {
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
});