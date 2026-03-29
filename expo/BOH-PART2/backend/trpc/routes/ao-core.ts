import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

export const aoCoreRouter = createTRPCRouter({
  executeWorkflow: publicProcedure
    .input(
      z.object({
        workflow_name: z.string(),
        payload: z.any(),
        brand: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      
      const { data } = await ctx.supabase.auth.getSession();
      const session = data?.session;
      const userId = session?.user?.id || null;

      console.log('🚀 AO Core: Executing workflow:', {
        workflow_name: input.workflow_name,
        brand: input.brand,
        user_id: userId,
      });

      let query = ctx.supabase
        .from('webhook_registry')
        .select('*')
        .eq('workflow_name', input.workflow_name)
        .eq('status', 'active');

      if (input.brand) {
        query = query.eq('brand', input.brand);
      }

      const { data: webhook, error: webhookError } = await query.single();

      if (webhookError || !webhook) {
        console.error('❌ Webhook not found:', webhookError);
        throw new Error(
          `Workflow "${input.workflow_name}" not found or inactive`
        );
      }

      const { data: execution, error: executionError } = await ctx.supabase
        .from('workflow_executions')
        .insert({
          workflow_id: webhook.id,
          user_id: userId,
          input_payload: input.payload,
          status: 'pending',
        })
        .select()
        .single();

      if (executionError) {
        console.error('❌ Failed to create execution log:', executionError);
        throw new Error('Failed to log workflow execution');
      }

      console.log('📝 Execution logged:', execution.id);

      try {
        const response = await fetch(webhook.n8n_endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...input.payload,
            _meta: {
              execution_id: execution.id,
              workflow_name: input.workflow_name,
              brand: input.brand,
              user_id: userId,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        const executionTime = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ n8n workflow failed:', errorText);

          await ctx.supabase
            .from('workflow_executions')
            .update({
              status: 'failed',
              error_message: `HTTP ${response.status}: ${errorText}`,
              execution_time_ms: executionTime,
            })
            .eq('id', execution.id);

          throw new Error(
            `Workflow execution failed: HTTP ${response.status}`
          );
        }

        const result = await response.json();

        await ctx.supabase
          .from('workflow_executions')
          .update({
            status: 'success',
            output_payload: result,
            execution_time_ms: executionTime,
          })
          .eq('id', execution.id);

        console.log('✅ Workflow executed successfully:', {
          execution_id: execution.id,
          execution_time_ms: executionTime,
        });

        return {
          execution_id: execution.id,
          status: 'success' as const,
          output_payload: result,
          execution_time_ms: executionTime,
        };
      } catch (error: any) {
        const executionTime = Date.now() - startTime;

        console.error('❌ Workflow execution error:', error);

        await ctx.supabase
          .from('workflow_executions')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error',
            execution_time_ms: executionTime,
          })
          .eq('id', execution.id);

        throw new Error(`Workflow execution failed: ${error.message}`);
      }
    }),

  getWorkflowStatus: publicProcedure
    .input(z.object({ execution_id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('workflow_executions')
        .select('*, webhook_registry(workflow_name, brand)')
        .eq('id', input.execution_id)
        .single();

      if (error) {
        console.error('❌ Execution not found:', error);
        throw new Error(`Execution not found: ${error.message}`);
      }

      return data;
    }),
});
