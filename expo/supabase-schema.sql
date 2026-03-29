-- Kollective BOH - Complete Database Schema
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS webhook_registry CASCADE;
DROP TABLE IF EXISTS brand_configurations CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS entity_members CASCADE;
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS org_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orgs they are members of"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.status = 'active'
    )
  );

CREATE POLICY "Owners can update their orgs"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
      AND org_members.status = 'active'
    )
  );

-- ============================================================================
-- ORG_MEMBERS TABLE
-- ============================================================================
CREATE TABLE org_members (
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their orgs"
  ON org_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Owners/Admins can manage org members"
  ON org_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
    )
  );

-- ============================================================================
-- ENTITIES TABLE
-- ============================================================================
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT,
  status TEXT DEFAULT 'active',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entities in their org"
  ON entities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = entities.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.status = 'active'
    )
  );

CREATE POLICY "Owners/Admins can manage entities"
  ON entities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = entities.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
      AND org_members.status = 'active'
    )
  );

-- ============================================================================
-- ENTITY_MEMBERS TABLE
-- ============================================================================
CREATE TABLE entity_members (
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (entity_id, user_id)
);

ALTER TABLE entity_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entity members they have access to"
  ON entity_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entities e
      JOIN org_members om ON om.org_id = e.org_id
      WHERE e.id = entity_members.entity_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Owners/Admins/Managers can manage entity members"
  ON entity_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM entities e
      JOIN org_members om ON om.org_id = e.org_id
      WHERE e.id = entity_members.entity_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND om.status = 'active'
    )
  );

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their org or assigned to them"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tasks.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND (
        om.role IN ('owner', 'admin')
        OR tasks.assigned_to = auth.uid()
        OR (
          om.role = 'manager'
          AND tasks.entity_id IN (
            SELECT entity_id FROM entity_members
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can create tasks in their org"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = tasks.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.status = 'active'
    )
  );

CREATE POLICY "Users can update tasks they created or are assigned to"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tasks.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND (
        om.role IN ('owner', 'admin')
        OR tasks.assigned_to = auth.uid()
        OR tasks.created_by = auth.uid()
        OR (
          om.role = 'manager'
          AND tasks.entity_id IN (
            SELECT entity_id FROM entity_members
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Owners/Admins can delete tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = tasks.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
      AND org_members.status = 'active'
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_entities_org_id ON entities(org_id);
CREATE INDEX idx_entity_members_entity_id ON entity_members(entity_id);
CREATE INDEX idx_entity_members_user_id ON entity_members(user_id);
CREATE INDEX idx_tasks_org_id ON tasks(org_id);
CREATE INDEX idx_tasks_entity_id ON tasks(entity_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- BRAND_CONFIGURATIONS TABLE
-- ============================================================================
CREATE TABLE brand_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_key TEXT UNIQUE NOT NULL,
  brand_display_name TEXT NOT NULL,
  ghl_location_id TEXT,
  email_from TEXT,
  instagram_account_id TEXT,
  sms_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT false,
  dm_enabled BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view brand configurations"
  ON brand_configurations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners/Admins can manage brand configurations"
  ON brand_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
      AND org_members.status = 'active'
    )
  );

-- ============================================================================
-- WEBHOOK_REGISTRY TABLE
-- ============================================================================
CREATE TABLE webhook_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  n8n_endpoint TEXT NOT NULL,
  brand TEXT,
  channel TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view webhook registry"
  ON webhook_registry FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners/Admins can manage webhook registry"
  ON webhook_registry FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
      AND org_members.status = 'active'
    )
  );

-- ============================================================================
-- WORKFLOW_EXECUTIONS TABLE
-- ============================================================================
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES webhook_registry(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  input_payload JSONB DEFAULT '{}',
  output_payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'timeout')),
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflow executions"
  ON workflow_executions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
      AND org_members.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create workflow executions"
  ON workflow_executions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update workflow executions"
  ON workflow_executions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INDEXES FOR WEBHOOK SYSTEM
-- ============================================================================
CREATE INDEX idx_webhook_registry_workflow_name ON webhook_registry(workflow_name);
CREATE INDEX idx_webhook_registry_brand ON webhook_registry(brand);
CREATE INDEX idx_webhook_registry_status ON webhook_registry(status);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX idx_brand_configurations_brand_key ON brand_configurations(brand_key);

-- ============================================================================
-- SEED DATA FOR BRAND CONFIGURATIONS
-- ============================================================================
INSERT INTO brand_configurations (brand_key, brand_display_name, ghl_location_id, email_from, instagram_account_id, sms_enabled, email_enabled, dm_enabled, metadata)
VALUES
  ('thepinkypromiseatl', 'The Pinky Promise ATL', 'ppATL_ghl_123', 'hello@thepinkypromiseatl.com', '@thepinkypromiseatl', true, true, true, '{"region": "atlanta", "timezone": "America/New_York"}'::jsonb),
  ('dolodorsey', 'DOLO DORSEY', 'dd_ghl_456', 'yo@dolodorsey.com', '@dolodorsey', true, true, true, '{"type": "personal_brand", "timezone": "America/Los_Angeles"}'::jsonb)
ON CONFLICT (brand_key) DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_configurations_updated_at
  BEFORE UPDATE ON brand_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_registry_updated_at
  BEFORE UPDATE ON webhook_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
