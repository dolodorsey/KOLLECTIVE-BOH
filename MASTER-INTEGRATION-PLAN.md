# KOLLECTIVE BOH - COMPLETE INTEGRATION GUIDE
## Everything You Need - January 15, 2026, 3 PM EST

---

## 👋 START HERE

You now have **EVERYTHING** needed to deploy the complete KOLLECTIVE BOH system:

1. ✅ **Expo Configuration Fixed** (January 15, 2026 AM)
2. 📦 **Design System Ready** (Redesign package provided)
3. ✅ **Backend Working** (Supabase + tRPC + Webhooks)
4. 📝 **Complete Documentation** (This + 4 design system docs)

**Total Time to Full Deployment**: 3-4 weeks
**Time to See New Dashboard Running**: 30 minutes

---

## 📂 DOCUMENTATION INDEX

### Core Integration Docs (You Have These)
1. **MASTER-INTEGRATION-PLAN.md** (This file) - Start here
2. **EXPO-FIXES-2026.md** - Expo configuration fixes
3. **QUICK-START.md** - 10-minute setup guide
4. **IMPLEMENTATION-GUIDE.md** - Component usage examples
5. **ARCHITECTURE-DECISIONS.md** - Design rationale
6. **EXECUTIVE-SUMMARY.md** - High-level overview

---

## 🎯 WHAT'S BEEN COMPLETED

### ✅ Expo Configuration (Completed Today)
**Status**: PRODUCTION READY

**Fixed Issues**:
- React 19.1.0 → ~19.0.1 (Expo 54 compatibility)
- React-DOM 19.1.0 → ~19.0.1
- Zod ^4.3.4 → ^3.23.8 (Zod 4 doesn't exist)
- Created app.config.js for dynamic env var loading
- Fixed tsconfig.json baseUrl for path aliases
- Simplified eas.json configuration

**Result**: `npm install` works cleanly, environment variables load properly

### 📦 Design System (Ready to Integrate)
**Status**: PACKAGE PROVIDED - NEEDS EXTRACTION

**What's Included**:
- Complete theme system (48 semantic color tokens, dark mode)
- 14 production components
- New Command Center dashboard (replaces static welcome page)
- Full TypeScript support
- Comprehensive documentation

**Location**: KOLLECTIVE-BOH-REDESIGNED.zip (you provided)

### ✅ Backend Infrastructure (Already Running)
**Status**: OPERATIONAL

- Supabase database configured
- tRPC API endpoints
- Webhook system with n8n
- RBAC implementation
- Entity health tracking

---

## 🚀 COMPLETE INTEGRATION PLAN

### **PHASE 1: Quick Start** (30 minutes)

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies (now works!)
npm install --legacy-peer-deps

# 3. Start development server  
npm start
```

**Verify**: App runs without errors

### **PHASE 2: Extract Design System** (1 hour)

```bash
# 1. Extract the redesign package
unzip KOLLECTIVE-BOH-REDESIGNED.zip

# 2. Copy design system files into project
cp -r KOLLECTIVE-BOH-REDESIGNED/src/ui ./src/
cp -r KOLLECTIVE-BOH-REDESIGNED/app/(owner)/dashboard-new.tsx ./app/(owner)/
```

### **PHASE 3: Wrap App with ThemeProvider** (15 minutes)

Edit `app/_layout.tsx`:
```typescript
import { ThemeProvider } from '@/src/ui/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      {/* Your existing providers */}
      <YourApp />
    </ThemeProvider>
  );
}
```

### **PHASE 4: Test New Dashboard** (15 minutes)

```bash
npm start
# Navigate to /owner/dashboard-new
```

**Verify**: New Command Center dashboard loads with:
- 6 KPI tiles
- Alerts panel
- Activity feed
- Quick actions
- System status

### **PHASE 5: Wire Real Data** (2-4 hours)

Edit `app/(owner)/dashboard-new.tsx`:

```typescript
// BEFORE (mock data)
const mockDashboardData = { ... };

