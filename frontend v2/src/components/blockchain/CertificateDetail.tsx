import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  CheckCircle,
  Calendar,
  User,
  Building2,
  Hash,
  ExternalLink,
  Copy,
  Check,
  FileText,
  AlertCircle,
  LucideIcon,
  XCircle,
  Linkedin,
  Download,
  QrCode,
  Share2
} from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';
import CertificateTemplate from '@/components/CertificateTemplate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { certificateService } from '@/services/certificateService';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  title: string;
  description?: string;
  status: 'valid' | 'expired' | 'revoked';
  issuedAt: string | Date;
  recipientName: string;
  recipientAddress?: string;
  issuerName: string;
  issuerAddress?: string;
  hash?: string;
  transactionHash?: string;
  blockNumber?: number;
  ipfsHash?: string;
  tokenId?: string;
  grade?: string;
  honors?: string;
  institution?: string;
  certificateType?: string;
  registrationNumber?: string;
}

const statusConfig = {
  valid: {
    icon: CheckCircle,
    label: 'Valid',
    className: 'bg-success/10 text-success border-success/20',
  },
  expired: {
    icon: AlertCircle,
    label: 'Expired',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  revoked: {
    icon: XCircle,
    label: 'Revoked',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

const InfoRow = ({ icon: Icon, label, value, mono = false, copyable = false }: {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 group-hover:border-primary/20 transition-all">
      <div className="p-2 rounded-xl bg-primary/10 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-1">{label}</p>
        <p className={`text-sm text-foreground font-medium break-all ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </p>
      </div>
      {copyable && (
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
};

export const CertificateDetail = () => {
  const { id } = useParams();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumCert, setShowPremiumCert] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const loadCertificate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await certificateService.getCertificateById(id!);
      if (res && res.certificate) {
        setCertificate(res.certificate);
      } else if (res && res.title) {
        // Handle case where it might return the cert directly
        setCertificate(res);
      }
    } catch (error) {
      console.error('Failed to load certificate:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCertificate();
    }
  }, [id, loadCertificate]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-shimmer h-96 rounded-2xl" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Certificate Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The certificate you're looking for doesn't exist
        </p>
        <Link to="/">
          <Button className="gradient-primary text-primary-foreground">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const StatusIcon = statusConfig[certificate.status].icon;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        id="certificate-content" // Important for PDF generation
      >
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 print:hidden">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Certificate Header */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="p-4 rounded-xl gradient-primary glow">
              <Award className="h-12 w-12 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{certificate.title}</h1>
                <Badge className={statusConfig[certificate.status].className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[certificate.status].label}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">{certificate.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Issued on {format(certificate.issuedAt, 'MMMM dd, yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20 mb-6">
          <CheckCircle className="h-6 w-6 text-success" />
          <div>
            <p className="font-semibold text-success">Blockchain Verified</p>
            <p className="text-sm text-muted-foreground">
              This certificate is authentic and immutably recorded on the blockchain
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Recipient Information
            </h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="Name" value={certificate.recipientName} />
              <InfoRow icon={Hash} label="Wallet Address" value={certificate.recipientAddress} mono copyable />
              {/* New Fields */}
              {certificate.grade && <InfoRow icon={CheckCircle} label="Grade" value={certificate.grade} />}
              {certificate.honors && <InfoRow icon={Award} label="Honors" value={certificate.honors} />}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Issuer Information
            </h3>
            <div className="space-y-3">
              <InfoRow icon={Building2} label="Organization" value={certificate.issuerName} />
              <InfoRow icon={Hash} label="Wallet Address" value={certificate.issuerAddress} mono copyable />
              {/* New Fields */}
              {certificate.institution && <InfoRow icon={Building2} label="Institution" value={certificate.institution} />}
              {certificate.certificateType && <InfoRow icon={FileText} label="Type" value={certificate.certificateType} />}
            </div>
          </div>
        </div>

        {/* Blockchain Proof */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Blockchain Proof
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Hash} label="Certificate Hash" value={certificate.hash} mono copyable />
            <InfoRow icon={Hash} label="Transaction Hash" value={certificate.transactionHash} mono copyable />
            <InfoRow icon={FileText} label="Block Number" value={`#${certificate.blockNumber.toLocaleString()}`} mono />
            {certificate.ipfsHash && (
              <InfoRow icon={FileText} label="IPFS Hash" value={certificate.ipfsHash} mono copyable />
            )}
          </div>
        </div>

        {/* Actions */}


        {/* NEW FEATURES SECTION */}
        <div className="flex flex-col md:flex-row gap-6 mt-8 print:hidden">
          {/* QR Code Section */}
          <div className="glass rounded-xl p-6 flex-1 flex flex-col items-center text-center">
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCode value={`${window.location.origin}/certificate/${certificate.id}`} size={128} />
            </div>
            <h3 className="font-semibold mb-2">Verify Authenticity</h3>
            <p className="text-sm text-muted-foreground mb-4">Scan to verify this certificate instantly on the blockchain.</p>
            <Button variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/certificate/${certificate.id}`);
              toast.success('Verification URL copied!');
            }}>
              <Copy className="w-3 h-3 mr-2" /> Copy Link
            </Button>
          </div>

          {/* Sharing & Download Actions */}
          <div className="glass rounded-xl p-6 flex-1 flex flex-col justify-center gap-4">
            <h3 className="font-semibold text-center mb-2">Share & Download</h3>

            <Button
              className="w-full bg-[#0077b5] hover:bg-[#006399] text-white"
              onClick={() => {
                const url = encodeURIComponent(`${window.location.origin}/certificate/${certificate.id}`);
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
              }}
            >
              <Linkedin className="w-4 h-4 mr-2" /> Add to LinkedIn
            </Button>

            <Button
              variant="default"
              className="gradient-primary text-primary-foreground w-full shadow-lg shadow-primary/20"
              onClick={async () => {
                const targetRef = showPremiumCert ? certificateRef : { current: document.getElementById('certificate-content') };
                const element = targetRef.current;

                if (!element) return;
                try {
                  toast.loading('Generating High-Resolution Certificate...');

                  // Dimensions for 1240x950 certificate
                  const width = 1240;
                  const height = 950;

                  // Optimize for certificate download
                  const canvas = await html2canvas(element, {
                    useCORS: true,
                    scale: 4, // Ultra-high resolution (4x)
                    logging: false,
                    backgroundColor: showPremiumCert ? '#fdfbf7' : '#ffffff',
                    width: showPremiumCert ? width : undefined,
                    height: showPremiumCert ? height : undefined,
                    allowTaint: true,
                    imageTimeout: 15000,
                    proxy: undefined,
                    onclone: (clonedDoc) => {
                      if (showPremiumCert) {
                        const el = clonedDoc.getElementById('certificate-to-capture');
                        if (el instanceof HTMLElement) {
                          el.style.transform = 'none';
                          el.style.display = 'block';
                          el.style.margin = '0';
                        }
                      }
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } as any);

                  const imgData = canvas.toDataURL('image/png', 1.0);

                  // If downloading the premium template, use exact proportions
                  if (showPremiumCert) {
                    const pdf = new jsPDF({
                      orientation: 'landscape',
                      unit: 'px',
                      format: [width, height]
                    });
                    pdf.addImage(imgData, 'PNG', 0, 0, width, height, undefined, 'FAST');
                    pdf.save(`${certificate.recipientName.replace(/\s+/g, '_')}_Secure_Certificate.pdf`);
                  } else {
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                    pdf.save(`${certificate.recipientName.replace(/\s+/g, '_')}_Record.pdf`);
                  }

                  toast.dismiss();
                  toast.success('Professional Document Downloaded!');
                } catch (err) {
                  console.error(err);
                  toast.dismiss();
                  toast.error('Failed to generate high-quality document');
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" /> Download {showPremiumCert ? 'Official Certificate' : 'PDF Record'}
            </Button>

            <Button
              variant="outline"
              className="w-full border-primary/20 hover:bg-primary/5"
              onClick={() => setShowPremiumCert(!showPremiumCert)}
            >
              <Award className="w-4 h-4 mr-2 text-primary" />
              {showPremiumCert ? 'Back to Details' : 'View Official Certificate'}
            </Button>
          </div>
        </div>

        {/* Premium Certificate Display (Hidden until toggled) */}
        {showPremiumCert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 flex flex-col items-center"
          >
            <div className="w-full overflow-x-auto pb-8 flex justify-center">
              <div className="min-w-[1056px] bg-white rounded-lg shadow-2xl origin-top transform scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 transition-transform">
                <CertificateTemplate
                  ref={certificateRef}
                  preview={false}
                  data={{
                    recipientName: certificate.recipientName,
                    title: certificate.title,
                    year: typeof certificate.issuedAt === 'string' ? new Date(certificate.issuedAt).getFullYear().toString() : certificate.issuedAt.getFullYear().toString(),
                    grade: certificate.grade,
                    description: certificate.description,
                    certificateType: certificate.certificateType || 'Official Blockchain Certificate',
                    institution: certificate.institution || certificate.issuerName,
                    honors: certificate.honors,
                    issuedBy: certificate.issuerName,
                    dateIssued: format(new Date(certificate.issuedAt), 'MMMM dd, yyyy'),
                    certificateId: certificate.id,
                    transactionHash: certificate.transactionHash,
                    registrationNumber: certificate.registrationNumber || certificate.id.slice(0, 8).toUpperCase()
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic mt-4">
              This is your official cryptographically-secured digital certificate.
            </p>
          </motion.div>
        )}
      </motion.div >
    </div >
  );
};
