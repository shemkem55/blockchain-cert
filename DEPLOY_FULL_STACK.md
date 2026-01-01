# Full Stack Deployment Guide

This guide will help you deploy the remaining parts of your application: the **Blockchain Smart Contracts** and the **Node.js Backend**, and then sync them with your Vercel frontend.

## Part 1: Deploy Smart Contracts to Sepolia Testnet

1. **Get Sepolia ETH**: You need testnet ETH to pay for gas. Get it from [Google's Sepolia Faucet](https://cloud.google.com/application/sepolia/faucet) or [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia).
2. **Configure Environment**:
    Inside `certificate-verification/.env` (create if missing), add:

    ```env
    SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
    SEPOLIA_PRIVATE_KEY=your_wallet_private_key
    ```

    *(Note: You can get an RPC URL from Alchemy or Infura for free)*

3. **Run Deployment Script**:

    ```bash
    cd certificate-verification.
    npm install
    npx hardhat compile
    node scripts/deploy-sepolia-ethers.js
    ```

4. **Save the Address**: The script will verify deployment and save the address to `deployed_address_sepolia.json`. **Copy this address.**

## Part 2: Deploy Backend to Render.com

1. **Push Changes**: Ensure your `render.yaml` and `package.json` updates are pushed to GitHub.
2. **Create Service**:
    * Go to [Render Dashboard](https://dashboard.render.com).
    * Click **New +** -> **Web Service**.
    * Connect your GitHub repo `shemkem55/blockchain-cert`.
    * Select `certificate-backend` as the **Root Directory**.
    * Render should auto-detect Node.js.
3. **Configure Environment Variables** (during setup or in Settings):
    * `NODE_ENV`: `production`
    * `DB_TYPE`: `mariadb` (or `mysql`)
    * `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: details from a hosted database (e.g., [TiDB/PingCAP](https://tidbcloud.com/) or [Aiven](https://aiven.io/) - both have free tiers). **SQLite will NOT work permanently on Render.**
    * `BLOCKCHAIN_RPC_URL`: Your Sepolia RPC URL (same as above).
    * `BLOCKCHAIN_CONTRACT_ADDRESS`: The address you copied in Part 1.
    * `BLOCKCHAIN_ADMIN_PRIVATE_KEY`: Your wallet private key (to issue certs).
4. **Deploy**: Click Create Web Service. Wait for it to go live.
5. **Copy Backend URL**: e.g., `https://blockchain-cert-backend.onrender.com`.

## Part 3: Sync Frontend with Backend

Now that your backend is live, point Vercel to it.

1. **Open `vercel.json`** in the root of your repo.
2. **Update Rewrites**:
    Change the `destination` of the rewrites to point to your new Render backend URL.

    ```json
    "rewrites": [
        {
            "source": "/auth/:path*",
            "destination": "https://blockchain-cert-backend.onrender.com/auth/:path*"
        },
        {
            "source": "/health",
            "destination": "https://blockchain-cert-backend.onrender.com/health"
        },
        {
            "source": "/certificates/:path*",
            "destination": "https://blockchain-cert-backend.onrender.com/certificates/:path*"
        },
        ... add other routes (admin, employer, student) as needed or use a wildcard /api/ proxy if checking code.
    ]
    ```

    *Better yet, updated the code to use `VITE_API_URL` env var, but rewrites are a quick fix.*

3. **Commit and Push**:

    ```bash
    git add vercel.json
    git commit -m "Point frontend to live Render backend"
    git push
    ```

## Optional: Database Hosting

For the backend to work on Render, you need a MySQL/MariaDB.

* **TiDB Cloud**: Offers a free Serverless Tier compatible with MySQL.
* **PlanetScale**: (No longer has a free hobby tier).
* **Neon**: (Postgres, but your app is set up for MySQL/SQLite).
* **Clever Cloud**: Offers free MySQL addon.

Update `DB_HOST` in Render with the credentials provided by these services.
