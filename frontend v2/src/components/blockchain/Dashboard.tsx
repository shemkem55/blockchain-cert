import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Clock, Shield, Wallet, LogIn, Play, CheckCircle, Zap, Lock, Globe } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { certificateService } from '@/services/certificateService';
import { CertificateCard } from './CertificateCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Certificate type definition (adjust fields as needed)
export interface Certificate {
  id: string;
  status: 'valid' | 'expired' | string;
  // Add other fields as needed, e.g. name, issuer, etc.
}

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass rounded-xl p-5"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-colors"
  >
    <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </motion.div>
);

export const Dashboard = () => {
  const { isConnected, address, connect } = useWeb3();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadCertificates();
    }
  }, [isConnected, address]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const certs = await certificateService.getMyCertificates(address!);
      setCertificates(certs);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Features Section
  const features = [
    {
      icon: Lock,
      title: 'Military-Grade Security',
      description: 'Your certificates are protected with advanced encryption and blockchain security protocols'
    },
    {
      icon: CheckCircle,
      title: 'Instant Verification',
      description: 'Verify any certificate in seconds with our blockchain-powered verification system'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for speed with optimized smart contracts and lightning-fast processing'
    },
    {
      icon: Globe,
      title: 'Globally Recognized',
      description: 'Certificates verified across multiple blockchain networks worldwide'
    },
    {
      icon: Award,
      title: 'Tamper-Proof',
      description: 'Once issued, certificates cannot be altered or forged - immutable by design'
    },
    {
      icon: TrendingUp,
      title: 'Transparent & Traceable',
      description: 'Complete audit trail of every certificate transaction on the blockchain'
    },
  ];

  if (!isConnected) {
    return (
      <div className="space-y-16">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="inline-flex items-center justify-center p-6 rounded-2xl gradient-primary glow">
                  <Shield className="h-16 w-16 text-primary-foreground" />
                </div>
              </motion.div>
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to <span className="gradient-text">CertChain</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Secure, transparent, and immutable certificate verification powered by blockchain technology
            </p>
            <p className="text-md text-muted-foreground mb-8">
              Eliminate certificate fraud with our advanced blockchain-based verification system. Issue, manage, and verify certificates with complete transparency and security.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 font-semibold">
                  <LogIn className="mr-2 h-5 w-5" />
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" className="gradient-primary text-primary-foreground h-14 px-8 font-semibold glow">
                  <Play className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Verified', value: '10K+' },
                { label: 'Issuers', value: '500+' },
                { label: 'Networks', value: '5+' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose CertChain?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of certificate management with blockchain technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard
                key={i}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Create Account',
                description: 'Sign up in seconds with your email'
              },
              {
                step: 2,
                title: 'Issue or Verify',
                description: 'Issue certificates or verify existing ones'
              },
              {
                step: 3,
                title: 'Blockchain Secure',
                description: 'All certificates stored securely on blockchain'
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const validCerts = certificates.filter(c => c.status === 'valid').length;
  const expiredCerts = certificates.filter(c => c.status === 'expired').length;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and view your blockchain certificates
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Award} label="Total Certificates" value={certificates.length} color="bg-primary/10 text-primary" />
        <StatCard icon={TrendingUp} label="Valid" value={validCerts} color="bg-success/10 text-success" />
        <StatCard icon={Clock} label="Expired" value={expiredCerts} color="bg-warning/10 text-warning" />
        <StatCard icon={Shield} label="Blockchain Verified" value="100%" color="bg-accent/10 text-accent" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">My Certificates</h2>
        <Link to="/issue">
          <Button className="gradient-primary text-primary-foreground">
            Issue New
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : certificates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert, i) => (
            <CertificateCard key={cert.id} certificate={cert} index={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No certificates found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start by issuing or receiving a certificate
          </p>
        </motion.div>
      )}
    </div>
  );
};
