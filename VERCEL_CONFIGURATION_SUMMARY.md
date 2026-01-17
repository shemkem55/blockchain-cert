# ✅ Vercel + Render Configuration - Complete

## 🎉 Summary

Your blockchain certificate system is configured to use:

- **Frontend**: Vercel (<https://blockchain-cert-shem-kipyegons-projects.vercel.app>)
- **Backend**: Render (<https://blockchain-cert-backend.onrender.com>)
- **Database**: PostgreSQL on Render

All components have been verified and tested.

## 📊 Test Results

```
✅ Configuration Verification: PASSED
✅ Component Testing: 28/28 tests PASSED (100%)
✅ Backend Startup: PASSED
✅ Health Endpoint: PASSED
✅ Database Configuration: PASSED
✅ Git Repository: READY
✅ Vercel Configuration: CREATED
```

## 📋 Quick Reference

### Production URLs

- **Frontend (Vercel)**: `https://blockchain-cert-shem-kipyegons-projects.vercel.app`
- **Backend (Render)**: `https://blockchain-cert-backend.onrender.com`
- **Backend Health**: `https://blockchain-cert-backend.onrender.com/health`

### Local Development

```bash
# Backend (port 3000)
cd certificate-backend
npm run dev

# Frontend (port 8080)
cd "frontend v2"
npm run dev
```

## 🔧 Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `render.yaml` | Render backend configuration | ✅ Ready |
| `frontend v2/vercel.json` | Vercel deployment & API rewrites | ✅ Created |
| `certificate-backend/config/db-pg.js` | PostgreSQL adapter | ✅ Implemented |
| `certificate-backend/config/models-pg.js` | PostgreSQL models | ✅ Implemented |
| `certificate-backend/server.js` | Main server with dynamic DB selection | ✅ Configured |

## 🗄️ Database Configuration

### Local Development (SQLite)

```bash
DB_TYPE=sqlite
```

- No setup required
- Database file: `certificate-backend/database.sqlite`
- Perfect for development and testing

### Production (PostgreSQL on Render)

```bash
DB_TYPE=postgres
DATABASE_URL=<auto-injected-by-render>
```

- Automatically provisioned by Render
- SSL enabled by default
- Tables auto-created on first connection

## 🌐 API Routing

### Production (Vercel → Render)

API calls from Vercel frontend are automatically rewritten to Render backend via `vercel.json`:

| Frontend Route | Backend Destination |
|----------------|---------------------|
| `/auth/*` | `https://blockchain-cert-backend.onrender.com/auth/*` |
| `/certificates/*` | `https://blockchain-cert-backend.onrender.com/certificates/*` |
| `/admin/*` | `https://blockchain-cert-backend.onrender.com/admin/*` |
| `/student/*` | `https://blockchain-cert-backend.onrender.com/student/*` |
| `/employer/*` | `https://blockchain-cert-backend.onrender.com/employer/*` |
| `/registrar/*` | `https://blockchain-cert-backend.onrender.com/registrar/*` |
| `/feedback/*` | `https://blockchain-cert-backend.onrender.com/feedback/*` |
| `/health` | `https://blockchain-cert-backend.onrender.com/health` |

### Local Development (Vite Proxy)

Local frontend proxies API calls to `localhost:3000` via `vite.config.ts`

## 🔐 Required Environment Variables

### For Render Backend

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

**Note**: `DATABASE_URL` is automatically set by Render

### For Vercel Frontend

**No environment variables needed!** API calls are proxied via `vercel.json`.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `VERCEL_RENDER_DEPLOYMENT.md` | Complete Vercel + Render deployment guide |
| `RENDER_BACKEND_SETUP.md` | Render backend setup guide |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment checklist |
| `certificate-backend/.env.example` | Environment variables template |
| `verify-config.sh` | Configuration verification script |
| `test-components.sh` | Component testing script |

## 🧪 Testing

### Verify Configuration

```bash
./verify-config.sh
```

### Test All Components

```bash
./test-components.sh
```

### Test Backend Locally

```bash
cd certificate-backend
npm run dev

# In another terminal
curl http://localhost:3000/health
```

### Test Frontend Locally

```bash
cd "frontend v2"
npm run dev

# Open browser to http://localhost:8080
```

## 🚀 Deployment Steps

### 1. Deploy Backend to Render

```bash
# Ensure all changes are committed
git add .
git commit -m "Configure for Vercel + Render deployment"
git push origin main
```

Render will automatically:

- Detect `render.yaml`
- Provision PostgreSQL database
- Deploy the backend
- Set up SSL/HTTPS

### 2. Configure Environment Variables in Render

1. Go to Render Dashboard
2. Select your service
3. Go to Environment tab
4. Add all required variables (see above)
5. Save changes (triggers redeploy)

### 3. Deploy Frontend to Vercel

**Option A: Via Vercel Dashboard**

1. Go to <https://vercel.com/dashboard>
2. Click "Add New..." → "Project"
3. Import from GitHub: `shemkem55/blockchain-cert`
4. Configure:
   - Framework: Vite
   - Root Directory: `frontend v2`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy!

**Option B: Via Vercel CLI**

```bash
cd "frontend v2"
vercel --prod
```

### 4. Verify Deployment

```bash
# Check backend health
curl https://blockchain-cert-backend.onrender.com/health

# Expected response:
# {
#   "status": "ok",
#   "db": { "type": "postgres", "ready": true },
#   "blockchain": { "ready": true }
# }
```

## 🔍 Monitoring

### Frontend (Vercel)

```
Vercel Dashboard → Your Project → Analytics
```

### Backend (Render)

```
Render Dashboard → Your Service → Logs
```

### Database (Render)

```
Render Dashboard → Databases → blockchain_db
```

## 🐛 Troubleshooting

### CORS Errors

1. Verify `CORS_ORIGINS` in Render includes Vercel URL
2. Check Vercel URL matches exactly (with https://)
3. Redeploy backend after changing CORS

### API Calls Failing

1. Check `vercel.json` rewrites are correct
2. Verify Render backend URL is correct
3. Test backend: `curl https://blockchain-cert-backend.onrender.com/health`
4. Check Render logs for errors

### Vercel Build Fails

1. Check build logs in Vercel dashboard
2. Test build locally: `npm run build`
3. Verify dependencies are installed

### Backend Not Responding

1. Check Render service status
2. Free tier spins down after inactivity (15-30s cold start)
3. Check Render logs
4. Verify environment variables are set

## 📊 System Architecture

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

## 🎯 Next Steps

1. ✅ Configuration verified
2. ✅ All tests passed
3. ✅ Vercel configuration created
4. ⏭️ Deploy backend to Render
5. ⏭️ Set environment variables in Render
6. ⏭️ Deploy frontend to Vercel
7. ⏭️ Test production deployment

## ✨ Features

- 🔐 Secure authentication with JWT
- 📧 Email verification with OTP
- 🔗 Google OAuth integration
- ⛓️ Blockchain certificate minting
- 📊 Admin dashboard
- 👨‍🎓 Student portal
- 👔 Employer verification
- 🏛️ Registrar management
- 📝 Feedback system
- 🛡️ Security event logging

## 🏆 Production Ready

Your system is now configured for production deployment with:

- **Frontend**: Vercel (automatic HTTPS, CDN, preview deployments)
- **Backend**: Render (PostgreSQL, automatic scaling, SSL)
- **Blockchain**: Sepolia testnet

---

**Last Updated**: 2026-01-17  
**Status**: ✅ Ready for Deployment  
**Test Results**: 28/28 Passed (100%)  
**Frontend**: Vercel  
**Backend**: Render
