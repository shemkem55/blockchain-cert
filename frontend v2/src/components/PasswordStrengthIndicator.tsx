import React, { useState, useEffect } from 'react';
import { Check, X, Shield, ShieldAlert, ShieldCheck, ShieldEllipsis } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PasswordStrengthIndicatorProps {
    password: string;
    onValidationChange?: (isValid: boolean) => void;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
    password,
    onValidationChange
}) => {
    const [strength, setStrength] = useState({
        score: 0,
        label: 'None',
        color: 'bg-muted',
        checks: {
            length: false,
            upper: false,
            lower: false,
            number: false,
            special: false
        }
    });

    useEffect(() => {
        const checks = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
        };

        let score = 0;
        if (checks.length) score += 20;
        if (checks.upper) score += 20;
        if (checks.lower) score += 20;
        if (checks.number) score += 20;
        if (checks.special) score += 20;

        const isValid = score === 100;
        if (onValidationChange) onValidationChange(isValid);

        let label = 'Very Weak';
        let color = 'bg-red-500';

        if (score >= 100) {
            label = 'Strong';
            color = 'bg-green-500';
        } else if (score >= 60) {
            label = 'Moderate';
            color = 'bg-yellow-500';
        } else if (score >= 20) {
            label = 'Weak';
            color = 'bg-orange-500';
        }

        setStrength({ score, label, color, checks });
    }, [password, onValidationChange]);

    const CheckItem = ({ label, met }: { label: string; met: boolean }) => (
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            {met ? (
                <Check className="w-3 h-3 text-green-500" />
            ) : (
                <X className="w-3 h-3 text-red-500/50" />
            )}
            <span className={cn(met ? "text-foreground" : "text-muted-foreground/50")}>
                {label}
            </span>
        </div>
    );

    if (!password) return null;

    return (
        <div className="mt-3 p-4 bg-secondary/30 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {strength.score >= 80 ? (
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                    ) : strength.score >= 40 ? (
                        <ShieldEllipsis className="w-4 h-4 text-yellow-500" />
                    ) : (
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        Security Level: <span className={cn("ml-1", strength.score >= 80 ? "text-green-500" : strength.score >= 40 ? "text-yellow-500" : "text-red-500")}>{strength.label}</span>
                    </span>
                </div>
                <span className="text-[10px] font-black text-muted-foreground">{strength.score}%</span>
            </div>

            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div
                    className={cn("h-full transition-all duration-500 ease-out", strength.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${strength.score}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <CheckItem label="8+ Characters" met={strength.checks.length} />
                <CheckItem label="Uppercase (A-Z)" met={strength.checks.upper} />
                <CheckItem label="Lowercase (a-z)" met={strength.checks.lower} />
                <CheckItem label="Number (0-9)" met={strength.checks.number} />
                <CheckItem label="Special Character" met={strength.checks.special} />
            </div>

            {strength.score < 100 && (
                <p className="mt-3 text-[9px] font-bold text-muted-foreground/70 italic border-t border-white/5 pt-2">
                    Encryption required: Complete all checks to initialize account.
                </p>
            )}
        </div>
    );
};
