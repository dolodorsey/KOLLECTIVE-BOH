import * as z from 'zod';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '../create-context';

export const communicationsRouter = createTRPCRouter({
  senders: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('communication_sender_profiles')
      .select(
        'id,brand_key,channel,stream,provider,from_address,from_name,reply_to,origination_identity,verified,sending_enabled,connection_status,daily_cap,last_verified_at,last_send_at'
      )
      .order('brand_key', { ascending: true })
      .order('channel', { ascending: true })
      .order('stream', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }),

  sendEmail: adminProcedure
    .input(
      z.object({
        brand_key: z.string().min(1),
        to: z.string().email(),
        subject: z.string().min(1).max(500),
        body: z.string().min(1).max(100000),
        stream: z.enum(['marketing', 'transactional']).default('transactional'),
        campaign_key: z.string().max(160).optional(),
        dry_run: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase.functions.invoke('email-send', { body: input });
      if (error) throw new Error(error.message || 'Email send failed');
      if (!data?.ok) throw new Error(data?.error || 'Email send failed');
      return data;
    }),

  sendSms: adminProcedure
    .input(
      z.object({
        brand_key: z.string().min(1),
        to: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 phone format'),
        body: z.string().min(1).max(1600),
        stream: z.enum(['marketing', 'transactional']).default('transactional'),
        campaign_key: z.string().max(160).optional(),
        dry_run: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase.functions.invoke('sms-send', { body: input });
      if (error) throw new Error(error.message || 'SMS send failed');
      if (!data?.ok) throw new Error(data?.error || 'SMS send failed');
      return data;
    }),
});
