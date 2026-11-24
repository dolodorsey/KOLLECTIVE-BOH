import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';
import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2@3.1090.0';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const clean = (value: unknown, max = 500) => String(value ?? '').trim().slice(0, max);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const authorization = req.headers.get('authorization') || '';
  const jwt = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
  if (!jwt) return json({ ok: false, error: 'authentication_required' }, 401);
  const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authData.user) return json({ ok: false, error: 'invalid_session' }, 401);
  const { data: member } = await supabase.from('org_members').select('role,status').eq('user_id', authData.user.id).eq('status', 'active').in('role', ['owner', 'admin']).limit(1).maybeSingle();
  if (!member) return json({ ok: false, error: 'owner_admin_required' }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
  const brandKey = clean(body?.brand_key, 100).toLowerCase();
  const stream = body?.stream === 'transactional' ? 'transactional' : 'marketing';
  const destination = clean(body?.to, 320).toLowerCase();
  const subject = clean(body?.subject, 500);
  let messageBody = clean(body?.body, 100000);
  let htmlBody = clean(body?.html, 200000);
  const campaignKey = clean(body?.campaign_key, 160) || null;
  const contentKey = clean(body?.content_key, 160) || (campaignKey ? `email:${campaignKey}` : `email:${brandKey}`);
  const linkDestination = clean(body?.destination_url ?? body?.link_url, 2000) || null;
  const dryRun = body?.dry_run === true;
  // Production remains locked until an explicitly approved activation change.
  if (!dryRun) return json({ ok: false, error: 'production_messaging_approval_required' }, 423);
  if (!brandKey || !destination || !subject || !messageBody) return json({ ok: false, error: 'brand_key_to_subject_and_body_required' }, 400);
  if (!emailPattern.test(destination)) return json({ ok: false, error: 'invalid_email' }, 400);

  const { data: copyPolicy } = await supabase.from('outbound_copy_policy')
    .select('primary_cc,alternate_cc,active,apply_to_all_outbound,suppress_if_already_recipient')
    .eq('policy_key', 'founder-default')
    .eq('channel', 'email')
    .maybeSingle();

  const explicitCcRaw = Array.isArray(body?.cc) ? body.cc : (body?.cc ? [body.cc] : []);
  const explicitCc = explicitCcRaw.map((v: unknown) => clean(v, 320).toLowerCase()).filter((v: string) => emailPattern.test(v));
  const founderPrimary = clean(copyPolicy?.primary_cc, 320).toLowerCase();
  const founderAlternate = clean(copyPolicy?.alternate_cc, 320).toLowerCase();
  const founderAlreadyRecipient = [founderPrimary, founderAlternate].filter(Boolean).includes(destination);
  let founderCc: string | null = null;
  if (copyPolicy?.active && copyPolicy?.apply_to_all_outbound && !founderAlreadyRecipient) {
    founderCc = emailPattern.test(founderPrimary) ? founderPrimary : (emailPattern.test(founderAlternate) ? founderAlternate : null);
  }
  const ccAddresses = Array.from(new Set([
    ...explicitCc,
    ...(founderCc ? [founderCc] : [])
  ])).filter((address) => address !== destination);

  const senderBrandKey = brandKey;
  const fallbackUsed = false;
  const { data: profile, error: profileError } = await supabase.from('communication_sender_profiles')
    .select('*').eq('brand_key', brandKey).eq('channel', 'email').eq('stream', stream).maybeSingle();
  if (profileError) return json({ ok: false, error: 'sender_profile_lookup_failed' }, 500);
  if (!profile || profile.provider !== 'amazon_ses' || !profile.from_address || !profile.configuration_set)
    return json({ ok: false, error: 'brand_ses_sender_incomplete' }, 409);
  if (!profile.verified || profile.connection_status !== 'connected')
    return json({ ok: false, error: 'email_sender_not_ready' }, 409);

  const { data: suppressions } = await supabase.from('email_suppression').select('scope,brand_key,reason').eq('email_norm', destination);
  const blocked = (suppressions ?? []).find((item: any) => item.scope === 'global' || (item.scope === 'brand' && item.brand_key === brandKey));
  if (blocked) return json({ ok: false, error: 'recipient_suppressed', reason: blocked.reason }, 409);
  if (stream === 'marketing') {
    const { data: consent } = await supabase.from('email_consent').select('id').eq('email_norm', destination).eq('brand_key', brandKey).is('unsubscribed_at', null).maybeSingle();
    if (!consent) return json({ ok: false, error: 'email_marketing_consent_required' }, 409);
  }
  if (profile.daily_cap) {
    const start = new Date(); start.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase.from('communication_send_log').select('id', { count: 'exact', head: true }).eq('sender_profile_id', profile.id).eq('channel', 'email').gte('submitted_at', start.toISOString()).in('status', ['queued', 'submitted', 'accepted', 'delivered']);
    if ((count ?? 0) >= profile.daily_cap) return json({ ok: false, error: 'email_daily_cap_reached', daily_cap: profile.daily_cap }, 429);
  }

  if (dryRun) return json({ ok: true, dry_run: true, provider_validation: false,
    production_locked: true, sending_enabled: profile.sending_enabled,
    brand_key: brandKey, stream, sender: profile.from_address, sender_brand_key: brandKey,
    fallback_sender_used: false, configuration_set: profile.configuration_set,
    credentials_present: Boolean(Deno.env.get('AWS_ACCESS_KEY_ID') && Deno.env.get('AWS_SECRET_ACCESS_KEY'))
  });

  let tracking: any = null;
  const { data: trackingData, error: trackingError } = await supabase.rpc('prepare_khg_acquisition_link', {
    p_entity_key: brandKey, p_channel: 'email', p_campaign_key: campaignKey, p_content_key: contentKey,
    p_destination_url: linkDestination, p_source: 'email', p_medium: 'owned_email', p_source_system: 'email-send',
    p_source_record_id: `${brandKey}:${campaignKey || contentKey}`, p_asset_type: 'email_campaign',
    p_metadata: { stream, sender_profile_id: profile.id, sender_brand_key: senderBrandKey, fallback_sender_used: fallbackUsed }
  });
  if (!trackingError && trackingData?.ok) tracking = trackingData;
  if (tracking?.tracking_url) {
    messageBody = messageBody.replaceAll('{{KHG_TRACKING_URL}}', tracking.tracking_url);
    htmlBody = htmlBody.replaceAll('{{KHG_TRACKING_URL}}', tracking.tracking_url);
    if (body?.inject_tracking_link === true && !messageBody.includes(tracking.tracking_url)) messageBody += `\n\n${tracking.tracking_url}`;
  }

  const region = clean(Deno.env.get('AWS_SES_REGION') ?? Deno.env.get('AWS_REGION') ?? 'us-east-1', 40);
  const accessKeyId = clean(Deno.env.get('AWS_ACCESS_KEY_ID'), 200);
  const secretAccessKey = clean(Deno.env.get('AWS_SECRET_ACCESS_KEY'), 300);
  const sessionToken = clean(Deno.env.get('AWS_SESSION_TOKEN'), 2000);
  if (!accessKeyId || !secretAccessKey) return json({ ok: false, error: 'aws_ses_credentials_missing', region, tracking, sender_brand_key: senderBrandKey, fallback_sender_used: fallbackUsed }, 503);
  const client = new SESv2Client({ region, credentials: { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) } });
  if (dryRun) return json({ ok: true, dry_run: true, brand_key: brandKey, stream, sender: profile.from_address, sender_brand_key: senderBrandKey, fallback_sender_used: fallbackUsed, recipient: destination, cc: ccAddresses, founder_copy_applied: Boolean(founderCc), tracking });

  try {
    const result = await client.send(new SendEmailCommand({
      FromEmailAddress: profile.from_name ? `${profile.from_name} <${profile.from_address}>` : profile.from_address,
      Destination: { ToAddresses: [destination], ...(ccAddresses.length ? { CcAddresses: ccAddresses } : {}) }, ReplyToAddresses: profile.reply_to ? [profile.reply_to] : undefined,
      ConfigurationSetName: profile.configuration_set || undefined,
      Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: messageBody, Charset: 'UTF-8' }, ...(htmlBody ? { Html: { Data: htmlBody, Charset: 'UTF-8' } } : {}) } } },
      EmailTags: [
        { Name: 'brand_key', Value: brandKey.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 255) },
        { Name: 'sender_brand', Value: senderBrandKey.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 255) },
        { Name: 'stream', Value: stream },
        ...(campaignKey ? [{ Name: 'campaign_key', Value: campaignKey.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 255) }] : []),
        ...(tracking?.tracking_code ? [{ Name: 'khg_track', Value: String(tracking.tracking_code).slice(0,255) }] : [])
      ],
    }));
    const now = new Date().toISOString();
    await supabase.from('communication_send_log').insert({ channel: 'email', brand_key: brandKey, stream, sender_profile_id: profile.id, provider: 'amazon_ses', provider_message_id: result.MessageId ?? null, recipient: destination, status: 'accepted', subject, body_preview: messageBody.slice(0, 240), campaign_key: campaignKey, metadata: { region, configuration_set: profile.configuration_set, caller_user_id: authData.user.id, khg_tracking: tracking, sender_brand_key: senderBrandKey, fallback_sender_used: fallbackUsed, cc: ccAddresses, founder_copy_applied: Boolean(founderCc), founder_copy_policy: 'founder-default' }, submitted_at: now });
    await supabase.from('communication_sender_profiles').update({ last_send_at: now }).eq('id', profile.id);
    return json({ ok: true, provider: 'amazon_ses', message_id: result.MessageId ?? null, brand_key: brandKey, stream, sender: profile.from_address, sender_brand_key: senderBrandKey, fallback_sender_used: fallbackUsed, recipient: destination, cc: ccAddresses, founder_copy_applied: Boolean(founderCc), tracking });
  } catch (error: any) {
    const message = clean(error?.message || error?.name || 'email_send_failed', 500);
    await supabase.from('communication_send_log').insert({ channel: 'email', brand_key: brandKey, stream, sender_profile_id: profile.id, provider: 'amazon_ses', recipient: destination, status: 'failed', subject, body_preview: messageBody.slice(0, 240), campaign_key: campaignKey, error_message: message, metadata: { region, caller_user_id: authData.user.id, khg_tracking: tracking, sender_brand_key: senderBrandKey, fallback_sender_used: fallbackUsed, cc: ccAddresses, founder_copy_applied: Boolean(founderCc), founder_copy_policy: 'founder-default' } });
    return json({ ok: false, error: message, tracking, sender_brand_key: senderBrandKey, fallback_sender_used: fallbackUsed }, 502);
  }
});