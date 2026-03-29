export type AgentStatus = 'active' | 'paused' | 'failed';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  brandId: string;
  completedTasks: number;
  avatar: string;
}