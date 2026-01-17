# Vercel + Render Deployment Guide

## 🌐 Architecture Overview

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel CDN     │  Frontend (React + Vite)
│  Static Files   │  https://blockchain-cert-shem-kipyegons-projects.vercel.app
└────────┬────────┘
         │ API Rewrites
         ▼
┌─────────────────┐
│  Render Backend │  Express.js Server
│  Port 10000     │  https://blockchain-cert-backend.onrender.com
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Render │ │ Sepolia  │
│ Postgres│ │Blockchain│
└────────┘ └──────────┘
```

## ✅ Current Configuration

### Frontend: Vercel

- **URL**: `https://blockchain-cert-shem-kipyegons-projects.vercel.app`
- **Config File**: `frontend v2/vercel.json`
- **Framework**: Vite + React
- **API Rewrites**: Configured to proxy to Render backend

### Backend: Render

- **URL**: `https://blockchain-cert-backend.onrender.com`
- **Config File**: `render.yaml`
- **Database**: PostgreSQL (auto-provisioned)
- **CORS**: Configured for Vercel frontend

## 🚀 Frontend Deployment (Vercel)

### Option 1: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**

   ```
   https://vercel.com/dashboard
   ```

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import from GitHub: `shemkem55/blockchain-cert`
   - Select repository

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend v2`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables** (if needed)
   - No environment variables required for frontend
   - API calls are proxied via `vercel.json`

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your site will be live at: `https://blockchain-cert-shem-kipyegons-projects.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy**

   ```bash
   cd "frontend v2"
   vercel --prod
   ```

4. **Follow Prompts**
   - Set up and deploy: Yes
   - Which scope: Select your account
   - Link to existing project: No (first time) or Yes (subsequent)
   - Project name: blockchain-cert
   - Directory: ./
   - Override settings: No

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

## 🔧 Backend Configuration (Render)

### CORS Settings

The backend is already configured to accept requests from Vercel:

```yaml
# render.yaml
CORS_ORIGINS: "https://blockchain-cert-shem-kipyegons-projects.vercel.app,http://localhost:8080"
```

### Update CORS (if needed)

If your Vercel URL is different:

1. Go to Render Dashboard
2. Select your service
3. Go to Environment tab
4. Update `CORS_ORIGINS`:

   ```
   https://your-vercel-url.vercel.app,http://localhost:8080
   ```

5. Save (triggers automatic redeploy)

## 📝 Configuration Files

### `frontend v2/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/auth/:path*",
      "destination": "https://blockchain-cert-backend.onrender.com/auth/:path*"
    },
    // ... other API routes
  ]
}
```

**Key Features:**

- ✅ API rewrites to Render backend
- ✅ Security headers
- ✅ SPA routing support
- ✅ Automatic HTTPS

### `render.yaml`

```yaml
services:
  - type: web
    name: blockchain-cert-backend
    env: node
    plan: free
    rootDir: certificate-backend
    envVars:
      - key: CORS_ORIGINS
        value: "https://blockchain-cert-shem-kipyegons-projects.vercel.app,http://localhost:8080"
```

## 🧪 Testing

### Test Frontend Deployment

1. **Visit Vercel URL**

   ```
   https://blockchain-cert-shem-kipyegons-projects.vercel.app
   ```

2. **Check Browser Console**
   - Open DevTools → Console
   - Look for any errors

3. **Test API Calls**
   - Try to register/login
   - Check Network tab in DevTools
   - Verify API calls go to Render backend

### Test Backend Connection

```bash
# Test health endpoint
curl https://blockchain-cert-backend.onrender.com/health

