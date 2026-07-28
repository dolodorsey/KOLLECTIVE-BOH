import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

/**
 * Entities now read boh.entities in the gateway project — 129 live entities
 * joined to their division. The old query hit `entities` with an
 * `owner:users(...)` join; neither table had any rows.
 */
export const entitiesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          division: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase.schema('boh').from('entities').select('*');

      if (input?.status && input.status !== 'all') {
        query = query.eq('status', input.status);
      }
      if (input?.division) {
        query = query.eq('division_slug', input.division);
      }
      if (input?.search) {
        query = query.ilike('name', `%${input.search}%`);
      }

      const { data, error } = await query
        .order('featured_priority', { ascending: false })
        .order('name');
      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  /** Operating profile for one entity — modules, cadence, and what it may do. */
  settings: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .schema('boh')
        .from('entity_settings')
        .select('*')
        .eq('entity_slug', input.slug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    }),

  setFocus: publicProcedure
    .input(z.object({ slug: z.string(), focus: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase.rpc('update_entity_focus', {
        p_entity_slug: input.slug,
        p_current_focus: input.focus,
      });
      if (error) throw new Error(error.message);
      return data;
    }),

  setLifecycle: publicProcedure
    .input(z.object({ slug: z.string(), lifecycle: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase.rpc('set_entity_lifecycle', {
        p_entity_slug: input.slug,
        p_lifecycle: input.lifecycle,
      });
      if (error) throw new Error(error.message);
      return data;
    }),
});
