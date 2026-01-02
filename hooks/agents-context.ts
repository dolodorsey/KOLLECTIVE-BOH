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
        return [];
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
          return [];
        }

        console.log(`✅ Loaded ${agentsData?.length || 0} agents`);
        
        const normalizedAgents: Agent[] = (agentsData || []).map((agent: any) => ({
          id: agent.id,
          name: agent.name,
          status: agent.status || 'active',
          brandId: agent.brand_id || agent.brandId,
          completedTasks: agent.completed_tasks || agent.completedTasks || 0,
          avatar: agent.avatar || '🤖',
        }));
        
        return normalizedAgents;
      } catch (error) {
        console.error('❌ Error in agents query:', error);
        return [];
      }
    },
    enabled: SUPABASE_CONFIG_OK,
    retry: false,
  });

  useEffect(() => {
    if (agentsQuery.data) {
      setAgents(agentsQuery.data);
    }
  }, [agentsQuery.data]);

  const userAgents = useMemo(() => {
    if (!user) return agents;
    if (user.assignedBrands.length === 0) return agents;
    
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