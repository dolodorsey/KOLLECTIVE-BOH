# AWS Communications integration — 2026-11-24

Status: infrastructure audited; safety repairs deployed; access setup and delivery integration blocked pending security-access confirmation. Production messaging remains disabled.

## Verified environment
- AWS account 875476617776, region us-east-1; authenticated console and CloudShell.
- Supabase KOLLECTIVE BOH wfkohcwxxsrhcxhepfql is ACTIVE_HEALTHY.
- Repository dolodorsey/KOLLECTIVE-BOH, base 6040e79dc5a7b0532d8e507df6c87c75d28ab063.
- 75 sender profiles across 30 distinct brand keys (includes historical aliases). All 75 sending_enabled=false.
- Sender profiles, send logs, email events and SMS events have RLS enabled.
- No AWS sends or email/SMS delivery events are recorded in BOH. Historical GHL/Gmail records are not AWS delivery evidence.

## Changes executed
- email-send v8: unconditional production lock (423 for authenticated non-preview requests); exact brand sender required; cross-brand fallback removed. Preview does not create tracking links or send evidence.
- sms-send v6: unconditional production lock; AWS provider dry runs do not update last_send_at or write delivery evidence.
- ses-events v7 / sms-events v6: validate RSA SNS signature, exact allowed topic and AWS certificate origin before database access; pin subscription confirmation URL; do not promote a sender to verified/connected from delivery events; scope send-log updates by channel, brand and stream.
- Corrected two historical SOS SES profiles from obsolete thesuperherosonstandby.com to existing brand-owned reply@superherosonstandby.com. Official domain is unverified in SES, so both remain unverified/disabled.
- Quarantined AWS SMS profiles sharing the single pending toll-free origin; retained original values and recorded the blocker. No numbers assigned across brands.
- Created 22 SMS configuration sets: marketing and transactional for each of dr-dorsey, kollective, casper-group, good-times, maga, help-911, on-call, bodega, stush, sos and thepinkypromiseatl. No phone purchase, registration submission or messaging activation.

## Provider audit
| Area | Verified state |
| --- | --- |
| SES | Sandbox; healthy; 200 emails/24h; 1 email/second; 0 sent today |
| SES configuration sets | 21 existing; 0 event destinations |
| SES identities | Verified domains include doctordorsey.com, thekollectivehospitality.com, thegoodtimesworldwide.com, caspergroupworldwide.com, bodegabodegabodega.com, stushusa.com, thaoldatlanta.com, help911.help, oncallallday.com |
| SOS official domain | superherosonstandby.com unverified |
| SNS | khg-ses-events exists; 0 subscriptions; its policy incorrectly references a .fifo resource |
| SMS | Sandbox; text-message monthly enforced/max limit USD 1 |
| SMS origin | One toll-free number PENDING; no pool |
| Registration | Its associated toll-free registration CREATED (not submitted); a separate 10DLC brand registration COMPLETE; short-code registration REQUIRES_UPDATES |
| Billing | Cost Explorer read denied: account not enabled for Cost Explorer access. Actual month-to-date cost is not verified |
| BOH budgets | All 75 sender profile monthly_budget fields unset |
| IAM | list-users returned no IAM users; no new integration identity/key created in this task |
| Secrets | No AWS CLI credentials locally. Supabase Edge secret inventory/values not inspected; no new AWS credentials stored |

## Validation
- node --test tests/aws-communications.test.mjs: 13 tests passed.
- Tests cover valid RSA signatures, tampering, topic/certificate pinning, subscription URL safety, unsigned webhook rejection, production holds, missing brand sender refusal, side-effect-free email preview and non-delivery SMS dry run.
- Live deployed HTTP tests through authenticated AWS CloudShell: unsigned ses-events/sms-events return 403; unauthenticated email-send/sms-send return 401.
- Supabase post-test readback: AWS send rows=0; email events=0; SMS events=0; enabled profiles=0.
- This is not successful end-to-end delivery testing. No real or simulator message was sent.

## Concrete access change awaiting confirmation
Create programmatic IAM user kollective-communications-integration with ops/aws/kollective-communications-readiness-policy.json; no console password, no IAM administration, no purchases, us-east-1 readiness reads only, explicit deny on SES/SMS/SNS sends. Store its key only in Supabase server-side Edge secrets, never public tables, browser clients or GitHub.

Repair the SES SNS policy to its actual non-FIFO ARN with tightly scoped SES service publishing permission (source account 875476617776 and khg-* configuration set ARNs); connect its signed HTTPS webhook; configure SES event destinations. SMS additionally needs a dedicated tracking topic with tightly scoped service permissions and its topic ARN in server-side secrets before the currently closed SMS webhook will accept events.

These operations create persistent security-sensitive access and require action-time confirmation under computer-use policy. Credential entry may require a secure user handoff. Production sending and provider test messages require separate explicit approval, including exact sender, recipient and content.

## Outstanding dependencies
- Secure IAM creation / credential storage, then STS and read-only provider validation.
- SNS policy repair and signed subscription confirmation; positive delivery-event integration test.
- Independent approved SMS origination resources per brand (no new number purchase authorized).
- SOS DNS verification. Do not substitute the obsolete domain.
- Explicit per-brand budget and production approval before any activation.
- Rate limits and budgets need atomic reservation/enforcement before releasing the hard production lock. Existing count-then-send caps and nullable budgets are not a complete spending control.
- Preserve each brand's independent consent and suppression data; no audience migrations or merges occurred.

Rollback: deployed prior versions email-send v7, sms-send v5, ses-events v6 and sms-events v5 are available through Supabase deployment history. Reverting them restores the security gaps; prefer targeted forward fixes. New SMS configuration sets have no origins/event destinations and emit no messages.
