import { Link } from 'react-router-dom';
import { Shield, Mail, Github, Linkedin, Twitter } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-transparent backdrop-blur-md">
      {/* Government Disclaimer */}
      <div className="bg-gradient-to-r from-red-900/20 via-green-900/20 to-red-900/20 border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-foreground/80 leading-relaxed">
              <p className="font-black text-primary uppercase tracking-wider mb-2">OFFICIAL GOVERNMENT NOTICE</p>
              <p>
                This is an official Government of Kenya digital credential verification system. All certificates issued through this platform are
                legally binding and recognized by the Republic of Kenya Ministry of Education and affiliated institutions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg gradient-primary">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-xl font-black gradient-text tracking-tighter block">CERTCHAIN KENYA</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Government Digital Platform</span>
                </div>
              </div>
            </div>
            <p className="text-xs font-bold text-foreground/70 leading-relaxed">
              Official blockchain-based credential verification system for the Republic of Kenya.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/verify" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  Verify Credentials
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link to="/registrar" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  Institutional Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Legal & Compliance</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  Data Protection Act
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                  Helpdesk
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Contact</h3>
            <div className="space-y-3 text-sm font-bold text-muted-foreground">
              <p>Ministry of Education</p>
              <p>Jogoo House, Harambee Ave</p>
              <p>Nairobi, Kenya</p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@certchain.go.ke" className="hover:text-primary transition-colors">
                  info@certchain.go.ke
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Flag Stripe */}
        <div className="w-full h-1 flex mb-8">
          <div className="flex-1 bg-black"></div>
          <div className="flex-1 bg-red-700"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-green-700"></div>
          <div className="flex-1 bg-black"></div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs font-black text-muted-foreground tracking-widest uppercase mb-1">
                © {currentYear} GOVERNMENT OF KENYA • MINISTRY OF EDUCATION
              </p>
              <p className="text-[10px] font-bold text-muted-foreground/60">
                Secured by Blockchain Technology • WCAG 2.1 AA Compliant
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">PRIVACY</Link>
              <Link to="/security-policy" className="hover:text-primary transition-colors">SECURITY</Link>
              <Link to="/terms-of-service" className="hover:text-primary transition-colors">TERMS</Link>
              <Link to="/cookie-policy" className="hover:text-primary transition-colors">COOKIES</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
