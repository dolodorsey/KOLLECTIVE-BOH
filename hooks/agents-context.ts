import createContextHook from '@nkzw/create-context-hook';

import { Agent } from '@/types/agent';

export const [AgentsContext, useAgents] = createContextHook(() => {
  return {
    agents: [] as Agent[],
    allAgents: [] as Agent[],
    isLoading: false,
    error: null
  };
});
