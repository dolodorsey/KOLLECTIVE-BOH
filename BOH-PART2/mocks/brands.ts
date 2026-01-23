import { Brand } from '@/types/brand';

export const brands: Brand[] = [
  {
    id: 'brand-1',
    name: 'HQ',
    mascot: '🏢',
    color: '#FFD700', // Gold
    taskCompletion: 85,
    activeAgents: 5,
    recentUploads: 12,
    status: 'good'
  },
  {
    id: 'brand-2',
    name: 'Parq',
    mascot: '🌿',
    color: '#50C878', // Emerald
    taskCompletion: 62,
    activeAgents: 3,
    recentUploads: 7,
    status: 'bottleneck'
  },
  {
    id: 'brand-3',
    name: 'Casper',
    mascot: '🍽️',
    color: '#FFFF00', // Yellow
    taskCompletion: 78,
    activeAgents: 4,
    recentUploads: 9,
    status: 'good'
  },
  {
    id: 'brand-4',
    name: 'Mind Studio',
    mascot: '🧠',
    color: '#C0C0C0', // Silver
    taskCompletion: 45,
    activeAgents: 2,
    recentUploads: 3,
    status: 'critical'
  }
];