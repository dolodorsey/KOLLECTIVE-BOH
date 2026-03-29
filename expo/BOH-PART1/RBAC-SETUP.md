# RBAC Database Setup - Kollective BOH

Complete SQL setup for testing the Role-Based Access Control system with sample data.

## Prerequisites

- Access to Supabase SQL Editor
- `dolodorsey@gmail.com` already exists in `auth.users`
- RLS policies enabled on all tables

---

## STEP 1: Create Test Users

```sql
-- Create 3 test users in auth.users
-- NOTE: dolodorsey@gmail.com already exists as owner

-- ADMIN user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@kollective.test',
  crypt('TestPass123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin User"}',
  false,
  'authenticated'
);

-- MANAGER user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'manager@kollective.test',
  crypt('TestPass123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Manager User"}',
  false,
  'authenticated'
);

-- STAFF user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'staff@kollective.test',
  crypt('TestPass123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Staff User"}',
  false,
  'authenticated'
);
```

---

## STEP 2: Get User IDs

```sql
-- Retrieve all user IDs for next steps
SELECT id, email FROM auth.users 
WHERE email IN (
  'dolodorsey@gmail.com',
  'admin@kollective.test',
  'manager@kollective.test',
  'staff@kollective.test'
)
ORDER BY email;
```

**Copy these IDs for use in following steps:**
- `OWNER_ID` = dolodorsey@gmail.com id
- `ADMIN_ID` = admin@kollective.test id
- `MANAGER_ID` = manager@kollective.test id
- `STAFF_ID` = staff@kollective.test id

---

## STEP 3: Create Profiles

```sql
-- Replace {OWNER_ID}, {ADMIN_ID}, {MANAGER_ID}, {STAFF_ID} with actual UUIDs

-- Owner profile
INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at)
VALUES (
  '{OWNER_ID}',
  'dolodorsey@gmail.com',
  'Dolo Dorsey',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=dolo',
  NOW(),
  NOW()
);

-- Admin profile
INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at)
VALUES (
  '{ADMIN_ID}',
  'admin@kollective.test',
  'Admin User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  NOW(),
  NOW()
);

-- Manager profile
INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at)
VALUES (
  '{MANAGER_ID}',
  'manager@kollective.test',
  'Manager User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
  NOW(),
  NOW()
);

-- Staff profile
INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at)
VALUES (
  '{STAFF_ID}',
  'staff@kollective.test',
  'Staff User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=staff',
  NOW(),
  NOW()
);
```

---

## STEP 4: Create Organization

```sql
-- Create 'The Kollective' organization
INSERT INTO organizations (id, name, slug, created_by, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'The Kollective',
  'the-kollective',
  '{OWNER_ID}',
  NOW(),
  NOW()
)
RETURNING id;
```

**Copy the returned `ORG_ID` for next steps**

---

## STEP 5: Add Organization Members

```sql
-- Replace {ORG_ID} with actual organization UUID

-- Owner membership
INSERT INTO org_members (org_id, user_id, role, created_at, updated_at)
VALUES ('{ORG_ID}', '{OWNER_ID}', 'owner', NOW(), NOW());

-- Admin membership
INSERT INTO org_members (org_id, user_id, role, created_at, updated_at)
VALUES ('{ORG_ID}', '{ADMIN_ID}', 'admin', NOW(), NOW());

-- Manager membership
INSERT INTO org_members (org_id, user_id, role, created_at, updated_at)
VALUES ('{ORG_ID}', '{MANAGER_ID}', 'manager', NOW(), NOW());

-- Staff membership
INSERT INTO org_members (org_id, user_id, role, created_at, updated_at)
VALUES ('{ORG_ID}', '{STAFF_ID}', 'staff', NOW(), NOW());
```

---

## STEP 6: Create Entities

```sql
-- Create Washington Parq HTX entity
INSERT INTO entities (
  id,
  org_id,
  name,
  type,
  status,
  description,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '{ORG_ID}',
  'Washington Parq HTX',
  'venue',
  'active',
  'Premier event venue in Houston',
  NOW(),
  NOW()
)
RETURNING id;

-- Copy WPQ_ENTITY_ID

-- Create GSU entity
INSERT INTO entities (
  id,
  org_id,
  name,
  type,
  status,
  description,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '{ORG_ID}',
  'GSU',
  'venue',
  'active',
  'Georgia State University partnership',
  NOW(),
  NOW()
)
RETURNING id;

-- Copy GSU_ENTITY_ID
```

