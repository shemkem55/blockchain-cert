import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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

            <h1 className="text-4xl font-bold mb-8 text-primary">Terms of Service</h1>
            <div className="prose prose-invert max-w-[800px] mx-auto text-left">
                <p className="mb-8 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing our website, you agree to be bound by these Terms of Service and to comply with all applicable laws and regulations.
                            If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">2. Use License</h2>
                        <p className="text-muted-foreground mb-4">
                            Permission is granted to temporarily download one copy of the materials (information or software) on CertChain's website for personal,
                            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>modify or copy the materials;</li>
                            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                            <li>attempt to decompile or reverse engineer any software contained on CertChain's website;</li>
                            <li>remove any copyright or other proprietary notations from the materials; or</li>
                            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">3. Disclaimer</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The materials on CertChain's website are provided on an 'as is' basis. CertChain makes no warranties, expressed or implied,
                            and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability,
                            fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">4. Limitations</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            In no event shall CertChain or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit,
                            or due to business interruption) arising out of the use or inability to use the materials on CertChain's website, even if CertChain or a CertChain authorized representative V has been notified orally or in writing of the possibility of such damage.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default TermsOfService;
