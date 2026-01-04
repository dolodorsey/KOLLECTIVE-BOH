# Webhook Infrastructure - Production Deployment Guide

## 🚀 System Status: LIVE AND ACTIVE

### Production Endpoints

#### n8n Webhook Handler (Active)
**Production URL:** `https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179`
- Method: POST
- Status: ✅ Active
- Logs to: workflow_executions table in Supabase

#### Supabase Database
**Project URL:** `https://wfkohcwxxsrhcxhepfql.supabase.co`
- Tables: webhook_registry, workflow_executions
- Auth: Service role configured in n8n
- Status: ✅ Production ready

### Quick Start - Using the Webhook API

#### 1. Register a New Webhook (via tRPC)

```typescript
import { useRegisterWebhook } from '@/hooks/webhooks-context';

const { mutate: registerWebhook } = useRegisterWebhook();

registerWebhook({
  workflow_name: 'send-sms',
  n8n_endpoint: 'https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179',
  brand: 'thepinkypromiseatl',
  channel: 'sms',
  metadata: {
    description: 'SMS notification webhook',
    triggers: ['order_placed', 'order_shipped']
  }
});
```

#### 2. Query Webhooks

```typescript
import { useWebhooks } from '@/hooks/webhooks-context';

// Get all active webhooks for a brand
const { data: webhooks, isLoading } = useWebhooks('thepinkypromiseatl', 'active');

// webhooks will contain array of webhook registrations
```

#### 3. View Execution Logs

```typescript
import { useWorkflowExecutions } from '@/hooks/webhooks-context';

const { data: executions } = useWorkflowExecutions({
  brand: 'thepinkypromiseatl',
  status: 'active'
});
```

### Testing the Webhook

#### Send Test POST Request

```bash
curl -X POST https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179 \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "thepinkypromiseatl",
    "channel": "sms",
    "event": "order_placed",
    "data": {
      "order_id": "12345",
      "customer": "John Doe"
    }
  }'
```

#### Expected Response
```json
{
  "success": true,
  "execution_id": "uuid-here"
}
```

### Database Schema

#### webhook_registry Table
```sql
CREATE TABLE webhook_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  n8n_endpoint TEXT NOT NULL,
  brand TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### workflow_executions Table
```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhook_registry(id),
  n8n_endpoint TEXT,
  brand TEXT,
  channel TEXT,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Available tRPC Routes

All routes accessible via `/api/trpc/webhooks.*`:

1. **registerWebhook**
   - Input: workflow_name, n8n_endpoint, brand, channel, metadata?
   - Output: Created webhook object

2. **updateWebhook**  
   - Input: id, updates object
   - Output: Updated webhook object

3. **deleteWebhook**
   - Input: id
   - Output: Success boolean (soft delete - sets status='inactive')

4. **getExecutions**
   - Input: filters (brand?, channel?, status?)
   - Output: Array of execution records

### Monitoring & Debugging

#### Check n8n Executions
1. Go to: https://drdorsey.app.n8n.cloud/workflow/WtgOWdP5VSVhESZO
2. Click "Executions" tab
3. View real-time webhook execution logs

#### Query Supabase Directly
```sql
-- Recent webhook executions
SELECT * FROM workflow_executions 
ORDER BY created_at DESC 
LIMIT 10;

-- Active webhooks by brand
SELECT * FROM webhook_registry 
WHERE brand = 'thepinkypromiseatl' 
AND status = 'active';
```

### Security Considerations

⚠️ **Production Recommendations:**
1. Add HMAC signature verification to webhooks
2. Implement rate limiting (e.g., 100 requests/minute per brand)
3. Add IP whitelisting for sensitive webhooks
4. Enable Supabase RLS policies
5. Rotate service role keys regularly

### Troubleshooting

#### Webhook Not Triggering
1. Verify workflow is Active in n8n
2. Check n8n execution logs for errors
3. Verify POST request format matches expected schema
4. Check Supabase for inserted records

#### Data Not Appearing
1. Verify Supabase credentials in n8n
2. Check table permissions (RLS policies)
3. Review n8n node configuration
4. Check workflow_executions table directly

### Next Steps

1. **Build Frontend Dashboard:**
   - Create `/app/webhooks` page
   - Use existing hooks: useWebhooks(), useWorkflowExecutions()
   - Display real-time execution logs
   - Add webhook management UI

2. **Add Security:**
   - Implement HMAC verification
   - Add rate limiting middleware
   - Configure IP whitelisting

3. **Enhanced Monitoring:**
   - Set up alerts for failed executions
   - Add performance metrics
   - Create dashboard for execution statistics

### Support Resources

**Documentation:**
- WEBHOOK-INFRASTRUCTURE.md - Complete architecture
- IMPLEMENTATION-SUMMARY.md - Implementation details  
- FINAL-COMPLETION-REPORT.md - Project status

**Dashboard URLs:**
- n8n: https://drdorsey.app.n8n.cloud
- Supabase: https://supabase.com/dashboard/project/wfkohcwxxsrhcxhepfql
- GitHub: https://github.com/dolodorsey/KOLLECTIVE-BOH

---
**Status:** ✅ Production Ready
**Last Updated:** January 4, 2026, 4:00 AM EST
**Webhook Endpoint:** Active and receiving requests
