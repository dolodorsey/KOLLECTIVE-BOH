import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { Agent } from '@/types/agent';
import { agents as mockAgents } from '@/mocks/agents';

export const [AgentsContext, useAgents] = createContextHook(() => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgents = () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('✅ Agents loaded:', mockAgents.length);
        setAgents(mockAgents);
        setAllAgents(mockAgents);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load agents';
        setError(errorMsg);
        console.error('[Agents] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, []);

  return {
    agents,
    allAgents,
    isLoading,
    error,
  };
});
