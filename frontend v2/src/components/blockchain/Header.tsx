import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NetworkStatus } from './NetworkStatus';
import { WalletButton } from './WalletButton';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Search, FilePlus, User, LogOut, Award, Shield, Building2, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface User {
  role?: string;
}

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user in header', err);
      }
    };
    fetchUser();
  }, [location.pathname]);

  const handleLogout = async () => {
    const role = user?.role?.toLowerCase();
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });

      // Clear admin session storage if needed
      if (role === 'admin') {
        sessionStorage.removeItem('admin_authenticated');
        sessionStorage.removeItem('admin_login_time');
      }

      setUser(null);

      if (role === 'admin') {
        navigate('/admin-login');
      } else if (role === 'registrar') {
        navigate('/registrar-login');
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Logout failed', err);
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/verify', label: 'Verify', icon: Search },
    { path: '/#contact', label: 'Contact', icon: Mail },
  ];

  const userRole = user?.role?.toLowerCase();

  if (userRole === 'student') {
    navItems.push({ path: '/student', label: 'My Portal', icon: User });
  } else if (userRole === 'admin' || userRole === 'registrar') {
    navItems.push({ path: '/registrar', label: 'Registrar Portal', icon: Award });
    if (userRole === 'admin') {
      navItems.push({ path: '/admin-portal', label: 'Admin Panel', icon: Shield });
    }
  } else if (userRole === 'employer') {
    navItems.push({ path: '/employer', label: 'Employer Portal', icon: Building2 });
  }

  const isAuthPage = ['/login', '/signup', '/'].includes(location.pathname);
  const showLogout = !isAuthPage || location.pathname.startsWith('/student') || location.pathname.startsWith('/employer');

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "w-full z-50 transition-all duration-300",
          location.pathname === '/'
            ? "absolute top-0 left-0 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-12"
            : "sticky top-0 border-b border-border/20 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/40"
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-12">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="relative p-2.5 rounded-xl gradient-primary shadow-2xl ring-1 ring-white/10"
                  >
                    <Shield className="h-6 w-6 text-primary-foreground" />
                  </motion.div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-white tracking-tighter drop-shadow-md group-hover:text-primary transition-colors duration-300">
                    CERTCHAIN
                  </span>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                {navItems.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      'relative px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                      location.pathname === path
                        ? 'text-white bg-primary shadow-lg shadow-primary/25'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-4">
                <NetworkStatus />
              </div>

              {showLogout ? (
                <Button
                  variant="ghost"
                  className="text-xs font-black uppercase tracking-widest text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-full px-6 h-10 border border-transparent hover:border-red-500/20 transition-all"
                  onClick={handleLogout}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  className="h-10 px-6 rounded-full gradient-primary text-primary-foreground font-black uppercase tracking-[0.15em] text-[10px] shadow-glow hover:scale-105 hover:shadow-primary/40 transition-all duration-300"
                  onClick={() => navigate('/signup')}
                >
                  Get Verified
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
};
