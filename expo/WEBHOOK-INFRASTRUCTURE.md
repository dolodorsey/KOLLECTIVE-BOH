# Kollective BOH - Webhook Infrastructure Documentation

## Overview

The Kollective BOH app features a comprehensive webhook management system that enables dynamic n8n workflow integration, brand-specific automation, and real-time execution monitoring. This infrastructure eliminates hardcoded webhook URLs and provides a centralized registry for all automation workflows.

### Key Features
- **Dynamic Webhook Registry**: Register, update, and manage n8n workflow endpoints without code changes
- **Brand-Based Routing**: Multi-brand support with channel-specific configurations (SMS, Email, DM)
- **Execution Logging**: Complete audit trail with performance metrics and error tracking
- **Real-Time Monitoring**: Live dashboard for workflow execution status and debugging
- **Unified API Gateway**: Single entry point (AO Core) for all workflow executions

---

## Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         │ tRPC
         │
┌────────▼────────────────────────────────────┐
│          Backend (Hono + tRPC)              │
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │   Webhooks   │  │   AO Core    │       │
│  │   Router     │  │   Router     │       │
│  └──────────────┘  └──────┬───────┘       │
│                            │               │
│  ┌──────────────┐          │               │
│  │   Brands     │          │               │
│  │   Router     │          │               │
│  └──────────────┘          │               │
└────────────────────────────┼───────────────┘
                             │
                    ┌────────▼────────┐
                    │   Supabase DB   │
                    │                 │
                    │  - webhook_     │
                    │    registry     │
                    │  - workflow_    │
                    │    executions   │
                    │  - brand_       │
                    │    configurations│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   n8n Workflows │
                    │   (External)    │
                    └─────────────────┘
```

---

## Database Schema

### 1. `webhook_registry` Table
Stores all registered n8n webhook endpoints.

```sql
CREATE TABLE webhook_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT UNIQUE NOT NULL,        -- e.g., "send-email", "generate-content"
  n8n_endpoint TEXT NOT NULL,                -- Full n8n webhook URL
  brand TEXT,                                 -- Optional brand filter (e.g., "dolodorsey")
  channel TEXT,                               -- Optional channel (e.g., "email", "sms", "dm")
  status TEXT DEFAULT 'active'                -- 'active' | 'inactive' | 'testing'
    CHECK (status IN ('active', 'inactive', 'testing')),
  metadata JSONB DEFAULT '{}',                -- Flexible additional data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example row:
{
  "id": "uuid-here",
  "workflow_name": "send-email",
  "n8n_endpoint": "https://n8n.yourserver.com/webhook/abc123",
  "brand": "dolodorsey",
  "channel": "email",
  "status": "active",
  "metadata": {
    "description": "Send transactional emails via SendGrid",
    "rate_limit": "100/hour"
  }
}
```

**Purpose**: Central registry for all workflow endpoints. Allows updating n8n URLs without redeploying the app.

---

### 2. `workflow_executions` Table
Logs every workflow execution with complete audit trail.

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES webhook_registry(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),      -- Who triggered the workflow
  input_payload JSONB NOT NULL,              -- Request data sent to n8n
  output_payload JSONB,                      -- Response from n8n (if successful)
  status TEXT DEFAULT 'pending'              -- 'pending' | 'success' | 'failed' | 'timeout'
    CHECK (status IN ('pending', 'success', 'failed', 'timeout')),
  execution_time_ms INTEGER,                 -- Performance metric
  error_message TEXT,                        -- Failure details
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example row:
{
  "id": "exec-uuid",
  "workflow_id": "webhook-uuid",
  "user_id": "user-uuid",
  "input_payload": {
    "recipient": "client@example.com",
    "subject": "Welcome!",
    "message": "Thanks for joining..."
  },
  "output_payload": {
    "success": true,
    "message_id": "msg_abc123"
  },
  "status": "success",
  "execution_time_ms": 1247,
  "error_message": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Purpose**: Complete execution history for debugging, analytics, and compliance.

---

### 3. `brand_configurations` Table
Brand-specific settings and channel enablement.

```sql
CREATE TABLE brand_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_key TEXT UNIQUE NOT NULL,            -- Lowercase identifier (e.g., "dolodorsey")
  brand_display_name TEXT NOT NULL,          -- Human-readable (e.g., "Dolo Dorsey")
  ghl_location_id TEXT,                      -- GoHighLevel integration ID
  email_from TEXT,                           -- Default sender email
  instagram_account_id TEXT,                 -- Instagram API account
  sms_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  dm_enabled BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',               -- Additional config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example row:
{
  "id": "brand-uuid",
  "brand_key": "thepinkypromiseatl",
  "brand_display_name": "The Pinky Promise ATL",
  "ghl_location_id": "loc_xyz789",
  "email_from": "hello@pinkypromise.com",
  "instagram_account_id": "ig_12345",
  "sms_enabled": true,
  "email_enabled": true,
  "dm_enabled": false,
  "metadata": {
    "timezone": "America/New_York",
    "default_signature": "The Pinky Promise Team"
  }
}
```

**Purpose**: Brand-specific configuration for multi-tenant workflow routing.

---

## API Endpoints (tRPC)

### Webhooks Router (`backend/trpc/routes/webhooks.ts`)

#### `webhooks.registerWebhook`
Register a new workflow endpoint.

```typescript
// Input
{
  workflow_name: string;          // Unique identifier
  n8n_endpoint: string;           // Full URL
  brand?: string;                 // Optional brand key
  channel?: string;               // Optional channel type
  status?: 'active' | 'inactive' | 'testing';
  metadata?: Record<string, any>;
}

