import { motion } from 'framer-motion';
import { Book, Code, Shield, Cpu, ArrowRight, Terminal, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const Docs = () => {
    const navigate = useNavigate();
    const sections = [
        {
            title: 'Getting Started',
            icon: Book,
            topics: ['Introduction', 'Account Creation', 'Portal Navigation', 'Basic Verification']
        },
        {
            title: 'API Reference',
            icon: Code,
            topics: ['Authentication', 'Certificate Issuance', 'Querying Records', 'Webhooks']
        },
        {
            title: 'Security Architecture',
            icon: Shield,
            topics: ['Zero-Knowledge Proofs', 'Smart Contract Logic', 'Data Encryption', 'Access Control']
        },
        {
            title: 'Network Protocol',
            icon: Cpu,
            topics: ['Node Operations', 'Consensus Mechanism', 'L2 Scaling', 'Gas Optimization']
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

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-4 gap-12">
                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-32 space-y-8">
                                <div>
                                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 gradient-text">
                                        Knowledge Base
                                    </h1>
                                    <p className="text-sm font-bold text-foreground/60 leading-relaxed">
                                        Comprehensive documentation for the CertChain Protocol and its integrated application suite.
                                    </p>
                                </div>

                                <nav className="space-y-1">
                                    {sections.map((s) => (
                                        <button
                                            key={s.title}
                                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-foreground/60 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between group"
                                        >
                                            {s.title}
                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </nav>

                                <div className="p-6 rounded-2xl bg-slate-950 border border-primary/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Terminal className="w-5 h-5 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Status</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs font-bold text-green-500">Mainnet Live</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <div className="grid md:grid-cols-2 gap-8">
                                {sections.map((section, i) => (
                                    <motion.div
                                        key={section.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="glass p-8 rounded-[2rem] border border-white/5 hover:border-primary/40 transition-all group"
                                    >
                                        <div className="p-4 rounded-2xl bg-primary/10 w-fit mb-6 group-hover:bg-primary transition-colors">
                                            <section.icon className="w-6 h-6 text-primary group-hover:text-white" />
                                        </div>
                                        <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">
                                            {section.title}
                                        </h2>
                                        <ul className="space-y-4">
                                            {section.topics.map((topic) => (
                                                <li key={topic}>
                                                    <button className="text-foreground/60 font-bold hover:text-primary transition-colors flex items-center gap-2 text-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                        {topic}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-12 glass p-10 rounded-[2.5rem] border-2 border-primary/20 bg-primary/5 text-center"
                            >
                                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Need custom integration?</h3>
                                <p className="text-foreground/70 font-bold mb-8 max-w-2xl mx-auto">
                                    Our engineering team provides direct support for enterprise university deployments and government identity systems.
                                </p>
                                <Button className="h-14 px-10 gradient-primary rounded-2xl font-black uppercase tracking-widest">
                                    Contact Support Engineer
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Docs;
