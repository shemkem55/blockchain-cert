import { useState } from 'react';
import { motion } from 'framer-motion';
import { FilePlus, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useWeb3 } from '@/contexts/Web3Context';
import { certificateService } from '@/services/certificateService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type IssuanceState = 'idle' | 'issuing' | 'success';

export const CertificateIssuance = () => {
  const { isConnected, address } = useWeb3();
  const navigate = useNavigate();
  const [state, setState] = useState<IssuanceState>('idle');
  const [newCertificate, setNewCertificate] = useState(null);
  const [form, setForm] = useState({
    recipientName: '',
    recipientAddress: '',
    title: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!form.recipientName || !form.recipientAddress || !form.title || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setState('issuing');

    try {
      const cert = await certificateService.issueCertificate(form);
      setNewCertificate(cert);
      setState('success');
      toast.success('Certificate issued successfully!');
    } catch (error) {
      setState('idle');
      toast.error('Failed to issue certificate');
    }
  };

  const handleReset = () => {
    setState('idle');
    setNewCertificate(null);
    setForm({
      recipientName: '',
      recipientAddress: '',
      title: '',
      description: '',
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="p-6 rounded-full bg-warning/10 mb-6">
            <AlertTriangle className="h-12 w-12 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Wallet Not Connected</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to issue certificates on the blockchain
          </p>
        </motion.div>
      </div>
    );
  }

  if (state === 'success' && newCertificate) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-success/20 animate-pulse-ring" />
            <div className="relative p-6 rounded-full bg-success/10">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Certificate Issued!</h2>
          <p className="text-muted-foreground mb-6">
            The certificate has been recorded on the blockchain
          </p>

          <div className="w-full glass rounded-xl p-6 text-left mb-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Certificate Hash</Label>
                <p className="font-mono text-sm text-foreground break-all">{newCertificate.hash}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Transaction Hash</Label>
                <p className="font-mono text-sm text-foreground break-all">{newCertificate.transactionHash}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Block Number</Label>
                <p className="font-mono text-sm text-foreground">#{newCertificate.blockNumber.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="glass border-border">
              Issue Another
            </Button>
            <Button onClick={() => navigate(`/certificate/${newCertificate.id}`)} className="gradient-primary text-primary-foreground">
              View Certificate
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-4">
          <FilePlus className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Issue Certificate</h1>
        <p className="text-muted-foreground">
          Create a new blockchain-verified certificate
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="glass rounded-2xl p-6 space-y-6"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input
              id="recipientName"
              value={form.recipientName}
              onChange={(e) => setForm(prev => ({ ...prev, recipientName: e.target.value }))}
              placeholder="John Doe"
              className="bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientAddress">Recipient Wallet Address</Label>
            <Input
              id="recipientAddress"
              value={form.recipientAddress}
              onChange={(e) => setForm(prev => ({ ...prev, recipientAddress: e.target.value }))}
              placeholder="0x..."
              className="bg-secondary/50 border-border font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Certificate Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Blockchain Developer Certification"
            className="bg-secondary/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the achievement or qualification..."
            rows={4}
            className="bg-secondary/50 border-border resize-none"
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={state === 'issuing'}
            className="w-full h-12 gradient-primary text-primary-foreground font-semibold"
          >
            {state === 'issuing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Issuing Certificate...
              </>
            ) : (
              <>
                <FilePlus className="mr-2 h-4 w-4" />
                Issue Certificate
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Issuing from: <span className="font-mono">{address?.slice(0, 10)}...{address?.slice(-8)}</span>
        </p>
      </motion.form>
    </div>
  );
};
