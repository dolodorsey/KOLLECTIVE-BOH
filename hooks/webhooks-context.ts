import { trpc } from '@/lib/trpc';

export function useWebhooks(brand?: string, status?: 'active' | 'inactive' | 'testing') {
  return trpc.webhooks.getWebhooks.useQuery({ brand, status });
}

export function useWebhookByName(workflowName: string) {
  return trpc.webhooks.getWebhookByName.useQuery({ workflow_name: workflowName });
}

export function useRegisterWebhook() {
  const utils = trpc.useContext();
  
  return trpc.webhooks.registerWebhook.useMutation({
    onSuccess: () => {
      utils.webhooks.getWebhooks.invalidate();
    },
  });
}

export function useUpdateWebhook() {
  const utils = trpc.useContext();
  
  return trpc.webhooks.updateWebhook.useMutation({
    onSuccess: () => {
      utils.webhooks.getWebhooks.invalidate();
    },
  });
}

export function useDeleteWebhook() {
  const utils = trpc.useContext();
  
  return trpc.webhooks.deleteWebhook.useMutation({
    onSuccess: () => {
      utils.webhooks.getWebhooks.invalidate();
    },
  });
}

export function useWorkflowExecutions(filters?: {
  workflow_id?: string;
  user_id?: string;
  status?: 'pending' | 'success' | 'failed' | 'timeout';
  limit?: number;
}) {
  return trpc.webhooks.getExecutions.useQuery(filters);
}

export function useExecutionById(id: string) {
  return trpc.webhooks.getExecutionById.useQuery({ id });
}
