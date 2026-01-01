import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

export default function SetPassword() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.password) return toast.error('Password is required');
        if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
        if (!isPasswordValid) return toast.error('Password does not meet security requirements');

        setLoading(true);
        try {
            const res = await fetch('/auth/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ password: formData.password }),
                credentials: 'include'
            });

            const contentType = res.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }

            if (!res.ok) throw new Error(data.error || 'Failed to set password');

            toast.success('Password set successfully!');

            const meRes = await fetch('/auth/me', {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (meRes.ok) {
                const meContentType = meRes.headers.get('content-type');
                if (meContentType && meContentType.includes('application/json')) {
                    const meData = await meRes.json();
                    const user = meData.user;
                    let target = '/student';
                    if (user?.role === 'employer') target = '/employer';
                    else if (user?.role === 'admin' || user?.role === 'registrar') target = '/registrar';
                    navigate(target, { replace: true });
                } else {
                    navigate('/login');
                }
            } else {
                navigate('/login');
            }

        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center justify-center p-6 lg:p-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="glass rounded-[2rem] p-8 md:p-10 border border-primary/20 shadow-glow relative">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                            <KeyRound className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight mb-2">
                            Set Your Password
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Secure your account by setting a password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Min 6 characters"
                                        className="w-full pl-11 pr-4 py-3 bg-secondary/30 border border-white/5 rounded-2xl focus:border-primary/50 outline-none transition-all text-sm"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                                <PasswordStrengthIndicator
                                    password={formData.password}
                                    onValidationChange={setIsPasswordValid}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Re-type password"
                                        className="w-full pl-11 pr-4 py-3 bg-secondary/30 border border-white/5 rounded-2xl focus:border-primary/50 outline-none transition-all text-sm"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 px-6 gradient-primary text-primary-foreground font-bold rounded-2xl shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : null}
                            Set Password <ArrowRight className="h-5 w-5" />
                        </button>
                    </form>

                </div>
            </motion.div>
        </div>
    );
}
