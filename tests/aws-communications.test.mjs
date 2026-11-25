import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { generateKeyPairSync, createSign } from 'node:crypto';
import vm from 'node:vm';

const source = path => readFileSync(new URL('../supabase/functions/' + path, import.meta.url), 'utf8');
const guardCode = stripTypeScriptTypes(source('_shared/sns-guard.ts'));
const { verifySns, safeSubscribeUrl } = await import('data:text/javascript;base64,' + Buffer.from(guardCode).toString('base64'));
const topic = 'arn:aws:sns:us-east-1:875476617776:khg-ses-events';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
function signed(type = 'Notification') {
  const body = { Type: type, Message: '{}', MessageId: 'test-1', Timestamp: new Date().toISOString(), TopicArn: topic,
    SignatureVersion: '2', SigningCertURL: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-test.pem' };
  const fields = type === 'Notification' ? ['Message','MessageId','Timestamp','TopicArn','Type'] : ['Message','MessageId','SubscribeURL','Timestamp','Token','TopicArn','Type'];
  if (type !== 'Notification') { body.Token = 'test-token'; body.SubscribeURL = 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=' + encodeURIComponent(topic) + '&Token=test-token'; }
  body.Signature = createSign('RSA-SHA256').update(fields.map(k => k + '\n' + body[k] + '\n').join('')).end().sign(privateKey, 'base64');
  return body;
}
const certFetch = async () => new Response(publicKey.export({ type: 'spki', format: 'pem' }));
test('accepts a correctly signed, pinned SNS notification', async () => assert.equal(await verifySns(signed(), topic, certFetch), true));
test('rejects tampering', async () => assert.equal(await verifySns({ ...signed(), Message: 'tampered' }, topic, certFetch), false));
test('rejects another topic before fetching any certificate', async () => assert.equal(await verifySns(signed(), topic + '-other', () => { throw Error('must not fetch'); }), false));
test('rejects arbitrary certificate URLs', async () => assert.equal(await verifySns({ ...signed(), SigningCertURL: 'https://attacker.example/cert.pem' }, topic, certFetch), false));
test('rejects absent SMS topic configuration', async () => assert.equal(await verifySns(signed(), '', certFetch), false));
test('validates signed subscription and pins confirmation destination', async () => { const b = signed('SubscriptionConfirmation'); assert.equal(await verifySns(b, topic, certFetch), true); assert.ok(safeSubscribeUrl(b)); assert.equal(safeSubscribeUrl({ ...b, SubscribeURL: 'https://attacker.example/' }), null); });

function handler(slug, profile = null) {
  let serve;
  let providerCalls = 0;
  let writes = 0;
  const db = { auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, from(table) {
    const data = table === 'org_members' ? { role: 'owner', status: 'active' } : table === 'communication_sender_profiles' ? profile : table.endsWith('_consent') ? { id: 'consent' } : table.endsWith('_suppression') ? [] : null;
    const q = { select() { return q; }, eq() { return q; }, in() { return q; }, is() { return q; }, limit() { return q; }, gte() { return q; }, maybeSingle: async () => ({ data }), then(resolve) { return Promise.resolve({ data, count: 0 }).then(resolve); }, insert() { writes++; return q; }, update() { writes++; return q; } }; return q;
  }, rpc() { writes++; throw Error('dry run must not write tracking'); } };
  const code = stripTypeScriptTypes(source(slug + '/index.ts')).replace(/^import .*;\n/gm, '');
  vm.runInNewContext(code, { Response, URL, AbortSignal, Date, Set, console,
    createClient: () => db,
    SESv2Client: class { send() { providerCalls++; throw Error('unexpected send'); } },
    PinpointSMSVoiceV2Client: class { async send() { providerCalls++; return {}; } },
    SendTextMessageCommand: class { constructor(input) { assert.equal(input.DryRun, true); } },
    Deno: { serve: fn => { serve = fn; }, env: { get: key => ['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY'].includes(key) ? 'fake-test-only' : 'test' } }
  });
  return { invoke: body => serve(new Request('https://example.test', { method: 'POST', headers: { authorization: 'Bearer test' }, body: JSON.stringify(body) })), calls: () => ({ providerCalls, writes }) };
}
const payload = { brand_key: 'brand-a', to: 'test@example.com', subject: 'Test', body: 'Test', stream: 'transactional' };
for (const slug of ['email-send','sms-send']) test(slug + ' blocks production even for an authenticated owner', async () => { const h = handler(slug); assert.equal((await h.invoke(payload)).status, 423); assert.deepEqual(h.calls(), { providerCalls: 0, writes: 0 }); });
test('email refuses a missing brand sender rather than falling back', async () => { const h = handler('email-send'); assert.equal((await h.invoke({ ...payload, dry_run: true })).status, 409); assert.deepEqual(h.calls(), { providerCalls: 0, writes: 0 }); });
test('email preview accepts disabled verified own-brand profile without writes or sends', async () => { const h = handler('email-send', { id: 'p', provider: 'amazon_ses', from_address: 'brand-a@example.com', configuration_set: 'brand-a', verified: true, connection_status: 'connected', sending_enabled: false }); const r = await h.invoke({ ...payload, dry_run: true }); assert.equal(r.status, 200); const b = await r.json(); assert.equal(b.fallback_sender_used, false); assert.equal(b.production_locked, true); assert.deepEqual(h.calls(), { providerCalls: 0, writes: 0 }); });
test('SMS provider dry run does not write delivery evidence', async () => { const h = handler('sms-send', { id: 'p', provider: 'aws_end_user_messaging_sms', origination_identity: 'phone-test', configuration_set: 'brand-a', verified: true, connection_status: 'connected', sending_enabled: false }); const r = await h.invoke({ ...payload, to: '+12025550123', dry_run: true }); assert.equal(r.status, 200); assert.deepEqual(h.calls(), { providerCalls: 1, writes: 0 }); });
for (const slug of ['ses-events','sms-events']) test(slug + ' rejects unsigned events before accessing the database', async () => {
  let serve; const code = stripTypeScriptTypes(source(slug + '/index.ts')).replace(/^import .*;\n/gm, '');
  vm.runInNewContext(code, { Response, console, verifySns, safeSubscribeUrl, createClient: () => { throw Error('must reject before DB'); }, Deno: { serve: fn => { serve = fn; }, env: { get: () => '' } } });
  assert.equal((await serve(new Request('https://example.test', { method: 'POST', body: JSON.stringify({ eventType: 'Delivery', mail: { messageId: 'fake' } }) }))).status, 403);
});
