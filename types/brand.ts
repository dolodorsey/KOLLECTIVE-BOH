export interface Brand {
  id: string;
  name: string;
  mascot: string;
  color: string;
  taskCompletion: number;
  activeAgents: number;
  recentUploads: number;
  status: 'good' | 'bottleneck' | 'critical';
}