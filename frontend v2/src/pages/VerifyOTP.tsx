
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

const VerifyOTP = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            toast.error("No email provided for verification.");
            navigate('/login');
        }
    }, [email, navigate]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, otp }),
                credentials: 'include',
            });

            const contentType = res.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }

            if (res.ok) {
                toast.success(data.message || "Verification successful!");

                // Role-based redirection logic
                const userRole = data.user?.role?.toLowerCase();
                if (userRole) {
                    // Critical: Set admin session storage if admin
                    if (userRole === 'admin') {
                        sessionStorage.setItem('admin_authenticated', 'true');
                        sessionStorage.setItem('admin_login_time', new Date().toISOString());
                        if (data.accessToken) sessionStorage.setItem('admin_token', data.accessToken);
                    }

                    let target = '/';
                    if (userRole === 'student') target = '/student';
                    else if (userRole === 'employer') target = '/employer';
                    else if (userRole === 'registrar') target = '/registrar';
                    else if (userRole === 'admin') target = '/admin-portal';

                    // Added a tiny delay to ensure cookies are persisted before navigation
                    setTimeout(() => {
                        navigate(target, { replace: true });
                    }, 500);
                } else {
                    navigate('/login');
                }
            } else {
                toast.error(data.error || "Verification failed");
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to verify OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        try {
            const res = await fetch('/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const contentType = res.headers.get('content-type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }

            if (res.ok) {
                toast.success("OTP resent to your email.");
                if (data.devOtp) toast.info(`DEV OTP: ${data.devOtp}`);
            } else {
                toast.error(data.error || "Failed to resend OTP");
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Network error");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-background z-0" />

            <div className="glass w-full max-w-md p-8 rounded-[2rem] border border-white/10 shadow-glow relative z-10">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 shadow-glow">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Security Verification</h1>
                    <p className="text-muted-foreground text-sm font-bold">
                        Enter the verification code sent to <br /> <span className="text-primary">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-primary ml-1">One-Time Password</label>
                        <Input
                            type="text"
                            placeholder="------"
                            className="bg-black/20 border-white/10 h-14 text-center text-2xl font-mono tracking-[1em] rounded-xl focus:ring-primary/50"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                        />
                    </div>

                    <Button className="w-full h-14 gradient-primary rounded-xl font-black uppercase tracking-widest shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Identity"}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 uppercase tracking-wider"
                    >
                        {resendLoading ? "Sending..." : "Resend Code"}
                    </button>

                    <div className="mt-6 pt-6 border-t border-white/5">
                        <button onClick={() => navigate('/login')} className="text-xs text-muted-foreground hover:text-foreground transition-colors font-bold">
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
