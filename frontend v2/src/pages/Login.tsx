import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, GraduationCap, Briefcase, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'employer' | 'registrar'>('student');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.isVerified) {
            const userRole = data.user.role?.toLowerCase();
            let target = '/';
            if (userRole === 'student') target = '/student';
            else if (userRole === 'employer') target = '/employer';
            else if (userRole === 'registrar') target = '/registrar';
            else if (userRole === 'admin') {
              sessionStorage.setItem('admin_authenticated', 'true');
              sessionStorage.setItem('admin_login_time', new Date().toISOString());
              target = '/admin-portal';
            }
            navigate(target, { replace: true });
          }
        }
      } catch (err) {
        // Not logged in
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');

    setLoading(true);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        credentials: 'include',
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response. This usually means the backend URL is wrong or the service is down. Response start: ${text.substring(0, 500)}`);
      }

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errMsg = data.errors.map((err: { msg: string }) => err.msg).join(', ');
          throw new Error(errMsg);
        }
        throw new Error(data.error || data.message || 'Login failed');
      }



      const userRole = data.user?.role?.toLowerCase();
      if (!userRole) {
        throw new Error('Authentication Error: User profile data is missing or corrupted.');
      }

      let target = '/';
      if (userRole === 'student') target = '/student';
      else if (userRole === 'employer') target = '/employer';
      else if (userRole === 'registrar') target = '/registrar';
      else if (userRole === 'admin') {
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_login_time', new Date().toISOString());
        target = '/admin-portal';
      }

      toast.success(`Welcome back to CertChain!`);
      setTimeout(() => {
        navigate(target, { replace: true });
      }, 500);

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const sendGoogleTokenToBackend = async (idToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ idToken, role }),
        credentials: 'include',
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response. This usually means the backend URL is wrong or the service is down. Response start: ${text.substring(0, 500)}`);
      }

      if (!res.ok) throw new Error(data.error || 'Google login failed');

      toast.success('Google Authentication Successful');

      if (data.user?.requiresPasswordSet) {
        navigate('/set-password', { replace: true });
        return;
      }

      const userRole = data.user?.role?.toLowerCase();
      if (!userRole) {
        throw new Error('Authentication Error: User profile data is missing or corrupted.');
      }

      let target = '/';
      if (userRole === 'student') target = '/student';
      else if (userRole === 'employer') target = '/employer';
      else if (userRole === 'admin' || userRole === 'registrar') target = '/registrar';

      setTimeout(() => {
        navigate(target, { replace: true });
      }, 500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col items-center justify-center p-6 lg:p-12 min-h-screen bg-[#020617] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/60 hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all hover:scale-110 shadow-2xl z-50 group"
        title="Return Home"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="glass rounded-[2rem] p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-2xl bg-white/[0.02]">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5 border border-primary/20 shadow-inner"
            >
              <ShieldCheck className="w-8 h-8 text-primary drop-shadow-glow" />
            </motion.div>
            <h1 className="text-3xl md:text-3xl font-black tracking-tight mb-2 text-white">
              Login to <span className="gradient-text">CertChain</span>
            </h1>
            <p className="text-[13px] text-white/40 font-medium tracking-wide">
              Securely access your <span className="text-primary italic">Certificates & Profile</span>.
            </p>
          </div>

          {/* Role Selector Upgrade */}
          <div className="flex gap-2 mb-8 p-1.5 bg-white/[0.03] rounded-2xl border border-white/5 backdrop-blur-sm">
            {[
              { id: 'student', icon: GraduationCap, label: 'Student' },
              { id: 'employer', icon: Briefcase, label: 'Employer' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as 'student' | 'employer' | 'registrar')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-[9px] ${role === r.id
                  ? 'bg-primary text-primary-foreground shadow-glow scale-[1.02]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                  }`}
              >
                <r.icon className={`w-3.5 h-3.5 ${role === r.id ? 'animate-pulse' : ''}`} />
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" title="Recover Password" className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 gradient-primary text-primary-foreground font-black uppercase tracking-[0.2em] rounded-xl shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group mt-2 h-14 text-xs"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  SIGN IN
                  <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.4em] font-black">
              <span className="bg-[#0a0f18]/80 backdrop-blur-md px-3 text-white/10">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-[240px] opacity-80 hover:opacity-100 transition-opacity">
              <GoogleLogin
                onSuccess={credentialResponse => {
                  if (credentialResponse.credential) {
                    sendGoogleTokenToBackend(credentialResponse.credential);
                  }
                }}
                onError={() => toast.error('Google Login Failed')}
                theme="filled_black"
                shape="pill"
                text="continue_with"
                size="large"
                width="100%"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Need an account?</span>
            <Link to="/signup" className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest">
              Create Account
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-[9px] text-white/10 uppercase tracking-[0.6em] font-black flex items-center justify-center gap-3">
            <span className="w-6 h-px bg-white/5" />
            SECURE ACCESS
            <span className="w-6 h-px bg-white/5" />
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
