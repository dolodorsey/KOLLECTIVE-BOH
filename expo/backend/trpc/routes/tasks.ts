import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

/**
 * Tasks read boh.tasks (the live kollective_task_queue) and write through
 * boh.create_task, which enforces each entity's own operating profile:
 * portfolio entities cannot create tasks, build-stage entities cannot take
 * outreach/content/comms work, and staff are limited to their assigned brands.
 */
export const tasksRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          entity: z.string().optional(),
          status: z.string().optional(),
          assignee: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase.schema('boh').from('tasks').select('*');
      if (input?.entity) query = query.eq('brand', input.entity);
      if (input?.status && input.status !== 'all') query = query.eq('status', input.status);
      if (input?.assignee) query = query.eq('assigned_to', input.assignee);

      const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  create: publicProcedure
    .input(
      z.object({
        entitySlug: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
        category: z
          .enum(['build', 'content', 'outreach', 'ops', 'comms', 'research', 'data', 'design'])
          .default('ops'),
        assignedTo: z.string().optional(),
        scheduledFor: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase.rpc('create_task', {
        p_entity_slug: input.entitySlug,
        p_title: input.title,
        p_description: input.description ?? null,
        p_priority: input.priority,
        p_assigned_to: input.assignedTo ?? null,
        p_category: input.category,
        p_scheduled_for: input.scheduledFor ?? null,
      });
      if (error) throw new Error(error.message);
      // The function returns { ok:false, error } for policy rejections —
      // surface that to the UI rather than swallowing it as success.
      if (data && data.ok === false) throw new Error(data.error);
      return data;
    }),
});
