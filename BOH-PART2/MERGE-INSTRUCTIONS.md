# MERGE INSTRUCTIONS

This is a 2-part split of KOLLECTIVE-BOH-FIXED.

## TO MERGE:

1. Extract BOH-PART1.zip
2. Extract BOH-PART2.zip
3. Copy all contents from BOH-PART2 into BOH-PART1

```bash
# After extracting both:
cp -r BOH-PART2/* BOH-PART1/
cd BOH-PART1
```

## WHAT'S IN EACH PART:

**PART 1:**
- Root config files (package.json, tsconfig.json, etc.)
- /app (routes & screens)
- /assets (images, fonts)
- /components (UI components)
- /constants (app constants)

**PART 2:**
- /backend (tRPC server)
- /hooks (React contexts)
- /lib (utilities)
- /mocks (mock data)
- /src (core UI system)
- /types (TypeScript types)

After merging, follow DEPLOYMENT-FIXES.md to deploy.
