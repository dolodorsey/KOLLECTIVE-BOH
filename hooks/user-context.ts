import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { currentUser } from '@/mocks/users';
import { User } from '@/types/user';

export const [UserContext, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          return JSON.parse(storedUser) as User;
        }
        // For demo purposes, we'll use the mock data
        await AsyncStorage.setItem('user', JSON.stringify(currentUser));
        return currentUser;
      } catch (error) {
        console.error('Error fetching user data:', error);
        return currentUser;
      }
    }
  });

  useEffect(() => {
    if (userQuery.data) {
      setUser(userQuery.data);
    }
  }, [userQuery.data]);

  return {
    user,
    isLoading: userQuery.isLoading,
    error: userQuery.error
  };
});