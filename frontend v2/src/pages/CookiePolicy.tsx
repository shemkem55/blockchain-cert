import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CookiePolicy = () => {
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

            <h1 className="text-4xl font-bold mb-8 text-primary">Cookie Policy</h1>
            <div className="prose prose-invert max-w-[800px] mx-auto text-left">
                <p className="mb-8 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">1. What Are Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows
                            the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">2. How We Use Cookies</h2>
                        <p className="text-muted-foreground mb-4">
                            When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>To enable certain functions of the Service.</li>
                            <li>To provide analytics.</li>
                            <li>To store your preferences.</li>
                            <li>To enable advertisements delivery, including behavioral advertising.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-6 mb-4 text-foreground">3. Your Choices Regarding Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.
                            Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer,
                            you may not be able to store your preferences, and some of our pages might not display properly.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default CookiePolicy;
