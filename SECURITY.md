# Security Notice - Immediate Action Required

## ⚠️ Critical Security Issue

**An `env` file containing sensitive Supabase credentials was committed to the Git repository.**

### Exposed Credentials

The following file was publicly committed:
- `env` (contains EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY)

**Status:** The file has been removed from the working directory and added to .gitignore, but **still exists in Git history**.

---

## Required Actions

### 1. Clean Git History (Run Locally)

⚠️ **CRITICAL:** The exposed keys still exist in your Git history. You must clean the history:

```bash
# Remove the file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch env" \
  --prune-empty --tag-name-filter cat -- --all

# Alternative using git-filter-repo (recommended, faster):
# Install: pip install git-filter-repo
git filter-repo --path env --invert-paths

# Force push to remote (WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

### 2. Rotate Supabase Keys Immediately

1. **Go to Supabase Dashboard:**
   - Navigate to https://supabase.com/dashboard
   - Select your project: "Kollective BOH"

2. **Navigate to Project Settings:**
   - Click "Settings" (gear icon) in the left sidebar
   - Click "API" under Project Settings

3. **Rotate the Keys:**
   - Under "Project API keys", click "Reset" or "Regenerate"
   - Copy the new `anon/public` key
   - **Important:** The `service_role` key should NEVER be in your app code

4. **Update Environment Variables:**
   - Create a `.env` file in the project root (not committed to Git)
   - Add the new keys:
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key-here
     ```

5. **Verify .env is Excluded:**
   - Confirm `.env`, `.env*.local`, and `env` are in .gitignore ✅
   - Run: `git status` - should NOT show `.env` file

### 3. Review Database Security

After rotating keys, review your Supabase Row Level Security (RLS) policies:

1. Go to Supabase Dashboard → Authentication → Policies
2. Ensure all tables have appropriate RLS policies enabled
3. Verify that the `anon` role can only access public data
4. Confirm sensitive operations require authenticated users

---

## Environment Variables Setup

### For Development

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### For Production/Deployment

Set environment variables in your deployment platform:
- Expo EAS: Use `eas secret:create`
- Vercel/Railway: Use dashboard environment variables section

---

## Prevention Checklist

- [x] File removed from working directory
- [x] File added to .gitignore
- [ ] Git history cleaned (run locally)
- [ ] Supabase keys rotated
- [ ] New keys added to `.env` file
- [ ] `.env` file verified NOT tracked by Git
- [ ] Team members notified of security incident
- [ ] Database RLS policies reviewed

---

## Questions?

If you have questions about this security incident or need help with remediation, contact your team lead or DevOps administrator.

**Last Updated:** 2026-01-04
