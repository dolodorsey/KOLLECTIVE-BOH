import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

import { agents as mockAgents } from '@/mocks/agents';
import { Agent } from '@/types/agent';
import { useUser } from '@/hooks/user-context';

export const [AgentsContext, useAgents] = createContextHook(() => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const { user } = useUser();

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        const storedAgents = await AsyncStorage.getItem('agents');
        if (storedAgents) {
          return JSON.parse(storedAgents) as Agent[];
        }
        // For demo purposes, we'll use the mock data
        await AsyncStorage.setItem('agents', JSON.stringify(mockAgents));
        return mockAgents;
      } catch (error) {
        console.error('Error fetching agents data:', error);
        return mockAgents;
      }
    }
  });

  useEffect(() => {
    if (agentsQuery.data) {
      setAgents(agentsQuery.data);
    }
  }, [agentsQuery.data]);

  const userAgents = useMemo(() => {
    if (!user) return [];
    
    // Filter agents based on user's assigned brands
    return agents.filter(agent => 
      user.assignedBrands.includes(agent.brandId)
    );
  }, [agents, user]);

  return {
    agents: userAgents,
    allAgents: agents,
    isLoading: agentsQuery.isLoading,
    error: agentsQuery.error
  };
});