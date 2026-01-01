import { motion } from 'framer-motion';
import {
    FileText,
    HelpCircle,
    Download,
    BookOpen,
    Video,
    Phone,
    Mail,
    MapPin,
    ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickLink {
    title: string;
    description: string;
    icon: React.ElementType;
    link: string;
    external?: boolean;
    badge?: string;
}

const quickLinks: QuickLink[] = [
    {
        title: 'Student Guide',
        description: 'Complete guide on how to request and verify your certificates',
        icon: BookOpen,
        link: '/guide',
        badge: 'New',
    },
    {
        title: 'FAQs',
        description: 'Frequently asked questions about the certification system',
        icon: HelpCircle,
        link: '/#faq',
    },
    {
        title: 'Download Forms',
        description: 'Access application forms and required documentation',
        icon: Download,
        link: '/downloads',
        badge: 'Updated',
    },
    {
        title: 'Video Tutorials',
        description: 'Watch step-by-step video guides on using the portal',
        icon: Video,
        link: '/tutorials',
    },
    {
        title: 'User Manual',
        description: 'Comprehensive user manual and technical documentation',
        icon: FileText,
        link: '/docs',
    },
    {
        title: 'Contact Support',
        description: 'Get help from our support team',
        icon: Phone,
        link: '/#contact',
    },
];

const contactInfo = [
    {
        icon: Phone,
        title: 'Helpline',
        content: '+254 700 000 000',
        subtitle: 'Mon-Fri 8AM-5PM',
    },
    {
        icon: Mail,
        title: 'Email Support',
        content: 'support@certchain.go.ke',
        subtitle: '24/7 Email Support',
    },
    {
        icon: MapPin,
        title: 'Physical Address',
        content: 'Jogoo House, Harambee Ave',
        subtitle: 'Nairobi, Kenya',
    },
];

export const QuickLinksSection = () => {
    return (
        <section className="bg-gradient-to-b from-transparent via-primary/5 to-transparent py-20 border-y border-white/5">
            <div className="container mx-auto px-4">
                {/* Quick Links */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-3">
                            Quick <span className="text-primary">Access</span>
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickLinks.map((link, index) => (
                            <motion.div
                                key={link.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    to={link.link}
                                    className="glass p-6 rounded-lg border-2 border-white/5 hover:border-primary/40 transition-all group block h-full"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                                            <link.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="text-lg font-black group-hover:text-primary transition-colors">
                                                    {link.title}
                                                </h3>
                                                {link.badge && (
                                                    <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-full flex-shrink-0">
                                                        {link.badge}
                                                    </span>
                                                )}
                                                {link.external && (
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                                                {link.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Contact Information */}
                <div className="glass p-8 rounded-xl border-2 border-primary/20">
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-6 text-center">
                        Need <span className="text-primary">Assistance?</span>
                    </h3>

                    <div className="grid md:grid-cols-3 gap-6">
                        {contactInfo.map((contact, index) => (
                            <motion.div
                                key={contact.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center p-4 rounded-lg bg-background/50 border border-white/5"
                            >
                                <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
                                    <contact.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">
                                    {contact.title}
                                </h4>
                                <p className="text-sm font-bold text-foreground mb-1">{contact.content}</p>
                                <p className="text-xs font-bold text-muted-foreground">{contact.subtitle}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
