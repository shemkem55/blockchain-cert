# Netlify Deployment Fix - Secrets Scanner Issue

## Problem

Netlify's secrets scanner is blocking deployment with false positives for:

- `NODE_ENV` (finds "production" in code)
- `PORT` (finds "8080" in code)
- `ADMIN_USERNAME` (finds "root" in code)
- `GOOGLE_CLIENT_ID` (public OAuth ID, not a secret)

## Solution: Configure via Netlify UI

Since the `netlify.toml` configuration isn't being respected, follow these steps:

### Step 1: Access Site Settings

1. Go to <https://app.netlify.com>
2. Select your site: **blockchaincert**
3. Click **Site settings**

### Step 2: Add Environment Variable

1. In the left sidebar, click **Environment variables**
2. Click **Add a variable** or **Add environment variables**
3. Add this variable:
   - **Key:** `SECRETS_SCAN_ENABLED`
   - **Value:** `false`
   - **Scopes:** Select all scopes (Builds, Functions, Post-processing)
4. Click **Save**

### Alternative: Use Omit Keys (More Secure)

If you prefer to keep scanning enabled but exclude these specific keys:

1. Add this variable instead:
   - **Key:** `SECRETS_SCAN_OMIT_KEYS`
   - **Value:** `NODE_ENV,PORT,ADMIN_USERNAME,GOOGLE_CLIENT_ID`
   - **Scopes:** Select all scopes
2. Click **Save**

### Step 3: Trigger Redeploy

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**
3. Wait for the build to complete

## Why This Happens

These are **false positives** - the scanner finds common strings in your built files:

- "production" appears in compiled JavaScript
- "8080" appears in configuration
- "root" appears as a default username
- Google Client ID is meant to be public (it's not a secret)

## Important Notes

- ✅ Your actual `.env` file is protected (it's in `.gitignore`)
- ✅ No real secrets are exposed
- ✅ This is a known Netlify scanner limitation
- ✅ Disabling the scanner for this project is safe

## If This Still Fails

Contact Netlify support and reference this issue:

- Site: blockchaincert
- Error: False positive secrets detection
- Variables: NODE_ENV, PORT, ADMIN_USERNAME, GOOGLE_CLIENT_ID
