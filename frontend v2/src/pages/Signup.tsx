import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, GraduationCap, Briefcase, Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    role: 'student' as 'student' | 'employer'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleSelect = (role: 'student' | 'employer') => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return toast.error('Please fill in all fields');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    if (!isPasswordValid) return toast.error('Password does not meet security requirements');

    setLoading(true);
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          organizationName: formData.role === 'employer' ? formData.organizationName : undefined
        }),
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
        throw new Error(data.error || data.message || 'Registration failed');
      }

      toast.success('Account created! Logging you in...');

      const userRole = data.user?.role?.toLowerCase();
      let target = '/';
      if (userRole === 'student') target = '/student';
      else if (userRole === 'employer') target = '/employer';

      setTimeout(() => {
        navigate(target, { replace: true });
      }, 1000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
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
        body: JSON.stringify({ idToken, role: formData.role }),
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

      if (!res.ok) throw new Error(data.error || 'Google signup failed');

      toast.success('Google Authentication Successful');

      const userRole = data.user?.role?.toLowerCase();

      if (data.user?.requiresPasswordSet) {
        navigate('/set-password', { replace: true });
        return;
      }

      let target = userRole === 'student' ? '/student' : '/employer';
      if (userRole === 'admin') target = '/registrar';

      navigate(target, { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto min-h-screen bg-[#020617] overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-5%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <button
        onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
        className="absolute top-8 left-8 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/50 hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all hover:scale-110 shadow-3xl z-50 group"
        title="Back"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[500px] z-10 py-8"
      >
        <div className="glass rounded-[2rem] p-6 md:p-10 border border-white/10 shadow-3xl relative overflow-hidden backdrop-blur-2xl bg-white/[0.01]">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 mb-5 shadow-glow"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">New Registration</span>
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-white">
              Create <span className="gradient-text">Account</span>
            </h1>
            <p className="text-[13px] text-white/40 font-medium tracking-wide">
              Set up your <span className="text-primary italic">digital academic identity</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Upgrade */}
            <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner mb-6">
              {[
                { id: 'student', icon: GraduationCap, label: 'Student' },
                { id: 'employer', icon: Briefcase, label: 'Employer' }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id as 'student' | 'employer')}
                  className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-[8px] ${formData.role === r.id
                    ? 'bg-primary text-primary-foreground shadow-glow scale-[1.02]'
                    : 'text-white/20 hover:text-white/60 hover:bg-white/[0.05]'
                    }`}
                >
                  <r.icon className={`w-4 h-4 mb-1 ${formData.role === r.id ? 'animate-bounce' : ''}`} />
                  {r.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Full Name</label>
                <div className="relative group/input">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:border-primary/50 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Email Address</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                  <input
                    type="email"
                    name="email"
                    placeholder="mail@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:border-primary/50 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {formData.role === 'employer' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Organization Name</label>
                  <div className="relative group/input">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                    <input
                      type="text"
                      name="organizationName"
                      placeholder="Enter organization name"
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:border-primary/50 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                      value={formData.organizationName}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Create Password</label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Min 6 characters"
                    className="w-full pl-11 pr-11 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:border-primary/50 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                <PasswordStrengthIndicator
                  password={formData.password}
                  onValidationChange={setIsPasswordValid}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">Confirm Password</label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/20 group-focus-within/input:text-primary transition-colors" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Re-type password"
                    className="w-full pl-11 pr-11 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:border-primary/50 outline-none transition-all text-white text-sm font-medium placeholder:text-white/10"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
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
                  CREATE ACCOUNT
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
              <span className="bg-[#0a0f18]/80 backdrop-blur-md px-3 text-white/10">Or register with</span>
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
                onError={() => toast.error('Google Signup Failed')}
                theme="filled_black"
                shape="pill"
                text="signup_with"
                size="large"
                width="100%"
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-3">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Already have an account?</span>
            <Link to="/login" className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest underline decoration-[2px] underline-offset-4 decoration-primary/30">
              Log In
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6 opacity-30">
          <div className="flex items-center gap-8">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div className="w-px h-10 bg-white/20" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-left leading-relaxed max-w-[220px]">
              SOC-II COMPLIANT INFRASTRUCTURE • AES-256 END-TO-END QUANTUM ENCRYPTION
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
