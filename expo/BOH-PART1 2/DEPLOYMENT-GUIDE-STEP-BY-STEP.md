# KOLLECTIVE BOH - Step-by-Step Deployment Guide
## Ready for Physical Device Testing

---

## STEP 1: Build EAS Development Client (15 minutes)

### Prerequisites Check:
```bash
# 1. Check you're in the repo root
pwd  # Should show /path/to/KOLLECTIVE-BOH

# 2. Check Node version (should be 20.x)
node --version

# 3. Check if EAS CLI is installed
eas --version
# If not installed: npm install -g eas-cli
```

### Build the Dev Client:
```bash
# Step 1: Login to Expo
eas login
# Use your expo.dev credentials

# Step 2: Verify account
eas whoami
# Should show: thekollective

# Step 3: Build iOS development client
eas build --profile development --platform ios

# The build will take 15-20 minutes
# You'll get a link like: https://expo.dev/accounts/thekollective/projects/kollective-os-dashboard/builds/...
```

### Expected Output:
- Build starts on EAS servers
- You'll receive an email when complete
- Build artifact will be available for download
- Can install via TestFlight or direct download

### Install the Build:
1. Open the EAS build link on your iOS device
2. Follow the installation prompts
3. Trust the developer certificate if prompted
4. Launch the app

### Validation:
- [ ] App launches without Metro bundler
- [ ] No immediate crash or red screen
- [ ] Login screen appears
- [ ] Can navigate to Dashboard

---

## STEP 2: Seed Supabase with Minimum Viable Data (10 minutes)

### Current Table Structure:
Based on your tRPC routes, you need these tables:
- `users` - User accounts
- `entities` - Business entities with owner_id
- `workflows` - Workflow definitions with owner_id  
- `workflow_executions` - Workflow runs with workflow_id and entity_id
- `alerts` - Alert records

Run the seed script in Supabase SQL Editor:

### Open Supabase:
1. Go to: https://supabase.com/dashboard/project/wfkohcwxxsrhcxhepfql
2. Click "SQL Editor" in left sidebar
3. Create new query
4. Paste the seed-data.sql script (see below)
5. Click "Run"

### Validation Queries:
```sql
-- Check users
SELECT count(*) FROM users;
-- Expected: 3

-- Check entities with owners
SELECT e.name, u.name as owner_name 
FROM entities e
LEFT JOIN users u ON e.owner_id = u.id
LIMIT 5;
-- Expected: 10 rows with owner names populated

-- Check workflows
SELECT w.name, u.name as owner_name
FROM workflows w
LEFT JOIN users u ON w.owner_id = u.id;
-- Expected: 5-8 rows

-- Check workflow executions with joins
SELECT 
  we.id,
  w.name as workflow_name,
  e.name as entity_name,
  we.status
FROM workflow_executions we
LEFT JOIN workflows w ON we.workflow_id = w.id
LEFT JOIN entities e ON we.entity_id = e.id
LIMIT 10;
-- Expected: 50 rows with names populated

-- Check failed runs
SELECT count(*) FROM workflow_executions WHERE status = 'failed';
-- Expected: 8-12 rows
```

---

## STEP 3: Implement RLS Policies (15 minutes)

### Basic Production-Safe Policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users: can only read their own record
CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Entities: owner can read/write
CREATE POLICY "Owners can read entities"
  ON entities FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can create entities"
  ON entities FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update entities"
  ON entities FOR UPDATE
  USING (owner_id = auth.uid());

-- Workflows: owner can read/write
CREATE POLICY "Owners can read workflows"
  ON workflows FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can create workflows"
  ON workflows FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Workflow executions: access via parent workflow owner
CREATE POLICY "Users can read workflow executions"
  ON workflow_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflow_executions.workflow_id
      AND w.owner_id = auth.uid()
    )
  );

-- Alerts: read if entity owner
CREATE POLICY "Users can read alerts"
  ON alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entities e
      WHERE e.id = alerts.entity_id
      AND e.owner_id = auth.uid()
    )
  );
```

### Test RLS:
```sql
-- Test as service role (should see all)
SET ROLE service_role;
SELECT count(*) FROM entities;
-- Expected: 10

-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claims.sub = '<USER_ID_FROM_SEED>';
SELECT count(*) FROM entities;
-- Expected: 3-4 (only owned entities)

