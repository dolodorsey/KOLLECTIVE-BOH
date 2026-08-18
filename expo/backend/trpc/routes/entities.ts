import * as z from 'zod';
import { createTRPCRouter, protectedProcedure } from '../create-context';

export const entitiesRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const orgRole = ctx.orgMemberships[0]?.role;
      let allowedEntityIds: string[] | null = null;

      if (!['owner', 'admin'].includes(orgRole || '')) {
        const { data: assignments, error: assignmentError } = await ctx.supabase
          .from('company_team_assignments')
          .select('entity_id')
          .eq('user_id', ctx.user.id)
          .eq('status', 'active');
        if (assignmentError) throw new Error(assignmentError.message);
        allowedEntityIds = (assignments || []).map((item: any) => item.entity_id);
        if (!allowedEntityIds.length) return [];
      }

      let query = ctx.supabase
        .from('enterprise_directory_records')
        .select(
          'id,entity_key,entity_name,division,entity_type,status,priority,primary_poc,current_blocker,next_action,brand_readiness,operational_readiness,revenue_readiness,technical_readiness,created_at,updated_at'
        );

      if (allowedEntityIds) query = query.in('id', allowedEntityIds);
      if (input?.status && input.status !== 'all') query = query.eq('status', input.status);
      if (input?.search) query = query.ilike('entity_name', `%${input.search}%`);

      const { data, error } = await query.order('entity_name', { ascending: true });
      if (error) throw new Error(error.message);

      return (data || []).map((entity: any) => ({
        id: entity.id,
        entity_key: entity.entity_key,
        name: entity.entity_name,
        type: entity.entity_type || entity.division || 'Enterprise Entity',
        division: entity.division,
        status: entity.status,
        priority: entity.priority,
        owner: entity.primary_poc ? { name: entity.primary_poc } : null,
        current_blocker: entity.current_blocker,
        next_action: entity.next_action,
        brand_readiness: entity.brand_readiness,
        operational_readiness: entity.operational_readiness,
        revenue_readiness: entity.revenue_readiness,
        technical_readiness: entity.technical_readiness,
        // Health compatibility fields are derived from current enterprise state,
        // not the retired workflow/alert shadow schema.
        alerts_open: entity.current_blocker ? 1 : 0,
        failed_runs_24h: 0,
        last_activity_at: entity.updated_at,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
      }));
    }),
});
