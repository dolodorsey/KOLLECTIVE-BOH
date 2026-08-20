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

  firstDrafts: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('communication_first_send_drafts')
      .select(
        'id,entity_key,entity_name,draft_key,sender_brand_key,sender_from,sender_mode,subject,preheader,audience,purpose,primary_cta,destination_url,asset_refs,suppression_consent_rule,status,metadata,updated_at'
      )
      .order('entity_name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }),

  sendFirstDraft: adminProcedure
    .input(
      z.object({
        entity_key: z.string().min(1).max(100),
        to: z.string().email(),
        dry_run: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data: draft, error } = await ctx.supabase
        .from('communication_first_send_drafts')
        .select(
          'entity_key,draft_key,subject,text_body,html_body,destination_url,status,metadata'
        )
        .eq('entity_key', input.entity_key)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!draft) throw new Error('First-send draft not found');
      if (draft.status !== 'approved') throw new Error('First-send draft must be approved before sending');
      if (!draft.destination_url) throw new Error('First-send draft is missing a live CTA destination');
      if (draft.metadata?.media_hosting_status !== 'ready') {
        throw new Error('First-send draft graphic is not production-hosted yet');
      }

      const { data, error: invokeError } = await ctx.supabase.functions.invoke('email-send', {
        body: {
          brand_key: draft.entity_key,
          to: input.to,
          subject: draft.subject,
          body: draft.text_body,
          html: draft.html_body,
          stream: 'marketing',
          campaign_key: draft.draft_key,
          content_key: `email:${draft.draft_key}`,
          destination_url: draft.destination_url,
          dry_run: input.dry_run,
        },
      });
      if (invokeError) throw new Error(invokeError.message || 'Email send failed');
      if (!data?.ok) throw new Error(data?.error || 'Email send failed');
      return data;
    }),

  sendEmail: adminProcedure
    .input(
      z.object({
        brand_key: z.string().min(1),
        to: z.string().email(),
        subject: z.string().min(1).max(500),
        body: z.string().min(1).max(100000),
        html: z.string().max(200000).optional(),
        stream: z.enum(['marketing', 'transactional']).default('transactional'),
        campaign_key: z.string().max(160).optional(),
        content_key: z.string().max(160).optional(),
        destination_url: z.string().max(2000).optional(),
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
