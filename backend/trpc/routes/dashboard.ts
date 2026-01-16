import { createTRPCRouter, publicProcedure } from '../create-context';

export const dashboardRouter = createTRPCRouter({
  summary: publicProcedure.query(async ({ ctx }) => {
    let entitiesCount = 0;
    let alertsCount = 0;

    try {
      const entitiesResult = await ctx.supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (!entitiesResult.error) {
        entitiesCount = entitiesResult.count || 0;
      }
    } catch {
      console.log('[dashboard] entities table not available');
    }

    try {
      const alertsResult = await ctx.supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      if (!alertsResult.error) {
        alertsCount = alertsResult.count || 0;
      }
    } catch {
      console.log('[dashboard] alerts table not available');
    }

    return {
      active_entities_count: entitiesCount,
      active_entities_delta_7d: 0,
      alerts_open_count: alertsCount,
      workflow_runs_today_count: 0,
      workflow_failures_today_count: 0,
      tasks_open_count: 0,
      team_online_count: 0,
      system_health: 'ok' as const,
    };
  }),
});
