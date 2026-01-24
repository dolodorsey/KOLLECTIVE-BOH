-- ============================================================
-- N8N WORKFLOW CONFIGURATION FOR KOLLECTIVE
-- Integrates with existing n8n instance at drdorsey.app.n8n.cloud
-- ============================================================

-- First, insert webhook registry entries for all KOLLECTIVE workflows

INSERT INTO webhook_registry (workflow_name, n8n_endpoint, brand, channel, status, metadata) VALUES

-- ============================================================
-- DR. DORSEY CORE WORKFLOWS
-- ============================================================
('Dr. Dorsey Workflow - Core Router', 
 'https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179',
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
 'https://drdorsey.app.n8n.cloud/webhook/casper-angel-wings-orders',
 'ANGEL WINGS', 'orders', 'active',
 jsonb_build_object(
   'description', 'Processes online orders and sends to kitchen',
   'integration', 'Toast POS',
   'cities', ARRAY['Atlanta', 'Houston', 'Las Vegas']
 )),

('PASTA BISH - Reservation System',
 'https://drdorsey.app.n8n.cloud/webhook/casper-pasta-bish-reservations',
 'PASTA BISH', 'reservations', 'active',
 jsonb_build_object(
   'description', 'Manages table reservations via OpenTable',
   'integration', 'OpenTable API',
   'auto_confirm', true
 )),

('CASPER GROUP - Inventory Alert',
 'https://drdorsey.app.n8n.cloud/webhook/casper-inventory-alert',
 'CASPER GROUP', 'inventory', 'active',
 jsonb_build_object(
   'description', 'Low inventory alerts across all brands',
   'threshold', 20,
   'notification_channels', ARRAY['sms', 'slack']
 )),

('CASPER GROUP - Daily Sales Report',
 'https://drdorsey.app.n8n.cloud/webhook/casper-daily-sales',
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
 'https://drdorsey.app.n8n.cloud/webhook/huglife-event-registration',
 'HUGLIFE', 'registrations', 'active',
 jsonb_build_object(
   'description', 'Processes event ticket purchases',
   'payment_gateway', 'Stripe',
   'auto_send_tickets', true
 )),

('ESPRESSO - Attendee Check-In',
 'https://drdorsey.app.n8n.cloud/webhook/huglife-espresso-checkin',
 'ESPRESSO', 'checkin', 'active',
 jsonb_build_object(
   'description', 'QR code check-in for ESPRESSO events',
   'cities', ARRAY['Washington DC', 'Los Angeles', 'Charlotte', 'Atlanta']
 )),

('HUGLIFE - Post-Event Survey',
 'https://drdorsey.app.n8n.cloud/webhook/huglife-post-event-survey',
 'HUGLIFE', 'feedback', 'active',
 jsonb_build_object(
   'description', 'Sends automated post-event surveys',
   'delay', '24 hours',
   'platform', 'Typeform'
 )),

('HUGLIFE - VIP Guest Management',
 'https://drdorsey.app.n8n.cloud/webhook/huglife-vip-management',
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
 'https://drdorsey.app.n8n.cloud/webhook/umbrella-auto-service',
 'UMBRELLA AUTO EXCHANGE', 'service_requests', 'active',
 jsonb_build_object(
   'description', 'Routes auto service requests to providers',
   'sla', '2 hours',
   'coverage_area', 'Atlanta Metro'
 )),

('UMBRELLA REALTY - Lead Capture',
 'https://drdorsey.app.n8n.cloud/webhook/umbrella-realty-leads',
 'UMBRELLA REALTY GROUP', 'leads', 'active',
 jsonb_build_object(
   'description', 'Captures and enriches real estate leads',
   'enrichment', ARRAY['Clay', 'Clearbit'],
   'crm', 'GoHighLevel'
 )),

('UMBRELLA ACCOUNTING - Client Onboarding',
 'https://drdorsey.app.n8n.cloud/webhook/umbrella-accounting-onboard',
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
 'https://drdorsey.app.n8n.cloud/webhook/goodtimes-venue-submission',
 'GOOD TIMES', 'venues', 'active',
 jsonb_build_object(
   'description', 'Processes new venue submissions for nightlife platform',
   'validation', ARRAY['google_places', 'instagram_check'],
   'auto_approve_threshold', 4.0
 )),

('ROADSIDE - Emergency Dispatch',
 'https://drdorsey.app.n8n.cloud/webhook/roadside-emergency-dispatch',
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
 'https://drdorsey.app.n8n.cloud/webhook/kollective-unified-inbox',
 'KOLLECTIVE', 'inbox', 'active',
 jsonb_build_object(
   'description', 'Centralized inbox for all brand communications',
   'channels', ARRAY['sms', 'email', 'instagram_dm', 'facebook_messenger'],
   'ai_routing', true,
   'ghl_integration', true
 )),

('KOLLECTIVE - Broadcast Message',
 'https://drdorsey.app.n8n.cloud/webhook/kollective-broadcast',
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
 'https://drdorsey.app.n8n.cloud/webhook/kollective-weekly-analytics',
 'KOLLECTIVE', 'analytics', 'active',
 jsonb_build_object(
   'description', 'Automated weekly performance report',
   'schedule', 'Monday 8 AM',
   'data_sources', ARRAY['Supabase', 'Stripe', 'Google Analytics'],
   'recipients', ARRAY['leadership']
 )),

('KOLLECTIVE - Real-Time Dashboard',
 'https://drdorsey.app.n8n.cloud/webhook/kollective-realtime-metrics',
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
 'https://drdorsey.app.n8n.cloud/webhook/kollective-attendance',
 'KOLLECTIVE', 'hr', 'active',
 jsonb_build_object(
   'description', 'Tracks staff check-in/check-out across locations',
   'geofencing', true,
   'overtime_alerts', true
 )),

('KOLLECTIVE - Social Media Auto-Post',
 'https://drdorsey.app.n8n.cloud/webhook/kollective-social-autopost',
 'KOLLECTIVE', 'social', 'active',
 jsonb_build_object(
   'description', 'Scheduled social media posting for all brands',
   'platforms', ARRAY['Instagram', 'Facebook', 'Twitter', 'TikTok'],
   'ai_caption_generation', true
 ))

ON CONFLICT (workflow_name, n8n_endpoint) DO UPDATE SET
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
  n8n_endpoint,
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
