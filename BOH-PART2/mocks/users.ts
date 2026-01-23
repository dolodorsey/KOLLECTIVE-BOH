import { User } from '@/types/user';

export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Morgan',
  role: 'Inner Circle',
  rank: 'Architect',
  assignedBrands: ['brand-1', 'brand-2', 'brand-3', 'brand-4'],
  xp: 1250,
  profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
};

export const leaderboard: User[] = [
  {
    id: 'user-2',
    name: 'Jordan Smith',
    role: 'Super Admin',
    rank: 'Execution King',
    assignedBrands: ['brand-1', 'brand-2', 'brand-3', 'brand-4', 'brand-5'],
    xp: 2100,
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  },
  {
    ...currentUser
  },
  {
    id: 'user-3',
    name: 'Taylor Reed',
    role: 'Brand Lead',
    rank: 'Hustler',
    assignedBrands: ['brand-1', 'brand-3'],
    xp: 980,
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'user-4',
    name: 'Casey Johnson',
    role: 'Creative',
    rank: 'MVP of the Week',
    assignedBrands: ['brand-2', 'brand-4'],
    xp: 850,
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  },
];