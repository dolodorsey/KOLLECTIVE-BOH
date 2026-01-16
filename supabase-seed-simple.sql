-- KOLLECTIVE BOH - Simple Seed Data (Matches Actual Schema)
-- Run this in Supabase SQL Editor
-- Last Updated: January 16, 2026

-- ============================================================================
-- STEP 0: Create alerts table if it doesn't exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view alerts in their org"
  ON alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entities e
      JOIN org_members om ON om.org_id = e.org_id
      WHERE e.id = alerts.entity_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- ============================================================================
-- STEP 1: Insert Profiles (3 test users)
-- Using fixed UUIDs for predictable relationships
-- ============================================================================
INSERT INTO profiles (id, email, full_name, avatar_url, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john.owner@kollective.com', 'John Owner', NULL, NOW() - INTERVAL '90 days'),
  ('22222222-2222-2222-2222-222222222222', 'sarah.manager@kollective.com', 'Sarah Manager', NULL, NOW() - INTERVAL '60 days'),
  ('33333333-3333-3333-3333-333333333333', 'mike.staff@kollective.com', 'Mike Staff', NULL, NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- ============================================================================
-- STEP 2: Insert Organization (1 test org)
-- ============================================================================
INSERT INTO organizations (id, name, slug, created_by, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kollective Hospitality Group', 'kollective-hg', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '90 days')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- ============================================================================
-- STEP 3: Insert Org Members (link users to org)
-- ============================================================================
INSERT INTO org_members (org_id, user_id, role, status, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', 'active', NOW() - INTERVAL '90 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'manager', 'active', NOW() - INTERVAL '60 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'staff', 'active', NOW() - INTERVAL '30 days')
ON CONFLICT (org_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- ============================================================================
-- STEP 4: Insert Entities (10 restaurants/bars/cafes)
-- ============================================================================
INSERT INTO entities (id, org_id, name, entity_type, status, meta, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'The Pinky Promise ATL', 'restaurant', 'active', '{"cuisine": "soul_food", "capacity": 120, "alerts_open": 0, "failed_runs_24h": 0}', NOW() - INTERVAL '80 days'),
  ('e2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Southern Belle Kitchen', 'restaurant', 'active', '{"cuisine": "southern", "capacity": 80, "alerts_open": 1, "failed_runs_24h": 0}', NOW() - INTERVAL '75 days'),
  ('e3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Peachtree Bistro', 'restaurant', 'active', '{"cuisine": "french", "capacity": 60, "alerts_open": 0, "failed_runs_24h": 1}', NOW() - INTERVAL '70 days'),
  ('e4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Midtown Grille', 'restaurant', 'active', '{"cuisine": "american", "capacity": 150, "alerts_open": 3, "failed_runs_24h": 2}', NOW() - INTERVAL '65 days'),
  ('e5555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Buckhead Steakhouse', 'restaurant', 'active', '{"cuisine": "steakhouse", "capacity": 100, "alerts_open": 0, "failed_runs_24h": 0}', NOW() - INTERVAL '60 days'),
  ('e6666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Virginia Highland Cafe', 'cafe', 'active', '{"cuisine": "cafe", "capacity": 40, "alerts_open": 2, "failed_runs_24h": 1}', NOW() - INTERVAL '55 days'),
  ('e7777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Decatur Diner', 'restaurant', 'inactive', '{"cuisine": "diner", "capacity": 50, "alerts_open": 0, "failed_runs_24h": 0}', NOW() - INTERVAL '50 days'),
  ('e8888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'East Atlanta Bar', 'bar', 'active', '{"type": "cocktail_bar", "capacity": 80, "alerts_open": 1, "failed_runs_24h": 0}', NOW() - INTERVAL '45 days'),
  ('e9999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'West End Lounge', 'bar', 'archived', '{"type": "lounge", "capacity": 60, "alerts_open": 0, "failed_runs_24h": 0}', NOW() - INTERVAL '40 days'),
  ('eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Grant Park Pizza', 'restaurant', 'active', '{"cuisine": "pizza", "capacity": 70, "alerts_open": 0, "failed_runs_24h": 0}', NOW() - INTERVAL '35 days')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  entity_type = EXCLUDED.entity_type,
  status = EXCLUDED.status,
  meta = EXCLUDED.meta;

-- ============================================================================
-- STEP 5: Insert Webhook Registry (8 workflow definitions)
-- ============================================================================
INSERT INTO webhook_registry (id, workflow_name, n8n_endpoint, brand, channel, status, metadata, created_at) VALUES
  ('w1111111-1111-1111-1111-111111111111', 'send-order-confirmation-sms', 'https://n8n.kollective.io/webhook/order-sms', 'thepinkypromiseatl', 'sms', 'active', '{"description": "Send SMS when order is placed"}', NOW() - INTERVAL '60 days'),
  ('w2222222-2222-2222-2222-222222222222', 'update-inventory-count', 'https://n8n.kollective.io/webhook/inventory', 'thepinkypromiseatl', 'internal', 'active', '{"description": "Update inventory after order"}', NOW() - INTERVAL '55 days'),
  ('w3333333-3333-3333-3333-333333333333', 'alert-low-stock', 'https://n8n.kollective.io/webhook/low-stock', 'thepinkypromiseatl', 'email', 'active', '{"description": "Alert when stock is low"}', NOW() - INTERVAL '50 days'),
  ('w4444444-4444-4444-4444-444444444444', 'daily-sales-report', 'https://n8n.kollective.io/webhook/sales-report', 'dolodorsey', 'email', 'active', '{"description": "Generate daily sales report"}', NOW() - INTERVAL '45 days'),
  ('w5555555-5555-5555-5555-555555555555', 'weekly-schedule-sync', 'https://n8n.kollective.io/webhook/schedule', 'dolodorsey', 'internal', 'active', '{"description": "Sync employee schedules"}', NOW() - INTERVAL '40 days'),
  ('w6666666-6666-6666-6666-666666666666', 'customer-feedback-processor', 'https://n8n.kollective.io/webhook/feedback', 'thepinkypromiseatl', 'internal', 'active', '{"description": "Process customer reviews"}', NOW() - INTERVAL '35 days'),
  ('w7777777-7777-7777-7777-777777777777', 'reservation-reminder', 'https://n8n.kollective.io/webhook/reservation', 'thepinkypromiseatl', 'sms', 'active', '{"description": "Send reservation reminders"}', NOW() - INTERVAL '30 days'),
  ('w8888888-8888-8888-8888-888888888888', 'late-night-cleanup-alert', 'https://n8n.kollective.io/webhook/cleanup', 'dolodorsey', 'push', 'inactive', '{"description": "Alert for cleanup tasks"}', NOW() - INTERVAL '25 days')
ON CONFLICT (id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  n8n_endpoint = EXCLUDED.n8n_endpoint,
  status = EXCLUDED.status;

-- ============================================================================
-- STEP 6: Insert Workflow Executions (50 runs with mixed statuses)
-- ============================================================================
INSERT INTO workflow_executions (id, workflow_id, user_id, status, execution_time_ms, error_message, input_payload, output_payload, created_at) VALUES
  -- Successful runs
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', 1234, NULL, '{"order_id": "ORD001"}', '{"sms_sent": true}', NOW() - INTERVAL '1 hour'),
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', 890, NULL, '{"order_id": "ORD002"}', '{"sms_sent": true}', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'success', 456, NULL, '{"item": "ribeye"}', '{"updated": true}', NOW() - INTERVAL '3 hours'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'success', 678, NULL, '{"item": "salmon"}', '{"updated": true}', NOW() - INTERVAL '4 hours'),
  (gen_random_uuid(), 'w3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'success', 345, NULL, '{"item": "wine"}', '{"alert_sent": true}', NOW() - INTERVAL '5 hours'),
  (gen_random_uuid(), 'w4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'success', 2345, NULL, '{"date": "2026-01-15"}', '{"report_url": "s3://reports/daily.pdf"}', NOW() - INTERVAL '6 hours'),
  (gen_random_uuid(), 'w5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'success', 1567, NULL, '{"week": "2026-W03"}', '{"synced": 15}', NOW() - INTERVAL '7 hours'),
  (gen_random_uuid(), 'w6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'success', 890, NULL, '{"review_id": "R001"}', '{"processed": true}', NOW() - INTERVAL '8 hours'),
  (gen_random_uuid(), 'w7777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'success', 567, NULL, '{"reservation_id": "RES001"}', '{"reminder_sent": true}', NOW() - INTERVAL '9 hours'),
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', 1100, NULL, '{"order_id": "ORD003"}', '{"sms_sent": true}', NOW() - INTERVAL '10 hours'),
  
  -- Failed runs
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'failed', 5000, 'SMS provider timeout', '{"order_id": "ORD004"}', '{}', NOW() - INTERVAL '11 hours'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'failed', 3000, 'Database connection lost', '{"item": "chicken"}', '{}', NOW() - INTERVAL '12 hours'),
  (gen_random_uuid(), 'w3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'failed', 4500, 'Email service unavailable', '{"item": "vodka"}', '{}', NOW() - INTERVAL '13 hours'),
  (gen_random_uuid(), 'w4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'failed', 6000, 'Report generation timeout', '{"date": "2026-01-14"}', '{}', NOW() - INTERVAL '14 hours'),
  (gen_random_uuid(), 'w5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'failed', 2500, 'Calendar API rate limit exceeded', '{"week": "2026-W02"}', '{}', NOW() - INTERVAL '15 hours'),
  (gen_random_uuid(), 'w6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'failed', 1800, 'Sentiment analysis service down', '{"review_id": "R002"}', '{}', NOW() - INTERVAL '16 hours'),
  (gen_random_uuid(), 'w7777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'failed', 4000, 'Invalid phone number format', '{"reservation_id": "RES002"}', '{}', NOW() - INTERVAL '17 hours'),
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'failed', 5500, 'Twilio API error', '{"order_id": "ORD005"}', '{}', NOW() - INTERVAL '18 hours'),
  
  -- Pending runs
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'pending', NULL, NULL, '{"order_id": "ORD006"}', '{}', NOW() - INTERVAL '5 minutes'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'pending', NULL, NULL, '{"item": "beef"}', '{}', NOW() - INTERVAL '10 minutes'),
  (gen_random_uuid(), 'w4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'pending', NULL, NULL, '{"date": "2026-01-16"}', '{}', NOW() - INTERVAL '15 minutes'),
  (gen_random_uuid(), 'w7777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'pending', NULL, NULL, '{"reservation_id": "RES003"}', '{}', NOW() - INTERVAL '20 minutes'),
  
  -- Timeout runs
  (gen_random_uuid(), 'w4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'timeout', 30000, 'Execution exceeded 30s limit', '{"date": "2026-01-13"}', '{}', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'w5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'timeout', 30000, 'Execution exceeded 30s limit', '{"week": "2026-W01"}', '{}', NOW() - INTERVAL '2 days'),
  
  -- More successful runs to reach 50
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', 950, NULL, '{"order_id": "ORD007"}', '{"sms_sent": true}', NOW() - INTERVAL '19 hours'),
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', 1020, NULL, '{"order_id": "ORD008"}', '{"sms_sent": true}', NOW() - INTERVAL '20 hours'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'success', 580, NULL, '{"item": "pork"}', '{"updated": true}', NOW() - INTERVAL '21 hours'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'success', 620, NULL, '{"item": "shrimp"}', '{"updated": true}', NOW() - INTERVAL '22 hours'),
  (gen_random_uuid(), 'w3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'success', 410, NULL, '{"item": "beer"}', '{"alert_sent": true}', NOW() - INTERVAL '23 hours'),
  (gen_random_uuid(), 'w3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'success', 380, NULL, '{"item": "tequila"}', '{"alert_sent": true}', NOW() - INTERVAL '1 day 1 hour'),
  (gen_random_uuid(), 'w4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'success', 2100, NULL, '{"date": "2026-01-12"}', '{"report_url": "s3://reports/daily2.pdf"}', NOW() - INTERVAL '1 day 2 hours'),
  (gen_random_uuid(), 'w5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'success', 1450, NULL, '{"week": "2025-W52"}', '{"synced": 12}', NOW() - INTERVAL '1 day 3 hours'),
  (gen_random_uuid(), 'w6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'success', 780, NULL, '{"review_id": "R003"}', '{"processed": true}', NOW() - INTERVAL '1 day 4 hours'),
  (gen_random_uuid(), 'w6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'success', 820, NULL, '{"review_id": "R004"}', '{"processed": true}', NOW() - INTERVAL '1 day 5 hours'),
  (gen_random_uuid(), 'w7777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'success', 490, NULL, '{"reservation_id": "RES004"}', '{"reminder_sent": true}', NOW() - INTERVAL '1 day 6 hours'),
  (gen_random_uuid(), 'w7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'success', 530, NULL, '{"reservation_id": "RES005"}', '{"reminder_sent": true}', NOW() - INTERVAL '1 day 7 hours'),
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', 870, NULL, '{"order_id": "ORD009"}', '{"sms_sent": true}', NOW() - INTERVAL '1 day 8 hours'),
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'success', 920, NULL, '{"order_id": "ORD010"}', '{"sms_sent": true}', NOW() - INTERVAL '1 day 9 hours'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'success', 540, NULL, '{"item": "duck"}', '{"updated": true}', NOW() - INTERVAL '1 day 10 hours'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'success', 590, NULL, '{"item": "lamb"}', '{"updated": true}', NOW() - INTERVAL '1 day 11 hours'),
  (gen_random_uuid(), 'w3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'success', 320, NULL, '{"item": "whiskey"}', '{"alert_sent": true}', NOW() - INTERVAL '1 day 12 hours'),
  (gen_random_uuid(), 'w4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'success', 1980, NULL, '{"date": "2026-01-11"}', '{"report_url": "s3://reports/daily3.pdf"}', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'w5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'success', 1320, NULL, '{"week": "2025-W51"}', '{"synced": 18}', NOW() - INTERVAL '2 days 2 hours'),
  (gen_random_uuid(), 'w6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'success', 710, NULL, '{"review_id": "R005"}', '{"processed": true}', NOW() - INTERVAL '2 days 4 hours'),
  (gen_random_uuid(), 'w7777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'success', 480, NULL, '{"reservation_id": "RES006"}', '{"reminder_sent": true}', NOW() - INTERVAL '2 days 6 hours'),
  (gen_random_uuid(), 'w1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'success', 1050, NULL, '{"order_id": "ORD011"}', '{"sms_sent": true}', NOW() - INTERVAL '2 days 8 hours'),
  (gen_random_uuid(), 'w2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'success', 510, NULL, '{"item": "tofu"}', '{"updated": true}', NOW() - INTERVAL '2 days 10 hours'),
  (gen_random_uuid(), 'w3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'success', 290, NULL, '{"item": "gin"}', '{"alert_sent": true}', NOW() - INTERVAL '2 days 12 hours'),
  (gen_random_uuid(), 'w4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'success', 2050, NULL, '{"date": "2026-01-10"}', '{"report_url": "s3://reports/daily4.pdf"}', NOW() - INTERVAL '3 days');

-- ============================================================================
-- STEP 7: Insert Alerts (10 alerts)
-- ============================================================================
INSERT INTO alerts (id, entity_id, severity, title, message, status, created_at) VALUES
  (gen_random_uuid(), 'e1111111-1111-1111-1111-111111111111', 'info', 'System health check passed', 'All systems operational for The Pinky Promise ATL', 'resolved', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'e2222222-2222-2222-2222-222222222222', 'warning', 'Low inventory: Wine', 'Chardonnay stock below threshold (5 bottles remaining)', 'open', NOW() - INTERVAL '6 hours'),
  (gen_random_uuid(), 'e3333333-3333-3333-3333-333333333333', 'warning', 'Workflow execution slow', 'Daily report took longer than expected', 'acknowledged', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'e4444444-4444-4444-4444-444444444444', 'critical', 'POS system offline', 'Register #2 not responding', 'open', NOW() - INTERVAL '30 minutes'),
  (gen_random_uuid(), 'e4444444-4444-4444-4444-444444444444', 'critical', 'Multiple failed transactions', '5 failed card payments in last hour', 'open', NOW() - INTERVAL '45 minutes'),
  (gen_random_uuid(), 'e4444444-4444-4444-4444-444444444444', 'warning', 'Staff shortage detected', 'Only 2 servers scheduled for dinner rush', 'open', NOW() - INTERVAL '3 hours'),
  (gen_random_uuid(), 'e6666666-6666-6666-6666-666666666666', 'warning', 'Low inventory: Coffee beans', 'Ethiopian blend running low', 'open', NOW() - INTERVAL '4 hours'),
  (gen_random_uuid(), 'e6666666-6666-6666-6666-666666666666', 'critical', 'Espresso machine error', 'Machine showing E03 error code', 'open', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), 'e8888888-8888-8888-8888-888888888888', 'warning', 'Liquor license expiring', 'License expires in 30 days', 'acknowledged', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'info', 'New review received', '5-star review on Google', 'resolved', NOW() - INTERVAL '1 day');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
SELECT '--- Data Counts ---' as info;
SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
UNION ALL
SELECT 'organizations', count(*) FROM organizations
UNION ALL
SELECT 'org_members', count(*) FROM org_members
UNION ALL
SELECT 'entities', count(*) FROM entities
UNION ALL
SELECT 'webhook_registry (workflows)', count(*) FROM webhook_registry
UNION ALL
SELECT 'workflow_executions', count(*) FROM workflow_executions
UNION ALL
SELECT 'alerts', count(*) FROM alerts;

SELECT '--- Entities with Org ---' as info;
SELECT 
  e.name as entity_name,
  e.entity_type,
  e.status,
  o.name as org_name
FROM entities e
JOIN organizations o ON e.org_id = o.id
LIMIT 5;

SELECT '--- Workflow Execution Stats ---' as info;
SELECT status, count(*) as count
FROM workflow_executions
GROUP BY status
ORDER BY count DESC;

SELECT '--- Open Alerts by Severity ---' as info;
SELECT severity, count(*) as count
FROM alerts
WHERE status = 'open'
GROUP BY severity
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 1 
    WHEN 'warning' THEN 2 
    ELSE 3 
  END;