// Output
WebhookRegistry // Full registered webhook object

// Example usage
const webhook = await trpc.webhooks.registerWebhook.mutate({
  workflow_name: "send-sms",
  n8n_endpoint: "https://n8n.server.com/webhook/sms-trigger",
  brand: "dolodorsey",
  channel: "sms",
  status: "active"
});
```

#### `webhooks.getWebhooks`
Fetch all webhooks with optional filters.

```typescript
// Input (optional)
{
  brand?: string;
  status?: 'active' | 'inactive' | 'testing';
}

// Output
WebhookRegistry[] // Array of webhooks

// Example
const activeWebhooks = await trpc.webhooks.getWebhooks.query({ 
  status: 'active' 
});
```

#### `webhooks.getWebhookByName`
Get a specific webhook by workflow name.

```typescript
// Input
{ workflow_name: string }

// Output
WebhookRegistry // Single webhook (throws if not found)
```

#### `webhooks.updateWebhook`
Update webhook configuration.

```typescript
// Input
{
  id: string;                     // UUID
  n8n_endpoint?: string;          // Update URL
  status?: 'active' | 'inactive' | 'testing';
  metadata?: Record<string, any>;
}
```

#### `webhooks.deleteWebhook`
Remove a webhook from the registry.

```typescript
// Input
{ id: string }

// Output
{ success: true }
```

#### `webhooks.getExecutions`
Fetch execution logs with filtering.

```typescript
// Input (optional)
{
  workflow_id?: string;           // Filter by webhook
  user_id?: string;               // Filter by user
  status?: 'pending' | 'success' | 'failed' | 'timeout';
  limit?: number;                 // Default 50, max 100
}

// Output
WorkflowExecution[] // Array with joined webhook_registry data
```

#### `webhooks.getExecutionById`
Get detailed execution information.

```typescript
// Input
{ id: string }

// Output
WorkflowExecution // Single execution with webhook details
```

---

### AO Core Router (`backend/trpc/routes/ao-core.ts`)

#### `aoCore.executeWorkflow`
**Primary API Gateway** - Execute any registered workflow.

```typescript
// Input
{
  workflow_name: string;          // Must exist in webhook_registry
  payload: Record<string, any>;   // Data to send to n8n
  brand?: string;                 // Optional brand filter
}