// AFTER (real data)
const { data: dashboardData } = trpc.dashboard.summary.useQuery();
const { data: alerts } = trpc.alerts.list.useQuery({ status: 'open', limit: 10 });
const { data: activity } = trpc.activity.list.useQuery({ limit: 20 });
```

**Required API Endpoints**:

- `trpc.dashboard.summary.useQuery()` - Returns KPI data
- `trpc.alerts.list.useQuery()` - Returns active alerts
- `trpc.activity.list.useQuery()` - Returns recent activity
- `trpc.entities.health.useQuery()` - Returns entity health status

**Expected Response Format**:

```typescript
interface DashboardSummary {
  kpis: {
    totalRevenue: { value: number; trend: 'up' | 'down'; change: string };
    activeEntities: { value: number; trend: 'up' | 'down'; change: string };
    systemHealth: { value: number; trend: 'up' | 'down'; change: string };
    alertsOpen: { value: number; trend: 'up' | 'down'; change: string };
    avgResponseTime: { value: string; trend: 'up' | 'down'; change: string };
    uptime: { value: string; trend: 'up' | 'down'; change: string };
  };
}
```

---

## 🧪 TESTING CHECKLIST

### Phase 1 Verification
- [ ] `npm install --legacy-peer-deps` completes without errors
- [ ] `.env` file exists with all required variables
- [ ] `npm start` launches without errors
- [ ] Metro bundler runs successfully
- [ ] App loads on iOS/Android simulator

### Phase 2 Verification  
- [ ] `src/ui` directory exists with all components
- [ ] `src/ui/theme` directory contains theme files
- [ ] TypeScript recognizes new imports
- [ ] No missing dependency errors

### Phase 3 Verification
- [ ] App wraps with ThemeProvider
- [ ] Theme context is available in components
- [ ] Dark mode toggle works
- [ ] Colors render correctly

### Phase 4 Verification
- [ ] New dashboard route `/owner/dashboard-new` loads
- [ ] All 6 KPI tiles render
- [ ] Alerts panel displays
- [ ] Activity feed scrolls
- [ ] Quick actions are clickable
- [ ] System status shows correct states

### Phase 5 Verification
- [ ] tRPC queries execute successfully
- [ ] Real data populates KPI tiles
- [ ] Alerts load from database
- [ ] Activity feed shows real events
- [ ] Loading states display correctly
- [ ] Error states handle gracefully

---

## 🐛 TROUBLESHOOTING

### Issue: "npm install" fails
**Solution**: Use `npm install --legacy-peer-deps` flag. This is required due to React 19 peer dependency conflicts.

### Issue: Environment variables not loading
**Solution**: 
1. Verify `app.config.js` exists
2. Check `.env` file has all required variables
3. Restart Metro bundler with `npm start --reset-cache`

### Issue: TypeScript path aliases not working
**Solution**: Verify `tsconfig.json` has `"baseUrl": "."`

### Issue: Theme not applying
**Solution**:
1. Ensure ThemeProvider wraps the entire app in `_layout.tsx`
2. Check `src/ui/theme/index.ts` exports correctly
3. Verify component imports use correct paths

### Issue: tRPC queries failing
**Solution**:
1. Check Supabase credentials in `.env`
2. Verify API base URL is correct
3. Ensure tRPC router is properly configured
4. Check network connectivity

### Issue: Dashboard shows mock data after wiring
**Solution**:
1. Clear React Query cache
2. Verify tRPC hooks are being called
3. Check browser/dev tools network tab for API calls
4. Ensure conditional rendering prefers real data over mock

---

## 📅 DEPLOYMENT TIMELINE

### Week 1: Foundation (You Are Here)
- ✅ Day 1: Fix Expo configuration
- ✅ Day 1: Create documentation
- ⏳ Day 2-3: Extract and integrate design system
- ⏳ Day 4-5: Wire real data to dashboard

### Week 2: Component Integration
- Day 1-2: Replace all existing components with design system
- Day 3: Implement remaining dashboard pages
- Day 4-5: Add navigation and routing

### Week 3: Feature Completion
- Day 1-2: Implement RBAC UI
- Day 3-4: Add webhook monitoring UI
- Day 5: Entity health tracking dashboard

### Week 4: Testing & Launch
- Day 1-2: Comprehensive testing
- Day 3: Bug fixes and polish
- Day 4: EAS build and submission
- Day 5: Production deployment

**Target Launch Date**: February 12, 2026

---

## 🎯 NEXT STEPS

### Immediate (Today)
1. Pull latest code from GitHub
2. Run `npm install --legacy-peer-deps`
3. Verify app runs successfully
4. Review all documentation files

### Short Term (This Week)
1. Extract KOLLECTIVE-BOH-REDESIGNED.zip
2. Copy design system into project
3. Wrap app with ThemeProvider
4. Test new dashboard with mock data
5. Wire first tRPC query

### Medium Term (Next 2 Weeks)
1. Replace all UI components
2. Complete dashboard integration
3. Implement all phases
4. Comprehensive testing

### Long Term (By Launch)
1. Production EAS build
2. Submit to app stores
3. Monitor deployment
4. Gather user feedback

---

## 📚 RESOURCES

### Documentation Files
- `MASTER-INTEGRATION-PLAN.md` (this file)
- `EXPO-FIXES-2026.md` - Configuration fixes
- `QUICK-START.md` - Fast setup guide
- `IMPLEMENTATION-GUIDE.md` - Component usage
- `ARCHITECTURE-DECISIONS.md` - Design rationale
- `EXECUTIVE-SUMMARY.md` - High-level overview

### External Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [tRPC Documentation](https://trpc.io/)
- [Supabase Documentation](https://supabase.com/docs)

### Support Channels
- GitHub Issues: For bug reports
- Design System Docs: In KOLLECTIVE-BOH-REDESIGNED package
- Supabase Dashboard: For database management
- Expo Dashboard: For build management

---

## ✨ SUCCESS CRITERIA

Your integration is complete when:

1. ✅ **App Runs**: `npm start` works without errors
2. ✅ **New Dashboard Loads**: `/owner/dashboard-new` displays correctly
3. ✅ **Real Data Shows**: KPIs, alerts, and activity from database
4. ✅ **Theme Works**: Dark mode toggle functions properly
5. ✅ **No Mock Data**: All components show live data
6. ✅ **Navigation Works**: All routes accessible
7. ✅ **RBAC Active**: Permissions enforced correctly
8. ✅ **Build Succeeds**: EAS build completes successfully

---

## 🚀 YOU'RE READY!

You have everything needed to deploy KOLLECTIVE BOH:

- ✅ **Stable codebase** with fixed dependencies
- ✅ **Complete design system** ready to integrate
- ✅ **Working backend** with Supabase + tRPC
- ✅ **Comprehensive documentation** for every step
- ✅ **Clear timeline** to production

**Total estimated time to production**: 3-4 weeks  
**Time to see new dashboard running**: 30 minutes

**Start with Phase 1 and follow the plan step by step.**

Good luck! 🎉

**Required API Endpoints**: 
