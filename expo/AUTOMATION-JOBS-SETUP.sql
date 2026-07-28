-- ============================================================
-- AUTOMATION JOB CONFIGURATION FOR KOLLECTIVE BOH
-- ============================================================
-- REWRITTEN 2026-07-28. This file previously registered webhooks against
-- drdorsey.app.n8n.cloud, which is (a) a banned platform and (b) dead (404).
--
-- Every endpoint below now targets a Supabase Edge Function on the KHG
-- gateway. Deploy the function before activating its row, or the entry
-- will register a URL that 404s exactly like the n8n ones did.
--
--   Pattern:  https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-<job>
--   Register: every job also gets a row in workflows_registry
--             with runtime = 'edge_function'.
-- ============================================================

INSERT INTO webhook_registry (workflow_name, endpoint_url, brand, channel, status, metadata) VALUES

-- ============================================================
-- DR. DORSEY CORE WORKFLOWS
-- ============================================================
('Dr. Dorsey Workflow - Core Router', 
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-core-router',
 'KOLLECTIVE', 'unified', 'active',
 jsonb_build_object(
   'description', 'Main communication router for all KOLLECTIVE brands',
   'triggers', ARRAY['sms', 'email', 'dm', 'voice'],
   'priority', 'critical'
 )),

-- ============================================================
-- CASPER GROUP WORKFLOWS (Restaurant Operations)
-- ============================================================
('ANGEL WINGS - Order Processing',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-casper-angel-wings-orders',
 'ANGEL WINGS', 'orders', 'active',
 jsonb_build_object(
   'description', 'Processes online orders and sends to kitchen',
   'integration', 'Toast POS',
   'cities', ARRAY['Atlanta', 'Houston', 'Las Vegas']
 )),

('PASTA BISH - Reservation System',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-casper-pasta-bish-reservations',
 'PASTA BISH', 'reservations', 'active',
 jsonb_build_object(
   'description', 'Manages table reservations via OpenTable',
   'integration', 'OpenTable API',
   'auto_confirm', true
 )),

('CASPER GROUP - Inventory Alert',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-casper-inventory-alert',
 'CASPER GROUP', 'inventory', 'active',
 jsonb_build_object(
   'description', 'Low inventory alerts across all brands',
   'threshold', 20,
   'notification_channels', ARRAY['sms', 'slack']
 )),

('CASPER GROUP - Daily Sales Report',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-casper-daily-sales',
 'CASPER GROUP', 'reporting', 'active',
 jsonb_build_object(
   'description', 'Automated daily sales rollup',
   'schedule', '11:59 PM daily',
   'recipients', ARRAY['leadership', 'finance']
 )),

-- ============================================================
-- HUGLIFE WORKFLOWS (Event Management)
-- ============================================================
('HUGLIFE - Event Registration',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-huglife-event-registration',
 'HUGLIFE', 'registrations', 'active',
 jsonb_build_object(
   'description', 'Processes event ticket purchases',
   'payment_gateway', 'Stripe',
   'auto_send_tickets', true
 )),

('ESPRESSO - Attendee Check-In',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-huglife-espresso-checkin',
 'ESPRESSO', 'checkin', 'active',
 jsonb_build_object(
   'description', 'QR code check-in for ESPRESSO events',
   'cities', ARRAY['Washington DC', 'Los Angeles', 'Charlotte', 'Atlanta']
 )),

('HUGLIFE - Post-Event Survey',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-huglife-post-event-survey',
 'HUGLIFE', 'feedback', 'active',
 jsonb_build_object(
   'description', 'Sends automated post-event surveys',
   'delay', '24 hours',
   'platform', 'Typeform'
 )),

('HUGLIFE - VIP Guest Management',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-huglife-vip-management',
 'HUGLIFE', 'vip', 'active',
 jsonb_build_object(
   'description', 'Manages VIP guest lists and bottle service',
   'crm_integration', 'GoHighLevel',
   'priority', 'high'
 )),

-- ============================================================
-- UMBRELLA GROUP WORKFLOWS (Service Operations)
-- ============================================================
('UMBRELLA AUTO - Service Request',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-umbrella-auto-service',
 'UMBRELLA AUTO EXCHANGE', 'service_requests', 'active',
 jsonb_build_object(
   'description', 'Routes auto service requests to providers',
   'sla', '2 hours',
   'coverage_area', 'Atlanta Metro'
 )),

('UMBRELLA REALTY - Lead Capture',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-umbrella-realty-leads',
 'UMBRELLA REALTY GROUP', 'leads', 'active',
 jsonb_build_object(
   'description', 'Captures and enriches real estate leads',
   'enrichment', ARRAY['Clay', 'Clearbit'],
   'crm', 'GoHighLevel'
 )),

('UMBRELLA ACCOUNTING - Client Onboarding',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-umbrella-accounting-onboard',
 'UMBRELLA ACCOUNTING', 'onboarding', 'active',
 jsonb_build_object(
   'description', 'Automates new client onboarding process',
   'document_signing', 'DocuSign',
   'qbo_sync', true
 )),