// Output
{
  execution_id: string;           // UUID for tracking
  status: 'success' | 'failed';
  output_payload?: Record<string, any>;
  execution_time_ms?: number;
}

// Example: Send an email
const result = await trpc.aoCore.executeWorkflow.mutate({
  workflow_name: "send-email",
  brand: "dolodorsey",
  payload: {
    recipient: "client@example.com",
    subject: "Campaign Launch",
    message: "Your campaign is live!"
  }
});

console.log(`Execution ID: ${result.execution_id}`);
console.log(`Completed in: ${result.execution_time_ms}ms`);
```

**Internal Flow:**
1. Authenticate user (via Supabase session)
2. Lookup webhook in `webhook_registry` by `workflow_name` + `brand`
3. Create `workflow_executions` record with status 'pending'
4. POST to n8n endpoint with payload + metadata
5. Update execution record with result (success/failed)
6. Return execution summary

**Error Handling:**
- Webhook not found → `throw Error("Workflow not found or inactive")`
- Network failure → Logs to `workflow_executions` with error_message
- HTTP non-200 → Stores response body in error_message

#### `aoCore.getWorkflowStatus`
Poll execution status (for async workflows).

```typescript
// Input
{ execution_id: string }

// Output
WorkflowExecution // Full execution details with webhook info
```

---

### Brands Router (`backend/trpc/routes/brands.ts`)

#### `brands.getBrands`
List all brand configurations.

```typescript
// Output
BrandConfiguration[] // All brands, ordered by display name
```

#### `brands.getBrandByKey`
Get single brand configuration.

```typescript
// Input
{ brand_key: string }

// Output
BrandConfiguration
```

#### `brands.createBrand`
Add a new brand to the system.

```typescript
// Input
{
  brand_key: string;              // Unique identifier
  brand_display_name: string;
  ghl_location_id?: string;
  email_from?: string;
  instagram_account_id?: string;
  sms_enabled?: boolean;
  email_enabled?: boolean;
  dm_enabled?: boolean;
  metadata?: Record<string, any>;
}

// Example
const brand = await trpc.brands.createBrand.mutate({
  brand_key: "new-brand-llc",
  brand_display_name: "New Brand LLC",
  email_from: "contact@newbrand.com",
  email_enabled: true,
  sms_enabled: false,
  dm_enabled: false
});
```

#### `brands.updateBrand`
Update brand settings.

```typescript
// Input
{
  id: string;                     // UUID
  brand_display_name?: string;
  ghl_location_id?: string;
  email_from?: string;
  instagram_account_id?: string;
  sms_enabled?: boolean;
  email_enabled?: boolean;
  dm_enabled?: boolean;
  metadata?: Record<string, any>;
}
```

#### `brands.deleteBrand`
Remove a brand from the system.

```typescript
// Input
{ id: string }
```

---

## Frontend Components

### 1. Workflows Dashboard (`app/(owner)/workflows.tsx`)

Real-time monitoring of all workflow executions.

**Features:**
- Live execution feed with auto-refresh
- Status filtering (All, Success, Pending, Failed, Timeout)
- Color-coded status indicators
- Performance metrics (execution time)
- Error message display
- Relative timestamps ("5m ago", "2h ago")

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ⚡ Workflow Executions             │
│  Real-time automation intelligence  │
├─────────────────────────────────────┤
│  [All] [Success] [Pending] [Failed] │ ← Status filters
├─────────────────────────────────────┤
│  ✅ send-email        [SUCCESS]     │
│     Brand: dolodorsey               │
│     Duration: 1.24s | 5m ago        │
│                                     │
│  ❌ generate-content  [FAILED]      │
│     Error: HTTP 500: Timeout        │
│     Duration: 30.00s | 12m ago      │
│                                     │
│  ⏱️  send-sms          [PENDING]    │
│     Brand: thepinkypromiseatl       │
│     Duration: N/A | Just now        │
└─────────────────────────────────────┘
```

**Usage:**
```typescript
import { useWorkflowExecutions } from '@/hooks/webhooks-context';

const { data: executions } = useWorkflowExecutions({
  status: 'failed',
  limit: 50
});
```

