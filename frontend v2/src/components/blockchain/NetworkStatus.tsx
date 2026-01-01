import { useWeb3 } from '@/contexts/Web3Context';
import { motion } from 'framer-motion';

export const NetworkStatus = () => {
  const { isConnected, chainId, getNetworkName } = useWeb3();

  if (!isConnected) return null;

  const isMainnet = chainId === 1 || chainId === 137;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full glass"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isMainnet ? 'bg-success' : 'bg-warning'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isMainnet ? 'bg-success' : 'bg-warning'
          }`}
        />
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        {getNetworkName()}
      </span>
    </motion.div>
  );
};
