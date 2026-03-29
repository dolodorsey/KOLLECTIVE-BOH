# KOLLECTIVE BOH - Expo Configuration Fixes (January 2026)

## Summary

This document details all fixes applied to resolve Expo/React Native configuration issues in the KOLLECTIVE-BOH project on January 15, 2026.

## Issues Fixed

### 1. Critical Dependency Conflicts

**Problem**: React 19.1.0 and Zod 4.3.4 were causing version conflicts

**Solution**: Updated `package.json`
- React: 19.1.0 → ~19.0.1 (Expo 54 compatibility)
- React-DOM: 19.1.0 → ~19.0.1
- Zod: ^4.3.4 → ^3.23.8 (Zod 4.x doesn't exist)

**Impact**: Resolves `npm install` failures

### 2. Missing Environment Variable Configuration

**Problem**: No dynamic configuration file to load environment variables from .env

**Solution**: Created `app.config.js`
- Loads .env variables using dotenv
- Injects all EXPO_PUBLIC_* variables into app.extra
- Maintains all existing app.json configuration
- Supports Supabase, API, Webhook, and Rork configuration

**Impact**: Environment variables now properly accessible at runtime

### 3. Broken TypeScript Path Aliases

**Problem**: tsconfig.json had `baseUrl: null` preventing @/* imports

**Solution**: Updated `tsconfig.json`
- Changed baseUrl: null → baseUrl: "."

**Impact**: Enables imports like `import { api } from '@/lib/api'`

### 4. Hardcoded Environment Variables in EAS Config

**Problem**: eas.json had hardcoded API_URL values

**Solution**: Cleaned up `eas.json`
- Removed all hardcoded env variables
- Added autoIncrement for production builds
- Environment variables now managed through app.config.js

**Impact**: Single source of truth for configuration

## Files Modified

1. **package.json** - Fixed React and Zod versions
2. **app.config.js** - Created new file for dynamic configuration
3. **tsconfig.json** - Fixed baseUrl for path aliases
4. **eas.json** - Removed hardcoded environment variables

## Environment Variable Setup

### Local Development

1. Copy env.example to .env:
```bash
cp env.example .env
```

2. Fill in your values in .env:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
EXPO_PUBLIC_API_URL=https://kollective-api--drdorsey.replit.app

# Webhook Configuration
EXPO_PUBLIC_WEBHOOK_URL=https://drdorsey.app.n8n.cloud
EXPO_PUBLIC_WEBHOOK_PATH=/webhook/45cd6ead-84fa-458a-a165-7e96e53e3179
```

3. Install dependencies:
```bash
npm install --legacy-peer-deps
```

4. Start the app:
```bash
npm start
```

### EAS Builds

For EAS builds, set environment variables using Expo secrets:

```bash
# Set each secret
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "your-api-url"
eas secret:create --scope project --name EXPO_PUBLIC_WEBHOOK_URL --value "your-webhook-url"
eas secret:create --scope project --name EXPO_PUBLIC_WEBHOOK_PATH --value "/webhook/path"
```

Or place a .env file in the project root before building.

## Deployment Instructions

### Fresh Install

```bash
# Clone the repository
git clone https://github.com/dolodorsey/KOLLECTIVE-BOH.git
cd KOLLECTIVE-BOH

# Copy and configure environment variables
cp env.example .env
# Edit .env with your values

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start
```

### Development Build (EAS)

```bash
# Build for development
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Production Build

```bash
# Ensure environment variables are set in Expo secrets
# Then build for production
eas build --profile production --platform ios
eas build --profile production --platform android
```

## Verification

After applying fixes, verify:

1. **Dependencies install cleanly**:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

2. **App starts without errors**:
```bash
npm start
```

3. **Environment variables are accessible**:
- Check that Supabase connects
- Verify API calls work
- Test webhook functionality

4. **TypeScript path aliases work**:
- No import errors for @/* paths
- IntelliSense works for path imports

## Common Issues

### Issue: "Cannot find module '@/lib/api'"
**Solution**: Restart TypeScript server or IDE

### Issue: "EXPO_PUBLIC_SUPABASE_URL is undefined"
**Solution**: Ensure .env file exists and app.config.js loads it

### Issue: "npm install fails with peer dependency errors"
**Solution**: Use `npm install --legacy-peer-deps`

### Issue: "EAS build fails with missing environment variables"
**Solution**: Set secrets with `eas secret:create` or add .env file

## Next Steps

1. Test the app thoroughly in development
2. Create EAS development build for testing
3. Set up Expo secrets for production builds
4. Update CI/CD pipelines if applicable
5. Document any additional environment variables needed

## Support

For issues or questions:
1. Check this documentation
2. Review ENV-SETUP-GUIDE.md
3. Check Expo documentation: https://docs.expo.dev
4. Review commit history for detailed changes

## Commit References

- **package.json**: Fix critical dependency issues (React 19.0.1, Zod 3.23.8)
- **app.config.js**: Add app.config.js for proper environment variable management
- **tsconfig.json**: Fix tsconfig.json baseUrl for path alias support
- **eas.json**: Simplify eas.json, remove hardcoded env vars

All fixes committed on: January 15, 2026
