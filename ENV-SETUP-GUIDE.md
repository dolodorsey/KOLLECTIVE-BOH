# Environment Configuration Setup Guide

## 🚀 Quick Start

### Step 1: Copy Environment Template

```bash
cp env.example .env
```

### Step 2: Configure Production URLs

Your `.env` file should contain these production values:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://wfkohcwxxsrhcxhepfql.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here

# API Configuration (Production)
EXPO_PUBLIC_API_URL=https://kollective-api--drdor5.replit.app

# n8n Webhook Configuration (Production)
EXPO_PUBLIC_WEBHOOK_URL=https://drdorsey.app.n8n.cloud
EXPO_PUBLIC_WEBHOOK_PATH=/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179
```

### Step 3: Verify Configuration

The app includes a built-in diagnostic component that validates your configuration. When properly configured, you should see:

#### Expected Console Output (Success)

```
[ConnectionDiagnostic] ✓ Environment Variables - API URL configured
[ConnectionDiagnostic] ✓ Supabase Config - Configuration valid
[ConnectionDiagnostic] ✓ API Base URL - Valid URL (https://kollective-api--drdor5.replit.app)
[ConnectionDiagnostic] ✓ HTTPS Protocol - Using secure HTTPS
[ConnectionDiagnostic] ✓ Network Connectivity - Internet connection active
```

#### Warning Signs (Needs Fixing)

```
[ConnectionDiagnostic] ✗ API Base URL - Using localhost (won't work on devices)
[ConnectionDiagnostic] ✗ HTTPS Protocol - Using HTTP (iOS will block)
```

## 🧪 Testing the Webhook Endpoint

### Test 1: Basic Health Check

```bash
curl -X GET https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179
```

**Expected Response:** n8n webhook response or 404 (confirms endpoint exists)

### Test 2: POST Request (Full Webhook Test)

```bash
curl -X POST https://drdorsey.app.n8n.cloud/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179 \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "thepinkypromiseatl",
    "channel": "sms",
    "event": "test_event",
    "data": {
      "message": "Test from setup guide"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "execution_id": "some-uuid-here"
}
```

### Test 3: From React Native App

```typescript
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

export function WebhookTest() {
  const [result, setResult] = useState('');

  const testWebhook = async () => {
    const webhookUrl = process.env.EXPO_PUBLIC_WEBHOOK_URL;
    const webhookPath = process.env.EXPO_PUBLIC_WEBHOOK_PATH;
    
    if (!webhookUrl || !webhookPath) {
      setResult('❌ Environment variables not configured');
      return;
    }

    try {
      const response = await fetch(`${webhookUrl}${webhookPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'thepinkypromiseatl',
          channel: 'test',
          event: 'app_test',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      setResult(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      console.log('[WebhookTest] Success:', data);
    } catch (error) {
      setResult(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('[WebhookTest] Failed:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Test Webhook" onPress={testWebhook} />
      <Text style={{ marginTop: 10 }}>{result}</Text>
    </View>
  );
}
```

## 🔧 Troubleshooting

### Issue: "Failed to fetch"

**Cause:** API URL is using `localhost` or `http://`

**Fix:**
1. Open `.env` file
2. Ensure `EXPO_PUBLIC_API_URL` is set to: `https://kollective-api--drdor5.replit.app`
3. Ensure `EXPO_PUBLIC_WEBHOOK_URL` is set to: `https://drdorsey.app.n8n.cloud`
4. Restart Expo dev server: `npx expo start -c`

### Issue: "Network request failed" on iOS

**Cause:** iOS blocks insecure HTTP connections by default

**Fix:**
- All URLs in `.env` must use `https://` (not `http://`)
- The production URLs provided are already HTTPS-compliant

### Issue: Environment variables not loading

**Cause:** Changes to `.env` require app restart

**Fix:**
```bash
# Stop Expo
# Then restart with cache clear
npx expo start -c
```

### Issue: Webhook returns 404

**Cause:** Webhook path is incorrect or workflow is inactive

**Fix:**
1. Verify webhook URL in n8n dashboard: https://drdorsey.app.n8n.cloud
2. Ensure workflow status is "Active"
3. Check that webhook path matches exactly: `/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179`

## 📊 Diagnostic Component

The app includes `<ConnectionDiagnostic />` component for real-time validation.

### Using the Diagnostic Component

```typescript
import { ConnectionDiagnostic } from '@/components/ConnectionDiagnostic';

export default function DebugScreen() {
  return <ConnectionDiagnostic />;
}
```

### What It Checks

1. **Environment Variables** - Confirms API URL is set
2. **Supabase Config** - Validates Supabase URL and key
3. **API Base URL** - Ensures not using localhost
4. **HTTPS Protocol** - Confirms secure connection
5. **Network Connectivity** - Tests internet connection

### Success Indicators

- ✅ Green checkmark = Test passed
- ❌ Red X = Issue detected
- ⏳ Gray dot = Test in progress

## 🔐 Security Notes

### DO NOT Commit `.env` File

The `.env` file is in `.gitignore` and should NEVER be committed to version control.

```bash
# Verify .env is ignored
git status
# Should NOT show .env file
```

### Environment Variables Scope

- `EXPO_PUBLIC_*` variables are embedded in the client bundle
- Do NOT put sensitive API keys in `EXPO_PUBLIC_*` variables
- Use server-side environment variables for sensitive data

### Webhook Security

Production webhooks should implement:
- HMAC signature verification
- Rate limiting
- IP whitelisting
- Request validation

See `PRODUCTION-DEPLOYMENT-GUIDE.md` for security implementation details.

## 📱 Platform-Specific Notes

### iOS

- Requires HTTPS for all network requests
- Localhost won't work on physical devices
- Use computer's local IP for local development: `https://192.168.1.x:3000`

### Android

- Allows HTTP connections (but HTTPS is recommended)
- Localhost won't work on physical devices
- Use `10.0.2.2` for Android emulator to reach host machine

### Web

- No special configuration needed
- CORS policies may apply
- Check browser console for detailed errors

## 🆘 Getting Help

### Check Logs

```bash
# View Expo logs
npx expo start

# View n8n execution logs
# Visit: https://drdorsey.app.n8n.cloud/workflow/WtgOWdP5VSVhESZO
# Click "Executions" tab
```

### Verify Supabase Connection

```bash
# Test Supabase connection
curl -X GET "https://wfkohcwxxsrhcxhepfql.supabase.co/rest/v1/webhook_registry" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Documentation References

- `WEBHOOK-INFRASTRUCTURE.md` - Complete system architecture
- `PRODUCTION-DEPLOYMENT-GUIDE.md` - Production deployment steps
- `FINAL-COMPLETION-REPORT.md` - Implementation status

---

**Last Updated:** January 4, 2026  
**Status:** Production Ready  
**Support:** Refer to documentation files for detailed troubleshooting
