# Hyperion Architecture - Remotion Components Sharing

> **Quick Reference:** See [interactive-viewer/README.md](interactive-viewer/README.md) for day-to-day usage.

## 🎯 Quick Commands

```bash
# Development
cd interactive-viewer && npm run dev

# Modify Remotion components
vim remotion/src/components/LessonComposition.tsx
# Then restart: npm run dev (auto-syncs)

# Build
cd interactive-viewer && npm run build
```

---

## 📖 Technical Details

### Problem

`interactive-viewer` needs to use Remotion components from the `remotion/` directory, but importing across packages causes **React Context mismatch** because each package has its own `node_modules/remotion` instance.

### Solution: Build-time Copy

We copy Remotion components from `remotion/src` to `interactive-viewer/src/remotion/` during build time.

```
remotion/src/              ← Source of truth (for backend MP4 rendering)
    ├── components/
    ├── styles/
    └── utils/

interactive-viewer/src/remotion/  ← Copied during build (for Player)
    ├── components/
    ├── styles/
    └── utils/
```

### How It Works

#### 1. Automatic Sync on Dev & Build

```bash
npm run dev    # Automatically syncs before starting dev server
npm run build  # Automatically syncs before building
```

The `predev` and `prebuild` hooks in `package.json` ensure components are always synced:

```json
{
  "scripts": {
    "predev": "npm run sync-remotion",
    "dev": "vite",
    "prebuild": "npm run sync-remotion",
    "build": "vite build",
    "sync-remotion": "rm -rf src/remotion && cp -r ../remotion/src src/remotion"
  }
}
```

#### 2. Manual Sync (If Needed)

Normally not needed since `predev` and `prebuild` auto-sync, but available if you want to sync manually:

```bash
cd interactive-viewer
npm run sync-remotion
```

#### 3. Git Ignore

The copied directory is gitignored to avoid duplication:

```gitignore
interactive-viewer/src/remotion/
```

### Why This Approach?

| Aspect             | This Approach        | Direct Import         |
| ------------------ | -------------------- | --------------------- |
| React Context      | ✅ Single instance   | ❌ Multiple instances |
| Code Duplication   | ⚠️ During build only | ❌ In git             |
| Maintenance        | ✅ Single source     | ✅ Single source      |
| Backend MP4        | ✅ Works             | ✅ Works              |
| Interactive Viewer | ✅ Works             | ❌ Context error      |

### Usage by Different Parts

#### Backend (MP4 Rendering)

Uses `remotion/` directory directly via Remotion CLI:

```bash
cd remotion
npx remotion render Lesson output.mp4
```

**No changes needed!** Backend continues to use `remotion/` as before.

#### Interactive Viewer (Browser Player)

Uses synced copy from `src/remotion/`:

```tsx
import { LessonComposition } from "../remotion/components/LessonComposition";
import { VIDEO_CONFIG } from "../remotion/styles/theme";
```

Components are synced automatically during build.

### Modifying Remotion Components

**✅ Correct:**

1. Edit files in `remotion/src/components/`
2. For backend MP4: Changes are immediate
3. For interactive-viewer:
   - Just restart `npm run dev` (auto-syncs) ✅
   - Or run `npm run sync-remotion` manually

**❌ Wrong:**

Don't edit `interactive-viewer/src/remotion/` directly - it will be overwritten on next sync!

### Deployment (Vercel)

Vercel build automatically syncs components:

1. `npm install` - Install dependencies
2. `npm run build` - Triggers `prebuild` → syncs remotion → builds

### Future Improvements

#### Option A: npm Workspace (Medium-term)

Use npm workspaces to share dependencies:

```json
// Root package.json
{
  "workspaces": ["backend", "interactive-viewer", "remotion"]
}
```

#### Option B: Publish as Package (Long-term)

Publish `@hyperion/remotion` as an internal package with peerDependencies:

```json
{
  "name": "@hyperion/remotion",
  "peerDependencies": {
    "remotion": "^4.0.0",
    "react": "^18.0.0"
  }
}
```

### Directory Structure

```
hyperion/
├── backend/                      # NestJS backend
│   └── uses remotion/ for MP4 rendering
├── remotion/                     # ⭐ Source of truth
│   └── src/
│       ├── components/
│       ├── styles/
│       └── utils/
├── interactive-viewer/
│   ├── src/
│   │   ├── components/
│   │   └── remotion/            # ⚠️ Copied, not in git
│   │       ├── components/      # ← Synced from ../remotion/src
│   │       ├── styles/
│   │       └── utils/
│   └── package.json
└── vercel.json                   # Deployment config
```

### Commands Reference

```bash
# Development (auto-syncs on start)
cd interactive-viewer
npm run dev

# Build (auto-syncs before build)
npm run build

# Manual sync (rarely needed)
npm run sync-remotion

# Deploy to Vercel (auto-syncs during build)
git push origin main
```

### Troubleshooting

#### "No video config found" error

This means interactive-viewer is trying to use remotion components from the wrong instance.

**Solution:**

```bash
cd interactive-viewer
npm run sync-remotion
npm run build
```

#### Changes in remotion/ not reflected

**Solution:**

```bash
cd interactive-viewer
npm run sync-remotion
```

#### Vercel build fails

Check that:

1. `remotion/src/` directory exists in git
2. `vercel.json` has correct build command
3. `package.json` has `prebuild` hook
