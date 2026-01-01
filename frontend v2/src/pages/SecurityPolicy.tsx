import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

const SecurityPolicy = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        // Check if there's a previous page in history
        if (window.history.length > 1 && location.key !== 'default') {
            navigate(-1);
        } else {
            // Fallback to home if no history
            navigate('/');
        }
    };

    return (
        <main className="container mx-auto px-4 py-12">
            <button
                onClick={handleBack}
                className="mb-8 flex items-center gap-2 px-4 py-2 bg-secondary/50 backdrop-blur-sm border border-white/10 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-all hover:scale-105 shadow-lg group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold">Back</span>
            </button>

            <h1 className="text-4xl font-bold mb-8 text-primary">Security Policy</h1>
            <div className="prose prose-invert max-w-[800px] mx-auto text-left">
                <p className="mb-8 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">1. Commitment to Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            At CertChain, we take security seriously. We are committed to protecting our users' data and ensuring the integrity of our blockchain certificate platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">2. Data Encryption</h2>
                        <p className="text-muted-foreground mb-4">
                            We use industry-standard encryption protocols to protect your data both in transit and at rest.
                            All sensitive information, including passwords and personal identification keys, is hashed and encrypted before storage.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">3. Blockchain Integrity</h2>
                        <p className="text-muted-foreground mb-4">
                            Certificates issued on our platform are secured by blockchain technology.
                            This ensures that once a certificate is issued, it cannot be altered, tampered with, or deleted, providing a permanent and verifiable record.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">4. Vulnerability Reporting</h2>
                        <p className="text-muted-foreground mb-4">
                            If you discover a security vulnerability in our platform, we encourage you to report it to us immediately.
                            We will investigate all reports and take appropriate action to address any confirmed issues.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex justify-end items-center">
                    <Link to="/registrar-login" className="text-xs text-muted-foreground/30 hover:text-primary transition-colors">
                        uni registra
                    </Link>
                    <span className="mx-2 text-muted-foreground/10 text-xs">|</span>
                    <Link to="/admin-portal" className="text-xs text-muted-foreground/30 hover:text-primary transition-colors">
                        admin
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default SecurityPolicy;