---

### 2. Compose Message UI (`app/(owner)/compose.tsx`)

Unified interface for sending messages via SMS, Email, or DM.

**Features:**
- Brand selector (only shows configured brands)
- Channel selection with enabled/disabled states
- Dynamic form fields (subject line for email only)
- Real-time workflow execution
- Success/error feedback

**UI Flow:**
```
1. Select Brand
   ┌──────────────┐ ┌──────────────┐
   │ Dolo Dorsey  │ │ Pinky Promise│
   └──────────────┘ └──────────────┘

2. Select Channel
   ┌─────┐ ┌───────┐ ┌─────┐
   │ SMS │ │ EMAIL │ │ DM  │
   │ ON  │ │  ON   │ │ OFF │
   └─────┘ └───────┘ └─────┘

3. Enter Recipient
   ┌──────────────────────────────┐
   │ recipient@example.com        │
   └──────────────────────────────┘

4. Compose Message
   ┌──────────────────────────────┐
   │ Your message here...         │
   │                              │
   │                              │
   └──────────────────────────────┘

5. [DEPLOY MESSAGE] ← Trigger workflow
```

**Workflow Mapping:**
- SMS → Calls workflow `send-sms`
- Email → Calls workflow `send-email`
- DM → Calls workflow `send-dm`

**Usage:**
```typescript
import { useExecuteWorkflow } from '@/hooks/ao-core-context';

const executeWorkflow = useExecuteWorkflow();

await executeWorkflow.mutateAsync({
  workflow_name: "send-email",
  brand: "dolodorsey",
  payload: {
    recipient: "client@example.com",
    subject: "Welcome",
    message: "Thanks for joining!"
  }
});
```

---

## React Hooks

All tRPC calls are wrapped in convenient React hooks:

### Webhook Management
```typescript
import {
  useWebhooks,
  useWebhookByName,
  useRegisterWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useWorkflowExecutions,
  useExecutionById
} from '@/hooks/webhooks-context';
```

### Brand Management
```typescript
import {
  useBrands,
  useBrandByKey,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand
} from '@/hooks/workflows-context';
```

### Workflow Execution
```typescript
import {
  useExecuteWorkflow,
  useWorkflowStatus
} from '@/hooks/ao-core-context';
```

---

## Setup Guide

### 1. Register n8n Webhooks in the System

**SQL Method (Initial Setup):**
```sql
INSERT INTO webhook_registry (workflow_name, n8n_endpoint, brand, channel, status)
VALUES
  ('send-email', 'https://n8n.server.com/webhook/email-abc123', 'dolodorsey', 'email', 'active'),
  ('send-sms', 'https://n8n.server.com/webhook/sms-xyz789', 'dolodorsey', 'sms', 'active'),
  ('generate-content', 'https://n8n.server.com/webhook/ai-content', NULL, NULL, 'active');
```

**API Method (Programmatic):**
```typescript
const registerWebhook = useRegisterWebhook();

await registerWebhook.mutateAsync({
  workflow_name: "send-email",
  n8n_endpoint: "https://n8n.yourserver.com/webhook/abc123",
  brand: "dolodorsey",
  channel: "email",
  status: "active",
  metadata: {
    description: "Send transactional emails",
    rate_limit: "100/hour"
  }
});
```

---

### 2. Add New Brands

**SQL Method:**
```sql
INSERT INTO brand_configurations (
  brand_key, 
  brand_display_name, 
  ghl_location_id, 
  email_from, 
  sms_enabled, 
  email_enabled
) VALUES (
  'newbrand',
  'New Brand Inc',
  'ghl_loc_12345',
  'hello@newbrand.com',
  true,
  true
);
```

**API Method:**
```typescript
const createBrand = useCreateBrand();

await createBrand.mutateAsync({
  brand_key: "newbrand",
  brand_display_name: "New Brand Inc",
  ghl_location_id: "ghl_loc_12345",
  email_from: "hello@newbrand.com",
  sms_enabled: true,
  email_enabled: true,
  dm_enabled: false
});
```

