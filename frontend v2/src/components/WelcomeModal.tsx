import { useState, useEffect } from 'react';
import { X, CheckCircle, Award, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeModalProps {
    userRole: string;
    userName?: string;
}

export const WelcomeModal = ({ userRole, userName }: WelcomeModalProps) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if user has seen welcome modal
        const hasSeenWelcome = localStorage.getItem(`welcome_seen_${userRole}`);
        if (!hasSeenWelcome) {
            setIsOpen(true);
        }
    }, [userRole]);

    const handleClose = () => {
        localStorage.setItem(`welcome_seen_${userRole}`, 'true');
        setIsOpen(false);
    };

    const getContent = () => {
        switch (userRole.toLowerCase()) {
            case 'student':
                return {
                    title: 'Welcome to Your Student Portal!',
                    features: [
                        { icon: Award, text: 'View and download your certificates', color: 'text-blue-500' },
                        { icon: Shield, text: 'Blockchain-verified credentials', color: 'text-green-500' },
                        { icon: Zap, text: 'Share on LinkedIn with one click', color: 'text-purple-500' },
                    ],
                };
            case 'employer':
                return {
                    title: 'Welcome to Your Employer Portal!',
                    features: [
                        { icon: CheckCircle, text: 'Verify candidate certificates instantly', color: 'text-blue-500' },
                        { icon: Shield, text: 'Blockchain-powered authenticity checks', color: 'text-green-500' },
                        { icon: Zap, text: 'Streamlined recruitment process', color: 'text-purple-500' },
                    ],
                };
            case 'admin':
                return {
                    title: 'Welcome to the Registrar Portal!',
                    features: [
                        { icon: Award, text: 'Issue certificates to students', color: 'text-blue-500' },
                        { icon: Shield, text: 'Monitor system security logs', color: 'text-green-500' },
                        { icon: Zap, text: 'Manage all certificates centrally', color: 'text-purple-500' },
                    ],
                };
            default:
                return {
                    title: 'Welcome to CertChain!',
                    features: [
                        { icon: Award, text: 'Secure credential management', color: 'text-blue-500' },
                        { icon: Shield, text: 'Blockchain technology', color: 'text-green-500' },
                        { icon: Zap, text: 'Fast and reliable', color: 'text-purple-500' },
                    ],
                };
        }
    };

    const content = getContent();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Gradient Header */}
                        <div className="relative h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                            >
                                <Award className="w-10 h-10 text-white" />
                            </motion.div>
                            <button
                                onClick={handleClose}
                                aria-label="Close welcome modal"
                                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {content.title}
                            </h2>
                            {userName && (
                                <p className="text-gray-600 mb-6">
                                    Hi <span className="font-semibold text-blue-600">{userName}</span>! Here's what you can do:
                                </p>
                            )}

                            <div className="space-y-4 mb-6">
                                {content.features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.1 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                                            <feature.icon className="w-5 h-5" />
                                        </div>
                                        <p className="text-gray-700 pt-2">{feature.text}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Get Started
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
