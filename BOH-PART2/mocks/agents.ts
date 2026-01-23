import { Agent } from '@/types/agent';

export const agents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Marketing Automation',
    status: 'active',
    brandId: 'brand-3',
    completedTasks: 24,
    avatar: '🤖'
  },
  {
    id: 'agent-2',
    name: 'Content Scheduler',
    status: 'active',
    brandId: 'brand-2',
    completedTasks: 18,
    avatar: '📅'
  },
  {
    id: 'agent-3',
    name: 'Client Onboarding',
    status: 'paused',
    brandId: 'brand-4',
    completedTasks: 12,
    avatar: '👋'
  },
  {
    id: 'agent-4',
    name: 'Inventory Manager',
    status: 'failed',
    brandId: 'brand-3',
    completedTasks: 8,
    avatar: '📦'
  },
  {
    id: 'agent-5',
    name: 'Performance Tracker',
    status: 'active',
    brandId: 'brand-1',
    completedTasks: 32,
    avatar: '📊'
  }
];