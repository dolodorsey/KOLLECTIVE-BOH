import { verifySns, safeSubscribeUrl } from '../_shared/sns-guard.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.2';

const BRAND_MAP: Record<string, string> = {
  'khg-dr-dorsey': 'dolodorsey',
  'khg-kollective': 'kollectivehospitality',
  'khg-casper-group': 'thecaspergroupworldwide',
  'khg-good-times': 'goodtimesworldwide',
  'khg-maga': 'makeatlantagreatagain',
  'khg-help-911': 'help911help',
  'khg-on-call': 'oncallallday',
  'khg-bodega': 'bodega',
  'khg-stush': 'stush',
  'khg-sos': 'sos',
};

function firstTag(mail: any, name: string): string | null {
  const value = mail?.tags?.[name];
  if (Array.isArray(value)) return value[0] ?? null;
  if (typeof value === 'string') return value;
  return null;
}

function parseConfigSet(cs: string | null) {
  if (!cs) return { brand_key: null, stream: null };
  const match = cs.match(/^(khg-.+)-(transactional|marketing)$/);
  if (!match) return { brand_key: null, stream: null };
  return { brand_key: BRAND_MAP[match[1]] ?? match[1], stream: match[2] };
}

function extract(ev: any) {
  const type = ev.eventType ?? ev.notificationType;
  switch (type) {
    case 'Bounce': {
      const recipient = ev.bounce?.bouncedRecipients?.[0] ?? {};
      return {
        recipients: (ev.bounce?.bouncedRecipients ?? []).map((item: any) => item.emailAddress),
        at: ev.bounce?.timestamp,
        bounce_type: ev.bounce?.bounceType ?? null,
        bounce_subtype: ev.bounce?.bounceSubType ?? null,
        diagnostic_code: recipient.diagnosticCode ?? null,
        complaint_feedback_type: null,
      };
    }
    case 'Complaint':
      return {
        recipients: (ev.complaint?.complainedRecipients ?? []).map((item: any) => item.emailAddress),
        at: ev.complaint?.timestamp,
        bounce_type: null,
        bounce_subtype: null,
        diagnostic_code: null,
        complaint_feedback_type: ev.complaint?.complaintFeedbackType ?? null,
      };
    case 'Delivery':
      return {
        recipients: ev.delivery?.recipients ?? [],
        at: ev.delivery?.timestamp,
        bounce_type: null,
        bounce_subtype: null,
        diagnostic_code: null,
        complaint_feedback_type: null,
      };
    case 'DeliveryDelay':
      return {
        recipients: (ev.deliveryDelay?.delayedRecipients ?? []).map((item: any) => item.emailAddress),
        at: ev.deliveryDelay?.timestamp,
        bounce_type: null,
        bounce_subtype: null,
        diagnostic_code: ev.deliveryDelay?.delayType ?? null,
        complaint_feedback_type: null,
      };
    default:
      return {
        recipients: ev.mail?.destination ?? [],
        at: ev.mail?.timestamp,
        bounce_type: null,
        bounce_subtype: null,
        diagnostic_code: null,
        complaint_feedback_type: null,
      };
  }
}

function sendLogStatus(eventType: string) {
  if (eventType === 'Delivery') return 'delivered';
  if (eventType === 'Reject') return 'rejected';
  if (eventType === 'Bounce' || eventType === 'Complaint' || eventType === 'RenderingFailure') return 'failed';
  if (eventType === 'Send') return 'accepted';
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

  const expectedTopic = 'arn:aws:sns:us-east-1:875476617776:khg-ses-events';
  if (!await verifySns(body, expectedTopic)) return new Response('invalid SNS origin', { status: 403 });
  if (body.Type === 'SubscriptionConfirmation') {
    const url = safeSubscribeUrl(body);
    if (!url) return new Response('invalid subscription URL', { status: 403 });
    const confirmation = await fetch(url, { redirect: 'error' });
    return new Response(confirmation.ok ? 'subscription confirmed' : 'confirmation failed', { status: confirmation.ok ? 200 : 502 });
  }
  if (body.Type !== 'Notification') return new Response('ignored', { status: 200 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let event: any = body;
  if (typeof body.Message === 'string') {
    try {
      event = JSON.parse(body.Message);
    } catch {
      event = body;
    }
  }

  const eventType = event.eventType ?? event.notificationType;
  if (!eventType) return new Response('no event type', { status: 200 });

  const mail = event.mail ?? {};
  const configurationSet = firstTag(mail, 'ses:configuration-set');
  const parsed = parseConfigSet(configurationSet);
  let brandKey = parsed.brand_key ?? firstTag(mail, 'brand') ?? firstTag(mail, 'brand_key');
  let stream = parsed.stream ?? firstTag(mail, 'stream');

  const source: string = mail.source ?? '';
  if ((!brandKey || !stream) && source) {
    let query = supabase
      .from('communication_sender_profiles')
      .select('brand_key,stream')
      .eq('channel', 'email')
      .eq('from_address', source.toLowerCase())
      .limit(1);
    if (stream) query = query.eq('stream', stream);
    const { data: profile } = await query.maybeSingle();
    brandKey = brandKey ?? profile?.brand_key ?? null;
    stream = stream ?? profile?.stream ?? null;
  }

  const details = extract(event);
  const fromDomain = source.includes('@') ? source.split('@').pop()! : null;
  const eventAt = details.at ?? mail.timestamp ?? new Date().toISOString();
  const recipients = details.recipients.length ? details.recipients : [null];

  const rows = recipients.map((recipient: string | null) => ({
    ses_message_id: mail.messageId ?? 'unknown',
    event_type: eventType,
    brand_key: brandKey,
    configuration_set: configurationSet,
    stream,
    from_address: source || null,
    from_domain: fromDomain,
    recipient,
    subject: mail.commonHeaders?.subject ?? null,
    event_at: eventAt,
    bounce_type: details.bounce_type,
    bounce_subtype: details.bounce_subtype,
    complaint_feedback_type: details.complaint_feedback_type,
    diagnostic_code: details.diagnostic_code,
    raw: event,
  }));

  const { error } = await supabase.from('email_events').upsert(rows, {
    onConflict: 'ses_message_id,event_type,recipient,event_at',
    ignoreDuplicates: true,
  });

  if (error) {
    console.error('email event insert failed', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (brandKey) {
    let profileUpdate = supabase
      .from('communication_sender_profiles')
      .update({
        last_event_at: eventAt,
      })
      .eq('brand_key', brandKey)
      .eq('channel', 'email');
    if (stream) profileUpdate = profileUpdate.eq('stream', stream);
    await profileUpdate;
  }

  const logStatus = sendLogStatus(eventType);
  if (logStatus && mail.messageId) {
    await supabase
      .from('communication_send_log')
      .update({ status: logStatus, updated_at: new Date().toISOString() })
      .eq('provider_message_id', mail.messageId).eq('channel', 'email').eq('brand_key', brandKey).eq('stream', stream);
  }

  return new Response(JSON.stringify({
    ok: true,
    inserted: rows.length,
    brand_key: brandKey,
    stream,
    configuration_set: configurationSet,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
