# Configure Sepolia RPC on Render Backend

## Your Sepolia RPC URL

```
https://eth-sepolia.g.alchemy.com/v2/KyNXzvXZgjtUpnFf7D340
```

## Step-by-Step: Update Render Environment Variables

### Step 1: Access Render Dashboard

1. Go to: <https://dashboard.render.com>
2. Sign in to your account
3. Find and click on your backend service: **blockchain-cert-backend**

### Step 2: Navigate to Environment Variables

1. In the left sidebar, click **Environment**
2. You'll see a list of existing environment variables

### Step 3: Add/Update BLOCKCHAIN_RPC_URL

1. Look for `BLOCKCHAIN_RPC_URL` in the list
   - If it exists: Click **Edit** next to it
   - If it doesn't exist: Click **Add Environment Variable**

2. Enter the following:
   - **Key:** `BLOCKCHAIN_RPC_URL`
   - **Value:** `https://eth-sepolia.g.alchemy.com/v2/KyNXzvXZgjtUpnFf7D340`

3. Click **Save Changes**

### Step 4: Redeploy the Service

After saving the environment variable:

1. Render will automatically trigger a redeploy
2. Wait 2-3 minutes for the deployment to complete
3. The backend will restart with the new RPC endpoint

### Step 5: Verify the Connection

After deployment completes, check the health endpoint:

```bash
curl https://blockchain-cert-backend.onrender.com/health
```

You should see:

```json
{
  "blockchain": {
    "ready": true,
    "network": "sepolia",
    "rpcUrl": "https://eth-sepolia.g.alchemy.com/v2/..."
  }
}
```

## Other Important Environment Variables to Set

While you're in the Render environment settings, make sure these are also configured:

### Required Variables

- `NODE_ENV` = `production`
- `DB_TYPE` = `postgres` (should already be set)
- `BLOCKCHAIN_RPC_URL` = `https://eth-sepolia.g.alchemy.com/v2/KyNXzvXZgjtUpnFf7D340`
- `BLOCKCHAIN_CONTRACT_ADDRESS` = (Your deployed contract address)
- `BLOCKCHAIN_ADMIN_PRIVATE_KEY` = (Your wallet private key for signing transactions)

### Optional but Recommended

- `JWT_SECRET` = (Strong random secret - generate one)
- `EMAIL_USER` = (Your Gmail for sending OTPs)
- `EMAIL_PASSWORD` = (Gmail app password)
- `ADMIN_PASSWORD` = `12747aluminA@`
- `CORS_ORIGINS` = `https://blockchaincert.netlify.app`

## Security Note

⚠️ **Never commit the Sepolia RPC URL to Git!** It contains your API key. Always set it as an environment variable in Render.

## Next Steps After Configuration

1. Wait for Render to redeploy (2-3 minutes)
2. Test the backend health endpoint
3. Try logging into your Netlify frontend
4. Certificate operations should now work with Sepolia testnet
