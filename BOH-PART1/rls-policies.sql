-- KOLLECTIVE BOH - Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor after seeding data
-- Last Updated: January 16, 2026

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users: read/update own record
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Entities: owner access
CREATE POLICY "entities_select" ON entities FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "entities_insert" ON entities FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "entities_update" ON entities FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "entities_delete" ON entities FOR DELETE USING (owner_id = auth.uid());

-- Workflows: owner access
CREATE POLICY "workflows_select" ON workflows FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "workflows_insert" ON workflows FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "workflows_update" ON workflows FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "workflows_delete" ON workflows FOR DELETE USING (owner_id = auth.uid());

-- Workflow executions: access via parent workflow
CREATE POLICY "workflow_executions_select" ON workflow_executions FOR SELECT
  USING (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_executions.workflow_id AND w.owner_id = auth.uid()));

CREATE POLICY "workflow_executions_insert" ON workflow_executions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_executions.workflow_id AND w.owner_id = auth.uid()));

-- Alerts: access via parent entity
CREATE POLICY "alerts_select" ON alerts FOR SELECT
  USING (EXISTS (SELECT 1 FROM entities e WHERE e.id = alerts.entity_id AND e.owner_id = auth.uid()));

CREATE POLICY "alerts_insert" ON alerts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM entities e WHERE e.id = alerts.entity_id AND e.owner_id = auth.uid()));

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('users', 'entities', 'workflows', 'workflow_executions', 'alerts');
