import { createTRPCRouter, publicProcedure } from '../create-context';

export const workflowsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await ctx.supabase
        .from('workflow_executions')
        .select('id, workflow_name, status, started_at, completed_at, duration_ms')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) {
        console.log('[workflows] Error fetching workflows:', error.message);
        return [];
      }

      return data || [];
    } catch (err) {
      console.log('[workflows] Table not available or error:', err);
      return [];
    }
  }),
});
