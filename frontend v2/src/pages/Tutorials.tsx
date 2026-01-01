import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Play, Clock, ArrowRight, ArrowLeft, X, CheckCircle2, ShieldCheck, Cpu, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Tutorial {
    id: string;
    title: string;
    duration: string;
    category: string;
    thumbnail: string;
    description: string;
    steps: string[];
    icon: React.ElementType;
}

const Tutorials = () => {
    const navigate = useNavigate();
    const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null);

    const tutorials: Tutorial[] = [
        {
            id: '1',
            title: 'For Students: Requesting Your First Certificate',
            duration: '4:20',
            category: 'Onboarding',
            thumbnail: '/thumbnails/student.png',
            description: 'Learn the complete lifecycle of a certificate request, from initial document upload to receiving your Soulbound Token on the blockchain.',
            steps: [
                'Log in to your student portal using university credentials',
                'Navigate to the Request Issuance tab',
                'Upload required identification documents (ID/Passport)',
                'Select your department and graduation year',
                'Track request status in real-time until minted'
            ],
            icon: ShieldCheck
        },
        {
            id: '2',
            title: 'For Employers: High-Volume Verification',
            duration: '6:15',
            category: 'Verification',
            thumbnail: '/thumbnails/employer.png',
            description: 'A masterclass for HR professionals on how to utilize our bulk verification tools to audit hundreds of candidates simultaneously.',
            steps: [
                'Create and verify your employer organization account',
                'Access the Verification Center dashboard',
                'Upload CSV/Excel templates with candidate IDs',
                'Understand cryptographic proof of authenticity',
                'Export audit-ready PDF reports for compliance'
            ],
            icon: CheckCircle2
        },
        {
            id: '3',
            title: 'Understanding Blockchain Soulbound Tokens',
            duration: '8:45',
            category: 'Education',
            thumbnail: '/thumbnails/blockchain.png',
            description: 'Deep dive into the underlying technology. What are Soulbound Tokens (SBTs) and why are they the new gold standard for academic credentials?',
            steps: [
                'Introduction to decentralized identifiers (DIDs)',
                'The difference between NFTs and SBTs',
                'How Zero-Knowledge Proofs protect student privacy',
                'Verifying transaction hashes on public explorers',
                'Future-proofing academic records for the next century'
            ],
            icon: Cpu
        },
        {
            id: '4',
            title: 'Administrator Panel Configuration',
            duration: '12:30',
            category: 'Setup',
            thumbnail: '/thumbnails/admin.png',
            description: 'Comprehensive guide for university administrators on managing the system, monitoring health, and approving issuance requests.',
            steps: [
                'Navigating the root-access administrative interface',
                'Configuring institution-specific metadata',
                'Managing registrar accounts and permissions',
                'Real-time system log monitoring and error handling',
                'Database backup and infrastructure scaling'
            ],
            icon: Globe
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

                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-6 gradient-text">
                            Video Tutorials
                        </h1>
                        <p className="text-xl font-bold text-foreground/70">
                            Master the CertChain ecosystem with our step-by-step visual guides.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {tutorials.map((video, i) => (
                            <motion.div
                                key={video.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass rounded-[2rem] border-2 border-white/5 overflow-hidden hover:border-primary/40 transition-all group cursor-pointer"
                                onClick={() => setSelectedVideo(video)}
                            >
                                <div className="aspect-video w-full relative overflow-hidden">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform shadow-glow">
                                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> {video.duration}
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                                            {video.category}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black mb-6 leading-tight group-hover:text-primary transition-colors">
                                        {video.title}
                                    </h2>
                                    <button className="flex items-center gap-2 text-foreground font-black text-xs uppercase tracking-widest hover:gap-4 transition-all group-hover:text-primary">
                                        Open Tutorial <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Video Player Modal Overlay */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 lg:p-24 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-card w-full max-w-6xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col lg:flex-row relative"
                        >
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
                                title="Close"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Left: Video Placeholder */}
                            <div className="flex-1 bg-black relative flex items-center justify-center group">
                                <img
                                    src={selectedVideo.thumbnail}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                                    alt="Video background"
                                />
                                <div className="relative text-center p-12 space-y-6">
                                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mx-auto shadow-glow group-hover:scale-110 transition-transform cursor-pointer">
                                        <Play className="w-10 h-10 text-white fill-white ml-2" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Initialize Transmission</h3>
                                    <p className="text-primary font-black text-xs tracking-widest animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
                                </div>
                            </div>

                            {/* Right: Info Panel */}
                            <div className="lg:w-[450px] p-12 bg-card overflow-y-auto max-h-[80vh] lg:max-h-full">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">
                                    Tutorial Intelligence
                                </span>
                                <h3 className="text-3xl font-black mb-6 leading-tight uppercase tracking-tighter">
                                    {selectedVideo.title}
                                </h3>
                                <p className="text-foreground/70 font-bold mb-10 leading-relaxed">
                                    {selectedVideo.description}
                                </p>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 py-4 border-y border-white/10">
                                        <div className="p-3 rounded-2xl bg-primary/10">
                                            <selectedVideo.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-foreground/50">Curriculum</p>
                                            <p className="font-black">Interactive Session</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Learning Path</h4>
                                        <div className="space-y-4">
                                            {selectedVideo.steps.map((step, idx) => (
                                                <div key={idx} className="flex gap-4 group/step">
                                                    <div className="text-xs font-black text-primary/40 group-hover/step:text-primary transition-colors mt-1">
                                                        0{idx + 1}
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground/80 group-hover/step:text-foreground transition-colors">
                                                        {step}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <button
                                        onClick={() => setSelectedVideo(null)}
                                        className="w-full py-4 gradient-primary rounded-2xl font-black uppercase tracking-widest shadow-glow hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Start Learning
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tutorials;
