import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

export const locationsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase.from('locations').select('*');

      if (input?.search) {
        query = query.ilike('name', `%${input.search}%`);
      }

      if (input?.status && input.status !== 'all') {
        query = query.eq('status', input.status);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }),
});