# Expected response:
# {
#   "status": "ok",
#   "db": { "type": "postgres", "ready": true },
#   "blockchain": { "ready": true }
# }
```

### Test End-to-End

1. Register a new account
2. Verify email (check OTP)
3. Login
4. Upload documents (student)
5. Approve certificate (admin)
6. Verify certificate

## 🔐 Environment Variables

### Frontend (Vercel)

**No environment variables needed!** API calls are proxied via `vercel.json`.

### Backend (Render)

Set these in Render Dashboard → Environment:

```bash
NODE_ENV=production
PORT=10000
DB_TYPE=postgres
JWT_SECRET=<generate-with: openssl rand -base64 32>
EMAIL_USER=<your-gmail@gmail.com>
EMAIL_PASSWORD=<gmail-app-password>
BLOCKCHAIN_RPC_URL=<sepolia-rpc-url>
BLOCKCHAIN_ADMIN_PRIVATE_KEY=<wallet-private-key>
GOOGLE_CLIENT_ID=<oauth-client-id>
CORS_ORIGINS=https://blockchain-cert-shem-kipyegons-projects.vercel.app,http://localhost:8080
```

## 🔄 Deployment Workflow

### Making Changes

1. **Make changes locally**

   ```bash
   # Frontend
   cd "frontend v2"
   npm run dev  # Test locally
   
   # Backend
   cd certificate-backend
   npm run dev  # Test locally
   ```

2. **Commit and push**

   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

3. **Automatic deployment**
   - Vercel: Automatically deploys frontend
   - Render: Automatically deploys backend

4. **Monitor deployments**
   - Vercel: <https://vercel.com/dashboard>
   - Render: <https://dashboard.render.com>

## 🐛 Troubleshooting

### CORS Errors

**Symptom**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:

1. Check `CORS_ORIGINS` in Render includes your Vercel URL
2. Verify Vercel URL matches exactly (including https://)
3. Redeploy backend after changing CORS settings

### API Calls Failing

**Symptom**: API calls return 404 or timeout

**Solution**:

1. Check `vercel.json` rewrites are correct
2. Verify Render backend URL is correct
3. Test backend directly: `curl https://blockchain-cert-backend.onrender.com/health`
4. Check Render logs for errors

### Vercel Build Fails

**Symptom**: Deployment fails during build

**Solution**:

1. Check build logs in Vercel dashboard
2. Verify `package.json` scripts are correct
3. Test build locally: `npm run build`
4. Check for missing dependencies

### Backend Not Responding

**Symptom**: Backend returns 503 or times out

**Solution**:

1. Check Render service status
2. Free tier services spin down after inactivity (15-30s cold start)
3. Check Render logs for errors
4. Verify environment variables are set

## 📊 Monitoring

### Vercel Analytics

- Go to Vercel Dashboard → Your Project → Analytics
- Monitor page views, performance, errors

### Render Logs

- Go to Render Dashboard → Your Service → Logs
- Monitor backend requests, errors, database queries

### Backend Health Check

```bash
# Check backend status
curl https://blockchain-cert-backend.onrender.com/health

# Monitor continuously
watch -n 5 'curl -s https://blockchain-cert-backend.onrender.com/health | jq .'
```

## 🔗 Useful Links

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | <https://blockchain-cert-shem-kipyegons-projects.vercel.app> |
| **Backend (Render)** | <https://blockchain-cert-backend.onrender.com> |
| **Vercel Dashboard** | <https://vercel.com/dashboard> |
| **Render Dashboard** | <https://dashboard.render.com> |
| **GitHub Repo** | <https://github.com/shemkem55/blockchain-cert> |

## 🎯 Next Steps

1. ✅ Vercel configuration created (`vercel.json`)
2. ✅ CORS configured for Vercel in `render.yaml`
3. ⏭️ Deploy frontend to Vercel
4. ⏭️ Verify API calls work correctly
5. ⏭️ Test full application flow
6. ⏭️ Configure custom domain (optional)

## 💡 Tips

1. **Preview Deployments**: Vercel creates preview URLs for pull requests
2. **Environment Branches**: Use different Vercel projects for staging/production
3. **Cold Starts**: First request to Render backend may take 15-30 seconds
4. **Logs**: Check both Vercel and Render logs for debugging
5. **Caching**: Vercel automatically caches static assets

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Render backend logs
3. Verify `vercel.json` configuration
4. Test backend health endpoint
5. Check CORS settings in Render

---

**Last Updated**: 2026-01-17  
**Frontend**: Vercel  
**Backend**: Render  
**Status**: ✅ Configured and Ready
