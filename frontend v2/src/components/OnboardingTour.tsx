import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    X,
    ArrowRight,
    ArrowLeft,
    Shield,
    Upload,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
    title: string;
    description: string;
    icon: React.ReactNode;
    highlight?: string;
}

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const steps: OnboardingStep[] = [
    {
        title: 'Welcome to Your Digital Vault',
        description: 'Store, verify, and share your academic credentials securely on the blockchain. Your certificates are cryptographically anchored and tamper-proof.',
        icon: <Sparkles className="h-8 w-8" />,
        highlight: '#identity-verification-center'
    },
    {
        title: 'Upload Your Certificate',
        description: 'Drag and drop your degree certificate or click to browse. We support PDF and image formats. Our AI will automatically extract the Certificate ID.',
        icon: <Upload className="h-8 w-8" />,
        highlight: '#cert-upload-v5'
    },
    {
        title: 'Instant Blockchain Verification',
        description: 'Click "Verify Now" to check your certificate against our immutable blockchain ledger. Get detailed verification findings in seconds.',
        icon: <Shield className="h-8 w-8" />,
        highlight: '#verify-button'
    },
    {
        title: 'Download Verification Reports',
        description: 'Generate professional PDF verification reports to share with employers. Each report includes blockchain proof and transaction hashes.',
        icon: <CheckCircle2 className="h-8 w-8" />,
    }
];

export const OnboardingTour = ({ isOpen, onClose, onComplete }: OnboardingTourProps) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
            onClose();
            localStorage.setItem('onboarding_completed', 'true');
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('onboarding_completed', 'true');
        onClose();
    };

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
                    >
                        <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-white/10 shadow-2xl overflow-hidden">
                            <CardContent className="p-0">
                                {/* Progress Bar */}
                                <div className="px-8 pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            Step {currentStep + 1} of {steps.length}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSkip}
                                            className="text-xs"
                                        >
                                            Skip Tour
                                        </Button>
                                    </div>
                                    <Progress value={progress} className="h-1" />
                                </div>

                                {/* Content */}
                                <div className="p-8 min-h-[320px] flex flex-col justify-center">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                {step.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-black mb-2">{step.title}</h2>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Visual Indicator */}
                                        <div className="relative h-40 rounded-2xl bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-white/10 overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-6xl opacity-10">
                                                    {step.icon}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Navigation */}
                                <div className="px-8 pb-8 flex items-center justify-between gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={currentStep === 0}
                                        className="rounded-xl"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Previous
                                    </Button>

                                    <div className="flex gap-2">
                                        {steps.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "h-2 w-2 rounded-full transition-all",
                                                    idx === currentStep
                                                        ? "bg-primary w-6"
                                                        : "bg-white/20"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <Button
                                        onClick={handleNext}
                                        className="rounded-xl gradient-primary"
                                    >
                                        {currentStep === steps.length - 1 ? (
                                            <>
                                                Get Started
                                                <CheckCircle2 className="h-4 w-4 ml-2" />
                                            </>
                                        ) : (
                                            <>
                                                Next
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
