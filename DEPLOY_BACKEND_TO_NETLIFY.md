# Deploy Backend to Netlify

## Step 1: Create netlify.toml for Backend

This configuration will deploy the backend as a Node.js server on Netlify.

```toml
[build]
  base = "certificate-backend"
  publish = "certificate-backend"
  command = "npm install"

[build.environment]
  NODE_VERSION = "18"
  SECRETS_SCAN_ENABLED = "false"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server/:splat"
  status = 200
```

## Step 2: Create Netlify Function Wrapper

We need to wrap the Express app as a Netlify Function.

Create: `certificate-backend/netlify/functions/server.js`

```javascript
const serverless = require('serverless-http');
const app = require('../../server.js');

exports.handler = serverless(app);
```

## Step 3: Update package.json

Add serverless-http dependency:

```json
{
  "dependencies": {
    "serverless-http": "^3.2.0",
    ...existing dependencies
  }
}
```

## Step 4: Deploy Backend to Netlify

1. Go to: <https://app.netlify.com>
2. Click **Add new site** → **Import an existing project**
3. Connect to your GitHub repo
4. Configure:
   - **Base directory:** `certificate-backend`
   - **Build command:** `npm install`
   - **Publish directory:** `certificate-backend`
5. Click **Deploy site**

## Step 5: Set Environment Variables in Netlify

Go to Site Settings → Environment Variables and add:

- `NODE_ENV` = `production`
- `DB_TYPE` = `postgres`
- `BLOCKCHAIN_RPC_URL` = `https://eth-sepolia.g.alchemy.com/v2/KyNXzvXZgjtUpnFf7D340`
- `BLOCKCHAIN_CONTRACT_ADDRESS` = (your contract address)
- `BLOCKCHAIN_ADMIN_PRIVATE_KEY` = (your wallet private key)
- `DATABASE_URL` = (your PostgreSQL connection string)
- `JWT_SECRET` = (generate a strong secret)
- `EMAIL_USER` = (your Gmail)
- `EMAIL_PASSWORD` = (Gmail app password)
- `ADMIN_PASSWORD` = `12747aluminA@`
- `SECRETS_SCAN_ENABLED` = `false`

## Step 6: Update Frontend to Use New Backend URL

After backend is deployed, you'll get a URL like:
`https://your-backend-name.netlify.app`

Update `netlify.toml` in the root to point to this new URL instead of Render.

## Step 7: Disconnect Render from Git

1. Go to: <https://dashboard.render.com>
2. Click on your backend service
3. Go to **Settings**
4. Scroll to **Danger Zone**
5. Click **Delete Service**

---

## ⚠️ Important Limitations

Even with this setup, Netlify Functions have:

- **10-second timeout** (26s for Pro)
- **No persistent storage** for uploads
- **Cold starts** on first request

**Alternative Recommendation:**
Keep Render for backend, just configure the Sepolia RPC. It's more reliable for your use case.

Would you like me to proceed with creating the Netlify backend setup files?
