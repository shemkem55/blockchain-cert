import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, CheckCircle, GraduationCap, Quote, HelpCircle, Mail, ArrowRight, Phone, MapPin, User, Globe, Lock, Cpu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { NewsUpdatesSection } from '@/components/NewsUpdatesSection';
import { QuickLinksSection } from '@/components/QuickLinksSection';

const Index = () => {
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elem = document.getElementById(location.hash.substring(1));
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (!mounted) return;
        if (!res.ok) return;
        const data = await res.json();
        const role = data?.user?.role?.toLowerCase();
        const isVerified = data?.user?.isVerified;
        // Only redirect to portal if the user's email is verified
        if (isVerified) {
          if (role === 'student') navigate('/student');
          else if (role === 'admin' || role === 'registrar') navigate('/registrar');
          else if (role === 'employer') navigate('/employer');
        }
      } catch (err) {
        // silently ignore - user not logged in
      }
    };

    check();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <>
      {/* Dynamic Background Elements */}
      <div className="hidden" />

      <AnnouncementBanner />

      <div>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-32 pt-48 text-center lg:py-48 relative overflow-hidden">
          <h1 className="text-5xl font-black tracking-tighter lg:text-8xl mb-8 leading-[1.1]">
            The Future of <span className="gradient-text drop-shadow-[0_0_30px_rgba(186,32,38,0.5)]">Digital Trust</span>
          </h1>
          <p className="mx-auto max-w-3xl text-xl font-bold text-foreground/80 mb-12 leading-relaxed">
            CertChain leverages <span className="text-primary italic font-black">immutable blockchain</span> technology to issue verifiable, tamper-proof credentials. The new global standard for modern academic validation.
          </p>
          <div className="flex justify-center gap-8 flex-col sm:flex-row items-center">
            <button
              onClick={() => navigate('/verify')}
              className="inline-flex h-14 items-center justify-center rounded-2xl gradient-primary px-10 text-lg font-black uppercase tracking-widest text-primary-foreground shadow-glow transition-all hover:scale-110 active:scale-95 group"
            >
              Verify Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex h-14 items-center justify-center rounded-2xl border-2 border-primary/30 bg-background/50 backdrop-blur-md px-10 text-lg font-black uppercase tracking-widest text-foreground shadow-xl transition-all hover:bg-primary/10 hover:border-primary/60 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </section>

        {/* TRUSTED BY / PARTNERS */}
        <section className="py-14 border-y border-white/10 bg-white/5 backdrop-blur-md">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-8 drop-shadow-sm">Trusted by Leading Digital Entities</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24 opacity-80 transition-all hover:opacity-100">
              <div className="flex items-center gap-3 font-black text-2xl tracking-tighter hover:text-primary transition-colors cursor-default"><GraduationCap className="w-8 h-8 text-primary" /> UNIVERSITY OF NAIROBI</div>
              <div className="flex items-center gap-3 font-black text-2xl tracking-tighter hover:text-primary transition-colors cursor-default"><ShieldCheck className="w-8 h-8 text-primary" /> STRATHMORE</div>
              <div className="flex items-center gap-3 font-black text-2xl tracking-tighter hover:text-primary transition-colors cursor-default"><CheckCircle className="w-8 h-8 text-primary" /> KENYATTA UNI</div>
              <div className="flex items-center gap-3 font-black text-2xl tracking-tighter hover:text-primary transition-colors cursor-default"><GraduationCap className="w-8 h-8 text-primary" /> JKUAT ACADEMY</div>
            </div>
          </div>
        </section>


        {/* Feature Grid */}
        <section className="container mx-auto px-4 py-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 gradient-text uppercase tracking-tighter">Why Choose CertChain?</h2>
            <div className="w-24 h-1.5 gradient-primary mx-auto rounded-full" />
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            <div className="glass p-10 rounded-3xl border-2 border-primary/10 hover:border-primary/50 transition-all group hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 shadow-glow">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Tamper Proof</h3>
              <p className="text-foreground/70 font-bold leading-relaxed">
                Records are cryptographically secured on a public blockchain. Once issued, a certificate allows
                immutable proof of ownership that cannot be forged or altered.
              </p>
            </div>
            <div className="glass p-10 rounded-3xl border-2 border-primary/10 hover:border-primary/50 transition-all group hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 shadow-glow">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Instant Audit</h3>
              <p className="text-foreground/70 font-bold leading-relaxed">
                Verify credentials in milliseconds. Zero-day background checks for employers. Just scan or input the ID for absolute certainty.
              </p>
            </div>
            <div className="glass p-10 rounded-3xl border-2 border-primary/10 hover:border-primary/50 transition-all group hover:-translate-y-2">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 shadow-glow">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">Student Sovereignty</h3>
              <p className="text-foreground/70 font-bold leading-relaxed">
                Students receive Soulbound Tokens directly. They own their achievements forever, independent of any central authority.
              </p>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION - THE NEW STANDARD */}
        <section className="container mx-auto px-4 py-32 bg-primary/5 rounded-[4rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[150px] -z-10" />
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 uppercase tracking-tighter">The New Evolution</h2>
            <p className="text-foreground/70 font-bold max-w-2xl mx-auto">Stop living in the past. Compare the old legacy systems with the CertChain Protocol.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="glass p-10 rounded-3xl border-red-500/20 bg-red-500/5 opacity-100">
              <h3 className="text-2xl font-black mb-8 text-red-500 uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-px bg-red-500" /> Legacy Systems
              </h3>
              <ul className="space-y-6">
                {[
                  "Weeks of manual university verification",
                  "Paper-based certificates easily forged",
                  "High administrative & mailing costs",
                  "Data siloed in disconnected databases",
                  "Prone to human error & loss"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 font-bold text-foreground/50">
                    <div className="w-5 h-5 rounded-full border border-red-500/50 flex items-center justify-center text-[10px] text-red-500">✕</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass p-10 rounded-3xl border-primary/40 bg-primary/5 shadow-glow relative scale-105">
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">Recommended</div>
              <h3 className="text-2xl font-black mb-8 text-primary uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-px bg-primary" /> CertChain Protocol
              </h3>
              <ul className="space-y-6">
                {[
                  "Instant, millisecond on-chain audit",
                  "Cryptographically immutable & secured",
                  "Zero cost for student distribution",
                  "Global decentralized interoperability",
                  "Permanent, self-sovereign ownership"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 font-bold text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground">✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* NEWS & UPDATES SECTION */}
        <NewsUpdatesSection />

        {/* USE CASES - SECTOR SOLUTIONS */}
        <section className="container mx-auto px-4 py-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl lg:text-5xl font-black mb-6 uppercase tracking-tighter">One Protocol.<br /><span className="text-primary italic">Infinite Applications.</span></h2>
              <p className="text-foreground/70 font-bold">CertChain isn't just for universities. Our decentralized ledger provides a foundation for trust across every industry.</p>
            </div>
            <div className="hidden md:block">
              <div className="px-6 py-3 border border-primary/30 rounded-full text-primary font-black text-xs uppercase tracking-widest animate-pulse">Scanning Ecosystem...</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Academic Degrees",
                desc: "Immutable degrees and transcripts for higher education institutions.",
                icon: GraduationCap,
                tag: "Higher Ed"
              },
              {
                title: "Skill Badges",
                desc: "Micro-credentials for corporate training and skill-based platforms.",
                icon: CheckCircle,
                tag: "Enterprise"
              },
              {
                title: "Medical Licenses",
                desc: "Verified practicing licenses for healthcare professionals and boards.",
                icon: ShieldCheck,
                tag: "Government"
              },
              {
                title: "Legal Identity",
                desc: "Soulbound identity documents for secure decentralized validation.",
                icon: User,
                tag: "Sovereign ID"
              }
            ].map((useCase, i) => (
              <div key={i} className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/40 transition-all group cursor-default shadow-lg">
                <div className="mb-6 flex justify-between items-start">
                  <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary transition-colors">
                    <useCase.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <span className="text-[10px] font-black text-primary/40 border border-primary/20 px-3 py-1 rounded-full">{useCase.tag}</span>
                </div>
                <h3 className="text-xl font-black mb-3 uppercase tracking-tight group-hover:text-primary transition-colors">{useCase.title}</h3>
                <p className="text-sm font-bold text-foreground/60 leading-relaxed">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        {/* HOW IT WORKS - THE LIFECYCLE OF TRUST */}
        <section className="py-40 bg-slate-950/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full paper-texture opacity-10 pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-24">
              <h2 className="text-4xl lg:text-5xl font-black mb-6 uppercase tracking-tighter">The Lifecycle of Trust</h2>
              <div className="w-24 h-1.5 gradient-primary mx-auto rounded-full" />
            </div>

            <div className="grid lg:grid-cols-3 gap-16">
              {[
                {
                  step: "01",
                  title: "DECENTRALIZED MINTING",
                  desc: "Institutions cryptographically sign credentials, anchoring them to the Ethereum Layer 2 ledger as unique Soulbound Tokens.",
                  icon: Cpu
                },
                {
                  step: "02",
                  title: "SOVEREIGN POSSESSION",
                  desc: "Students receive permanent ownership of their achievements. No central authority can revoke or alter the recorded history.",
                  icon: Lock
                },
                {
                  step: "03",
                  title: "INSTANT VALIDATION",
                  desc: "Employers query the public ledger to verify authenticity in milliseconds, eliminating weeks of background check latency.",
                  icon: ShieldCheck
                }
              ].map((s, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -top-16 left-0 text-[12rem] font-black text-primary/5 select-none leading-none group-hover:text-primary/10 transition-colors">
                    {s.step}
                  </div>
                  <div className="relative pt-12">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 group-hover:scale-110 transition-transform shadow-glow">
                      <s.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black mb-6 uppercase tracking-tight group-hover:text-primary transition-colors">{s.title}</h3>
                    <p className="text-foreground/60 font-bold leading-relaxed">{s.desc}</p>
                    <button
                      onClick={() => {
                        const elem = document.getElementById('faq');
                        if (elem) {
                          elem.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="mt-8 flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:gap-3 cursor-pointer"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-24 container mx-auto px-4">
          <div className="glass rounded-[3rem] p-16 border-2 border-primary/20 relative overflow-hidden shadow-glow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="grid md:grid-cols-3 gap-12 text-center relative z-10">
              <div className="space-y-2">
                <div className="text-6xl font-black gradient-text drop-shadow-[0_0_20px_rgba(180,255,255,0.2)]">10K+</div>
                <div className="text-foreground/80 font-black uppercase tracking-[0.2em] text-sm">Credentials Minted</div>
              </div>
              <div className="space-y-2">
                <div className="text-6xl font-black gradient-text drop-shadow-[0_0_20px_rgba(180,255,255,0.2)]">50+</div>
                <div className="text-foreground/80 font-black uppercase tracking-[0.2em] text-sm">Network Partners</div>
              </div>
              <div className="space-y-2">
                <div className="text-6xl font-black gradient-text drop-shadow-[0_0_20px_rgba(180,255,255,0.2)]">100%</div>
                <div className="text-foreground/80 font-black uppercase tracking-[0.2em] text-sm">On-Chain Integrity</div>
              </div>
            </div>
          </div>
        </section>

        {/* TECHNICAL FOUNDATION - GLOBAL INFRASTRUCTURE */}
        <section className="container mx-auto px-4 py-32 border-y border-white/5 relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
                Forged in <span className="text-primary italic">Cryptography.</span><br />Built for Scale.
              </h2>
              <p className="text-lg font-bold text-foreground/70 leading-relaxed">
                The CertChain Protocol isn't just a database. It's a globally distributed ledger designed to survive the next century of academic evolution.
              </p>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <h4 className="font-black text-sm uppercase tracking-widest">ZK-Security</h4>
                  </div>
                  <p className="text-xs font-bold text-foreground/50 leading-relaxed">Advanced Zero-Knowledge Proofs ensure data privacy without sacrificing verifiability.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" />
                    <h4 className="font-black text-sm uppercase tracking-widest">Global Node</h4>
                  </div>
                  <p className="text-xs font-bold text-foreground/50 leading-relaxed">Decentralized network architecture ensures 100% uptime and tamper-resistance.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-primary" />
                    <h4 className="font-black text-sm uppercase tracking-widest">Real-time Audit</h4>
                  </div>
                  <p className="text-xs font-bold text-foreground/50 leading-relaxed">Millisecond verification latency powered by high-performance Layer 2 scaling.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h4 className="font-black text-sm uppercase tracking-widest">Immutable</h4>
                  </div>
                  <p className="text-xs font-bold text-foreground/50 leading-relaxed">Records are mathematically permanent. Once minted, they cannot be deleted or changed.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse-slow" />
              <div className="glass p-1 rounded-[3rem] border-primary/20 relative">
                <div className="bg-slate-950 rounded-[2.8rem] p-10 overflow-hidden relative border border-white/5">
                  <div className="absolute top-0 left-0 w-full h-full paper-texture opacity-20 pointer-events-none" />
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-black text-primary uppercase tracking-widest">Live Chain Feed</div>
                  </div>

                  <div className="space-y-4 font-mono text-[10px] text-primary/60 leading-relaxed">
                    <p className="animate-pulse">_ EXECUTION_STARTED: [BLOCK_#827,294]</p>
                    <p className="text-foreground/40">$ initializing_verification_handshake...</p>
                    <p className="text-green-400 font-bold">$ AUTH_SUCCESS: UNIVERSITY_ID_VERIFIED</p>
                    <p>$ MINTING_SOULBOUND_TOKEN [SBT_#774...]</p>
                    <p className="text-foreground/40">$ encryption_layer_stabilized_1024_bit</p>
                    <p className="text-yellow-400 font-bold">$ BROADCASTING_TO_GLOBAL_NODES...</p>
                    <p>$ FINALIZING_PERMANENT_RECORD</p>
                    <div className="h-px bg-white/5 my-6" />
                    <div className="flex items-center justify-between">
                      <p className="text-foreground font-black tracking-widest">LATENCY: 1.2ms</p>
                      <p className="text-foreground font-black tracking-widest">SEC_LEVEL: QUANTUM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-secondary/20 py-32 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Voice of the Network</h2>
              <div className="w-16 h-1 gradient-primary mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  quote: "CertChain has revolutionized how we verify candidate credentials. It used to take weeks, now it takes seconds of pure mathematical certainty.",
                  author: "SARAH JENKINS",
                  role: "HR DIRECTOR • TECHCORP"
                },
                {
                  quote: "As a graduate, having my degree in my digital wallet feels empowering. I can prove my skills anywhere in the world instantly.",
                  author: "DAVID KAMAU",
                  role: "ALUMNI • UON"
                },
                {
                  quote: "The security and immutability of the blockchain give us peace of mind that our university's legacy is digitally protected.",
                  author: "DR. MAINA",
                  role: "REGISTRAR • STRATHMORE"
                }
              ].map((t, i) => (
                <div key={i} className="glass p-10 rounded-3xl border border-white/10 bg-card/40 relative shadow-xl hover:border-primary/40 transition-all">
                  <Quote className="absolute top-8 right-8 h-10 w-10 text-primary/10" />
                  <p className="text-foreground/80 font-bold mb-8 italic leading-relaxed">"{t.quote}"</p>
                  <div>
                    <p className="font-black text-primary tracking-widest text-sm mb-1">{t.author}</p>
                    <p className="text-[10px] font-bold text-muted-foreground tracking-[0.2em]">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container mx-auto px-4 py-32 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Protocol Intel</h2>
            <div className="w-12 h-1 gradient-primary mx-auto rounded-full mt-2" />
          </div>
          <div className="space-y-6">
            {[
              { q: "Is CertChain cryptographically secure?", a: "Yes. All data is protected by Zero-Knowledge proofs and the certificates themselves are minted on a decentralized Ethereum Layer 2 ledger." },
              { q: "Can I lose my digital diploma?", a: "No. Since it is a Soulbound Token, it is permanently linked to your decentralized identity. The record exists as long as the blockchain exists." },
              { q: "What are the institutional costs?", a: "For students, the platform is entirely free. Institutions pay a nominal network fee for large-scale minting operations." }
            ].map((faq, i) => (
              <div key={i} className="glass p-8 rounded-2xl border-2 border-white/5 bg-card/40 hover:border-primary/30 transition-all">
                <h3 className="flex items-center gap-4 font-black text-xl mb-4 tracking-tight">
                  <HelpCircle className="h-6 w-6 text-primary" /> {faq.q}
                </h3>
                <p className="text-foreground/70 font-bold ml-10 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* QUICK LINKS & RESOURCES */}
        <QuickLinksSection />

        {/* ECOSYSTEM - GLOBAL NETWORK */}
        <section className="container mx-auto px-4 py-32 text-center">
          <div className="glass p-20 rounded-[4rem] border-primary/20 relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full -z-10 animate-pulse-slow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full -z-10" />

            <Globe className="w-16 h-16 text-primary mx-auto mb-8 animate-float" />
            <h2 className="text-4xl lg:text-7xl font-black mb-8 uppercase tracking-tighter">Join the<br /><span className="gradient-text">Global Network</span></h2>
            <p className="text-xl font-bold text-foreground/70 max-w-3xl mx-auto mb-16 leading-relaxed">
              We are building the trust layer of the internet. Be part of the ecosystem that is eradicating credential fraud and empowering the next generation of global talent.
            </p>

            <div className="flex flex-wrap justify-center gap-12 opacity-40">
              <div className="flex items-center gap-3 font-black text-xl tracking-widest">ISO 27001 COMPLIANT</div>
              <div className="flex items-center gap-3 font-black text-xl tracking-widest">W3C VERIFIABLE</div>
              <div className="flex items-center gap-3 font-black text-xl tracking-widest">EBSI COMPATIBLE</div>
            </div>
          </div>
        </section>

        {/* CTA / NEWSLETTER */}
        <section className="container mx-auto px-4 py-24">
          <div className="glass rounded-[3rem] p-16 text-center border-2 border-primary/20 bg-gradient-to-b from-card/80 to-background/80 relative overflow-hidden shadow-glow">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 blur-[120px] rounded-full -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />

            <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter">Stay Synchronized</h2>
            <p className="text-foreground/80 font-bold max-w-2xl mx-auto mb-12 text-lg">
              Join 10,000+ educators and industry leaders getting the latest insights on decentralized academic credentials.
            </p>

            <div className="flex max-w-lg mx-auto gap-3">
              <Input placeholder="Enter your network email" className="h-14 bg-background/50 border-white/10 rounded-2xl font-bold px-6 focus:ring-primary/40" />
              <Button className="h-14 px-10 gradient-primary rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow">
                JOIN NOW
              </Button>
            </div>
          </div>
        </section>
        {/* CONTACT US */}
        <section className="container mx-auto px-4 py-32" id="contact">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black mb-6 uppercase tracking-tighter">Direct Uplink</h2>
              <p className="text-foreground/80 font-bold mb-10 text-xl leading-relaxed">
                Have inquiries about integration? Our protocol specialists are ready to help you architect your digital future.
              </p>

              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center shadow-glow">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-lg tracking-tight">ENCRYPTED MAIL</p>
                    <p className="text-foreground/70 font-bold">protocol@certchain.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center shadow-glow">
                    <Phone className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-lg tracking-tight">VOICE COMMS</p>
                    <p className="text-foreground/70 font-bold">+254 700 000 000</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center shadow-glow">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-lg tracking-tight">COORDINATES</p>
                    <p className="text-foreground/70 font-bold">Blockchain Hub • Nairobi, KE</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass p-10 rounded-[2.5rem] border-2 border-white/10 bg-card/40 shadow-2xl">
              <form className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Identity First</label>
                    <Input placeholder="John" className="h-14 bg-background/50 border-white/10 rounded-2xl font-bold px-6" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Identity Last</label>
                    <Input placeholder="Doe" className="h-14 bg-background/50 border-white/10 rounded-2xl font-bold px-6" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Network Address</label>
                  <Input type="email" placeholder="john@example.com" className="h-14 bg-background/50 border-white/10 rounded-2xl font-bold px-6" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Transmission Message</label>
                  <Textarea placeholder="Initialize communication..." className="bg-background/50 border-white/10 rounded-2xl font-bold px-6 py-4 min-h-[150px]" />
                </div>

                <Button className="w-full h-16 gradient-primary rounded-2xl font-black uppercase tracking-[0.2em] shadow-glow hover:scale-105 active:scale-95 transition-all text-lg">
                  SEND TRANSMISSION <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
