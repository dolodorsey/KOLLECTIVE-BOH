import { createTRPCRouter, protectedProcedure } from '../create-context';

function normalizeStatus(queueStatus: string) {
  if (queueStatus === 'completed') return 'completed';
  if (queueStatus === 'failed') return 'failed';
  if (queueStatus === 'skipped') return 'skipped';
  if (queueStatus === 'running') return 'running';
  return 'pending';
}

export const executionsRouter = createTRPCRouter({
  runs: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('company_execution_queue')
      .select(
        'id,entity_id,channel,title,scheduled_at,queue_status,approval_status,owner_user_id,completed_at,result_summary,proof_url,created_at,updated_at,entity:enterprise_directory_records(entity_key,entity_name,division)'
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return (data || []).map((run: any) => ({
      id: run.id,
      execution_name: run.title,
      channel: run.channel,
      entity: run.entity,
      status: normalizeStatus(run.queue_status),
      queue_status: run.queue_status,
      approval_status: run.approval_status,
      scheduled_at: run.scheduled_at,
      started_at: run.created_at,
      completed_at: run.completed_at,
      result_summary: run.result_summary,
      proof_url: run.proof_url,
      updated_at: run.updated_at,
    }));
  }),

  definitions: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('company_channel_plans')
      .select(
        'id,entity_id,channel,use_status,cadence_label,schedule_definition,approval_mode,daily_cap,weekly_cap,campaign_key,next_run_at,entity:enterprise_directory_records(entity_key,entity_name,division)'
      )
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);
    return data || [];
  }),
});
