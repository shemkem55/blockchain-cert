import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Search, ArrowRight, Shield, Globe, Award, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const StudentGuide = () => {
    const navigate = useNavigate();
    const steps = [
        {
            title: 'Account Verification',
            desc: 'Sign up and verify your identity through your university credentials. This ensures your academic record is linked to your digital identity.',
            icon: Shield
        },
        {
            title: 'Request Issuance',
            desc: 'Submit a request for your graduation certificate or transcript. Our protocol will synchronize with your institution’s legacy records.',
            icon: BookOpen
        },
        {
            title: 'Blockchain Minting',
            desc: 'Once approved, your certificate is minted as a Soulbound Token (SBT) on the decentralized ledger. It is permanent and immutable.',
            icon: Cpu
        },
        {
            title: 'Global Sharing',
            desc: 'Share your verified credentials with employers, institutions, or government bodies instantly through your unique certificate ID.',
            icon: Globe
        }
    ];

    return (
        <div className="min-h-screen pt-32 pb-20">
            <div className="container mx-auto px-4">
                <button
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
                    className="mb-12 flex items-center gap-2 px-4 py-2 bg-secondary/50 backdrop-blur-sm border border-white/10 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-all hover:scale-105 shadow-lg group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Back</span>
                </button>

                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-20"
                    >
                        <h1 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter mb-8 gradient-text">
                            Student <span className="text-foreground">Playbook</span>
                        </h1>
                        <p className="text-xl font-bold text-foreground/70 max-w-2xl mx-auto leading-relaxed">
                            Everything you need to know about managing your academic digital identity on the CertChain Protocol.
                        </p>
                    </motion.div>

                    <div className="grid gap-20">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}
                            >
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-6xl font-black text-primary/10">0{i + 1}</span>
                                        <h2 className="text-3xl font-black uppercase tracking-tight">{step.title}</h2>
                                    </div>
                                    <p className="text-lg font-bold text-foreground/60 leading-relaxed">
                                        {step.desc}
                                    </p>
                                    <Button variant="outline" className="h-12 border-primary/20 hover:border-primary/60 rounded-xl px-8 font-black uppercase tracking-widest flex items-center gap-2 group">
                                        Deep Dive <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                                <div className="flex-1 relative group">
                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative glass p-12 rounded-[2.5rem] border-2 border-white/5 flex items-center justify-center">
                                        <step.icon className="w-24 h-24 text-primary animate-float" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="mt-32 glass p-16 rounded-[4rem] border-2 border-primary/20 bg-primary/5 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10" />
                        <Award className="w-16 h-16 text-primary mx-auto mb-8" />
                        <h3 className="text-4xl font-black mb-6 uppercase tracking-tighter">Ready to Begin Your Journey?</h3>
                        <p className="text-xl font-bold text-foreground/70 mb-12 max-w-2xl mx-auto">
                            Join thousands of students who have already secured their legacy on the blockchain.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <Button className="h-16 px-12 gradient-primary rounded-2xl font-black uppercase tracking-widest shadow-glow hover:scale-105 active:scale-95 transition-all text-lg" onClick={() => window.location.href = '/signup'}>
                                Create Account
                            </Button>
                            <Button className="h-16 px-12 glass border-2 border-primary/30 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/10 transition-all text-lg" onClick={() => window.location.href = '/login'}>
                                Portal Login
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const Cpu = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M15 2v2" />
        <path d="M15 20v2" />
        <path d="M2 15h2" />
        <path d="M2 9h2" />
        <path d="M20 15h2" />
        <path d="M20 9h2" />
        <path d="M9 2v2" />
        <path d="M9 20v2" />
    </svg>
);

export default StudentGuide;