---

### 3. Update n8n Workflows to Use Dynamic System

**Old Pattern (Hardcoded):**
```javascript
// ❌ Bad: Hardcoded in code
const response = await fetch('https://n8n.server.com/webhook/old-url', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

**New Pattern (Dynamic):**
```typescript
// ✅ Good: Use AO Core
import { useExecuteWorkflow } from '@/hooks/ao-core-context';

const executeWorkflow = useExecuteWorkflow();

const result = await executeWorkflow.mutateAsync({
  workflow_name: "send-email",  // Looks up URL in database
  brand: "dolodorsey",
  payload: { recipient, subject, message }
});
```

**Benefits:**
- Update n8n URLs without app redeployment
- Automatic execution logging
- Built-in error handling
- User attribution
- Performance tracking

---

### 4. n8n Webhook Configuration

Your n8n workflows should expect this payload structure:

```json
{
  "recipient": "user@example.com",
  "subject": "Your Subject",
  "message": "Your message content",
  "_meta": {
    "execution_id": "uuid-of-execution",
    "workflow_name": "send-email",
    "brand": "dolodorsey",
    "user_id": "uuid-of-user",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**n8n Webhook Settings:**
- Method: POST
- Response Mode: "Last Node"
- Response Data: "Using Fields Below"

**Recommended n8n Response:**
```json
{
  "success": true,
  "message_id": "msg_abc123",
  "timestamp": "{{ $now }}",
  "details": {}
}
```

---

## Example API Calls

### Execute a Workflow
```typescript
const result = await trpc.aoCore.executeWorkflow.mutate({
  workflow_name: "send-email",
  brand: "dolodorsey",
  payload: {
    recipient: "client@example.com",
    subject: "Welcome to The Kollective",
    message: "We're excited to have you on board!"
  }
});

console.log(`Execution ID: ${result.execution_id}`);
console.log(`Status: ${result.status}`);
console.log(`Time: ${result.execution_time_ms}ms`);
```

### Check Execution Status
```typescript
const execution = await trpc.aoCore.getWorkflowStatus.query({
  execution_id: "exec-uuid-here"
});

console.log(`Status: ${execution.status}`);
if (execution.error_message) {
  console.error(`Error: ${execution.error_message}`);
}
```

### List Failed Executions
```typescript
const failures = await trpc.webhooks.getExecutions.query({
  status: "failed",
  limit: 25
});

failures.forEach(exec => {
  console.log(`${exec.webhook_registry.workflow_name}: ${exec.error_message}`);
});
```

### Update Webhook URL (Zero Downtime)
```typescript
// Step 1: Set to testing while you update n8n
await trpc.webhooks.updateWebhook.mutate({
  id: "webhook-uuid",
  status: "testing"
});

// Step 2: Update n8n workflow, get new URL

// Step 3: Update webhook registry with new URL
await trpc.webhooks.updateWebhook.mutate({
  id: "webhook-uuid",
  n8n_endpoint: "https://n8n.server.com/webhook/new-url",
  status: "active"
});
```

---

## Monitoring and Debugging

### View Real-Time Executions
Navigate to **Workflows** tab in the app to see:
- Live execution feed
- Status indicators (Success ✅, Failed ❌, Pending ⏱️)
- Performance metrics
- Error messages

### Query Executions Programmatically
```typescript
// Get all executions for a specific workflow
const executions = await trpc.webhooks.getExecutions.query({
  workflow_id: "webhook-uuid",
  limit: 100
});

// Calculate success rate
const total = executions.length;
const successful = executions.filter(e => e.status === 'success').length;
const successRate = (successful / total) * 100;
console.log(`Success Rate: ${successRate.toFixed(2)}%`);

// Average execution time
const avgTime = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / total;
console.log(`Avg Execution Time: ${avgTime.toFixed(0)}ms`);
```

### Debug Failed Workflows
```sql
-- Find recent failures
SELECT 
  we.id,
  wr.workflow_name,
  wr.brand,
  we.error_message,
  we.execution_time_ms,
  we.created_at
FROM workflow_executions we
JOIN webhook_registry wr ON we.workflow_id = wr.id
WHERE we.status = 'failed'
ORDER BY we.created_at DESC
LIMIT 10;

-- Check if a webhook is misconfigured
SELECT * FROM webhook_registry
WHERE status = 'active' AND n8n_endpoint LIKE '%localhost%';
```

### Performance Analysis
```sql
-- Slowest workflows (avg execution time)
SELECT 
  wr.workflow_name,
  COUNT(*) as execution_count,
  AVG(we.execution_time_ms) as avg_time_ms,
  MAX(we.execution_time_ms) as max_time_ms
FROM workflow_executions we
JOIN webhook_registry wr ON we.workflow_id = wr.id
WHERE we.status = 'success'
GROUP BY wr.workflow_name
ORDER BY avg_time_ms DESC;
```

### Health Check Queries
```sql
-- Webhooks needing attention
SELECT 
  workflow_name,
  status,
  updated_at
FROM webhook_registry
WHERE status = 'testing' OR status = 'inactive';

-- Recent error patterns
SELECT 
  LEFT(error_message, 50) as error_prefix,
  COUNT(*) as occurrence_count
FROM workflow_executions
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_prefix
ORDER BY occurrence_count DESC;
```

---

## Best Practices

### 1. Webhook Naming Convention
Use descriptive, action-based names:
- ✅ `send-email`, `generate-content`, `create-lead`
- ❌ `webhook-1`, `n8n-flow`, `automation`

### 2. Status Management
- `active`: Production workflows
- `testing`: Development/staging workflows
- `inactive`: Temporarily disabled (keeps execution history)

### 3. Error Handling
Always wrap workflow calls in try-catch:
```typescript
try {
  const result = await executeWorkflow.mutateAsync({...});
  Alert.alert('Success', 'Message sent!');
} catch (error: any) {
  Alert.alert('Error', error.message);
  // Error is already logged in workflow_executions
}
```

### 4. Brand Filtering
When workflows are brand-specific, always include the brand parameter:
```typescript
await executeWorkflow.mutateAsync({
  workflow_name: "send-sms",
  brand: "dolodorsey",  // ← Important for correct routing
  payload: {...}
});
```

### 5. Metadata Usage
Store useful context in webhook metadata:
```typescript
metadata: {
  "version": "2.0",
  "owner": "marketing-team",
  "description": "Sends promotional emails",
  "rate_limit": "500/hour",
  "dependencies": ["sendgrid", "segment"]
}
```

---

## Next Steps for Full Integration

### 1. Enable RLS Policies
Add Row Level Security to webhook tables:
```sql
ALTER TABLE webhook_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_configurations ENABLE ROW LEVEL SECURITY;

-- Allow org members to view webhooks
CREATE POLICY "Org members can view webhooks"
  ON webhook_registry FOR SELECT
  USING (true);  -- Adjust based on your org logic

-- Allow only owners/admins to modify webhooks
CREATE POLICY "Admins can manage webhooks"
  ON webhook_registry FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );
```

### 2. Add Webhook Management UI
Create admin screen for CRUD operations on webhooks:
- List all webhooks with status indicators
- Add/Edit form with validation
- Test webhook button (sends test payload)
- View execution history per webhook

### 3. Implement Rate Limiting
Add throttling to prevent abuse:
```typescript
// Check execution count in last hour
const recentExecutions = await ctx.supabase
  .from('workflow_executions')
  .select('id')
  .eq('workflow_id', webhook.id)
  .gt('created_at', new Date(Date.now() - 3600000).toISOString());

if (recentExecutions.data && recentExecutions.data.length > 100) {
  throw new Error('Rate limit exceeded');
}
```

### 4. Add Webhook Retry Logic
For failed executions, implement exponential backoff:
```typescript
const MAX_RETRIES = 3;
let attempt = 0;

while (attempt < MAX_RETRIES) {
  try {
    const response = await fetch(webhook.n8n_endpoint, {...});
    if (response.ok) break;
  } catch (error) {
    attempt++;
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
  }
}
```

### 5. Analytics Dashboard
Build metrics visualization:
- Executions per hour/day/week
- Success rate trends
- Top 10 slowest workflows
- Error frequency by workflow
- Brand usage statistics

### 6. Webhook Versioning
Support multiple versions of the same workflow:
```typescript
workflow_name: "send-email-v2"  // Allows gradual migration
```

### 7. Scheduled Workflows
Add cron-like scheduling:
```sql
ALTER TABLE webhook_registry ADD COLUMN schedule TEXT;
-- e.g., "0 9 * * *" for daily at 9am
```

### 8. Webhook Signing
Add HMAC signatures for security:
```typescript
const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

headers: {
  'X-Webhook-Signature': signature
}
```

### 9. Multi-Environment Support
Add environment field to webhooks:
```sql
ALTER TABLE webhook_registry ADD COLUMN environment TEXT DEFAULT 'production';
-- 'development' | 'staging' | 'production'
```

### 10. Notification System
Alert admins on critical failures:
- 3+ consecutive failures → Send alert
- Execution time > 30s → Performance warning
- Status = 'inactive' > 7 days → Cleanup reminder

---

## Troubleshooting

### Webhook Not Found
**Error**: `Workflow "send-email" not found or inactive`

**Solutions:**
1. Check webhook exists and is active:
   ```sql
   SELECT * FROM webhook_registry WHERE workflow_name = 'send-email';
   ```
2. Verify brand filter matches:
   ```sql
   SELECT * FROM webhook_registry 
   WHERE workflow_name = 'send-email' AND brand = 'dolodorsey';
   ```
3. Register the webhook if missing (see Setup Guide)

### n8n Endpoint Not Responding
**Error**: `Workflow execution failed: HTTP 500`

**Solutions:**
1. Test n8n endpoint directly:
   ```bash
   curl -X POST https://n8n.server.com/webhook/abc123 \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
2. Check n8n workflow is activated
3. Verify n8n server is running and accessible

### Executions Not Logging
**Issue**: Workflows run but no records in `workflow_executions`

**Solutions:**
1. Check RLS policies allow inserts
2. Verify user is authenticated (check `auth.uid()`)
3. Review Supabase logs for permission errors

### Slow Execution Times
**Issue**: Workflows taking > 10 seconds

**Solutions:**
1. Review n8n workflow complexity
2. Add caching to n8n nodes
3. Use async workflows for long-running tasks
4. Split complex workflows into smaller ones

---

## Summary

The Kollective BOH webhook infrastructure provides:

✅ **Centralized Management** - All webhooks in one registry  
✅ **Zero-Downtime Updates** - Change n8n URLs without redeployment  
✅ **Complete Audit Trail** - Every execution logged with metrics  
✅ **Brand Multi-Tenancy** - Route workflows by brand/channel  
✅ **Real-Time Monitoring** - Live dashboard for debugging  
✅ **Type-Safe APIs** - tRPC ensures end-to-end type safety  
✅ **Extensible** - Easy to add new workflows and brands  

This system eliminates hardcoded dependencies and provides a production-ready foundation for automation at scale.

---

## Quick Reference

### Key Files
- Database Schema: `supabase-schema.sql`
- Webhooks Router: `backend/trpc/routes/webhooks.ts`
- AO Core Router: `backend/trpc/routes/ao-core.ts`
- Brands Router: `backend/trpc/routes/brands.ts`
- Workflows UI: `app/(owner)/workflows.tsx`
- Compose UI: `app/(owner)/compose.tsx`
- Types: `types/webhook.ts`
- Hooks: `hooks/webhooks-context.ts`, `hooks/ao-core-context.ts`, `hooks/workflows-context.ts`

### Support
For questions or issues with the webhook infrastructure, contact the development team or review execution logs in the Workflows dashboard.
