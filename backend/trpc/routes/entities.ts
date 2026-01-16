import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

export const entitiesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase.from('entities').select('*, owner:users(id, name)');

      if (input?.status && input.status !== 'all') {
        query = query.eq('status', input.status);
      }

      if (input?.search) {
        query = query.ilike('name', `%${input.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }),
});
