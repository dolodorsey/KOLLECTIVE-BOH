-- Kollective BOH - Complete Database Schema
-- Drop tables in reverse dependency order
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
