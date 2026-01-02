import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

import { Agent } from '@/types/agent';
import { useUser } from '@/hooks/user-context';
import { getSupabase, SUPABASE_CONFIG_OK } from '@/lib/supabase';

export const [AgentsContext, useAgents] = createContextHook(() => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const { user } = useUser();

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      if (!SUPABASE_CONFIG_OK) {
        console.error('❌ Supabase not configured in agents context');
        throw new Error('Supabase not configured');
      }

      try {
        console.log('🤖 Fetching agents from Supabase...');
        const supabase = getSupabase();
        const { data: agentsData, error } = await supabase
          .from('agents')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('❌ Error fetching agents:', error);
          throw error;
        }

        console.log(`✅ Loaded ${agentsData?.length || 0} agents`);
        return (agentsData || []) as Agent[];
      } catch (error) {
        console.error('❌ Error in agents query:', error);
        throw error;
      }
    },
    enabled: SUPABASE_CONFIG_OK,
  });

  useEffect(() => {
    if (agentsQuery.data) {
      setAgents(agentsQuery.data);
    }
  }, [agentsQuery.data]);

  const userAgents = useMemo(() => {
    if (!user) return [];
    
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