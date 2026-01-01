import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, ArrowLeft, ArrowRight, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const contentType = res.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }

            if (!res.ok) {
                if (data.errors && Array.isArray(data.errors)) {
                    const errMsg = data.errors.map((err: { msg: string }) => err.msg).join(', ');
                    throw new Error(errMsg);
                }
                throw new Error(data.error || 'Authentication failed');
            }

            sessionStorage.setItem('admin_authenticated', 'true');
            sessionStorage.setItem('admin_login_time', new Date().toISOString());
            sessionStorage.setItem('admin_token', data.token);

            toast.success('Admin access granted', {
                description: 'Welcome to System Administration'
            });

            setTimeout(() => {
                navigate('/admin-portal');
            }, 500);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Authentication failed', {
                description: 'Access denied. Please contact system administrator.',
                duration: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full relative flex flex-col items-center justify-center p-6 lg:p-12 min-h-screen bg-[#020617] overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[5%] w-[35%] h-[35%] bg-red-900/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/50 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all hover:scale-110 shadow-2xl z-50 group"
                title="Return to Site Home"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Warning Top Bar */}
            <motion.div
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 h-1 bg-red-600/50 z-50 overflow-hidden"
            >
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-1/3 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[420px] z-10"
            >
                <div className="glass rounded-[2rem] p-6 md:p-10 border border-red-500/10 shadow-3xl relative overflow-hidden backdrop-blur-2xl bg-white/[0.01]">
                    {/* Header */}
                    <div className="text-center mb-8 relative">
                        <motion.div
                            initial={{ rotateY: 180, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-600/10 mb-5 border border-red-600/20 shadow-inner group/logo"
                        >
                            <Shield className="w-10 h-10 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] group-hover/logo:scale-110 transition-transform" />
                        </motion.div>
                        <h1 className="text-3xl md:text-3xl font-black tracking-tight mb-2 text-white">
                            Admin <span className="text-red-500">Login</span>
                        </h1>
                        <p className="text-[13px] text-white/40 font-medium tracking-wide flex items-center justify-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500/60" />
                            Secure Management Portal
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Username</label>
                            <div className="relative group/input">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                                    placeholder="Enter username"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-red-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Security Notice Upgrade */}
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 relative overflow-hidden group/notice pt-3">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" />
                            <div className="flex gap-3">
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse mt-0.5" />
                                <div>
                                    <p className="text-[9px] text-red-400 font-black uppercase tracking-[0.2em] mb-0.5">Security Notice</p>
                                    <p className="text-[11px] text-white/30 font-medium leading-relaxed">
                                        All activity on this portal is being logged. Unauthorized access is strictly prohibited.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-800 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:shadow-[0_15px_40px_rgba(220,38,38,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group h-14 text-xs"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    LOGIN AS ADMIN
                                    <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
                        <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] text-center">
                            CertChain Security Core v2.0
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
                        >
                            <ArrowLeft className="w-3 h-3" /> Go Back
                        </button>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-10 text-center"
                >
                    <p className="text-[9px] text-red-500/20 uppercase tracking-[0.8em] font-black">
                        BIOMETRIC OVERRIDE DISENGAGED
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
