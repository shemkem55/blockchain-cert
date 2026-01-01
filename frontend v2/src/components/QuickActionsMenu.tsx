import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Copy,
    Share2,
    Download,
    ExternalLink,
    Check,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickActionMenuItem {
    icon: React.ReactNode;
    label: string;
    action: () => void;
    shortcut?: string;
    variant?: 'default' | 'success' | 'danger';
}

interface QuickActionsMenuProps {
    certificateId?: string;
    onShare?: () => void;
    onDownload?: () => void;
    onViewOfficial?: () => void;
    position?: { x: number; y: number };
    isOpen: boolean;
    onClose: () => void;
}

export const QuickActionsMenu = ({
    certificateId,
    onShare,
    onDownload,
    onViewOfficial,
    position = { x: 0, y: 0 },
    isOpen,
    onClose
}: QuickActionsMenuProps) => {
    const [copiedId, setCopiedId] = useState(false);

    const handleCopyId = () => {
        if (certificateId) {
            navigator.clipboard.writeText(certificateId);
            setCopiedId(true);
            toast.success('Certificate ID copied to clipboard');
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleCopyLink = () => {
        if (certificateId) {
            const link = `${window.location.origin}/certificate/${certificateId}`;
            navigator.clipboard.writeText(link);
            toast.success('Verification link copied');
        }
    };

    const actions: QuickActionMenuItem[] = [
        {
            icon: copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />,
            label: 'Copy ID',
            action: handleCopyId,
            shortcut: 'Ctrl+C'
        },
        {
            icon: <Share2 className="h-4 w-4" />,
            label: 'Copy Link',
            action: handleCopyLink,
            shortcut: 'Ctrl+L'
        },
        {
            icon: <Download className="h-4 w-4" />,
            label: 'Download Report',
            action: () => onDownload?.(),
            shortcut: 'Ctrl+D'
        },
        {
            icon: <ExternalLink className="h-4 w-4" />,
            label: 'View Official',
            action: () => onViewOfficial?.(),
            variant: 'success'
        }
    ];

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'fixed',
                            left: position.x,
                            top: position.y,
                            zIndex: 50
                        }}
                        className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[240px]"
                    >
                        <div className="p-2">
                            <div className="px-3 py-2 mb-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Quick Actions
                                    </span>
                                    <button
                                        onClick={onClose}
                                        title="Close quick actions menu"
                                        aria-label="Close quick actions menu"
                                        className="h-5 w-5 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            {actions.map((item, idx) => (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => {
                                        item.action();
                                        if (item.label !== 'Copy ID') {
                                            onClose();
                                        }
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl",
                                        "hover:bg-white/10 transition-all group",
                                        item.variant === 'success' && "hover:bg-green-500/10",
                                        item.variant === 'danger' && "hover:bg-red-500/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "transition-colors",
                                            item.variant === 'success' && "group-hover:text-green-400",
                                            item.variant === 'danger' && "group-hover:text-red-400"
                                        )}>
                                            {item.icon}
                                        </div>
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </div>
                                    {item.shortcut && (
                                        <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0.5">
                                            {item.shortcut}
                                        </Badge>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {certificateId && (
                            <div className="px-4 py-3 bg-white/5 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                                        Active ID
                                    </span>
                                    <code className="text-[10px] font-mono text-primary">
                                        {certificateId}
                                    </code>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
