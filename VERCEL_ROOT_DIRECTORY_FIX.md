# CRITICAL FIX: Vercel Root Directory Configuration

## The Problem

Your Vercel project `frontend` (https://frontend-smoky-pi-12.vercel.app/) is configured incorrectly. The project is trying to deploy from the **repository root** but your frontend code is in the **`frontend/` subdirectory**.

## The Solution

You need to set the **Root Directory** in Vercel Dashboard to `frontend`.

## Step-by-Step Fix

### Option 1: Via Vercel Dashboard (RECOMMENDED)

1. Go to https://vercel.com/dashboard
2. Select your `frontend` project
3. Click **Settings** (top navigation)
4. Click **General** (left sidebar)
5. Scroll down to **Root Directory**
6. Click **Edit**
7. Enter: `frontend`
8. Click **Save**
9. Go to **Deployments** tab
10. Click the **three dots** (`...`) on the latest deployment
11. Click **Redeploy**

### Option 2: Via Vercel CLI (ALTERNATIVE)

```bash
cd /mnt/c/Users/boorl/OneDrive/Desktop/AI-Powered-Product-Intelligence/frontend
vercel --prod
```

This will deploy directly from the frontend directory.

## What This Does

Setting Root Directory to `frontend` tells Vercel:
- ✅ Look for `package.json` in `frontend/package.json`
- ✅ Look for `vercel.json` in `frontend/vercel.json`
- ✅ Look for `api/` folder in `frontend/api/`
- ✅ Build output goes to `frontend/dist/`

Without this setting, Vercel looks at the root and doesn't find:
- ❌ No `package.json` at root (it's in `frontend/`)
- ❌ Wrong `vercel.json` (root one is for backend)
- ❌ Can't find frontend files

## After Fixing

Once you set the Root Directory to `frontend` and redeploy, the site should work immediately at:
https://frontend-smoky-pi-12.vercel.app/

## Verification

After redeployment, test these URLs:
1. Frontend: https://frontend-smoky-pi-12.vercel.app/
2. API Health: https://frontend-smoky-pi-12.vercel.app/api/health
3. Check Keys: https://frontend-smoky-pi-12.vercel.app/api/check-keys

All should return successful responses.

## Why We Have Two Projects

Your architecture has:
1. **Backend API Project**: Deployed from root (`backend/main.py`)
2. **Frontend Project**: Should deploy from `frontend/` subdirectory

This is a common monorepo setup where frontend and backend are separate Vercel projects.

## If You Want One Unified Deployment

If you prefer a single deployment, you can:
1. Delete the separate `frontend` Vercel project
2. Move `frontend/` contents to root
3. Update root `vercel.json` to handle both frontend and backend

But the current setup (two projects) is fine once the Root Directory is set correctly!
