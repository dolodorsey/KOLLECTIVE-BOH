import { createTRPCRouter, publicProcedure } from '../create-context';

export const dashboardRouter = createTRPCRouter({
  summary: publicProcedure.query(async ({ ctx }) => {
    const { count: entitiesCount } = await ctx.supabase
      .from('entities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: alertsCount } = await ctx.supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    return {
      active_entities_count: entitiesCount || 0,
      active_entities_delta_7d: 0,
      alerts_open_count: alertsCount || 0,
      workflow_runs_today_count: 0,
      workflow_failures_today_count: 0,
      tasks_open_count: 0,
      team_online_count: 0,
      system_health: 'ok' as const,
    };
  }),
});
