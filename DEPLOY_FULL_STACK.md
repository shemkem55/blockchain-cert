# Full Stack Deployment Guide (Netlify + Render)

This guide will help you deploy the entire application: the **Frontend** on Netlify, the **Node.js Backend** on Render, and the **Blockchain Smart Contracts** on Sepolia.

## Part 1: Deploy Smart Contracts to Sepolia Testnet

1. **Get Sepolia ETH**: You need testnet ETH to pay for gas. Get it from [Google's Sepolia Faucet](https://cloud.google.com/application/sepolia/faucet) or [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia).
2. **Configure Environment**:
    Inside `certificate-verification/.env` (create if missing), add:

    ```env
    SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
    SEPOLIA_PRIVATE_KEY=your_wallet_private_key
    ```

3. **Run Deployment Script**:

    ```bash
    cd certificate-verification.
    npm install
    npx hardhat compile
    node scripts/deploy-sepolia-ethers.js
    ```

4. **Save the Address**: The script will output the contract address. **Copy this address.**

## Part 2: Deploy Backend to Render.com

1. **Push Changes**: Ensure your `render.yaml` and `package.json` updates are pushed to GitHub.
2. **Create Service**:
    * Go to [Render Dashboard](https://dashboard.render.com).
    * Click **New +** -> **Web Service**.
    * Connect your GitHub repo.
    * Select `certificate-backend` as the **Root Directory**.
3. **Configure Environment Variables**:
    * `NODE_ENV`: `production`
    * `DB_TYPE`: `mariadb` (or `mysql`)
    * `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: From your hosted database.
    * `BLOCKCHAIN_RPC_URL`: Your Sepolia RPC URL.
    * `BLOCKCHAIN_CONTRACT_ADDRESS`: The address from Part 1.
    * `BLOCKCHAIN_ADMIN_PRIVATE_KEY`: Your wallet private key.
4. **Deploy**: Click Create Web Service. Wait for it to go live.
5. **Copy Backend URL**: e.g., `https://blockchain-cert-backend.onrender.com`.

## Part 3: Deploy Frontend to Netlify

1. **Root Configuration**: Ensure the `netlify.toml` in the project root is correct:
   * `base = "frontend v2"`
   * `command = "npm run build"`
   * `publish = "dist"`
2. **API Proxies**: The `netlify.toml` already handles proxying `/auth/*` and other routes to your Render backend. Update the URLs in `netlify.toml` if your backend URL is different.
3. **Root Configuration**: Ensure the `netlify.toml` in the project root is correct:
    * `base = "frontend v2"`
    * `command = "npm run build"`
    * `publish = "dist"`
4. **API Proxies**: The `netlify.toml` already handles proxying `/auth/*` and other routes to your Render backend. Update the URLs in `netlify.toml` if your backend URL is different.
5. **Deployment**:
    * Go to [Netlify Dashboard](https://app.netlify.com).
    * Click **Add new site** -> **Import an existing project**.
    * Connect your GitHub repo.
    * Netlify should automatically detect the `netlify.toml` and configure the build settings.
6. **Environment Variables**:
    * Add `VITE_GOOGLE_CLIENT_ID` if using Google OAuth.
7. **Deploy**: Click **Deploy site**.

## Summary of Files for Netlify

* `netlify.toml`: Main configuration for build and routing.
* `frontend v2/public/_redirects`: Extra fallback for SPA routing.
* `prepare-deployment.sh`: Run this locally to generate secrets and build the frontend for verification.
