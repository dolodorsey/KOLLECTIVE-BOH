-- KOLLECTIVE BOH Minimum Viable Seed Data
-- Run this in Supabase SQL Editor to populate test data
-- Last Updated: January 16, 2026

-- 1. Insert Users (3 test users)
INSERT INTO users (id, name, email, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'John Owner', 'john@kollective.com', NOW() - INTERVAL '90 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Manager', 'sarah@kollective.com', NOW() - INTERVAL '60 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mike Team', 'mike@kollective.com', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Entities (10 business entities)
INSERT INTO entities (id, name, type, status, owner_id, alerts_open, failed_runs_24h, last_activity_at, created_at) VALUES
  (gen_random_uuid(), 'The Pinky Promise ATL', 'restaurant', 'active', '550e8400-e29b-41d4-a716-446655440001', 0, 0, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '80 days'),
  (gen_random_uuid(), 'Southern Belle Kitchen', 'restaurant', 'active', '550e8400-e29b-41d4-a716-446655440001', 1, 0, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '75 days'),
  (gen_random_uuid(), 'Peachtree Bistro', 'restaurant', 'active', '550e8400-e29b-41d4-a716-446655440001', 0, 1, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '70 days'),
  (gen_random_uuid(), 'Midtown Grille', 'restaurant', 'active', '550e8400-e29b-41d4-a716-446655440002', 3, 2, NOW() - INTERVAL '72 hours', NOW() - INTERVAL '65 days'),
  (gen_random_uuid(), 'Buckhead Steakhouse', 'restaurant', 'active', '550e8400-e29b-41d4-a716-446655440002', 0, 0, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '60 days'),
  (gen_random_uuid(), 'Virginia Highland Cafe', 'cafe', 'active', '550e8400-e29b-41d4-a716-446655440002', 2, 1, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '55 days'),
  (gen_random_uuid(), 'Decatur Diner', 'restaurant', 'inactive', '550e8400-e29b-41d4-a716-446655440003', 0, 0, NOW() - INTERVAL '120 hours', NOW() - INTERVAL '50 days'),
  (gen_random_uuid(), 'East Atlanta Bar', 'bar', 'active', '550e8400-e29b-41d4-a716-446655440003', 1, 0, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '45 days'),
  (gen_random_uuid(), 'West End Lounge', 'bar', 'archived', '550e8400-e29b-41d4-a716-446655440001', 0, 0, NOW() - INTERVAL '200 hours', NOW() - INTERVAL '40 days'),
  (gen_random_uuid(), 'Grant Park Pizza', 'restaurant', 'active', '550e8400-e29b-41d4-a716-446655440001', 0, 0, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '35 days');

-- 3. Insert Workflows (8 workflow definitions)
INSERT INTO workflows (id, name, description, owner_id, status, created_at) VALUES
  (gen_random_uuid(), 'send-order-confirmation-sms', 'Send SMS when order is placed', '550e8400-e29b-41d4-a716-446655440001', 'active', NOW() - INTERVAL '60 days'),
  (gen_random_uuid(), 'update-inventory-count', 'Update inventory after order', '550e8400-e29b-41d4-a716-446655440001', 'active', NOW() - INTERVAL '55 days'),
  (gen_random_uuid(), 'alert-low-stock', 'Alert when stock is low', '550e8400-e29b-41d4-a716-446655440001', 'active', NOW() - INTERVAL '50 days'),
  (gen_random_uuid(), 'daily-sales-report', 'Generate daily sales report', '550e8400-e29b-41d4-a716-446655440002', 'active', NOW() - INTERVAL '45 days'),
  (gen_random_uuid(), 'weekly-schedule-sync', 'Sync employee schedules', '550e8400-e29b-41d4-a716-446655440002', 'active', NOW() - INTERVAL '40 days'),
  (gen_random_uuid(), 'customer-feedback-processor', 'Process customer reviews', '550e8400-e29b-41d4-a716-446655440002', 'active', NOW() - INTERVAL '35 days'),
  (gen_random_uuid(), 'reservation-reminder', 'Send reservation reminders', '550e8400-e29b-41d4-a716-446655440003', 'active', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), 'late-night-cleanup-alert', 'Alert for cleanup tasks', '550e8400-e29b-41d4-a716-446655440003', 'inactive', NOW() - INTERVAL '25 days');

-- 4. Insert Workflow Executions (50 runs with varied statuses)
-- Note: This uses workflow_id and entity_id from the above inserts
-- You may need to adjust IDs based on your actual UUIDs

WITH workflow_ids AS (
  SELECT id FROM workflows LIMIT 8
),
entity_ids AS (
  SELECT id FROM entities LIMIT 10
)
INSERT INTO workflow_executions (id, workflow_id, entity_id, status, started_at, completed_at, duration_ms, error_message, metadata, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM workflow_ids OFFSET floor(random() * 8) LIMIT 1),
  (SELECT id FROM entity_ids OFFSET floor(random() * 10) LIMIT 1),
  CASE 
    WHEN random() < 0.15 THEN 'failed'
    WHEN random() < 0.25 THEN 'pending'
    WHEN random() < 0.30 THEN 'timeout'
    ELSE 'success'
  END,
  NOW() - (random() * INTERVAL '7 days'),
  NOW() - (random() * INTERVAL '7 days') + (random() * INTERVAL '5 minutes'),
  floor(random() * 5000 + 500)::int,
  CASE WHEN random() < 0.15 THEN 'Connection timeout' ELSE NULL END,
  jsonb_build_object('attempt', floor(random() * 3 + 1)),
  NOW() - (random() * INTERVAL '7 days')
FROM generate_series(1, 50);

-- 5. Insert Alerts (10 alerts)
WITH entity_ids AS (
  SELECT id FROM entities WHERE status = 'active' LIMIT 5
)
INSERT INTO alerts (id, entity_id, severity, title, message, status, created_at) 
SELECT
  gen_random_uuid(),
  (SELECT id FROM entity_ids OFFSET floor(random() * 5) LIMIT 1),
  CASE 
    WHEN random() < 0.3 THEN 'critical'
    WHEN random() < 0.6 THEN 'warning'
    ELSE 'info'
  END,
  CASE 
    WHEN random() < 0.5 THEN 'Low inventory alert'
    ELSE 'System health check'
  END,
  'System generated alert message',
  CASE WHEN random() < 0.7 THEN 'open' ELSE 'resolved' END,
  NOW() - (random() * INTERVAL '5 days')
FROM generate_series(1, 10);

-- Verification Queries
SELECT 'Users' as table_name, count(*) as row_count FROM users
UNION ALL
SELECT 'Entities', count(*) FROM entities
UNION ALL  
SELECT 'Workflows', count(*) FROM workflows
UNION ALL
SELECT 'Workflow Executions', count(*) FROM workflow_executions
UNION ALL
SELECT 'Alerts', count(*) FROM alerts;

-- Test Relations
SELECT 
  e.name as entity_name,
  u.name as owner_name,
  e.status
FROM entities e
LEFT JOIN users u ON e.owner_id = u.id
LIMIT 5;

SELECT
  we.status,
  w.name as workflow_name,
  e.name as entity_name
FROM workflow_executions we
LEFT JOIN workflows w ON we.workflow_id = w.id
LEFT JOIN entities e ON we.entity_id = e.id
WHERE we.status = 'failed'
LIMIT 10;
