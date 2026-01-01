import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Loader2, Building2, Wallet, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import { motion, AnimatePresence } from 'framer-motion';

type RegistrationRole = 'student' | 'employer' | 'registrar';

export default function RegistrarLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');

    setLoading(true);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password, role: 'registrar' }),
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

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errMsg = data.errors.map((err: { msg: string }) => err.msg).join(', ');
          throw new Error(errMsg);
        }
        throw new Error(data.error || data.message || 'Login failed');
      }



      if (!data.user || (data.user.role !== 'admin' && data.user.role !== 'employer' && data.user.role !== 'registrar')) {
        throw new Error('Access Restricted: University Registrars Only');
      }

      const userRole = data.user?.role?.toLowerCase();
      let target = '/registrar';
      if (userRole === 'admin') {
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_login_time', new Date().toISOString());
        target = '/admin-portal';
      }

      toast.success(userRole === 'admin' ? 'Admin Access Granted' : 'Registrar Access Granted');
      setTimeout(() => {
        navigate(target, { replace: true });
      }, 500);

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const { connect, isConnected, address, signer } = useWeb3();

  const handleWalletLogin = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    try {
      setLoading(true);
      const message = `Login to Blockchain Certificate System as Registrar\nTimestamp: ${Date.now()}`;
      const signature = await signer?.signMessage(message);

      const res = await fetch('/auth/wallet-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ address, signature, message }),
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

      if (!res.ok) throw new Error(data.error || 'Wallet login failed');

      toast.success('Wallet Logged In Successfully');
      navigate('/registrar', { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Wallet login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col items-center justify-center p-6 lg:p-12 min-h-screen bg-[#020617] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/60 hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all hover:scale-110 shadow-2xl z-50 group"
        title="Return to Site Home"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="glass rounded-[2rem] p-6 md:p-10 border border-white/10 shadow-3xl relative overflow-hidden backdrop-blur-2xl bg-white/[0.01]">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 mb-5 border border-indigo-500/20 shadow-inner"
            >
              <Building2 className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
            </motion.div>
            <h1 className="text-3xl md:text-3xl font-black tracking-tight mb-2 text-white">
              Uni <span className="text-indigo-400">Registrar</span>
            </h1>
            <p className="text-[13px] text-white/40 font-medium tracking-wide">
              Secure access for university <span className="text-indigo-300 italic">authorized staff</span>.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Work Email</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  placeholder="registrar@institution.edu"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Registry Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group mt-2 h-14 text-xs"
            >
              {loading && !isConnected ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  SIGN IN TO PORTAL
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
              <span className="bg-[#0a0f18]/80 backdrop-blur-md px-4 text-white/10">Or use digital wallet</span>
            </div>
          </div>

          <button
            onClick={handleWalletLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] hover:border-indigo-400/30 text-white/60 font-black py-3.5 rounded-xl transition-all border-dashed text-[9px] tracking-widest uppercase group/wallet"
          >
            {loading && isConnected ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Wallet className="h-4 w-4 group-hover/wallet:text-indigo-400 transition-colors" />
            )}
            {isConnected ? 'Sign in with Wallet' : 'Connect Web3 Wallet'}
          </button>

          <div className="mt-8 flex items-center justify-center gap-5 opacity-20">
            <div className="flex flex-col items-center">
              <div className="w-1 h-1 rounded-full bg-white mb-1" />
              <span className="text-[7px] font-black tracking-widest uppercase">SSL Encrypted</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-1 h-1 rounded-full bg-green-500 mb-1" />
              <span className="text-[7px] font-black tracking-widest uppercase text-green-500/80">Network Active</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] text-indigo-400/30 uppercase tracking-[0.6em] font-black">
          🛡️ Secure Higher Education Network
        </p>
      </motion.div>
    </div>
  );
}
