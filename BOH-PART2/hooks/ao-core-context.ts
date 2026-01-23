import { trpc } from '@/lib/trpc';

export function useExecuteWorkflow() {
  const utils = trpc.useContext();
  
  return trpc.aoCore.executeWorkflow.useMutation({
    onSuccess: () => {
      utils.webhooks.getExecutions.invalidate();
    },
  });
}

export function useWorkflowStatus(executionId: string) {
  return trpc.aoCore.getWorkflowStatus.useQuery({ execution_id: executionId });
}
