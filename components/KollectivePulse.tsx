import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Activity,
  Trophy,
  Heart,
  HelpCircle,
  Gift,
  Zap,
  Users,
  MessageCircle,
  Star,
  Sparkles,
} from 'lucide-react-native';

import { useBrands } from '@/hooks/brands-context';
import { brandMoods, mascotAffirmations } from '@/mocks/culture';

interface ActivityItem {
  id: string;
  type: 'win' | 'milestone' | 'help';
  title: string;
  description: string;
  user: string;
  timestamp: Date;
  brandId?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface HelpRequest {
  id: string;
  title: string;
  category: 'urgent' | 'project' | 'technical' | 'creative';
  reward: number;
  user: string;
  timestamp: Date;
}

const KollectivePulse: React.FC = () => {
  const { brands } = useBrands();
  const [activeTab, setActiveTab] = useState<'activity' | 'help'>('activity');

  // Mock activity data (would come from real-time feed)
  const activityFeed = useMemo<ActivityItem[]>(() => [
    {
      id: '1',
      type: 'win',
      title: 'Campaign Launch Complete',
      description: 'Jordan finalized the Washington Parq campaign ahead of schedule',
      user: 'Jordan Martinez',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      brandId: 'parq',
    },
    {
      id: '2',
      type: 'milestone',
      title: 'Birthday Celebration',
      description: 'Happy birthday to Alex Chen! 🎉 Celebrating another year of excellence',
      user: 'Alex Chen',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: '3',
      type: 'win',
      title: 'SOP Documentation',
      description: 'Sarah completed the new onboarding documentation for Mind Studio',
      user: 'Sarah Kim',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      brandId: 'mindstudio',
    },
    {
      id: '4',
      type: 'milestone',
      title: 'Promotion Announcement',
      description: 'Congratulations to Mike on his promotion to Brand Lead!',
      user: 'Mike Johnson',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    },
  ], []);

  // Mock help requests
  const helpRequests = useMemo<HelpRequest[]>(() => [
    {
      id: '1',
      title: 'Need design review for Casper menu update',
      category: 'urgent',
      reward: 50,
      user: 'Emma Wilson',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: '2',
      title: 'Looking for feedback on client onboarding flow',
      category: 'project',
      reward: 25,
      user: 'David Park',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
    {
      id: '3',
      title: 'Technical issue with automation workflow',
      category: 'technical',
      reward: 75,
      user: 'Lisa Rodriguez',
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    },
  ], []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'win':
        return <Trophy size={16} color="#FFD700" />;
      case 'milestone':
        return <Heart size={16} color="#FF69B4" />;
      case 'help':
        return <HelpCircle size={16} color="#0074D9" />;
      default:
        return <Activity size={16} color="#aaa" />;
    }
  };

  const getCategoryColor = (category: HelpRequest['category']) => {
    switch (category) {
      case 'urgent':
        return '#FF4136';
      case 'project':
        return '#FFD700';
      case 'technical':
        return '#0074D9';
      case 'creative':
        return '#B10DC9';
      default:
        return '#aaa';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const todayMood = useMemo(() => {
    const today = new Date().getDate();
    return brandMoods[today % brandMoods.length];
  }, []);

  const todayAffirmation = useMemo(() => {
    const today = new Date().getDate();
    return mascotAffirmations[today % mascotAffirmations.length];
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Activity size={24} color="#FFD700" />
          <Text style={styles.title}>THE KOLLECTIVE PULSE</Text>
          <Sparkles size={20} color="#FFD700" />
        </View>
        
        <Text style={styles.subtitle}>
          Live activity & culture feed
        </Text>
      </View>

      {/* Mood Pulse */}
      <View style={styles.moodSection}>
        <Text style={styles.moodText}>{todayMood}</Text>
      </View>

      {/* Mascot Affirmation */}
      <View style={styles.affirmationSection}>
        <Zap size={16} color="#FFD700" />
        <Text style={styles.affirmationText}>{todayAffirmation}</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Activity size={16} color={activeTab === 'activity' ? '#000' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            Live Activity
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'help' && styles.activeTab]}
          onPress={() => setActiveTab('help')}
        >
          <HelpCircle size={16} color={activeTab === 'help' ? '#000' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'help' && styles.activeTabText]}>
            Help Board
          </Text>
          {helpRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{helpRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'activity' ? (
          // Live Activity Feed
          <View style={styles.activityFeed}>
            {activityFeed.map((item) => {
              const brand = item.brandId ? brands.find(b => b.id === item.brandId) : null;
              
              return (
                <View key={item.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    {getActivityIcon(item.type)}
                  </View>
                  
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <Text style={styles.activityTime}>{formatTimeAgo(item.timestamp)}</Text>
                    </View>
                    
                    <Text style={styles.activityDescription}>{item.description}</Text>
                    
                    <View style={styles.activityMeta}>
                      <View style={styles.userInfo}>
                        <Users size={12} color="#aaa" />
                        <Text style={styles.userName}>{item.user}</Text>
                      </View>
                      
                      {brand && (
                        <View style={styles.brandInfo}>
                          <Text style={styles.brandEmoji}>{brand.mascot}</Text>
                          <Text style={[styles.brandName, { color: brand.color }]}>
                            {brand.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.celebrateButton}>
                    <Star size={16} color="#FFD700" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          // Help Board
          <View style={styles.helpBoard}>
            {helpRequests.length === 0 ? (
              <View style={styles.emptyHelpState}>
                <HelpCircle size={48} color="#666" />
                <Text style={styles.emptyHelpTitle}>No Help Requests</Text>
                <Text style={styles.emptyHelpSubtitle}>
                  Post a help request to get started
                </Text>
              </View>
            ) : (
              helpRequests.map((request) => (
              <TouchableOpacity key={request.id} style={styles.helpItem}>
                <View style={styles.helpHeader}>
                  <View style={[
                    styles.categoryBadge, 
                    { backgroundColor: getCategoryColor(request.category) }
                  ]}>
                    <Text style={styles.categoryText}>
                      {request.category.toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.rewardBadge}>
                    <Gift size={12} color="#FFD700" />
                    <Text style={styles.rewardText}>+{request.reward} XP</Text>
                  </View>
                </View>
                
                <Text style={styles.helpTitle}>{request.title}</Text>
                
                <View style={styles.helpMeta}>
                  <View style={styles.userInfo}>
                    <Users size={12} color="#aaa" />
                    <Text style={styles.userName}>{request.user}</Text>
                  </View>
                  
                  <Text style={styles.helpTime}>{formatTimeAgo(request.timestamp)}</Text>
                </View>
                
                <View style={styles.helpActions}>
                  <TouchableOpacity style={styles.helpButton}>
                    <MessageCircle size={14} color="#FFD700" />
                    <Text style={styles.helpButtonText}>Assist</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )))}
            
            {helpRequests.length > 0 && (
              <TouchableOpacity style={styles.postHelpButton}>
                <HelpCircle size={20} color="#FFD700" />
                <Text style={styles.postHelpText}>Post Help Request</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    marginBottom: 16,
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
    marginRight: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 36,
  },
  moodSection: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  moodText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    textAlign: 'center',
  },
  affirmationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  affirmationText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  badge: {
    backgroundColor: '#FF4136',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  activityFeed: {
    paddingBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: '#aaa',
  },
  activityDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 4,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
  },
  celebrateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  helpBoard: {
    paddingBottom: 20,
  },
  helpItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0074D9',
  },
  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rewardText: {
    fontSize: 10,
    color: '#FFD700',
    marginLeft: 2,
    fontWeight: 'bold',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  helpMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTime: {
    fontSize: 12,
    color: '#aaa',
  },
  helpActions: {
    flexDirection: 'row',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  helpButtonText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 4,
    fontWeight: '600',
  },
  postHelpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  postHelpText: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  emptyActivityState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyActivityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyActivitySubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  emptyHelpState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyHelpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHelpSubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default KollectivePulse;