-- ============================================================
-- THE INNER CIRCLE WORKFLOWS (App Integrations)
-- ============================================================
('GOOD TIMES - Venue Submission',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-goodtimes-venue-submission',
 'GOOD TIMES', 'venues', 'active',
 jsonb_build_object(
   'description', 'Processes new venue submissions for nightlife platform',
   'validation', ARRAY['google_places', 'instagram_check'],
   'auto_approve_threshold', 4.0
 )),

('ROADSIDE - Emergency Dispatch',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-roadside-emergency-dispatch',
 'ROADSIDE', 'emergency', 'active',
 jsonb_build_object(
   'description', 'Routes emergency roadside assistance requests',
   'priority', 'critical',
   'sla', '30 minutes',
   'twilio_integration', true
 )),

-- ============================================================
-- UNIFIED MESSAGING WORKFLOWS
-- ============================================================
('KOLLECTIVE - Unified Inbox',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-kollective-unified-inbox',
 'KOLLECTIVE', 'inbox', 'active',
 jsonb_build_object(
   'description', 'Centralized inbox for all brand communications',
   'channels', ARRAY['sms', 'email', 'instagram_dm', 'facebook_messenger'],
   'ai_routing', true,
   'ghl_integration', true
 )),

('KOLLECTIVE - Broadcast Message',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-kollective-broadcast',
 'KOLLECTIVE', 'broadcast', 'active',
 jsonb_build_object(
   'description', 'Send messages across all channels and brands',
   'rate_limiting', true,
   'personalization', 'dynamic',
   'platforms', ARRAY['SMS', 'Email', 'Push', 'WhatsApp']
 )),

-- ============================================================
-- ANALYTICS & REPORTING WORKFLOWS
-- ============================================================
('KOLLECTIVE - Weekly Analytics',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-kollective-weekly-analytics',
 'KOLLECTIVE', 'analytics', 'active',
 jsonb_build_object(
   'description', 'Automated weekly performance report',
   'schedule', 'Monday 8 AM',
   'data_sources', ARRAY['Supabase', 'Stripe', 'Google Analytics'],
   'recipients', ARRAY['leadership']
 )),

('KOLLECTIVE - Real-Time Dashboard',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-kollective-realtime-metrics',
 'KOLLECTIVE', 'realtime', 'active',
 jsonb_build_object(
   'description', 'Pushes real-time metrics to mobile dashboard',
   'update_interval', '5 minutes',
   'metrics', ARRAY['revenue', 'orders', 'events', 'alerts']
 )),

-- ============================================================
-- AUTOMATION WORKFLOWS
-- ============================================================
('KOLLECTIVE - Staff Attendance Tracker',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-kollective-attendance',
 'KOLLECTIVE', 'hr', 'active',
 jsonb_build_object(
   'description', 'Tracks staff check-in/check-out across locations',
   'geofencing', true,
   'overtime_alerts', true
 )),

('KOLLECTIVE - Social Media Auto-Post',
 'https://dzlmtvodpyhetvektfuo.supabase.co/functions/v1/khg-kollective-social-autopost',
 'KOLLECTIVE', 'social', 'active',
 jsonb_build_object(
   'description', 'Scheduled social media posting for all brands',
   'platforms', ARRAY['Instagram', 'Facebook', 'Twitter', 'TikTok'],
   'ai_caption_generation', true
 ))

ON CONFLICT (workflow_name, endpoint_url) DO UPDATE SET
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- ============================================================
-- WORKFLOW EXECUTION MONITORING
-- ============================================================

-- Create view for workflow health monitoring
CREATE OR REPLACE VIEW v_workflow_health AS
SELECT 
  wr.workflow_name,
  wr.brand,
  wr.channel,
  COUNT(we.id) as total_executions,
  COUNT(CASE WHEN we.status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as failed,
  ROUND(
    100.0 * COUNT(CASE WHEN we.status = 'success' THEN 1 END) / NULLIF(COUNT(we.id), 0),
    2
  ) as success_rate,
  AVG(we.execution_time_ms) as avg_execution_time_ms,
  MAX(we.created_at) as last_execution
FROM webhook_registry wr
LEFT JOIN workflow_executions we ON wr.id = we.workflow_id
WHERE wr.status = 'active'
  AND we.created_at > now() - interval '7 days'
GROUP BY wr.workflow_name, wr.brand, wr.channel
ORDER BY total_executions DESC;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- List all active workflows
SELECT 
  workflow_name,
  brand,
  channel,
  endpoint_url,
  metadata->>'description' as description
FROM webhook_registry
WHERE status = 'active'
ORDER BY brand, channel;

-- Workflow health dashboard
SELECT * FROM v_workflow_health
ORDER BY success_rate ASC, total_executions DESC;

-- Failed workflow executions in last 24 hours
SELECT 
  wr.workflow_name,
  wr.brand,
  we.error_message,
  we.created_at
FROM workflow_executions we
JOIN webhook_registry wr ON we.workflow_id = wr.id
WHERE we.status = 'failed'
  AND we.created_at > now() - interval '24 hours'
ORDER BY we.created_at DESC
LIMIT 50;
