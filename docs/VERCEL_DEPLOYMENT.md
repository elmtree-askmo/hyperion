# Vercel Deployment Guide

## Overview

This guide explains how to deploy the `interactive-viewer` application to Vercel from the Hyperion monorepo.

## Architecture

The project is a monorepo with the following structure:

```
hyperion/
├── backend/              # NestJS backend (not deployed to Vercel)
├── docs/                 # Documentation
├── remotion/            # Remotion video components (used by interactive-viewer)
└── interactive-viewer/  # React frontend (deployed to Vercel)
```

The `interactive-viewer` imports components from `remotion/src/`, so both directories need to be available during build.

## Deployment Configuration

### Files

1. **`vercel.json`** (root directory)

   - Configures build and output directories
   - Installs dependencies for both `remotion` and `interactive-viewer`

2. **`.vercelignore`** (root directory)
   - Excludes unnecessary files from upload
   - Reduces deployment size and time

### Vercel Project Settings

#### Option A: Using vercel.json (Automatic)

The `vercel.json` file in the root directory will be automatically detected. Just connect your repo and deploy.

**Settings (automatic from vercel.json):**

- Root Directory: `/` (entire monorepo)
- Build Command: `cd remotion && npm install && cd ../interactive-viewer && npm install && npm run build`
- Output Directory: `interactive-viewer/dist`
- Install Command: `cd interactive-viewer && npm install`

#### Option B: Manual Configuration in Vercel UI

If `vercel.json` is not being used:

1. Go to Project Settings → General
2. Set **Root Directory**: Leave empty (deploys entire repo)
3. Go to Project Settings → Build & Development Settings
4. Set **Framework Preset**: `Vite` or `Other`
5. Set **Build Command**:
   ```bash
   cd remotion && npm install && cd ../interactive-viewer && npm install && npm run build
   ```
6. Set **Output Directory**:
   ```
   interactive-viewer/dist
   ```
7. Set **Install Command**:
   ```bash
   cd interactive-viewer && npm install
   ```

## Build Process

### What Happens During Build

1. **Install remotion dependencies**

   - `cd remotion && npm install`
   - Installs React, Remotion, and other dependencies needed by remotion components

2. **Install interactive-viewer dependencies**

   - `cd ../interactive-viewer && npm install`
   - Installs React, Vite, Remotion Player, etc.

3. **Build interactive-viewer**
   - `npm run build` (runs `vite build`)
   - Vite bundles the app and resolves imports from `../remotion/src/`
   - Output: `interactive-viewer/dist/`

### Why Both Installations Are Needed

- `interactive-viewer` imports from `../remotion/src/components/`
- When Vite processes these imports, it needs the `remotion` package types
- The `remotion` directory must have its own `node_modules` for this to work

## Environment Variables

### Required Variables

- `VITE_API_URL` (optional): Backend API URL
  - Default: Empty string (uses relative paths)
  - Production example: `https://your-backend-api.com`

### Setting in Vercel

1. Go to Project Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-production-api.com`
3. Scope: Production

## Deployment Methods

### Method 1: Git Push (Recommended)

1. Commit your changes:

   ```bash
   git add .
   git commit -m "Deploy interactive-viewer"
   git push origin main
   ```

2. Vercel automatically builds and deploys

### Method 2: Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Login:

   ```bash
   vercel login
   ```

3. Deploy from root directory:
   ```bash
   cd hyperion
   vercel --prod
   ```

### Method 3: Manual Deploy via UI

1. Go to Vercel Dashboard
2. Click "Import Project"
3. Select your repository
4. Configure settings as described above
5. Click "Deploy"

## Troubleshooting

### Issue: "Could not resolve remotion"

**Cause**: `remotion` directory's dependencies not installed

**Solution**: Ensure build command includes:

```bash
cd remotion && npm install && cd ../interactive-viewer && ...
```

### Issue: "Could not resolve ../../../remotion/src/..."

**Cause**: Root directory set to `interactive-viewer`, excluding `remotion` directory

**Solution**: Set root directory to `/` (empty) to deploy entire monorepo

### Issue: TypeScript errors from remotion files

**Cause**: TypeScript trying to compile remotion files without their dependencies

**Solution**: Build command uses `vite build` (no `tsc` step)

- See `interactive-viewer/package.json`: `"build": "vite build"`

### Issue: Slow uploads

**Cause**: Uploading `node_modules` or large files

**Solution**: Check `.vercelignore` excludes:

- `backend/videos/`
- `*/node_modules/`
- `backend/dist/`

## Verification

After deployment, verify:

1. ✅ Build logs show both `npm install` commands succeeded
2. ✅ Build completes without errors
3. ✅ Deployment URL loads the application
4. ✅ No console errors in browser
5. ✅ Video player loads (may need backend API)

## Local Testing

Test the exact build command locally:

```bash
cd hyperion
rm -rf remotion/node_modules interactive-viewer/node_modules
cd remotion && npm install && cd ../interactive-viewer && npm install && npm run build
```

Preview the build:

```bash
cd interactive-viewer
npm run preview
```

## Notes

- The `backend` directory is **not deployed** to Vercel
- If you need the backend, deploy it separately (e.g., Railway, Render, or Vercel Functions)
- The `remotion` directory is only used for its source code during build
- After build, only `interactive-viewer/dist/` is deployed as static files

## Support

For issues specific to this deployment setup, check:

- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Vite Build Configuration](https://vitejs.dev/config/build-options.html)
- Project Issues on GitHub
