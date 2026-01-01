import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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

            <h1 className="text-4xl font-bold mb-8 text-primary">Privacy Policy</h1>
            <div className="prose prose-invert max-w-[800px] mx-auto text-left">
                <p className="mb-8 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to CertChain. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you as to how we look after your personal data when you visit our website
                            and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">2. Data We Collect</h2>
                        <p className="text-muted-foreground mb-4">
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Identity Data including first name, last name, username or similar identifier.</li>
                            <li>Contact Data including email address.</li>
                            <li>Technical Data including internet protocol (IP) address, your login data, browser type and version.</li>
                            <li>Usage Data including information about how you use our website and services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">3. How We Use Your Data</h2>
                        <p className="text-muted-foreground mb-4">
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal or regulatory obligation.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default PrivacyPolicy;
