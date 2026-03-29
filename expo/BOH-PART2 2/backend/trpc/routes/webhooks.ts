import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

export const webhooksRouter = createTRPCRouter({
  registerWebhook: publicProcedure
    .input(
      z.object({
        workflow_name: z.string(),
        n8n_endpoint: z.string().url(),
        brand: z.string().optional(),
        channel: z.string().optional(),
        status: z.enum(['active', 'inactive', 'testing']).optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('webhook_registry')
        .insert({
          workflow_name: input.workflow_name,
          n8n_endpoint: input.n8n_endpoint,
          brand: input.brand,
          channel: input.channel,
          status: input.status || 'active',
          metadata: input.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to register webhook:', error);
        throw new Error(`Failed to register webhook: ${error.message}`);
      }

      console.log('✅ Webhook registered:', data.workflow_name);
      return data;
    }),

  getWebhooks: publicProcedure
    .input(
      z
        .object({
          brand: z.string().optional(),
          status: z.enum(['active', 'inactive', 'testing']).optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase.from('webhook_registry').select('*');

      if (input?.brand) {
        query = query.eq('brand', input.brand);
      }

      if (input?.status) {
        query = query.eq('status', input.status);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        console.error('❌ Failed to fetch webhooks:', error);
        throw new Error(`Failed to fetch webhooks: ${error.message}`);
      }

      return data || [];
    }),

  getWebhookByName: publicProcedure
    .input(z.object({ workflow_name: z.string() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('webhook_registry')
        .select('*')
        .eq('workflow_name', input.workflow_name)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('❌ Webhook not found:', error);
        throw new Error(`Webhook not found: ${error.message}`);
      }

      return data;
    }),

  updateWebhook: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        n8n_endpoint: z.string().url().optional(),
        status: z.enum(['active', 'inactive', 'testing']).optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;

      const { data, error } = await ctx.supabase
        .from('webhook_registry')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update webhook:', error);
        throw new Error(`Failed to update webhook: ${error.message}`);
      }

      console.log('✅ Webhook updated:', data.workflow_name);
      return data;
    }),

  deleteWebhook: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { error } = await ctx.supabase
        .from('webhook_registry')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('❌ Failed to delete webhook:', error);
        throw new Error(`Failed to delete webhook: ${error.message}`);
      }

      console.log('✅ Webhook deleted');
      return { success: true };
    }),

  getExecutions: publicProcedure
    .input(
      z
        .object({
          workflow_id: z.string().uuid().optional(),
          user_id: z.string().uuid().optional(),
          status: z
            .enum(['pending', 'success', 'failed', 'timeout'])
            .optional(),
          limit: z.number().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      let query = ctx.supabase
        .from('workflow_executions')
        .select('*, webhook_registry(workflow_name, brand, channel)');

      if (input?.workflow_id) {
        query = query.eq('workflow_id', input.workflow_id);
      }

      if (input?.user_id) {
        query = query.eq('user_id', input.user_id);
      }

      if (input?.status) {
        query = query.eq('status', input.status);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(input?.limit || 50);

      if (error) {
        console.error('❌ Failed to fetch executions:', error);
        throw new Error(`Failed to fetch executions: ${error.message}`);
      }

      return data || [];
    }),

  getExecutionById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('workflow_executions')
        .select('*, webhook_registry(workflow_name, brand, channel)')
        .eq('id', input.id)
        .single();

      if (error) {
        console.error('❌ Execution not found:', error);
        throw new Error(`Execution not found: ${error.message}`);
      }

      return data;
    }),
});
