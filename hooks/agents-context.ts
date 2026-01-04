import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Agent } from '@/types/agent';

export const [AgentsContext, useAgents] = createContextHook(() => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get<Agent[]>('/api/agents');
        
        if (response.error) {
          setError(response.error);
          console.error('[Agents] Failed to fetch agents:', response.error);
        } else if (response.data) {
          setAgents(response.data);
          setAllAgents(response.data);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch agents';
        setError(errorMsg);
        console.error('[Agents] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return {
    agents,
    allAgents,
    isLoading,
    error,
  };
});
