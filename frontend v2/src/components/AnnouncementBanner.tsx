import { motion } from 'framer-motion';
import { AlertCircle, X, Megaphone, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Announcement {
    id: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    title: string;
    message: string;
    link?: string;
    linkText?: string;
    dismissible?: boolean;
}

const announcements: Announcement[] = [
    {
        id: 'announcement-1',
        type: 'urgent',
        title: 'New Scholarship Applications Open',
        message: 'Applications for the 2025/2026 academic year are now open. Apply before 31st January 2025.',
        link: '/student',
        linkText: 'Apply Now',
        dismissible: true,
    },
    {
        id: 'announcement-2',
        type: 'info',
        title: 'System Maintenance Notice',
        message: 'The portal will undergo scheduled maintenance on Sunday, 5th January 2025 from 2:00 AM to 6:00 AM.',
        dismissible: true,
    },
];

export const AnnouncementBanner = () => {
    const [visibleAnnouncements, setVisibleAnnouncements] = useState<string[]>(
        announcements.map(a => a.id)
    );

    const dismissAnnouncement = (id: string) => {
        setVisibleAnnouncements(prev => prev.filter(announcementId => announcementId !== id));
        // Store in localStorage to persist dismissal
        localStorage.setItem(`dismissed-${id}`, 'true');
    };

    const activeAnnouncements = announcements.filter(
        a => visibleAnnouncements.includes(a.id) && !localStorage.getItem(`dismissed-${a.id}`)
    );

    if (activeAnnouncements.length === 0) return null;

    const getTypeStyles = (type: Announcement['type']) => {
        switch (type) {
            case 'urgent':
                return 'bg-red-600/90 border-red-500';
            case 'warning':
                return 'bg-yellow-600/90 border-yellow-500';
            case 'success':
                return 'bg-green-600/90 border-green-500';
            default:
                return 'bg-primary/90 border-primary';
        }
    };

    return (
        <div className="w-full space-y-1">
            {activeAnnouncements.map((announcement, index) => (
                <motion.div
                    key={announcement.id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`${getTypeStyles(announcement.type)} border-b backdrop-blur-md`}
                >
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Megaphone className="h-5 w-5 text-white flex-shrink-0 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white uppercase tracking-wide">
                                        {announcement.title}
                                    </p>
                                    <p className="text-xs font-bold text-white/90 mt-0.5">
                                        {announcement.message}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {announcement.link && (
                                    <Link
                                        to={announcement.link}
                                        className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-white hover:text-white/80 transition-colors whitespace-nowrap"
                                    >
                                        {announcement.linkText || 'Learn More'}
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                )}

                                {announcement.dismissible && (
                                    <button
                                        onClick={() => dismissAnnouncement(announcement.id)}
                                        className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                                        aria-label="Dismiss announcement"
                                    >
                                        <X className="h-4 w-4 text-white" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
