export interface Brand {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  mascot?: string;
  color?: string;
  taskCompletion?: number;
  activeAgents?: number;
  recentUploads?: number;
  status?: 'good' | 'bottleneck' | 'critical';
}