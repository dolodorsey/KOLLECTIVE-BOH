export type TaskPriority = 'urgent' | 'medium' | 'flexible';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'archived';

export interface TaskCollaborator {
  id: string;
  name: string;
  profileImage?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: 'file' | 'link' | 'sop';
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  brandId: string;
  agentOrigin?: string;
  collaborators: TaskCollaborator[];
  attachments: TaskAttachment[];
  sopLink?: string;
  createdAt: string;
  lastUpdated: string;
  automationTrail?: string[];
}