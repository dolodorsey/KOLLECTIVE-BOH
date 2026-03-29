import { createTRPCRouter, publicProcedure } from '../create-context';

export const activityRouter = createTRPCRouter({
  feed: publicProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    return data || [];
  }),
});
