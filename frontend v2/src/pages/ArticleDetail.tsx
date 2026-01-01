import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Share2, FileText, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Article {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    date: string;
    category: 'announcement' | 'news' | 'guide' | 'update';
    author: string;
    image?: string;
}

const articles: Record<string, Article> = {
    '1': {
        id: '1',
        title: 'New Digital Credential System Launched',
        excerpt: 'The Government of Kenya through the Ministry of Education has officially launched the CertChain blockchain-based credential verification system.',
        content: `
            <h2>Historic Launch of Blockchain-Based Credential System</h2>
            <p>The Government of Kenya, through the Ministry of Education, Science and Technology, has officially launched the CertChain blockchain-based credential verification system, marking a significant milestone in the digitalization of educational records in the country.</p>
            
            <h3>A New Era of Digital Trust</h3>
            <p>This groundbreaking initiative positions Kenya as a leader in educational technology innovation across Africa. The CertChain system leverages immutable blockchain technology to ensure that academic credentials are tamper-proof, instantly verifiable, and permanently accessible.</p>
            
            <h3>What This Means for Students</h3>
            <p>Students graduating from participating institutions will receive blockchain-verified digital certificates that:</p>
            <ul>
                <li>Cannot be forged or altered</li>
                <li>Are instantly verifiable by employers worldwide</li>
                <li>Remain permanently accessible regardless of institutional changes</li>
                <li>Can be shared digitally without physical copies</li>
            </ul>
            
            <h3>Benefits for Employers</h3>
            <p>Employers can now verify credentials in milliseconds, eliminating the weeks traditionally required for background checks. This reduces hiring friction and ensures candidate authenticity with mathematical certainty.</p>
            
            <h3>Government Vision</h3>
            <p>Cabinet Secretary for Education, Prof. George Magoha, stated: "This system represents our commitment to leveraging technology for transparency, efficiency, and global competitiveness. We are building a future where academic fraud is impossible and genuine talent is instantly recognizable."</p>
            
            <h3>Implementation Timeline</h3>
            <p>The system has been rolled out in phases:</p>
            <ul>
                <li><strong>Phase 1 (Q4 2024):</strong> Pilot program with 5 major universities</li>
                <li><strong>Phase 2 (Q1 2025):</strong> Expansion to 25 universities and tertiary institutions</li>
                <li><strong>Phase 3 (Q2 2025):</strong> National rollout to all accredited institutions</li>
                <li><strong>Phase 4 (Q3 2025):</strong> Integration with regional verification networks</li>
            </ul>
            
            <h3>Technical Infrastructure</h3>
            <p>The CertChain system is built on Ethereum Layer 2 technology, ensuring high-speed transactions with minimal environmental impact. The system uses Zero-Knowledge Proofs to maintain student privacy while enabling instant verification.</p>
            
            <h3>Getting Started</h3>
            <p>Students can access their digital credentials through the student portal at certchain.go.ke. Universities can onboard their registrar offices through the institution dashboard.</p>
        `,
        date: '2025-01-15',
        category: 'announcement',
        author: 'Ministry of Education, Kenya',
    },
    '2': {
        id: '2',
        title: 'How to Apply for Certificate Verification',
        excerpt: 'Step-by-step guide for students on how to request and receive blockchain-verified certificates through the new system.',
        content: `
            <h2>Complete Guide to Certificate Verification</h2>
            <p>This comprehensive guide will walk you through the process of requesting and receiving your blockchain-verified certificate through the CertChain system.</p>
            
            <h3>Prerequisites</h3>
            <p>Before you begin, ensure you have:</p>
            <ul>
                <li>Completed your academic program and received confirmation from your institution</li>
                <li>A valid email address</li>
                <li>A scanned copy of your student ID</li>
                <li>A digital copy of your transcript (if required by your institution)</li>
            </ul>
            
            <h3>Step 1: Create Your Account</h3>
            <p>Visit the CertChain portal and click on "Student Portal" from the homepage. Create an account using your institutional email address. You'll receive an OTP (One-Time Password) for verification.</p>
            
            <h3>Step 2: Complete Your Profile</h3>
            <p>Once logged in, complete your student profile with accurate information:</p>
            <ul>
                <li>Full legal name (as it appears on official documents)</li>
                <li>Student registration number</li>
                <li>Course of study</li>
                <li>Year of graduation</li>
                <li>Institution name</li>
            </ul>
            
            <h3>Step 3: Request Certificate Issuance</h3>
            <p>Navigate to the "Request Issuance" tab in your dashboard. Fill out the certificate request form and upload any required documents. Your request will be sent to your institution's registrar for approval.</p>
            
            <h3>Step 4: Registrar Verification</h3>
            <p>Your institution's registrar will verify your academic records and approve the certificate issuance. This typically takes 3-5 business days. You'll receive email notifications at each stage of the process.</p>
            
            <h3>Step 5: Receive Your Digital Certificate</h3>
            <p>Once approved, your certificate will be minted on the blockchain and made available in your student portal. You'll receive a unique certificate ID and QR code that can be shared with employers.</p>
            
            <h3>Step 6: Share and Verify</h3>
            <p>You can share your certificate in several ways:</p>
            <ul>
                <li><strong>QR Code:</strong> Download the QR code for physical presentation</li>
                <li><strong>Certificate ID:</strong> Share the unique ID for online verification</li>
                <li><strong>Digital Wallet:</strong> Add the certificate to your digital wallet as a Soulbound Token</li>
                <li><strong>PDF Download:</strong> Download a printable version with embedded QR code</li>
            </ul>
            
            <h3>Verification Process for Employers</h3>
            <p>Employers can verify your certificate by:</p>
            <ol>
                <li>Visiting the CertChain verification portal</li>
                <li>Scanning the QR code or entering the certificate ID</li>
                <li>Viewing the instant verification results with full credential details</li>
            </ol>
            
            <h3>Troubleshooting Common Issues</h3>
            <p><strong>Issue:</strong> Request pending for more than 5 days<br/>
            <strong>Solution:</strong> Contact your institution's registrar office directly with your request ID.</p>
            
            <p><strong>Issue:</strong> Cannot upload documents<br/>
            <strong>Solution:</strong> Ensure files are in PDF or JPEG format and less than 5MB in size.</p>
            
            <h3>Support and Assistance</h3>
            <p>For technical support, contact our help desk at support@certchain.go.ke or call +254 700 000 000 during business hours (Monday-Friday, 8 AM - 5 PM EAT).</p>
        `,
        date: '2025-01-10',
        category: 'guide',
        author: 'CertChain Technical Team',
    },
    '3': {
        id: '3',
        title: 'Universities Integration Update',
        excerpt: 'Over 25 Kenyan universities have successfully integrated with the CertChain system, ensuring seamless certificate issuance.',
        content: `
            <h2>Major Milestone: 25 Universities Now on CertChain</h2>
            <p>We are thrilled to announce that 25 Kenyan universities and tertiary institutions have successfully integrated with the CertChain blockchain-based credential verification system, representing a significant step toward nationwide digital credential adoption.</p>
            
            <h3>Participating Institutions</h3>
            <p>The following institutions have completed integration and are now issuing blockchain-verified certificates:</p>
            
            <h4>Public Universities</h4>
            <ul>
                <li>University of Nairobi</li>
                <li>Kenyatta University</li>
                <li>Moi University</li>
                <li>Jomo Kenyatta University of Agriculture and Technology (JKUAT)</li>
                <li>Egerton University</li>
                <li>Maseno University</li>
                <li>Technical University of Kenya</li>
                <li>Masinde Muliro University of Science and Technology</li>
                <li>Dedan Kimathi University of Technology</li>
                <li>Pwani University</li>
            </ul>
            
            <h4>Private Universities</h4>
            <ul>
                <li>Strathmore University</li>
                <li>United States International University (USIU-Africa)</li>
                <li>Aga Khan University</li>
                <li>Catholic University of Eastern Africa</li>
                <li>Daystar University</li>
                <li>Mount Kenya University</li>
                <li>Kenya Methodist University</li>
                <li>African Nazarene University</li>
                <li>KCA University</li>
                <li>Riara University</li>
            </ul>
            
            <h4>Diploma and Technical Colleges</h4>
            <ul>
                <li>Kenya Institute of Management</li>
                <li>Kenya School of Government</li>
                <li>Kenya Medical Training College</li>
                <li>Kenya Polytechnic University College</li>
                <li>Cooperative University of Kenya</li>
            </ul>
            
            <h3>Integration Success Stories</h3>
            <p><strong>University of Nairobi</strong> reported a 90% reduction in certificate processing time, with over 5,000 blockchain certificates issued in the first month alone.</p>
            
            <p><strong>Strathmore University</strong> has integrated CertChain with their existing student management system, enabling automatic certificate minting upon degree conferment.</p>
            
            <p><strong>JKUAT</strong> has extended the system to include micro-credentials and skill badges from their innovation and entrepreneurship programs.</p>
            
            <h3>Technical Implementation</h3>
            <p>Each institution underwent a comprehensive integration process:</p>
            <ol>
                <li><strong>System Assessment:</strong> Compatibility analysis with existing student information systems</li>
                <li><strong>API Integration:</strong> Secure connection establishment with CertChain infrastructure</li>
                <li><strong>Data Migration:</strong> Historical credential data onboarding (optional)</li>
                <li><strong>Registrar Training:</strong> Comprehensive training for administrative staff</li>
                <li><strong>Pilot Testing:</strong> Small-scale deployment with select departments</li>
                <li><strong>Full Rollout:</strong> University-wide activation</li>
            </ol>
            
            <h3>Impact Metrics</h3>
            <p>Since integration began:</p>
            <ul>
                <li><strong>10,547 certificates</strong> have been minted on the blockchain</li>
                <li><strong>3,892 verifications</strong> have been performed by employers</li>
                <li><strong>99.8% uptime</strong> maintained across all institutional connections</li>
                <li><strong>1.2 seconds</strong> average certificate minting time</li>
                <li><strong>Zero fraudulent credentials</strong> detected</li>
            </ul>
            
            <h3>Upcoming Integrations</h3>
            <p>We are in active discussions with 15 additional institutions scheduled to join the network in Q1 2025, including:</p>
            <ul>
                <li>Several Teachers Training Colleges</li>
                <li>National Polytechnics</li>
                <li>Professional certification bodies</li>
                <li>Regional campus extensions of existing universities</li>
            </ul>
            
            <h3>Regional Expansion</h3>
            <p>Following successful deployment in Kenya, we are exploring partnerships with educational institutions in Uganda, Tanzania, and Rwanda as part of the East African Community's digital harmonization initiative.</p>
            
            <h3>For Institutions Interested in Integration</h3>
            <p>Universities and colleges interested in joining the CertChain network can contact our institutional partnerships team at partnerships@certchain.go.ke to schedule a consultation and demo.</p>
        `,
        date: '2025-01-05',
        category: 'update',
        author: 'CertChain Partnerships Team',
    },
    '4': {
        id: '4',
        title: 'Employer Verification Portal Now Live',
        excerpt: 'Employers can now verify academic credentials in real-time through our secure blockchain verification portal.',
        content: `
            <h2>Revolutionizing Credential Verification for Employers</h2>
            <p>The CertChain Employer Verification Portal is now live, providing companies and recruitment agencies with instant, cryptographically-verified academic credential authentication.</p>
            
            <h3>Why Employer Verification Matters</h3>
            <p>Academic credential fraud costs employers billions annually and undermines trust in hiring processes. Traditional verification methods can take weeks and require extensive administrative coordination. The CertChain system eliminates these challenges entirely.</p>
            
            <h3>Key Features</h3>
            
            <h4>1. Instant Verification</h4>
            <p>Verify certificates in under 2 seconds using either:</p>
            <ul>
                <li>Certificate ID (alphanumeric code)</li>
                <li>QR code scanning (mobile and desktop)</li>
                <li>Candidate email lookup (with permission)</li>
            </ul>
            
            <h4>2. Comprehensive Credential Details</h4>
            <p>Each verification provides:</p>
            <ul>
                <li>Student full name</li>
                <li>Degree/diploma title and classification</li>
                <li>Major/specialization</li>
                <li>Institution name and accreditation status</li>
                <li>Graduation date</li>
                <li>Blockchain transaction hash (proof of authenticity)</li>
                <li>Certificate minting timestamp</li>
            </ul>
            
            <h4>3. Verification History</h4>
            <p>Employers with registered accounts can:</p>
            <ul>
                <li>View all past verifications</li>
                <li>Export verification reports</li>
                <li>Bulk verify multiple candidates</li>
                <li>Generate compliance audit trails</li>
            </ul>
            
            <h4>4. API Access for HR Systems</h4>
            <p>Enterprise customers can integrate CertChain verification directly into their Applicant Tracking Systems (ATS) via our RESTful API. Documentation available at docs.certchain.go.ke/api</p>
            
            <h3>How to Use the Employer Portal</h3>
            
            <h4>For Quick Verifications (No Account Required)</h4>
            <ol>
                <li>Visit certchain.go.ke/verify</li>
                <li>Enter the certificate ID or scan the QR code</li>
                <li>View instant verification results</li>
                <li>Download PDF verification report (optional)</li>
            </ol>
            
            <h4>For Registered Employers (Recommended)</h4>
            <ol>
                <li>Create an employer account at certchain.go.ke/employer</li>
                <li>Verify your company email address</li>
                <li>Access your employer dashboard</li>
                <li>Perform verifications with automatic history logging</li>
                <li>Access advanced features like bulk verification</li>
            </ol>
            
            <h3>Security and Privacy</h3>
            <p>The employer verification portal implements multiple security layers:</p>
            <ul>
                <li><strong>Blockchain Security:</strong> All credentials are cryptographically signed and tamper-evident</li>
                <li><strong>Privacy Protection:</strong> Only non-sensitive credential information is displayed; personal student data remains encrypted</li>
                <li><strong>Audit Logging:</strong> Every verification attempt is logged for compliance and fraud prevention</li>
                <li><strong>Access Control:</strong> Employers can only verify credentials explicitly shared by candidates</li>
            </ul>
            
            <h3>Pricing</h3>
            <p>The employer verification portal operates on a freemium model:</p>
            <ul>
                <li><strong>Free Tier:</strong> Up to 50 verifications per month</li>
                <li><strong>Professional:</strong> KES 5,000/month for unlimited verifications + API access</li>
                <li><strong>Enterprise:</strong> Custom pricing for bulk verification and dedicated support</li>
            </ul>
            
            <h3>Case Study: TechCorp Kenya</h3>
            <p>TechCorp Kenya, one of the country's largest IT employers, was an early adopter of the CertChain verification system. Their HR Director, Sarah Jenkins, reports:</p>
            
            <blockquote>
                "Before CertChain, verifying academic credentials for our 200+ annual hires took our team weeks of manual coordination with universities. Now it takes seconds. We've eliminated credential fraud entirely and reduced our time-to-hire by 40%."
            </blockquote>
            
            <h3>Getting Started</h3>
            <p>Ready to streamline your hiring process? Visit certchain.go.ke/employer to create your account or email employer-support@certchain.go.ke for a guided demo.</p>
            
            <h3>Integration Support</h3>
            <p>For companies interested in API integration with existing HR systems, our technical team offers:</p>
            <ul>
                <li>Free integration consultation</li>
                <li>Comprehensive API documentation</li>
                <li>Sandbox environment for testing</li>
                <li>Developer support via email and Slack</li>
            </ul>
            
            <h3>Compliance and Legal</h3>
            <p>The CertChain employer verification system is compliant with:</p>
            <ul>
                <li>Kenya Data Protection Act 2019</li>
                <li>ISO 27001 Information Security Standards</li>
                <li>GDPR (for international verifications)</li>
                <li>Commission for University Education (CUE) guidelines</li>
            </ul>
        `,
        date: '2025-01-03',
        category: 'news',
        author: 'CertChain Product Team',
    },
};

const ArticleDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const article = id ? articles[id] : null;

    if (!article) {
        return (
            <main className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-4xl font-black mb-6">Article Not Found</h1>
                <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist.</p>
                <Button onClick={() => navigate('/news')}>View All Articles</Button>
            </main>
        );
    }

    const getCategoryColor = (category: Article['category']) => {
        switch (category) {
            case 'announcement':
                return 'bg-red-600 text-white';
            case 'news':
                return 'bg-primary text-white';
            case 'guide':
                return 'bg-accent text-white';
            case 'update':
                return 'bg-green-600 text-white';
            default:
                return 'bg-muted text-foreground';
        }
    };

    const getCategoryIcon = (category: Article['category']) => {
        switch (category) {
            case 'announcement':
                return <Bell className="h-4 w-4" />;
            case 'guide':
                return <FileText className="h-4 w-4" />;
            default:
                return null;
        }
    };

    return (
        <main>
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-primary/10 to-transparent py-20 border-b border-white/10">
                <div className="container mx-auto px-4 max-w-4xl">
                    <button
                        onClick={() => {
                            if (window.history.length > 1) {
                                navigate(-1);
                            } else {
                                navigate('/news');
                            }
                        }}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors mb-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <span
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${getCategoryColor(
                                article.category
                            )}`}
                        >
                            {getCategoryIcon(article.category)}
                            {article.category}
                        </span>
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={article.date}>
                                {new Date(article.date).toLocaleDateString('en-KE', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </time>
                        </div>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
                        {article.title}
                    </h1>

                    <p className="text-xl text-muted-foreground font-bold mb-8 leading-relaxed">
                        {article.excerpt}
                    </p>

                    <div className="flex items-center justify-between py-6 border-y border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-black text-primary">
                                    {article.author.charAt(0)}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-black">{article.author}</p>
                                <p className="text-xs text-muted-foreground">Author</p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                            }}
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                    </div>
                </div>
            </section>

            {/* Article Content */}
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <article
                        className="prose prose-lg prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </div>
            </section>

            {/* Related Articles */}
            <section className="py-16 bg-muted/20 border-t border-white/10">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-2xl font-black mb-8">Related Articles</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {Object.values(articles)
                            .filter((a) => a.id !== article.id)
                            .slice(0, 2)
                            .map((related) => (
                                <Link
                                    key={related.id}
                                    to={`/article/${related.id}`}
                                    className="glass p-6 rounded-lg border-2 border-white/5 hover:border-primary/40 transition-all group"
                                >
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${getCategoryColor(
                                            related.category
                                        )}`}
                                    >
                                        {related.category}
                                    </span>
                                    <h3 className="text-lg font-black mb-2 group-hover:text-primary transition-colors">
                                        {related.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {related.excerpt}
                                    </p>
                                </Link>
                            ))}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default ArticleDetail;
