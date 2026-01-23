import { createTRPCRouter, publicProcedure } from '../create-context';

export const workflowsRouter = createTRPCRouter({
  runs: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('workflow_executions')
      .select('*, workflow:workflows(name), entity:entities(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw new Error(error.message);
    return data || [];
  }),

  definitions: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('workflows')
      .select('*, owner:users(id, name)')
      .order('name');
    
    if (error) throw new Error(error.message);
    return data || [];
  }),
});