---

## STEP 7: Create Entity Member Assignments

```sql
-- Manager → Washington Parq HTX
INSERT INTO entity_members (entity_id, user_id, role, created_at, updated_at)
VALUES ('{WPQ_ENTITY_ID}', '{MANAGER_ID}', 'manager', NOW(), NOW());

-- Staff → GSU
INSERT INTO entity_members (entity_id, user_id, role, created_at, updated_at)
VALUES ('{GSU_ENTITY_ID}', '{STAFF_ID}', 'staff', NOW(), NOW());
```

---

## STEP 8: Create Test Tasks

```sql
-- 5 tasks for Staff at GSU
INSERT INTO tasks (org_id, entity_id, title, description, status, priority, assigned_to, created_by, created_at, updated_at)
VALUES
  ('{ORG_ID}', '{GSU_ENTITY_ID}', 'Setup event registration', 'Configure registration system for GSU homecoming', 'pending', 'high', '{STAFF_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', '{GSU_ENTITY_ID}', 'Coordinate with GSU admin', 'Weekly sync meeting with GSU administration', 'in_progress', 'medium', '{STAFF_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', '{GSU_ENTITY_ID}', 'Update vendor contracts', 'Review and update all vendor agreements', 'pending', 'high', '{STAFF_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', '{GSU_ENTITY_ID}', 'Marketing materials review', 'Approve GSU event marketing collateral', 'pending', 'low', '{STAFF_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', '{GSU_ENTITY_ID}', 'Budget reconciliation', 'Reconcile Q1 GSU event budget', 'completed', 'medium', '{STAFF_ID}', '{OWNER_ID}', NOW(), NOW());

-- 5 tasks for Manager at Washington Parq HTX
INSERT INTO tasks (org_id, entity_id, title, description, status, priority, assigned_to, created_by, created_at, updated_at)
VALUES
  ('{ORG_ID}', '{WPQ_ENTITY_ID}', 'Venue inspection walkthrough', 'Complete monthly venue safety inspection', 'in_progress', 'high', '{MANAGER_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', '{WPQ_ENTITY_ID}', 'Staff training session', 'Train new bartenders on POS system', 'pending', 'medium', '{MANAGER_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', '{WPQ_ENTITY_ID}', 'Book DJ for Friday night', 'Secure entertainment for weekend event', 'pending', 'high', '{MANAGER_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', '{WPQ_ENTITY_ID}', 'Review security protocols', 'Update security procedures for large events', 'pending', 'high', '{MANAGER_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', '{WPQ_ENTITY_ID}', 'Inventory audit', 'Complete monthly bar inventory count', 'completed', 'low', '{MANAGER_ID}', '{OWNER_ID}', NOW(), NOW());

-- 2 org-wide tasks for Owner
INSERT INTO tasks (org_id, entity_id, title, description, status, priority, assigned_to, created_by, created_at, updated_at)
VALUES
  ('{ORG_ID}', NULL, 'Q2 strategic planning', 'Develop organizational strategy for Q2', 'in_progress', 'high', '{OWNER_ID}', '{OWNER_ID}', NOW(), NOW()),
  ('{ORG_ID}', NULL, 'Investor deck preparation', 'Prepare pitch deck for Series A round', 'pending', 'high', '{OWNER_ID}', '{OWNER_ID}', NOW(), NOW());
```

---

## STEP 9: Verification Queries

```sql
-- Verify all users have profiles
SELECT u.email, p.full_name, p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%kollective%' OR u.email = 'dolodorsey@gmail.com';

-- Verify org members with roles
SELECT 
  p.full_name,
  p.email,
  om.role,
  o.name as org_name
FROM org_members om
JOIN profiles p ON om.user_id = p.id
JOIN organizations o ON om.org_id = o.id
ORDER BY om.role;

-- Verify entity assignments
SELECT 
  p.full_name as user_name,
  e.name as entity_name,
  em.role as entity_role
FROM entity_members em
JOIN profiles p ON em.user_id = p.id
JOIN entities e ON em.entity_id = e.id;

-- Verify task assignments by user
SELECT 
  p.full_name as assignee,
  COUNT(t.id) as task_count,
  e.name as entity_name,
  t.status
FROM tasks t
LEFT JOIN profiles p ON t.assigned_to = p.id
LEFT JOIN entities e ON t.entity_id = e.id
GROUP BY p.full_name, e.name, t.status
ORDER BY p.full_name, t.status;
```

