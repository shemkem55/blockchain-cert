import { connectDB } from '../lib/db';
import logger from '../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connection
    const dbReady = await connectDB();

    // Check blockchain status (mock for now)
    const blockchainReady = false;
    const blockchainRpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
    const blockchainContractAddress = null;
    const blockchainNetwork = null;

    res.status(200).json({
      status: "ok",
      time: new Date().toISOString(),
      db: {
        type: process.env.DB_TYPE || 'sqlite',
        ready: dbReady
      },
      blockchain: {
        rpcUrl: blockchainRpcUrl,
        contractAddress: blockchainContractAddress,
        network: blockchainNetwork,
        ready: blockchainReady
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: "error",
      error: error.message,
      time: new Date().toISOString()
    });
  }
}
