import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';
import { PinpointSMSVoiceV2Client, SendTextMessageCommand } from 'npm:@aws-sdk/client-pinpoint-sms-voice-v2@3.1090.0';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});
const clean = (value: unknown, max = 500) => String(value ?? '').trim().slice(0, max);
const phonePattern = /^\+[1-9]\d{7,14}$/;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const authorization = req.headers.get('authorization') || '';
  const jwt = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
  if (!jwt) return json({ ok: false, error: 'authentication_required' }, 401);

  const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authData.user) return json({ ok: false, error: 'invalid_session' }, 401);

  const { data: member } = await supabase
    .from('org_members')
    .select('role,status')
    .eq('user_id', authData.user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])
    .limit(1)
    .maybeSingle();
  if (!member) return json({ ok: false, error: 'owner_admin_required' }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  const brandKey = clean(body?.brand_key, 100).toLowerCase();
  const stream = body?.stream === 'transactional' ? 'transactional' : 'marketing';
  const destination = clean(body?.to, 32);
  const messageBody = clean(body?.body, 1600);
  const campaignKey = clean(body?.campaign_key, 160) || null;
  const dryRun = body?.dry_run === true;
  if (!dryRun) return json({ ok: false, error: 'production_messaging_approval_required' }, 423);

  if (!brandKey || !destination || !messageBody) return json({ ok: false, error: 'brand_key_to_and_body_required' }, 400);
  if (!phonePattern.test(destination)) return json({ ok: false, error: 'destination_must_be_e164' }, 400);

  const { data: profile, error: profileError } = await supabase
    .from('communication_sender_profiles')
    .select('*')
    .eq('brand_key', brandKey)
    .eq('channel', 'sms')
    .eq('stream', stream)
    .maybeSingle();

  if (profileError) return json({ ok: false, error: 'sender_profile_lookup_failed' }, 500);
  if (!profile) return json({ ok: false, error: 'sms_sender_profile_missing' }, 404);
  if (profile.provider !== 'aws_end_user_messaging_sms' || !profile.verified || profile.connection_status !== 'connected') {
    return json({ ok: false, error: 'sms_sender_not_ready', connection_status: profile.connection_status }, 409);
  }
  if (!profile.origination_identity || !profile.configuration_set) return json({ ok: false, error: 'sms_sender_incomplete' }, 409);

  const { data: suppressions } = await supabase
    .from('sms_suppression')
    .select('scope,brand_key,reason')
    .eq('phone_e164', destination);
  const blocked = (suppressions ?? []).find((item: any) => item.scope === 'global' || (item.scope === 'brand' && item.brand_key === brandKey));
  if (blocked) return json({ ok: false, error: 'recipient_suppressed', reason: blocked.reason }, 409);

  if (stream === 'marketing') {
    const { data: consent } = await supabase
      .from('sms_consent')
      .select('id')
      .eq('phone_e164', destination)
      .eq('brand_key', brandKey)
      .is('opted_out_at', null)
      .maybeSingle();
    if (!consent) return json({ ok: false, error: 'sms_marketing_consent_required' }, 409);
  }

  if (profile.daily_cap) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('communication_send_log')
      .select('id', { count: 'exact', head: true })
      .eq('sender_profile_id', profile.id)
      .eq('channel', 'sms')
      .gte('submitted_at', start.toISOString())
      .in('status', ['queued', 'submitted', 'accepted', 'delivered']);
    if ((count ?? 0) >= profile.daily_cap) return json({ ok: false, error: 'sms_daily_cap_reached', daily_cap: profile.daily_cap }, 429);
  }

  const region = clean(Deno.env.get('AWS_SMS_REGION') ?? Deno.env.get('AWS_REGION') ?? 'us-east-1', 40);
  const accessKeyId = clean(Deno.env.get('AWS_ACCESS_KEY_ID'), 200);
  const secretAccessKey = clean(Deno.env.get('AWS_SECRET_ACCESS_KEY'), 300);
  const sessionToken = clean(Deno.env.get('AWS_SESSION_TOKEN'), 2000);
  if (!accessKeyId || !secretAccessKey) return json({ ok: false, error: 'aws_sms_credentials_missing', region }, 503);

  const client = new PinpointSMSVoiceV2Client({
    region,
    credentials: { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) },
  });

  try {
    const result = await client.send(new SendTextMessageCommand({
      DestinationPhoneNumber: destination,
      MessageBody: messageBody,
      MessageType: stream === 'transactional' ? 'TRANSACTIONAL' : 'PROMOTIONAL',
      OriginationIdentity: profile.origination_identity,
      ConfigurationSetName: profile.configuration_set,
      DryRun: dryRun,
      TimeToLive: Number(profile.metadata?.time_to_live_seconds ?? 259200),
      ...(profile.metadata?.protect_configuration_id ? { ProtectConfigurationId: profile.metadata.protect_configuration_id } : {}),
      Context: {
        brand_key: brandKey,
        stream,
        sender_profile_id: profile.id,
        configuration_set: profile.configuration_set,
        caller_user_id: authData.user.id,
        ...(campaignKey ? { campaign_key: campaignKey } : {}),
      },
    }));

    const messageId = result.MessageId ?? null;
    if (dryRun) return json({ ok: true, dry_run: true, provider: 'aws_end_user_messaging_sms', provider_validation: true, brand_key: brandKey, stream });
    const now = new Date().toISOString();
    await supabase.from('communication_send_log').insert({
      channel: 'sms', brand_key: brandKey, stream, sender_profile_id: profile.id,
      provider: 'aws_end_user_messaging_sms', provider_message_id: messageId,
      recipient: destination, status: dryRun ? 'submitted' : 'accepted',
      body_preview: messageBody.slice(0, 240), campaign_key: campaignKey,
      metadata: { dry_run: dryRun, region, configuration_set: profile.configuration_set, caller_user_id: authData.user.id },
      submitted_at: now,
    });
    await supabase.from('communication_sender_profiles').update({ last_send_at: now }).eq('id', profile.id);
    return json({ ok: true, provider: 'aws_end_user_messaging_sms', message_id: messageId, brand_key: brandKey, stream, dry_run: dryRun });
  } catch (error: any) {
    const message = clean(error?.message || error?.name || 'sms_send_failed', 500);
    await supabase.from('communication_send_log').insert({
      channel: 'sms', brand_key: brandKey, stream, sender_profile_id: profile.id,
      provider: 'aws_end_user_messaging_sms', recipient: destination, status: 'failed',
      body_preview: messageBody.slice(0, 240), campaign_key: campaignKey,
      error_message: message, metadata: { dry_run: dryRun, region, caller_user_id: authData.user.id },
    });
    return json({ ok: false, error: message }, 502);
  }
});
