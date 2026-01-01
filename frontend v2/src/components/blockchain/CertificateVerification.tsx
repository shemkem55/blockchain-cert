import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, Loader2, Shield, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { certificateService } from '@/services/certificateService';
import { CertificateCard } from './CertificateCard';
import { toast } from 'sonner';

type VerificationState = 'idle' | 'verifying' | 'verified' | 'not-found';

export const CertificateVerification = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hash, setHash] = useState('');
  const [state, setState] = useState<VerificationState>('idle');
  const [certificate, setCertificate] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-verify from URL
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setHash(id);
      verify(id);
    }
  }, []);

  const verify = async (targetHash: string) => {
    if (!targetHash.trim()) {
      toast.error('Please enter a certificate hash or ID');
      return;
    }

    setState('verifying');
    setCertificate(null);

    try {
      const result = await certificateService.verifyCertificate(targetHash);
      if (result) {
        setCertificate(result);
        setState('verified');
        toast.success('Certificate verified successfully!');
      } else {
        setState('not-found');
        toast.error('Certificate not found');
      }
    } catch (error) {
      setState('not-found');
      toast.error('Verification failed');
    }
  };

  const handleVerify = () => verify(hash);

  const handleCopyExample = () => {
    navigator.clipboard.writeText('0x7a3f8c2d1e5b9a4f6c8d2e1b5a9f4c8d2e1b5a9f4c8d2e1b5a9f4c8d2e1b5a9f');
    setCopied(true);
    toast.success('Example hash copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Verify Certificate</h1>
        <p className="text-muted-foreground">
          Enter a certificate hash or ID to verify its authenticity on the blockchain
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="Enter certificate hash (0x...) or ID"
              className="pl-10 h-12 bg-secondary/50 border-border font-mono text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>
          <Button
            onClick={handleVerify}
            disabled={state === 'verifying'}
            className="h-12 px-8 gradient-primary text-primary-foreground font-semibold"
          >
            {state === 'verifying' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Try example:</span>
          <button
            onClick={handleCopyExample}
            className="flex items-center gap-1 font-mono text-xs bg-secondary/50 px-2 py-1 rounded hover:bg-secondary transition-colors"
          >
            0x7a3f8c...1b5a9f
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {state === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
              <div className="relative p-6 rounded-full bg-primary/10">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            </div>
            <p className="mt-6 text-lg font-medium text-foreground">Verifying on blockchain...</p>
            <p className="text-sm text-muted-foreground">Checking certificate authenticity</p>
          </motion.div>
        )}

        {state === 'verified' && certificate && (
          <motion.div
            key="verified"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-semibold text-success">Certificate Verified</p>
                <p className="text-sm text-muted-foreground">
                  This certificate is authentic and recorded on the blockchain
                </p>
              </div>
            </div>
            <CertificateCard certificate={certificate} />
          </motion.div>
        )}

        {state === 'not-found' && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="p-6 rounded-full bg-destructive/10 mb-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <p className="text-lg font-medium text-foreground">Certificate Not Found</p>
            <p className="text-sm text-muted-foreground mt-1">
              No certificate matching this hash exists on the blockchain
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