---

## RLS Policy Verification Checklist

Run these checks to ensure RLS is working correctly:

### ✅ Profiles Table
- [ ] Users can read their own profile
- [ ] Users can update their own profile
- [ ] Users cannot read other users' profiles (unless in same org)

### ✅ Organizations Table
- [ ] Org members can read their organization
- [ ] Only owners can update organization
- [ ] Non-members cannot see organizations

### ✅ Org Members Table
- [ ] Members can see other members in their org
- [ ] Only owner/admin can add/remove members
- [ ] Members cannot change their own role

### ✅ Entities Table
- [ ] Owner/Admin see all org entities
- [ ] Manager sees only assigned entities
- [ ] Staff sees only assigned entities
- [ ] Non-members see nothing

### ✅ Entity Members Table
- [ ] Users can see assignments in their org
- [ ] Owner/Admin can assign anyone
- [ ] Manager cannot assign to entities they don't manage
- [ ] Staff cannot assign

### ✅ Tasks Table
- [ ] Staff sees only tasks assigned to them
- [ ] Manager sees tasks for their assigned entities
- [ ] Owner/Admin sees all org tasks
- [ ] Users can update status on their assigned tasks
- [ ] Only Owner/Admin can reassign tasks

---

## Test Login Credentials

```
Owner:
  Email: dolodorsey@gmail.com
  Password: [your existing password]

Admin:
  Email: admin@kollective.test
  Password: TestPass123!

Manager:
  Email: manager@kollective.test
  Password: TestPass123!

Staff:
  Email: staff@kollective.test
  Password: TestPass123!
```

---

## Expected RBAC Behavior

### Owner (dolodorsey@gmail.com)
- ✅ Sees 4 tabs: Command Center, Entities, People, Profile
- ✅ Sees all 12 tasks in system
- ✅ Can view/edit all entities
- ✅ Can manage all org members
- ✅ Full system access

### Admin (admin@kollective.test)
- ✅ Sees 4 tabs: Command Center, Entities, People, Profile
- ✅ Sees all 12 tasks
- ✅ Can manage members and entities
- ✅ Cannot delete organization

### Manager (manager@kollective.test)
- ✅ Sees 3 tabs: Tasks, Entities, Profile
- ✅ Sees only 5 tasks (Washington Parq HTX tasks)
- ✅ Can view/edit Washington Parq HTX entity only
- ✅ Cannot see People tab or org dashboard
- ✅ Cannot see GSU or org-wide tasks

### Staff (staff@kollective.test)
- ✅ Sees 2 tabs: Tasks, Profile
- ✅ Sees only 5 tasks (assigned GSU tasks)
- ✅ Cannot see Entities tab
- ✅ Cannot see People tab
- ✅ Cannot see Washington Parq HTX or org-wide tasks

---

## Troubleshooting

### "No tasks showing up"
1. Check RLS policies are enabled on `tasks` table
2. Verify `assigned_to` UUIDs match actual user IDs
3. Check `org_id` matches in all tables
4. Run verification query above

### "Permission denied on org_members"
1. RLS policy missing for org member reads
2. User session not properly set in Supabase client
3. Check auth-context.tsx is fetching membership correctly

### "Entity not accessible to Manager"
1. Verify `entity_members` row exists
2. Check `entity_id` and `user_id` are correct
3. Ensure RLS policy on `entities` checks `entity_members`

### "Cannot login with test users"
1. Confirm test users created in `auth.users`
2. Check `email_confirmed_at` is set (not null)
3. Verify password hash generated correctly with `gen_salt('bf')`

---

## Clean Slate Reset (Danger Zone)

If you need to start over:

```sql
-- Delete in correct order to avoid FK violations
DELETE FROM tasks WHERE org_id = '{ORG_ID}';
DELETE FROM entity_members WHERE entity_id IN (SELECT id FROM entities WHERE org_id = '{ORG_ID}');
DELETE FROM entities WHERE org_id = '{ORG_ID}';
DELETE FROM org_members WHERE org_id = '{ORG_ID}';
DELETE FROM organizations WHERE id = '{ORG_ID}';
DELETE FROM profiles WHERE email LIKE '%kollective.test%';
DELETE FROM auth.users WHERE email LIKE '%kollective.test%';
```

Then start from STEP 1 again.
