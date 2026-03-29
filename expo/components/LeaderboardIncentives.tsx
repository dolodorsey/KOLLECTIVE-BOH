import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  Trophy,
  Medal,
  Star,
  Zap,
  TrendingUp,
  Crown,
  Award,
  Gift,
  Users,
} from 'lucide-react-native';

import { useUser } from '@/hooks/user-context';
import { useBrands } from '@/hooks/brands-context';

interface LeaderboardEntry {
  id: string;
  name: string;
  role: string;
  xp: number;
  rank: number;
  weeklyXP: number;
  monthlyXP: number;
  streak: number;
  badges: string[];
  profileImage?: string;
  brandId?: string;
}

interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: 'merch' | 'experience' | 'perk';
  available: boolean;
}

const LeaderboardIncentives: React.FC = () => {
  const { user } = useUser();
  const { brands } = useBrands();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'rewards'>('weekly');
  const [filterBy, setFilterBy] = useState<'kollective' | 'entity'>('kollective');

  // Mock leaderboard data
  const leaderboardData = useMemo<LeaderboardEntry[]>(() => {
    // If no user data, show minimal leaderboard
    if (!user) {
      return [];
    }
    
    return [
    {
      id: '1',
      name: 'Jordan Martinez',
      role: 'Brand Lead',
      xp: 2850,
      rank: 1,
      weeklyXP: 450,
      monthlyXP: 1200,
      streak: 12,
      badges: ['🏆', '⚡', '🎯'],
      brandId: 'parq',
    },
    {
      id: '2',
      name: 'Sarah Kim',
      role: 'Creative Director',
      xp: 2720,
      rank: 2,
      weeklyXP: 380,
      monthlyXP: 1150,
      streak: 8,
      badges: ['🎨', '💡', '🚀'],
      brandId: 'mindstudio',
    },
    {
      id: '3',
      name: 'Alex Chen',
      role: 'Operations Manager',
      xp: 2650,
      rank: 3,
      weeklyXP: 420,
      monthlyXP: 1080,
      streak: 15,
      badges: ['⚙️', '📊', '🎯'],
      brandId: 'casper',
    },
    {
      id: '4',
      name: user?.name || 'You',
      role: user?.role || 'Team Member',
      xp: user?.xp || 2400,
      rank: 4,
      weeklyXP: 320,
      monthlyXP: 950,
      streak: 6,
      badges: ['💪', '🎯'],
      brandId: user?.assignedBrands?.[0],
    },
    {
      id: '5',
      name: 'Mike Johnson',
      role: 'Brand Lead',
      xp: 2200,
      rank: 5,
      weeklyXP: 290,
      monthlyXP: 880,
      streak: 4,
      badges: ['📈', '🎪'],
      brandId: 'hq',
    },
  ];
  }, [user]);

  // Mock rewards data
  const rewardsData = useMemo<RewardItem[]>(() => [
    {
      id: '1',
      title: 'Kollective Hoodie',
      description: 'Premium branded hoodie with custom embroidery',
      cost: 500,
      category: 'merch',
      available: true,
    },
    {
      id: '2',
      title: 'VIP Lunch with Founder',
      description: 'Exclusive one-on-one lunch meeting',
      cost: 2000,
      category: 'experience',
      available: true,
    },
    {
      id: '3',
      title: 'Extra PTO Day',
      description: 'Additional paid time off day',
      cost: 800,
      category: 'perk',
      available: true,
    },
    {
      id: '4',
      title: 'Team Outing Budget',
      description: '$200 budget for team activity',
      cost: 1200,
      category: 'experience',
      available: false,
    },
    {
      id: '5',
      title: 'Kollective Water Bottle',
      description: 'Insulated steel water bottle',
      cost: 200,
      category: 'merch',
      available: true,
    },
    {
      id: '6',
      title: 'Work From Anywhere Week',
      description: 'One week remote work from anywhere',
      cost: 1500,
      category: 'perk',
      available: true,
    },
  ], []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown size={20} color="#FFD700" />;
      case 2:
        return <Medal size={20} color="#C0C0C0" />;
      case 3:
        return <Award size={20} color="#CD7F32" />;
      default:
        return <Trophy size={20} color="#666" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category: RewardItem['category']) => {
    switch (category) {
      case 'merch':
        return <Gift size={16} color="#FFD700" />;
      case 'experience':
        return <Star size={16} color="#FF69B4" />;
      case 'perk':
        return <Zap size={16} color="#0074D9" />;
      default:
        return <Gift size={16} color="#666" />;
    }
  };

  const currentUserEntry = leaderboardData.find(entry => entry.name === user?.name || entry.name === 'You');
  const userXP = user?.xp || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Trophy size={24} color="#FFD700" />
          <Text style={styles.title}>LEADERBOARD & INCENTIVES</Text>
        </View>
        
        <Text style={styles.subtitle}>
          Gamified recognition & reward hub
        </Text>
      </View>

      {/* User Stats Card */}
      <View style={styles.userStatsCard}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            )}
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Team Member'}</Text>
            <Text style={styles.userRank}>
              Rank #{currentUserEntry?.rank || 'N/A'} • {userXP} XP
            </Text>
          </View>
        </View>
        
        <View style={styles.userBadges}>
          {currentUserEntry?.badges.map((badge, index) => (
            <Text key={index} style={styles.badge}>{badge}</Text>
          ))}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
          onPress={() => setActiveTab('weekly')}
        >
          <TrendingUp size={16} color={activeTab === 'weekly' ? '#000' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>
            Weekly
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
          onPress={() => setActiveTab('monthly')}
        >
          <Trophy size={16} color={activeTab === 'monthly' ? '#000' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>
            Monthly
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
          onPress={() => setActiveTab('rewards')}
        >
          <Gift size={16} color={activeTab === 'rewards' ? '#000' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
            Rewards
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Toggle (for leaderboard tabs) */}
      {activeTab !== 'rewards' && (
        <View style={styles.filterToggle}>
          <TouchableOpacity
            style={[styles.filterButton, filterBy === 'kollective' && styles.activeFilter]}
            onPress={() => setFilterBy('kollective')}
          >
            <Users size={14} color={filterBy === 'kollective' ? '#000' : '#666'} />
            <Text style={[styles.filterText, filterBy === 'kollective' && styles.activeFilterText]}>
              Kollective-wide
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterBy === 'entity' && styles.activeFilter]}
            onPress={() => setFilterBy('entity')}
          >
            <Trophy size={14} color={filterBy === 'entity' ? '#000' : '#666'} />
            <Text style={[styles.filterText, filterBy === 'entity' && styles.activeFilterText]}>
              My Entities
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'rewards' ? (
          // Rewards Exchange
          <View style={styles.rewardsGrid}>
            <View style={styles.xpBalance}>
              <Zap size={20} color="#FFD700" />
              <Text style={styles.balanceText}>Available XP: {userXP}</Text>
            </View>
            
            {rewardsData.map((reward) => (
              <View key={reward.id} style={[
                styles.rewardCard,
                !reward.available && styles.unavailableCard
              ]}>
                <View style={styles.rewardHeader}>
                  <View style={styles.rewardInfo}>
                    {getCategoryIcon(reward.category)}
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                  </View>
                  
                  <View style={styles.rewardCost}>
                    <Zap size={14} color="#FFD700" />
                    <Text style={styles.costText}>{reward.cost}</Text>
                  </View>
                </View>
                
                <Text style={styles.rewardDescription}>{reward.description}</Text>
                
                <TouchableOpacity 
                  style={[
                    styles.redeemButton,
                    (!reward.available || userXP < reward.cost) && styles.disabledButton
                  ]}
                  disabled={!reward.available || userXP < reward.cost}
                >
                  <Text style={[
                    styles.redeemButtonText,
                    (!reward.available || userXP < reward.cost) && styles.disabledButtonText
                  ]}>
                    {!reward.available ? 'Out of Stock' : 
                     userXP < reward.cost ? 'Insufficient XP' : 'Redeem'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          // Leaderboard
          <View style={styles.leaderboard}>
            {leaderboardData.length === 0 ? (
              <View style={styles.emptyLeaderboardState}>
                <Trophy size={48} color="#666" />
                <Text style={styles.emptyLeaderboardTitle}>No Leaderboard Data</Text>
                <Text style={styles.emptyLeaderboardSubtitle}>
                  Complete tasks to start earning XP
                </Text>
              </View>
            ) : (
              leaderboardData.map((entry) => {
              const brand = entry.brandId ? brands.find(b => b.id === entry.brandId) : null;
              const isCurrentUser = entry.name === user?.name || entry.name === 'You';
              const xpToShow = activeTab === 'weekly' ? entry.weeklyXP : entry.monthlyXP;
              
              return (
                <View key={entry.id} style={[
                  styles.leaderboardEntry,
                  isCurrentUser && styles.currentUserEntry
                ]}>
                  <View style={styles.rankSection}>
                    {getRankIcon(entry.rank)}
                    <Text style={[styles.rankNumber, { color: getRankColor(entry.rank) }]}>
                      #{entry.rank}
                    </Text>
                  </View>
                  
                  <View style={styles.entryContent}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryName}>{entry.name}</Text>
                      <Text style={styles.entryXP}>{xpToShow} XP</Text>
                    </View>
                    
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryRole}>{entry.role}</Text>
                      
                      {brand && (
                        <View style={styles.entryBrand}>
                          <Text style={styles.brandEmoji}>{brand.mascot}</Text>
                          <Text style={[styles.brandText, { color: brand.color }]}>
                            {brand.name}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.entryBadges}>
                      {entry.badges.map((badge, index) => (
                        <Text key={index} style={styles.entryBadge}>{badge}</Text>
                      ))}
                      <View style={styles.streakBadge}>
                        <Zap size={10} color="#FFD700" />
                        <Text style={styles.streakText}>{entry.streak}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }))}
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
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 36,
  },
  userStatsCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  userRank: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  userBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    fontSize: 20,
    marginRight: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
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
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeFilter: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#000',
  },
  content: {
    flex: 1,
  },
  leaderboard: {
    paddingBottom: 20,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  currentUserEntry: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  rankSection: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  entryXP: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryRole: {
    fontSize: 12,
    color: '#aaa',
  },
  entryBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryBadge: {
    fontSize: 16,
    marginRight: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  streakText: {
    fontSize: 10,
    color: '#FFD700',
    marginLeft: 2,
    fontWeight: 'bold',
  },
  rewardsGrid: {
    paddingBottom: 20,
  },
  xpBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  rewardCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  unavailableCard: {
    opacity: 0.6,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  costText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 18,
  },
  redeemButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  disabledButtonText: {
    color: '#666',
  },
  emptyLeaderboardState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyLeaderboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyLeaderboardSubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default LeaderboardIncentives;