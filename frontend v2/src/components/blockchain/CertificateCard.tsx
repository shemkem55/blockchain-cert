// No runtime type import needed
import { motion } from 'framer-motion';
import { Award, Calendar, ExternalLink, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

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

export const CertificateCard = ({ certificate, index = 0 }) => {
  // Safely get status with fallback
  const status = certificate?.status || 'valid';
  const StatusIcon = statusConfig[status]?.icon || CheckCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 glass p-6"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="p-3 rounded-xl bg-primary/10 glow">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <Badge className={statusConfig[status]?.className || statusConfig.valid.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[status]?.label || 'Valid'}
          </Badge>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-1 heading-modern">
          {certificate.title}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {certificate.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Issued by:</span>
            <span className="font-medium text-foreground">{certificate.issuerName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(certificate.issuedAt, 'MMM dd, yyyy')}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          {certificate?.blockNumber && (
            <span className="text-xs font-mono text-muted-foreground">
              Block #{certificate.blockNumber.toLocaleString()}
            </span>
          )}
          <Link
            to={`/certificate/${certificate.id}`}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
