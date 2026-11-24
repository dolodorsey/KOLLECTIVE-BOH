import { verifySns, safeSubscribeUrl } from '../_shared/sns-guard.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';

function toIso(value: unknown): string {
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && value.trim() !== '') return new Date(numeric).toISOString();
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function logStatus(status: string | null) {
  if (!status) return null;
  if (status === 'DELIVERED' || status === 'SUCCESSFUL') return 'delivered';
  if (status === 'ACCEPTED' || status === 'SENT' || status === 'QUEUED' || status === 'PENDING') return 'accepted';
  if (status === 'INVALID' || status === 'PROTECT_BLOCKED' || status === 'CARRIER_BLOCKED') return 'blocked';
  if (status === 'FAILED' || status === 'UNROUTABLE' || status === 'TTL_EXPIRED' || status === 'UNREACHABLE') return 'failed';
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  const raw = await req.text();
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response('bad json', { status: 400 });
  }

  const expectedTopic = Deno.env.get('AWS_SMS_EVENTS_TOPIC_ARN') || '';
  if (!await verifySns(body, expectedTopic)) return new Response('invalid SNS origin', { status: 403 });
  if (body.Type === 'SubscriptionConfirmation') {
    const url = safeSubscribeUrl(body);
    if (!url) return new Response('invalid subscription URL', { status: 403 });
    const confirmation = await fetch(url, { redirect: 'error' });
    return new Response(confirmation.ok ? 'subscription confirmed' : 'confirmation failed', { status: confirmation.ok ? 200 : 502 });
  }
  if (body.Type !== 'Notification') return new Response('ignored', { status: 200 });

  let event: any = body;
  if (typeof body.Message === 'string') {
    try {
      event = JSON.parse(body.Message);
    } catch {
      event = body;
    }
  }

  const eventType = String(event.eventType ?? 'UNKNOWN');
  const messageId = String(event.messageId ?? event.messageID ?? '');
  if (!messageId) return new Response('no message id', { status: 200 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const context = event.context && typeof event.context === 'object' ? event.context : {};
  let brandKey = context.brand_key ?? context.brand ?? null;
  let stream = context.stream ?? null;
  let configurationSet = context.configuration_set ?? context.configurationSet ?? null;
  let senderProfileId = context.sender_profile_id ?? null;

  if (!senderProfileId && (configurationSet || event.originationPhoneNumber)) {
    let query = supabase
      .from('communication_sender_profiles')
      .select('id,brand_key,stream,configuration_set')
      .eq('channel', 'sms')
      .limit(1);
    if (configurationSet) query = query.eq('configuration_set', configurationSet);
    else query = query.eq('origination_identity', event.originationPhoneNumber);
    const { data: profile } = await query.maybeSingle();
    senderProfileId = profile?.id ?? null;
    brandKey = brandKey ?? profile?.brand_key ?? null;
    stream = stream ?? profile?.stream ?? null;
    configurationSet = configurationSet ?? profile?.configuration_set ?? null;
  }

  const eventAt = toIso(event.eventTimestamp ?? event.messageRequestTimestamp);
  const status = event.messageStatus ? String(event.messageStatus).toUpperCase() : null;

  const row = {
    aws_message_id: messageId,
    event_type: eventType,
    message_status: status,
    brand_key: brandKey,
    configuration_set: configurationSet,
    stream,
    sender_profile_id: senderProfileId,
    origination_identity: event.originationPhoneNumber ?? null,
    destination_phone: event.destinationPhoneNumber ?? null,
    event_at: eventAt,
    is_final: typeof event.isFinal === 'boolean' ? event.isFinal : null,
    message_type: event.messageType ?? null,
    status_description: event.messageStatusDescription ?? null,
    total_message_parts: event.totalMessageParts ?? null,
    total_message_price: event.totalMessagePrice ?? null,
    total_carrier_fee: event.totalCarrierFee ?? null,
    context,
    raw: event,
  };

  const { error } = await supabase.from('sms_events').insert(row);
  if (error && error.code !== '23505') {
    console.error('sms event insert failed', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (senderProfileId || brandKey) {
    let update = supabase
      .from('communication_sender_profiles')
      .update({ last_event_at: eventAt })
      .eq('channel', 'sms');
    if (senderProfileId) update = update.eq('id', senderProfileId);
    else {
      update = update.eq('brand_key', brandKey);
      if (stream) update = update.eq('stream', stream);
    }
    await update;
  }

  const mappedStatus = logStatus(status);
  if (mappedStatus) {
    await supabase
      .from('communication_send_log')
      .update({ status: mappedStatus, updated_at: new Date().toISOString() })
      .eq('provider_message_id', messageId).eq('channel', 'sms').eq('brand_key', brandKey).eq('stream', stream);
  }

  if (event.destinationPhoneNumber && (status === 'INVALID' || status === 'PROTECT_BLOCKED')) {
    const { error: suppressionError } = await supabase.from('sms_suppression').insert({
      phone_e164: event.destinationPhoneNumber,
      reason: status === 'INVALID' ? 'invalid' : 'protect_blocked',
      brand_key: brandKey,
      scope: brandKey ? 'brand' : 'global',
      source_message_id: messageId,
      detail: event.messageStatusDescription ?? null,
      suppressed_at: eventAt,
    });
    if (suppressionError && suppressionError.code !== '23505') {
      console.error('sms suppression insert failed', suppressionError.message);
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    duplicate: error?.code === '23505',
    message_id: messageId,
    brand_key: brandKey,
    stream,
    status,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
