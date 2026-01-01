import { motion } from 'framer-motion';
import { Download, FileText, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';

const Downloads = () => {
    const navigate = useNavigate();

    const resources = [
        {
            category: 'Application Forms',
            items: [
                { name: 'Graduation Certification Request', type: 'PDF', size: '1.2 MB', filename: 'graduation-request.pdf' },
                { name: 'Identity Verification Form', type: 'PDF', size: '0.8 MB', filename: 'identity-verification.pdf' },
                { name: 'Transcript Release Authorization', type: 'DOCX', size: '45 KB', filename: 'transcript-release.docx' },
            ]
        },
        {
            category: 'System Documentation',
            items: [
                { name: 'CertChain Protocol Overview', type: 'PDF', size: '2.4 MB', filename: 'protocol-overview.pdf' },
                { name: 'Employer Verification Guide', type: 'PDF', size: '1.5 MB', filename: 'employer-guide.pdf' },
                { name: 'University Integration API', type: 'PDF', size: '3.1 MB', filename: 'integration-api.pdf' },
            ]
        }
    ];

    return (
        <div className="min-h-screen pt-32 pb-20">
            <div className="container mx-auto px-4">
                <button
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
                    className="mb-8 flex items-center gap-2 px-4 py-2 bg-secondary/50 backdrop-blur-sm border border-white/10 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-all hover:scale-105 shadow-lg group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Back</span>
                </button>

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-6 gradient-text">
                            Resource Center
                        </h1>
                        <p className="text-xl font-bold text-foreground/70">
                            Access official forms, documentation, and technical resources for the CertChain ecosystem.
                        </p>
                    </motion.div>

                    <div className="relative mb-12">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                        <Input
                            placeholder="Search resources..."
                            className="h-16 pl-16 bg-card/40 border-primary/20 rounded-2xl font-bold text-lg focus:ring-primary/40"
                        />
                    </div>

                    <div className="space-y-12">
                        {resources.map((category, i) => (
                            <motion.div
                                key={category.category}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                                    <span className="w-8 h-px bg-primary" /> {category.category}
                                </h2>
                                <div className="grid gap-4">
                                    {category.items.map((item, j) => (
                                        <div
                                            key={item.name}
                                            className="glass p-6 rounded-2xl border border-white/5 hover:border-primary/40 transition-all group flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black tracking-tight group-hover:text-primary transition-colors">{item.name}</h3>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                        {item.type} • {item.size}
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={`/resources/${item.filename}`}
                                                download={item.filename}
                                                className="h-12 w-12 p-0 rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center bg-secondary/20"
                                                title="Download File"
                                            >
                                                <Download className="w-5 h-5" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Downloads;
