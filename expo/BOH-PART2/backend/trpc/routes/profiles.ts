import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

export const profilesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          role: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase.from('profiles').select('*');

      if (input?.search) {
        query = query.or(`name.ilike.%${input.search}%,email.ilike.%${input.search}%`);
      }

      if (input?.role) {
        query = query.eq('role', input.role);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('profiles')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});
