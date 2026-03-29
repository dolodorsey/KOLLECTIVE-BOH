# ⚠️ CRITICAL: Git History Purge Required

## Status: PARTIALLY COMPLETE

✅ **Step 1 DONE**: Updated `.gitignore` to include:
- `.env`
- `env`
- `.env.local`

❌ **Step 2-4 REQUIRED**: Git history still contains the exposed `env` file with Supabase credentials!

---

## 🚨 Security Issue

An `env` file (without the dot) containing sensitive Supabase credentials was committed to the Git repository and **still exists in the Git history**.

**Exposed Credentials**:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

---

## 🔧 Required Actions - Run in Terminal NOW

### Prerequisites
Before running these commands:
1. Open your terminal
2. Navigate to your project root directory:
   ```bash
   cd /path/to/KOLLECTIVE-BOH
   ```
3. Ensure you have git installed
4. **IMPORTANT**: Make sure all team members have committed and pushed their work

### Commands to Execute

Copy and paste these commands one by one into your terminal:

```bash
# 1. Remove the env file from Git cache (if it still exists)
git rm --cached env 2>/dev/null || echo "env file already removed from working directory"
git rm --cached .env 2>/dev/null || echo ".env file already removed from working directory"

# 2. Verify gitignore is updated (should show env patterns)
cat .gitignore | grep -E "^\\.env$|^env$|^\\.env\\.local$"

# 3. Commit the gitignore changes if not already done
git add .gitignore
git commit -m "fix: critical security - add env files to gitignore" || echo "Already committed"

# 4. **CRITICAL**: Purge env files from Git history
#    This removes the file from ALL commits in history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch env .env" \
  --prune-empty --tag-name-filter cat -- --all

# 5. Force push to update remote repository
#    WARNING: This rewrites history. Ensure team is aware!
git push origin --force --all

# 6. Clean up local repository
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 7. Verify the env file is gone from history
git log --all --full-history --pretty=format:"%H" -- env .env
# If this returns nothing, SUCCESS! The file is purged.
```

---

## 🛡️ Alternative Method (If filter-branch fails)

If `git filter-branch` fails, use `git-filter-repo` (more modern tool):

```bash
# Install git-filter-repo (if not installed)
# macOS:
brew install git-filter-repo

# Ubuntu/Debian:
sudo apt-get install git-filter-repo

# Run the purge
git filter-repo --invert-paths --path env --path .env --force

# Force push
git push origin --force --all
```

---

## ✅ Verification Steps

After running the commands:

1. **Check Git history**:
   ```bash
   git log --all --full-history -- env .env
   ```
   Should return: NO output (file completely removed)

2. **Check working directory**:
   ```bash
   git status
   ```
   Should NOT show `env` or `.env` files

3. **Verify gitignore**:
   ```bash
   cat .gitignore | grep -E "env"
   ```
   Should show:
   ```
   .env*.local
   .env
   env
   .env.local
   ```

4. **Check remote repository** (GitHub):
   - Go to: https://github.com/dolodorsey/KOLLECTIVE-BOH
   - Search for "env" in files
   - Should only find `env.example` (which is safe)

---

## 🔑 Post-Purge: Rotate Credentials

**CRITICAL**: Even after purging, the exposed credentials should be rotated:

### Supabase Credentials Rotation

1. **Navigate to Supabase Dashboard**:
   https://supabase.com/dashboard/project/wfkohcwxxsrhcxhepfql/settings/api

2. **Regenerate ANON KEY**:
   - Click "Regenerate anon key"
   - Copy the new key

3. **Update your local env file** (NOT in git):
   ```bash
   # Create a new .env file locally (will be ignored by git)
   cp env.example .env
   # Edit .env with your new credentials
   ```

4. **Update Expo/Replit secrets**:
   - Update EXPO_PUBLIC_SUPABASE_ANON_KEY with new value
   - Update EXPO_PUBLIC_SUPABASE_URL if it changed

---

## 📝 Team Communication

After force-pushing, notify your team:

```
🚨 URGENT: Git history rewrite completed

I've purged sensitive env files from our Git history and force-pushed the changes.

Action required by ALL team members:

1. Backup any uncommitted changes
2. Run: git fetch origin
3. Run: git reset --hard origin/main
4. Pull latest changes: git pull

The env file is now completely removed from history and gitignore is updated.
```

---

## 📊 Status Check

- [x] .gitignore updated with env patterns
- [ ] Git history purged with filter-branch/filter-repo
- [ ] Force pushed to remote
- [ ] Verified file removed from history
- [ ] Supabase credentials rotated
- [ ] Team notified of force push

---

## ❓ Troubleshooting

### Error: "Cannot rewrite history"
**Solution**: Ensure no one else is pushing. Run:
```bash
git fetch origin
git reset --hard origin/main
# Then try the purge commands again
```

### Error: "env file not found"
**Good news**: The file is already gone from working directory. The purge commands will still clean history.

### Error: "Force push rejected"
**Solution**: Check if branch protection is enabled on GitHub:
1. Go to: Settings > Branches
2. Temporarily disable branch protection
3. Run force push
4. Re-enable branch protection

---

## 📖 References

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Git filter-branch documentation](https://git-scm.com/docs/git-filter-branch)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)

---

**Created**: January 4, 2026  
**Priority**: CRITICAL  
**Status**: Awaiting manual execution of purge commands
