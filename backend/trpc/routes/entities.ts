import { createTRPCRouter, publicProcedure } from '../create-context';
import * as z from 'zod';

export const entitiesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      let q = ctx.supabase
        .from('entities')
        .select('*, owners(id,name)')
        .order('created_at', { ascending: false });

      if (input?.status && input.status !== 'all') {
        q = q.eq('status', input.status);
      }

      if (input?.search) {
        q = q.ilike('name', `%${input.search}%`);
      }

      const { data } = await q;
      return data || [];
    }),
});
