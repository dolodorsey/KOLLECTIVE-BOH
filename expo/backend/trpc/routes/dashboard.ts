import { createTRPCRouter, protectedProcedure } from '../create-context';

export const dashboardRouter = createTRPCRouter({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const orgRole = ctx.orgMemberships[0]?.role;
    let allowedEntityIds: string[] | null = null;

    if (!['owner', 'admin'].includes(orgRole || '')) {
      const { data: assignments, error } = await ctx.supabase
        .from('company_team_assignments')
        .select('entity_id')
        .eq('user_id', ctx.user.id)
        .eq('status', 'active');
      if (error) throw new Error(error.message);
      allowedEntityIds = (assignments || []).map((item: any) => item.entity_id);
      if (!allowedEntityIds.length) {
        return {
          active_entities_count: 0,
          active_entities_delta_7d: 0,
          alerts_open_count: 0,
          stale_entities_count: 0,
          high_attention_entities_count: 0,
          workflow_runs_today_count: 0,
          workflow_failures_today_count: 0,
          tasks_open_count: 0,
          team_online_count: 0,
          system_health: 'ok' as const,
        };
      }
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    let entityQuery = ctx.supabase
      .from('enterprise_directory_intelligence')
      .select('id,status,current_blocker,created_at,freshness_status,attention_score', { count: 'exact' })
      .eq('status', 'active');
    if (allowedEntityIds) entityQuery = entityQuery.in('id', allowedEntityIds);
    const { data: activeEntities, count: entitiesCount, error: entityError } = await entityQuery;
    if (entityError) throw new Error(entityError.message);

    const blockers = (activeEntities || []).filter((entity: any) => Boolean(entity.current_blocker)).length;
    const staleEntities = (activeEntities || []).filter((entity: any) => entity.freshness_status === 'stale').length;
    const highAttentionEntities = (activeEntities || []).filter((entity: any) => Number(entity.attention_score || 0) >= 60).length;
    const newActive7d = (activeEntities || []).filter(
      (entity: any) => entity.created_at && entity.created_at >= weekAgo
    ).length;

    let executionQuery = ctx.supabase
      .from('company_execution_queue')
      .select('id,entity_id,queue_status,created_at,completed_at')
      .gte('created_at', todayIso);
    if (allowedEntityIds) executionQuery = executionQuery.in('entity_id', allowedEntityIds);
    const { data: executions, error: executionError } = await executionQuery;
    if (executionError) throw new Error(executionError.message);

    let openQuery = ctx.supabase
      .from('company_execution_queue')
      .select('id', { count: 'exact', head: true })
      .in('queue_status', ['pending', 'queued', 'running']);
    if (allowedEntityIds) openQuery = openQuery.in('entity_id', allowedEntityIds);
    const { count: openExecutionCount, error: openError } = await openQuery;
    if (openError) throw new Error(openError.message);

    const failedToday = (executions || []).filter((run: any) => run.queue_status === 'failed').length;
    const completedToday = (executions || []).filter((run: any) => run.queue_status === 'completed').length;

    let teamQuery = ctx.supabase
      .from('company_team_assignments')
      .select('user_id')
      .eq('status', 'active');
    if (allowedEntityIds) teamQuery = teamQuery.in('entity_id', allowedEntityIds);
    const { data: teamAssignments } = await teamQuery;
    const distinctTeam = new Set((teamAssignments || []).map((item: any) => item.user_id)).size;

    return {
      active_entities_count: entitiesCount || 0,
      active_entities_delta_7d: newActive7d,
      alerts_open_count: blockers,
      stale_entities_count: staleEntities,
      high_attention_entities_count: highAttentionEntities,
      workflow_runs_today_count: (executions || []).length,
      workflow_failures_today_count: failedToday,
      tasks_open_count: openExecutionCount || 0,
      team_online_count: distinctTeam,
      system_health:
        failedToday > 0 || highAttentionEntities > 0
          ? ('critical' as const)
          : blockers > 0 || staleEntities > 0
            ? ('watch' as const)
            : ('ok' as const),
      completed_today_count: completedToday,
    };
  }),
});
