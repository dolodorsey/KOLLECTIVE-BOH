import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import {
  Search,
  User,
  Quote,
  Sparkles,
} from 'lucide-react-native';

import { useUser } from '@/hooks/user-context';
import { useBrands } from '@/hooks/brands-context';
import { useCulture } from '@/hooks/culture-context';

const HeroCommandStrip: React.FC = () => {
  const { user } = useUser();
  const { brands } = useBrands();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const userBrands = useMemo(() => {
    return brands.filter(brand => user?.assignedBrands?.includes(brand.id));
  }, [brands, user?.assignedBrands]);

  const { quoteOfTheDay: todayQuote } = useCulture();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getBrandColor = () => {
    if (userBrands.length === 1) return userBrands[0].color;
    return '#FFD700'; // Default gold for multi-brand or HQ
  };

  const getProjectCount = () => {
    // This would be calculated from actual project data
    return Math.floor(Math.random() * 8) + 2; // Mock: 2-9 projects
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Greeting & Role Recognition */}
      <View style={styles.greetingSection}>
        <View style={styles.userInfo}>
          <TouchableOpacity 
            style={[styles.profileAvatar, { borderColor: getBrandColor() }]}
          >
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <User color="#fff" size={20} />
            )}
          </TouchableOpacity>
          
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name}.
            </Text>
            <Text style={styles.roleDescription}>
              You are leading {getProjectCount()} projects across{' '}
              {userBrands.length === 1 
                ? userBrands[0].name 
                : `${userBrands.length} entities`
              } today.
            </Text>
          </View>
        </View>
      </View>

      {/* Quote of the Day */}
      <View style={styles.quoteSection}>
        <Quote size={16} color="#FFD700" />
        <Text style={styles.quoteText}>{todayQuote}</Text>
        <Sparkles size={16} color="#FFD700" />
      </View>

      {/* Global Search Command */}
      <View style={[styles.searchSection, isSearchFocused && styles.searchFocused]}>
        <Search size={20} color={isSearchFocused ? '#FFD700' : '#aaa'} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search entities, documents, tasks, team members..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  greetingSection: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 18,
  },
  quoteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
    marginHorizontal: 12,
    fontStyle: 'italic',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchFocused: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HeroCommandStrip;