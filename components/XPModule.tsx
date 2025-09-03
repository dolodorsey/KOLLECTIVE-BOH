import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

import { leaderboard } from '@/mocks/users';
import { useUser } from '@/hooks/user-context';

const XPModule: React.FC = () => {
  const { user } = useUser();
  
  if (!user) return null;
  
  // Find user position in leaderboard
  const userPosition = leaderboard.findIndex(u => u.id === user.id) + 1;
  
  // Calculate XP progress to next level
  const currentLevel = Math.floor(user.xp / 500);
  const nextLevelXP = (currentLevel + 1) * 500;
  const progress = ((user.xp % 500) / 500) * 100;
  
  return (
    <View style={styles.container} testID="xp-module">
      <Text style={styles.title}>Execution XP</Text>
      
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Level {currentLevel}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.xpText}>{user.xp} / {nextLevelXP} XP</Text>
      </View>
      
      <View style={styles.rankContainer}>
        <Text style={styles.rankLabel}>Current Rank:</Text>
        <Text style={styles.rankValue}>{user.rank}</Text>
      </View>
      
      <Text style={styles.leaderboardTitle}>Leaderboard</Text>
      
      {leaderboard.slice(0, 3).map((leader, index) => (
        <View 
          key={leader.id} 
          style={[
            styles.leaderItem, 
            leader.id === user.id && styles.currentUserItem
          ]}
        >
          <Text style={styles.position}>#{index + 1}</Text>
          
          <View style={styles.leaderInfo}>
            {leader.profileImage ? (
              <Image source={{ uri: leader.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{leader.name.charAt(0)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.leaderName}>{leader.name}</Text>
              <Text style={styles.leaderRole}>{leader.role}</Text>
            </View>
          </View>
          
          <Text style={styles.leaderXP}>{leader.xp} XP</Text>
        </View>
      ))}
      
      <Text style={styles.positionText}>Your position: #{userPosition} of {leaderboard.length}</Text>
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
  levelContainer: {
    marginBottom: 16,
  },
  levelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  xpText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'right',
  },
  rankContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  rankLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  rankValue: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  currentUserItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  position: {
    width: 30,
    color: '#aaa',
    fontSize: 14,
  },
  leaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarFallback: {
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  leaderName: {
    color: '#fff',
    fontSize: 14,
  },
  leaderRole: {
    color: '#aaa',
    fontSize: 12,
  },
  leaderXP: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  positionText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default XPModule;