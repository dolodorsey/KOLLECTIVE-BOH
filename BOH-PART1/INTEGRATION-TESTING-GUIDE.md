# Integration Testing Guide
## KOLLECTIVE BOH Webhook Infrastructure

**Last Updated:** January 4, 2026  
**Status:** Production Ready  
**Purpose:** Comprehensive guide for testing webhook infrastructure end-to-end

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Pre-Testing Setup](#pre-testing-setup)
3. [Connection Diagnostic Verification](#connection-diagnostic-verification)
4. [End-to-End Workflow Testing](#end-to-end-workflow-testing)
5. [RBAC Role Testing](#rbac-role-testing)
6. [Webhook Event Testing](#webhook-event-testing)
7. [Data Flow Verification](#data-flow-verification)
8. [Performance Benchmarks](#performance-benchmarks)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Automated Testing Scripts](#automated-testing-scripts)

---

## Testing Overview

### System Architecture
```
Mobile App (React Native)
    ↓ (tRPC API)
Backend API (Hono + tRPC)
    ↓ (HTTP POST)
n8n Workflow Handler
    ↓ (Supabase Insert)
Supabase Database
    ↓ (Query)
Frontend Display (React Query)
```

### Testing Layers
1. **Network Layer**: App → Backend connectivity
2. **API Layer**: tRPC route functionality
3. **Webhook Layer**: n8n endpoint processing
4. **Database Layer**: Supabase data persistence
5. **UI Layer**: Component rendering and updates
6. **Auth Layer**: RBAC permission enforcement

---

## Pre-Testing Setup

### 1. Environment Configuration

**Verify .env file exists with:**
```bash
# Check environment variables
cat .env

# Should contain:
EXPO_PUBLIC_API_URL=https://drdorsey.app.n8n.cloud
EXPO_PUBLIC_WEBHOOK_PATH=/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179
EXPO_PUBLIC_RORK_DB_ENDPOINT=<your-value>
EXPO_PUBLIC_RORK_DB_NAMESPACE=<your-value>
EXPO_PUBLIC_RORK_DB_TOKEN=<your-value>
```

### 2. Database Setup Verification

**Connect to Supabase and verify tables:**
```sql
-- Check webhook_registry table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'webhook_registry';

-- Check workflow_executions table
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workflow_executions';

-- Verify sample data exists
SELECT COUNT(*) FROM webhook_registry;
SELECT COUNT(*) FROM workflow_executions;
```

**Expected Results:**
- webhook_registry: 8 columns (id, workflow_name, n8n_endpoint, brand, channel, status, metadata, created_at, updated_at)
- workflow_executions: 8 columns (id, webhook_id, n8n_endpoint, brand, channel, status, metadata, created_at)
- At least 2 sample records in webhook_registry

### 3. n8n Workflow Verification

**Access n8n Dashboard:**
```
URL: https://drdorsey.app.n8n.cloud
Workflow: "Webhook Infrastructure Handler"
Status: Should be "Active" with green indicator
```

**Test webhook manually in n8n:**
1. Open workflow editor
2. Click "Execute Workflow" button
3. Select "Listen for test event"
4. Send test POST request (see curl command below)
5. Verify execution appears in "Executions" tab

---

## Connection Diagnostic Verification

### Using ConnectionDiagnostic Component

**Component Location:** `components/ConnectionDiagnostic.tsx`

### Expected Console Output (Success)

```
[ConnectionDiagnostic] Starting diagnostics...
[ConnectionDiagnostic] Environment variables loaded: {
  apiUrl: "https://drdorsey.app.n8n.cloud",
  webhookPath: "/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179",
  fullUrl: "https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179"
}
[ConnectionDiagnostic] Testing webhook connectivity...
[ConnectionDiagnostic] Response received: {
  status: 200,
  ok: true,
  headers: {...}
}
[ConnectionDiagnostic] ✅ All diagnostics passed
```

### Expected UI Indicators

**Success State:**
- ✅ Green checkmarks for all tests
- "Environment Variables: Loaded"
- "Webhook Connection: Active"
- "Database Connection: Connected"

**Failure State:**
- ❌ Red X marks for failed tests
- Error messages displayed in red text
- "Retry" button appears
- Console logs show detailed error information

### Test Cases

#### Test 1: Environment Variables
```typescript
// Expected behavior
process.env.EXPO_PUBLIC_API_URL !== undefined
process.env.EXPO_PUBLIC_WEBHOOK_PATH !== undefined

// Console output
"[ConnectionDiagnostic] Env check: PASSED"
```

#### Test 2: Webhook Connectivity
```typescript
// Expected behavior
fetch('https://drdorsey.app.n8n.cloud/webhook/...') returns 200

// Console output
"[ConnectionDiagnostic] Webhook check: PASSED"
"[ConnectionDiagnostic] Response time: 234ms"
```

#### Test 3: Supabase Connection
```typescript
// Expected behavior
supabase.from('webhook_registry').select('count') succeeds

// Console output
"[ConnectionDiagnostic] Supabase check: PASSED"
"[ConnectionDiagnostic] Tables accessible: 2"
```

---

## End-to-End Workflow Testing

### Complete User Flow Test

**Scenario:** Owner registers a new webhook and triggers execution

#### Step 1: Register Webhook via App

```typescript
// In app code (e.g., workflows page)
const { mutate: registerWebhook } = useRegisterWebhook();

registerWebhook({
  workflow_name: 'test-sms-workflow',
  n8n_endpoint: 'https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179',
  brand: 'thepinkypromiseatl',
  channel: 'sms',
  metadata: {
    test: true,
    timestamp: new Date().toISOString()
  }
});
```

**Expected Outcome:**
- Success toast/message in UI
- Console: "[Webhooks] Registered webhook: {...}"
- Supabase: New row in webhook_registry table

#### Step 2: Verify Database Insert

```sql
-- Check newly created webhook
SELECT * FROM webhook_registry 
WHERE workflow_name = 'test-sms-workflow'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Result:**
```json
{
  "id": "uuid-here",
  "workflow_name": "test-sms-workflow",
  "n8n_endpoint": "https://drdorsey.app.n8n.cloud/webhook/...",
  "brand": "thepinkypromiseatl",
  "channel": "sms",
  "status": "active",
  "metadata": {"test": true, "timestamp": "..."},
  "created_at": "2026-01-04T04:00:00.000Z"
}
```

#### Step 3: Trigger Webhook Execution

```bash
# Using curl
curl -X POST \
  https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179 \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "test-sms-workflow",
    "brand": "thepinkypromiseatl",
    "channel": "sms",
    "event": "test_trigger",
    "payload": {
      "message": "Test SMS",
      "recipient": "+15551234567"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "execution_id": "uuid-here",
  "timestamp": "2026-01-04T04:00:00.000Z"
}
```

#### Step 4: Verify Workflow Execution

```sql
-- Check workflow execution log
SELECT * FROM workflow_executions 
WHERE brand = 'thepinkypromiseatl'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Result:**
```json
{
  "id": "execution-uuid",
  "webhook_id": "webhook-uuid",
  "n8n_endpoint": "https://drdorsey.app.n8n.cloud/webhook/...",
  "brand": "thepinkypromiseatl",
  "channel": "sms",
  "status": "active",
  "metadata": {"event": "test_trigger", "payload": {...}},
  "created_at": "2026-01-04T04:00:00.000Z"
}
```

#### Step 5: Verify in App

```typescript
// Query executions in app
const { data: executions } = useWorkflowExecutions({
  brand: 'thepinkypromiseatl',
  status: 'active'
});

// Should include newly created execution
console.log('Total executions:', executions?.length);
```

**Expected Console Output:**
```
[WorkflowExecutions] Fetched 1 execution(s)
[WorkflowExecutions] Latest: test-sms-workflow @ 2026-01-04T04:00:00.000Z
Total executions: 1
```

---

## RBAC Role Testing

### Test Users Setup

```sql
-- Create test users with different roles
INSERT INTO user_roles (user_id, brand_id, role) VALUES
  ('owner-user-id', 'brand-1', 'owner'),
  ('manager-user-id', 'brand-1', 'manager'),
  ('team-user-id', 'brand-1', 'team_member');
```

### Owner Role Tests

**Expected Permissions:**
- ✅ View all brands
- ✅ Create/edit/delete webhooks
- ✅ View all workflow executions
- ✅ Access workflows dashboard
- ✅ Access compose page
- ✅ Manage team members

**Test Cases:**

```typescript
// Test 1: Access workflows page
// Navigate to: /dashboard/workflows
// Expected: Page loads successfully

// Test 2: Register webhook
const { mutate } = useRegisterWebhook();
mutate({...}); // Should succeed

// Test 3: Delete webhook
const { mutate: deleteWebhook } = useDeleteWebhook();
deleteWebhook('webhook-id'); // Should succeed

// Test 4: View all brand data
const { data } = useWebhooks(); // No brand filter
// Expected: Returns webhooks from all brands
```

### Manager Role Tests

**Expected Permissions:**
- ✅ View assigned brands only
- ✅ Create/edit webhooks (own brands)
- ❌ Delete webhooks
- ✅ View workflow executions (own brands)
- ✅ Access workflows dashboard (filtered)
- ✅ Access compose page
- ❌ Manage team members

**Test Cases:**

```typescript
// Test 1: View webhooks (should be filtered)
const { data } = useWebhooks();
// Expected: Only returns webhooks for manager's brands

// Test 2: Attempt to delete webhook
const { mutate: deleteWebhook } = useDeleteWebhook();
deleteWebhook('webhook-id'); 
// Expected: Error "Insufficient permissions"

// Test 3: Access workflows page
// Navigate to: /dashboard/workflows
// Expected: Only see own brand's workflows
```

### Team Member Role Tests

**Expected Permissions:**
- ✅ View assigned brands only
- ❌ Create/edit/delete webhooks
- ✅ View workflow executions (own brands)
- ✅ Access workflows dashboard (read-only)
- ❌ Access compose page
- ❌ Manage team members

**Test Cases:**

```typescript
// Test 1: Attempt to register webhook
const { mutate } = useRegisterWebhook();
mutate({...});
// Expected: Error "Insufficient permissions"

// Test 2: View executions (read-only)
const { data } = useWorkflowExecutions();
// Expected: Returns executions for assigned brands

// Test 3: Access compose page
// Navigate to: /dashboard/compose
// Expected: Redirect to /dashboard or error message
```

### RBAC Verification SQL Queries

```sql
-- Check user's permissions
SELECT u.email, ur.role, b.brand_display_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN brand_configurations b ON ur.brand_id = b.id
WHERE u.id = 'test-user-id';

-- Verify role enforcement
SELECT * FROM webhook_registry 
WHERE brand IN (
  SELECT b.brand_key 
  FROM brand_configurations b
  JOIN user_roles ur ON b.id = ur.brand_id
  WHERE ur.user_id = 'test-user-id'
);
```

---

## Webhook Event Testing

### Test Scenarios

#### Scenario 1: SMS Notification Webhook

**Trigger:**
```bash
curl -X POST \
  https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179 \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "send-sms",
    "brand": "thepinkypromiseatl",
    "channel": "sms",
    "event": "order_placed",
    "payload": {
      "order_id": "ORD-12345",
      "customer_name": "Jane Doe",
      "customer_phone": "+15551234567",
      "message": "Your order #ORD-12345 has been placed!"
    }
  }'
```

**Expected Response Time:** < 500ms

**Verification:**
```sql
SELECT * FROM workflow_executions 
WHERE metadata->>'event' = 'order_placed'
ORDER BY created_at DESC LIMIT 1;
```

#### Scenario 2: Email Notification Webhook

**Trigger:**
```bash
curl -X POST \
  https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179 \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "send-email",
    "brand": "dolodorsey",
    "channel": "email",
    "event": "welcome_email",
    "payload": {
      "user_email": "test@example.com",
      "user_name": "John Smith",
      "subject": "Welcome to KOLLECTIVE",
      "template_id": "welcome-v1"
    }
  }'
```

**Expected Response Time:** < 500ms

#### Scenario 3: Instagram DM Webhook

**Trigger:**
```bash
curl -X POST \
  https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179 \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "send-dm",
    "brand": "thepinkypromiseatl",
    "channel": "instagram",
    "event": "new_follower",
    "payload": {
      "instagram_username": "@newuser",
      "message": "Thanks for following!"
    }
  }'
```

**Expected Response Time:** < 500ms

### Batch Testing Script

```bash
#!/bin/bash
# test-webhooks.sh

WEBHOOK_URL="https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179"

echo "Testing Webhook Infrastructure..."
echo "=================================="

# Test 1: SMS
echo "Test 1: SMS Webhook"
RESPONSE_1=$(curl -s -w "\n%{http_code}" -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"workflow_name":"send-sms","brand":"thepinkypromiseatl","channel":"sms","event":"test"}')
echo "Response: $RESPONSE_1"
echo ""

# Test 2: Email
echo "Test 2: Email Webhook"
RESPONSE_2=$(curl -s -w "\n%{http_code}" -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"workflow_name":"send-email","brand":"dolodorsey","channel":"email","event":"test"}')
echo "Response: $RESPONSE_2"
echo ""

# Test 3: Instagram
echo "Test 3: Instagram Webhook"
RESPONSE_3=$(curl -s -w "\n%{http_code}" -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"workflow_name":"send-dm","brand":"thepinkypromiseatl","channel":"instagram","event":"test"}')
echo "Response: $RESPONSE_3"
echo ""

echo "Testing complete!"
```

**Run tests:**
```bash
chmod +x test-webhooks.sh
./test-webhooks.sh
```

---

## Data Flow Verification

### Step-by-Step Data Tracking

#### 1. App → Backend (tRPC)

**Enable tRPC logging:**
```typescript
// In lib/trpc.ts
const client = createTRPCReact<AppRouter>();

// Add logging middleware
const loggerLink = () => {
  return ({ next, op }) => {
    console.log('[tRPC]', op.type, op.path, op.input);
    return next((result) => {
      console.log('[tRPC] Result:', result);
      return result;
    });
  };
};
```

**Expected Console Output:**
```
[tRPC] mutation webhooks.registerWebhook {workflow_name: "...", ...}
[tRPC] Result: {success: true, data: {...}}
```

#### 2. Backend → n8n

**Check n8n execution logs:**
1. Go to: https://drdorsey.app.n8n.cloud/executions
2. Filter by workflow: "Webhook Infrastructure Handler"
3. Click on latest execution
4. Verify:
   - Input data matches POST payload
   - Supabase node executed successfully
   - No error messages

**Expected Execution Data:**
```json
{
  "webhook": {
    "body": {
      "workflow_name": "test-workflow",
      "brand": "thepinkypromiseatl",
      "channel": "sms"
    }
  },
  "supabase": {
    "status": "success",
    "rows_inserted": 1
  }
}
```

#### 3. n8n → Supabase

**Direct database verification:**
```sql
-- Check latest insertion
SELECT 
  id,
  workflow_name,
  brand,
  channel,
  created_at,
  metadata
FROM workflow_executions 
ORDER BY created_at DESC 
LIMIT 1;

-- Verify timing (should be < 1 second after webhook trigger)
SELECT 
  created_at,
  NOW() - created_at as age
FROM workflow_executions 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Result:**
- Age < 5 seconds
- All fields populated correctly
- No NULL values (except webhook_id if not linked)

#### 4. Supabase → App (React Query)

**Enable React Query devtools logging:**
```typescript
// In app/_layout.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Expected Query Behavior:**
```
[React Query] Query ['webhooks'] fetching...
[React Query] Query ['webhooks'] success - 5 items
[React Query] Cache updated
```

### Data Consistency Checks

**Query to verify data consistency:**
```sql
-- Check for orphaned executions
SELECT we.* 
FROM workflow_executions we
LEFT JOIN webhook_registry wr ON we.webhook_id = wr.id
WHERE we.webhook_id IS NOT NULL 
  AND wr.id IS NULL;

-- Should return 0 rows

-- Check for mismatched brands
SELECT DISTINCT brand FROM webhook_registry
EXCEPT
SELECT DISTINCT brand_key FROM brand_configurations;

-- Should return 0 rows
```

---

## Performance Benchmarks

### Success Criteria

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| Webhook Response Time | < 200ms | 200-500ms | > 500ms |
| tRPC Mutation Time | < 100ms | 100-300ms | > 300ms |
| Database Query Time | < 50ms | 50-150ms | > 150ms |
| App Load Time | < 2s | 2-5s | > 5s |
| React Query Fetch | < 100ms | 100-300ms | > 300ms |

### Performance Testing

#### Test 1: Webhook Response Time

```bash
# Test with curl timing
curl -X POST \
  https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179 \
  -H "Content-Type: application/json" \
  -d '{"workflow_name":"test","brand":"test","channel":"sms"}' \
  -w "\nTime Total: %{time_total}s\n"
```

**Expected Output:**
```
{"success":true,"execution_id":"..."}
Time Total: 0.234s
```

#### Test 2: Database Query Performance

```sql
-- Enable timing
\timing on

-- Test webhook query
SELECT * FROM webhook_registry WHERE brand = 'thepinkypromiseatl';
-- Expected: Time < 50ms

-- Test execution query
SELECT * FROM workflow_executions 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
-- Expected: Time < 100ms

-- Test join query
SELECT wr.workflow_name, COUNT(we.id) as execution_count
FROM webhook_registry wr
LEFT JOIN workflow_executions we ON wr.id = we.webhook_id
WHERE wr.status = 'active'
GROUP BY wr.id, wr.workflow_name;
-- Expected: Time < 150ms
```

#### Test 3: Load Testing

```bash
# Install Apache Bench
brew install apache-bench

# Run load test
ab -n 100 -c 10 \
  -p payload.json \
  -T "application/json" \
  https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179
```

**payload.json:**
```json
{"workflow_name":"load-test","brand":"test","channel":"sms","event":"stress_test"}
```

**Expected Results:**
- Requests per second: > 20
- Failed requests: 0
- 95th percentile: < 500ms

### Monitoring Queries

```sql
-- Average execution time per brand
SELECT 
  brand,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_processing_time_seconds
FROM workflow_executions
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY brand;

-- Execution success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM workflow_executions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Peak usage times
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as executions
FROM workflow_executions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY executions DESC
LIMIT 10;
```

---

## Troubleshooting Guide

### Issue 1: "Failed to fetch" Error

**Symptoms:**
- ConnectionDiagnostic shows red X
- Console: `[API] Request failed: TypeError: Failed to fetch`

**Diagnosis:**
```typescript
// Check environment variables
console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('Webhook Path:', process.env.EXPO_PUBLIC_WEBHOOK_PATH);

// Test direct fetch
fetch('https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
  .then(res => console.log('Success:', res.status))
  .catch(err => console.error('Error:', err));
```

**Solutions:**
1. Verify .env file exists and is loaded
2. Check network connectivity (try in browser)
3. Verify n8n workflow is Active
4. Check CORS settings in n8n
5. Test with curl on same network

### Issue 2: Data Not Appearing in Supabase

**Symptoms:**
- Webhook returns 200
- n8n shows successful execution
- No row in workflow_executions table

**Diagnosis:**
```sql
-- Check table structure
\d workflow_executions;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'workflow_executions';

-- Check for errors in n8n
-- Go to: n8n → Executions → Filter "Error"
```

**Solutions:**
1. Disable RLS policies temporarily for testing
2. Verify Supabase credentials in n8n
3. Check n8n node configuration (table name, column mappings)
4. Verify service role key has INSERT permission

### Issue 3: RBAC Permissions Not Working

**Symptoms:**
- Team member can access owner features
- Manager can't see assigned brands

**Diagnosis:**
```sql
-- Check user's role assignment
SELECT * FROM user_roles WHERE user_id = 'problem-user-id';

-- Check role definition
SELECT * FROM roles WHERE name = 'manager';

-- Check permission mappings
SELECT r.name, p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'manager';
```

**Solutions:**
1. Verify role is assigned correctly in user_roles table
2. Check AccessGuard component is wrapping protected routes
3. Verify useAuth() hook returns correct role
4. Clear app cache and re-login

### Issue 4: Slow Webhook Response

**Symptoms:**
- Webhook takes > 1 second to respond
- n8n execution shows long processing time

**Diagnosis:**
```bash
# Test webhook timing
time curl -X POST https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179 \
  -H "Content-Type: application/json" \
  -d '{"test":true}'

# Check n8n execution details
# Go to: n8n → Executions → Click execution → View node timing
```

**Solutions:**
1. Check Supabase connection latency
2. Optimize n8n workflow (remove unnecessary nodes)
3. Add database indexes:
```sql
CREATE INDEX idx_workflow_executions_brand ON workflow_executions(brand);
CREATE INDEX idx_workflow_executions_created ON workflow_executions(created_at DESC);
```
4. Consider caching frequently accessed data

### Issue 5: Webhook Returns 404

**Symptoms:**
- curl returns 404 Not Found
- n8n workflow not triggering

**Diagnosis:**
```bash
# Verify webhook URL
curl -I https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179

# Check n8n workflow status
# Go to: n8n → Workflows → Find "Webhook Infrastructure Handler"
# Status should be "Active" (green circle)
```

**Solutions:**
1. Activate workflow in n8n dashboard
2. Verify webhook URL is correct (check for typos)
3. Ensure webhook node is properly configured
4. Check n8n service is running (not down for maintenance)

---

## Automated Testing Scripts

### Complete Test Suite

**File: `scripts/run-integration-tests.sh`**
```bash
#!/bin/bash

echo "🚀 KOLLECTIVE BOH Integration Test Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

WEBHOOK_URL="https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179"
PASSED=0
FAILED=0

# Test 1: Webhook Connectivity
echo "Test 1: Webhook Connectivity"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"test":"connectivity"}')

if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✅ PASSED${NC} - Webhook returned 200"
  PASSED=$((PASSED+1))
else
  echo -e "${RED}❌ FAILED${NC} - Webhook returned $RESPONSE"
  FAILED=$((FAILED+1))
fi
echo ""

# Test 2: SMS Workflow
echo "Test 2: SMS Workflow"
SMS_RESPONSE=$(curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"workflow_name":"send-sms","brand":"thepinkypromiseatl","channel":"sms","event":"test"}')

if [[ $SMS_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✅ PASSED${NC} - SMS webhook executed"
  PASSED=$((PASSED+1))
else
  echo -e "${RED}❌ FAILED${NC} - SMS webhook failed: $SMS_RESPONSE"
  FAILED=$((FAILED+1))
fi
echo ""

# Test 3: Email Workflow
echo "Test 3: Email Workflow"
EMAIL_RESPONSE=$(curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"workflow_name":"send-email","brand":"dolodorsey","channel":"email","event":"test"}')

if [[ $EMAIL_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✅ PASSED${NC} - Email webhook executed"
  PASSED=$((PASSED+1))
else
  echo -e "${RED}❌ FAILED${NC} - Email webhook failed: $EMAIL_RESPONSE"
  FAILED=$((FAILED+1))
fi
echo ""

# Test 4: Response Time
echo "Test 4: Response Time"
START=$(date +%s.%N)
curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"test":"timing"}' > /dev/null
END=$(date +%s.%N)
DURATION=$(echo "$END - $START" | bc)

if (( $(echo "$DURATION < 0.5" | bc -l) )); then
  echo -e "${GREEN}✅ PASSED${NC} - Response time: ${DURATION}s"
  PASSED=$((PASSED+1))
else
  echo -e "${YELLOW}⚠️  WARNING${NC} - Response time: ${DURATION}s (> 0.5s)"
  FAILED=$((FAILED+1))
fi
echo ""

# Summary
echo "========================================"
echo "Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
```

**Run tests:**
```bash
chmod +x scripts/run-integration-tests.sh
./scripts/run-integration-tests.sh
```

### Database Verification Script

**File: `scripts/verify-database.sql`**
```sql
-- KOLLECTIVE BOH Database Verification Script
-- Run this in Supabase SQL Editor

\echo '=== Database Schema Verification ==='
\echo ''

-- Check tables exist
\echo 'Checking tables...'
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('webhook_registry', 'workflow_executions', 'brand_configurations')
ORDER BY table_name;

\echo ''
\echo '=== Data Verification ==='
\echo ''

-- Check record counts
\echo 'Record counts:'
SELECT 'webhook_registry' as table_name, COUNT(*) as records FROM webhook_registry
UNION ALL
SELECT 'workflow_executions', COUNT(*) FROM workflow_executions
UNION ALL
SELECT 'brand_configurations', COUNT(*) FROM brand_configurations;

\echo ''
\echo '=== Recent Activity ==='
\echo ''

-- Latest webhook registrations
\echo 'Latest webhook registrations:'
SELECT 
  workflow_name,
  brand,
  channel,
  status,
  created_at
FROM webhook_registry 
ORDER BY created_at DESC 
LIMIT 5;

\echo ''
-- Latest executions
\echo 'Latest workflow executions:'
SELECT 
  brand,
  channel,
  status,
  created_at
FROM workflow_executions 
ORDER BY created_at DESC 
LIMIT 5;

\echo ''
\echo '=== Health Checks ==='
\echo ''

-- Check for inactive webhooks
SELECT 
  COUNT(*) as inactive_webhooks
FROM webhook_registry 
WHERE status != 'active';

-- Check for old executions (no activity in 24h)
SELECT 
  COUNT(*) as recent_executions
FROM workflow_executions 
WHERE created_at > NOW() - INTERVAL '24 hours';

\echo ''
\echo '✅ Database verification complete'
```

---

## Success Checklist

Use this checklist to verify complete system integration:

### Pre-Deployment
- [ ] Environment variables configured in .env
- [ ] Supabase tables created and populated
- [ ] n8n workflow activated
- [ ] RBAC roles and permissions configured
- [ ] ConnectionDiagnostic component shows all green

### Functional Testing
- [ ] Can register new webhook via app
- [ ] Can view webhooks in app
- [ ] Can trigger webhook via curl
- [ ] Can see execution logs in app
- [ ] Owner can access all features
- [ ] Manager sees only assigned brands
- [ ] Team member has read-only access

### Performance Testing
- [ ] Webhook response < 500ms
- [ ] Database queries < 150ms
- [ ] App loads in < 5 seconds
- [ ] Load test passes (100 requests)

### Data Integrity
- [ ] All webhook executions logged
- [ ] No orphaned records
- [ ] Timestamps accurate
- [ ] Metadata properly stored

### Monitoring
- [ ] Can view execution logs in n8n
- [ ] Can query Supabase directly
- [ ] Error logging working
- [ ] Console logs informative

---

## Additional Resources

**Documentation:**
- [WEBHOOK-INFRASTRUCTURE.md](./WEBHOOK-INFRASTRUCTURE.md) - System architecture
- [PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md) - Deployment steps
- [RBAC-SETUP-COMPLETE.md](./RBAC-SETUP-COMPLETE.md) - RBAC configuration

**External Links:**
- [n8n Dashboard](https://drdorsey.app.n8n.cloud)
- [Supabase Dashboard](https://supabase.com/dashboard/project/wfkohcwxxsrhcxhepfql)
- [tRPC Documentation](https://trpc.io)

---

**Last Updated:** January 4, 2026  
**Maintained By:** KOLLECTIVE BOH Development Team  
**Status:** Production Ready ✅
