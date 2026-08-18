import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

// Compatibility namespace only. The old external workflow registry was retired.
// This router now exposes the direct-provider control plane and execution evidence.
export const webhooksRouter = createTRPCRouter({
  getIntegrations: publicProcedure
    .input(
      z.object({
        provider: z.string().optional(),
        status: z.enum(['connected', 'needs_verification', 'degraded', 'disabled', 'archived']).optional(),
        entity_id: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase
        .from('direct_integration_registry')
        .select('id,integration_key,provider,display_name,enterprise_entity_id,auth_mode,secret_ref,endpoint_url,capabilities,status,last_verified_at,last_success_at,last_error,metadata,created_at,updated_at');

      if (input?.provider) query = query.eq('provider', input.provider);
      if (input?.status) query = query.eq('status', input.status);
      if (input?.entity_id) query = query.eq('enterprise_entity_id', input.entity_id);

      const { data, error } = await query.order('integration_key', { ascending: true });
      if (error) throw new Error(`Failed to fetch direct integrations: ${error.message}`);
      return data || [];
    }),

  getIntegrationByKey: publicProcedure
    .input(z.object({ integration_key: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('direct_integration_registry')
        .select('id,integration_key,provider,display_name,enterprise_entity_id,auth_mode,secret_ref,endpoint_url,capabilities,status,last_verified_at,last_success_at,last_error,metadata,created_at,updated_at')
        .eq('integration_key', input.integration_key)
        .single();
      if (error) throw new Error(`Direct integration not found: ${error.message}`);
      return data;
    }),

  getRuns: publicProcedure
    .input(
      z.object({
        integration_id: z.string().uuid().optional(),
        entity_id: z.string().uuid().optional(),
        status: z.enum(['queued', 'running', 'succeeded', 'failed', 'skipped']).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase
        .from('direct_integration_runs')
        .select('id,integration_id,enterprise_entity_id,action_key,status,request_ref,result_summary,evidence,error_message,started_at,completed_at,metadata');
      if (input?.integration_id) query = query.eq('integration_id', input.integration_id);
      if (input?.entity_id) query = query.eq('enterprise_entity_id', input.entity_id);
      if (input?.status) query = query.eq('status', input.status);
      const { data, error } = await query
        .order('started_at', { ascending: false })
        .limit(input?.limit ?? 50);
      if (error) throw new Error(`Failed to fetch direct integration runs: ${error.message}`);
      return data || [];
    }),

  getSheetBackends: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('google_sheet_backends')
      .select('id,sheet_key,spreadsheet_id,title,purpose,authority_scope,sync_direction,status,tab_schema,last_pull_at,last_push_at,last_verified_at,last_error,metadata,created_at,updated_at')
      .order('sheet_key', { ascending: true });
    if (error) throw new Error(`Failed to fetch Google Sheet backends: ${error.message}`);
    return data || [];
  }),

  getSystemSummary: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('v_enterprise_system_summary')
      .select('*')
      .single();
    if (error) throw new Error(`Failed to fetch enterprise system summary: ${error.message}`);
    return data;
  }),
});
