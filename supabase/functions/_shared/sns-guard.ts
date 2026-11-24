import { createVerify } from 'node:crypto';

export async function verifySns(body: any, expectedTopic: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    if (!expectedTopic || body.TopicArn !== expectedTopic) return false;
    const topic = expectedTopic.match(/^arn:aws:sns:([a-z0-9-]+):875476617776:[A-Za-z0-9_-]+$/);
    if (!topic || !['Notification', 'SubscriptionConfirmation', 'UnsubscribeConfirmation'].includes(body.Type)) return false;
    if (!['1', '2'].includes(body.SignatureVersion)) return false;
    const url = new URL(body.SigningCertURL);
    if (url.protocol !== 'https:' || url.hostname !== `sns.${topic[1]}.amazonaws.com` ||
        url.port || url.username || url.password || url.search || url.hash ||
        !/^\/SimpleNotificationService-[A-Za-z0-9_-]+\.pem$/.test(url.pathname)) return false;
    const fields = body.Type === 'Notification'
      ? ['Message', 'MessageId', ...(body.Subject !== undefined ? ['Subject'] : []), 'Timestamp', 'TopicArn', 'Type']
      : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
    if (fields.some(k => typeof body[k] !== 'string' || !body[k])) return false;
    const response = await fetcher(url.toString(), { redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const cert = await response.text();
    if (cert.length > 20000) return false;
    const verifier = createVerify(body.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1');
    verifier.update(fields.map(k => k + '\n' + body[k] + '\n').join(''));
    verifier.end();
    return verifier.verify(cert, body.Signature, 'base64');
  } catch { return false; }
}

export function safeSubscribeUrl(body: any): string | null {
  try {
    const region = body.TopicArn.split(':')[3];
    const u = new URL(body.SubscribeURL);
    if (u.protocol !== 'https:' || u.hostname !== `sns.${region}.amazonaws.com` || u.port ||
        u.username || u.password || u.pathname !== '/' || u.hash ||
        u.searchParams.get('Action') !== 'ConfirmSubscription' ||
        u.searchParams.get('TopicArn') !== body.TopicArn ||
        u.searchParams.get('Token') !== body.Token) return null;
    return u.toString();
  } catch { return null; }
}
