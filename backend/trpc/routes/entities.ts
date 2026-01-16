import { createTRPCRouter, publicProcedure } from '../create-context';

export const entitiesRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    try {
      const { data, error } = await ctx.supabase
        .from('entities')
        .select('id, name, type, status, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('[entities] Error fetching entities:', error.message);
        return [];
      }

      return data || [];
    } catch (err) {
      console.log('[entities] Table not available or error:', err);
      return [];
    }
  }),
});
