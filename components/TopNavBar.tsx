
import { Home, Target, Briefcase, Calendar, Trophy, MessageSquare, FileText, Bot, Brain, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';

import { useUser } from '@/hooks/user-context';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onPress: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.navItem, isActive && styles.activeNavItem]} 
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

const TopNavBar: React.FC = () => {

  const { user } = useUser();
  
  const handleNavigation = (screen: string) => {
    console.log(`Navigate to ${screen}`);
  };
  
  return (
    <View style={styles.container} testID="top-nav-bar">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <NavItem 
          icon={<Home color="#FFD700" size={20} />} 
          label="Home" 
          isActive={true}
          onPress={() => handleNavigation('Home')}
        />
        
        <NavItem 
          icon={<Target color="#fff" size={20} />} 
          label="My Missions" 
          onPress={() => handleNavigation('Missions')}
        />
        
        <NavItem 
          icon={<Briefcase color="#fff" size={20} />} 
          label="My Brands" 
          onPress={() => handleNavigation('Brands')}
        />
        
        <NavItem 
          icon={<Calendar color="#fff" size={20} />} 
          label="My Calendar" 
          onPress={() => handleNavigation('Calendar')}
        />
        
        <NavItem 
          icon={<Trophy color="#fff" size={20} />} 
          label="Leaderboard" 
          onPress={() => handleNavigation('Leaderboard')}
        />
        
        <NavItem 
          icon={<MessageSquare color="#fff" size={20} />} 
          label="Messages" 
          onPress={() => handleNavigation('Messages')}
        />
        
        <NavItem 
          icon={<FileText color="#fff" size={20} />} 
          label="Vault" 
          onPress={() => handleNavigation('Vault')}
        />
        
        <NavItem 
          icon={<Bot color="#fff" size={20} />} 
          label="Agents" 
          onPress={() => handleNavigation('Agents')}
        />
        
        <NavItem 
          icon={<Brain color="#fff" size={20} />} 
          label="Culture" 
          onPress={() => handleNavigation('Culture')}
        />
      </ScrollView>
      
      {user && (
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => handleNavigation('Profile')}
        >
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <User color="#fff" size={24} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scrollContent: {
    flexGrow: 1,
    paddingRight: 50,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  navLabel: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  activeNavLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  profileButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

export default TopNavBar;