-- Reset
RESET ROLE;
```

---

## STEP 4: On-Device Acceptance Testing (15 minutes)

### Test Checklist:

#### Dashboard Screen:
- [ ] App loads without errors
- [ ] Pull-to-refresh gesture works
- [ ] KPI tiles show non-zero numbers
- [ ] Active Entities count matches Supabase
- [ ] Alerts count matches Supabase
- [ ] System health shows "ok" or appropriate status
- [ ] No red error toasts
- [ ] Empty states look intentional (not broken)
- [ ] Operator shortcuts are tappable

#### Entities Screen:
- [ ] List loads with 10 entities
- [ ] Owner names appear (from relation)
- [ ] Search input filters by name
- [ ] Status filter chips work (All/Active/Inactive/Archived)
- [ ] Health badges compute without crashes
- [ ] Health colors are correct (green/yellow/red)
- [ ] No infinite spinner
- [ ] Pull-to-refresh works
- [ ] Empty state shows when filtered to 0 results

#### Workflows Screen:
- [ ] Runs list loads with 50 recent executions
- [ ] Workflow names appear (from relation)
- [ ] Entity names appear (from relation)
- [ ] Status filter works (all/pending/success/failed/timeout)
- [ ] "Failed only" filter returns 8-12 rows
- [ ] Definitions list loads
- [ ] Owner names appear on definitions
- [ ] No crashes when scrolling
- [ ] Pull-to-refresh works

#### Error Handling:
- [ ] Network errors show controlled message (not silent blank)
- [ ] Missing data shows empty state
- [ ] Invalid queries show error toast
- [ ] App doesn't crash on 404/500 responses

### Performance Checks:
- [ ] Dashboard loads in < 2 seconds
- [ ] Entities search responds in < 500ms
- [ ] Workflows list scrolls smoothly
- [ ] No memory leaks after 5 minutes of use
- [ ] App remains responsive during background refetch

---

## STEP 5: Production Build (When Above is Clean)

### Prerequisites:
- [ ] All acceptance tests passing
- [ ] RLS policies verified
- [ ] No critical bugs
- [ ] Environment variables for production set

### Build Commands:
```bash
# iOS Production Build
eas build --profile production --platform ios

# Android Production Build (if needed)
eas build --profile production --platform android

# Both platforms
eas build --profile production --platform all
```

### Production Checklist:
- [ ] API_URL points to production backend
- [ ] Supabase URL is production instance
- [ ] Analytics/monitoring enabled
- [ ] Crash reporting configured
- [ ] App Store metadata ready
- [ ] Privacy policy linked
- [ ] Terms of service linked

---

## TROUBLESHOOTING

### Build Fails:
```bash
# Check EAS status
eas build:list

# View build logs
eas build:view <BUILD_ID>

# Clear EAS cache
eas build --clear-cache
```

### App Crashes on Launch:
1. Check Metro logs: `npx expo start`
2. Check device logs: Xcode > Devices > Console
3. Verify environment variables loaded
4. Check Supabase connection

### tRPC Queries Fail:
1. Check API_URL in app.config.js
2. Verify backend is running: `curl https://kollective-api--DRDORS.replit.app/api/trpc`
3. Check network inspector in dev tools
4. Verify RLS policies aren't blocking queries

### Empty Data:
1. Run seed script again
2. Check RLS policies
3. Verify foreign keys are populated
4. Check auth.uid() matches seed data

---

## NEXT STEPS AFTER SUCCESSFUL TESTING

1. **Add More Test Data**: Expand to 100+ entities, 500+ workflow runs
2. **Implement Auth Flow**: Add real login/logout
3. **Add Create/Edit Forms**: Allow users to add entities/workflows
4. **Implement Push Notifications**: For alerts and workflow failures
5. **Add Analytics**: Track user behavior and performance
6. **Beta Testing**: Distribute to team via TestFlight
7. **App Store Submission**: Submit for review

---

## TIMELINE ESTIMATE

- **EAS Build**: 20 minutes (mostly waiting)
- **Supabase Seeding**: 10 minutes
- **RLS Setup**: 15 minutes
- **Testing**: 15 minutes
- **Total**: ~60 minutes to production-ready state

---

**Last Updated**: January 16, 2026  
**Status**: Ready for Deployment  
**Next Action**: Run `eas login` and start Step 1
