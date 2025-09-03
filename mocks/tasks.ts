import { Task } from '@/types/task';

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Finalize Q3 Marketing Strategy for Casper',
    description: 'Complete the marketing strategy document and get approval from stakeholders.',
    dueDate: '2025-08-10T18:00:00Z',
    priority: 'urgent',
    status: 'in-progress',
    brandId: 'brand-3',
    agentOrigin: 'Marketing Automation',
    collaborators: [
      { id: 'user-1', name: 'Alex Morgan', profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { id: 'user-3', name: 'Taylor Reed', profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ],
    attachments: [
      { id: 'att-1', name: 'Q3_Strategy_Draft.pdf', type: 'file', url: '#' },
      { id: 'att-2', name: 'Marketing SOP', type: 'sop', url: '#' }
    ],
    sopLink: '#',
    createdAt: '2025-08-01T10:00:00Z',
    lastUpdated: '2025-08-05T14:30:00Z',
    automationTrail: [
      'Created by Marketing Automation on Aug 1',
      'Reminder sent on Aug 3',
      'Escalated priority on Aug 5'
    ]
  },
  {
    id: 'task-2',
    title: 'Review Mind Studio Client Onboarding Process',
    description: 'Evaluate current onboarding flow and suggest improvements.',
    dueDate: '2025-08-12T15:00:00Z',
    priority: 'medium',
    status: 'pending',
    brandId: 'brand-4',
    collaborators: [
      { id: 'user-1', name: 'Alex Morgan', profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { id: 'user-4', name: 'Casey Johnson', profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ],
    attachments: [
      { id: 'att-3', name: 'Current_Onboarding.docx', type: 'file', url: '#' }
    ],
    sopLink: '#',
    createdAt: '2025-08-03T09:15:00Z',
    lastUpdated: '2025-08-03T09:15:00Z'
  },
  {
    id: 'task-3',
    title: 'Deploy New Rork Agent for Parq Social Media',
    description: 'Set up and test the new AI agent for social media content scheduling.',
    dueDate: '2025-08-08T12:00:00Z',
    priority: 'flexible',
    status: 'pending',
    brandId: 'brand-2',
    agentOrigin: 'Rork Deployment',
    collaborators: [
      { id: 'user-1', name: 'Alex Morgan', profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ],
    attachments: [
      { id: 'att-4', name: 'Agent_Config.json', type: 'file', url: '#' },
      { id: 'att-5', name: 'Agent Deployment SOP', type: 'sop', url: '#' }
    ],
    sopLink: '#',
    createdAt: '2025-08-04T16:20:00Z',
    lastUpdated: '2025-08-04T16:20:00Z',
    automationTrail: [
      'Created by Rork Deployment on Aug 4',
      'Configuration validated on Aug 4'
    ]
  },
  {
    id: 'task-4',
    title: 'HQ Weekly Leadership Sync',
    description: 'Prepare agenda and attend the weekly leadership meeting.',
    dueDate: '2025-08-07T14:00:00Z',
    priority: 'medium',
    status: 'pending',
    brandId: 'brand-1',
    collaborators: [
      { id: 'user-1', name: 'Alex Morgan', profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { id: 'user-2', name: 'Jordan Smith', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { id: 'user-3', name: 'Taylor Reed', profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ],
    attachments: [
      { id: 'att-6', name: 'Meeting_Agenda.docx', type: 'file', url: '#' }
    ],
    sopLink: '#',
    createdAt: '2025-08-01T08:00:00Z',
    lastUpdated: '2025-08-05T10:45:00Z'
  },
  {
    id: 'task-5',
    title: 'Update Casper Menu Items',
    description: 'Review and update the seasonal menu items for Casper restaurants.',
    dueDate: '2025-08-09T17:00:00Z',
    priority: 'urgent',
    status: 'pending',
    brandId: 'brand-3',
    collaborators: [
      { id: 'user-1', name: 'Alex Morgan', profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ],
    attachments: [
      { id: 'att-7', name: 'Current_Menu.pdf', type: 'file', url: '#' },
      { id: 'att-8', name: 'Menu Update SOP', type: 'sop', url: '#' }
    ],
    sopLink: '#',
    createdAt: '2025-08-02T11:30:00Z',
    lastUpdated: '2025-08-02T11:30:00Z'
  }
];