import { createTRPCRouter, publicProcedure } from '../create-context';

export const workflowsRouter = createTRPCRouter({
  runs: publicProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from('workflow_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);

    return data || [];
  }),

  definitions: publicProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from('workflows')
      .select('*')
      .order('name', { ascending: true });

    return data || [];
  }),
});
