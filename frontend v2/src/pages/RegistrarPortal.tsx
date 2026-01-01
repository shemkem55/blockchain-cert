import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, Search, Award, TrendingUp, Users, FileText,
    Download, Filter, Calendar, BarChart3, PieChart as PieChartIcon,
    CheckCircle2, XCircle, AlertCircle, RefreshCw, Plus, Eye, X, Printer, ExternalLink,
    Sparkles, Layers, Zap, Wallet, Link as LinkIcon, Shield, FilePlus, Lock, ShieldCheck
} from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { useWeb3 } from '@/contexts/Web3Context';
import { toast } from 'sonner';
import { certificateService } from '@/services/certificateService';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import CertificateTemplate from '@/components/CertificateTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

type Cert = {
    id: string;
    recipientName: string;
    title: string;
    year?: string;
    issuedAt: string;
    issuerName: string;
    status: string;
    transactionHash?: string;
    tokenId?: string;
    // Enhanced fields
    grade?: string;
    description?: string;
    certificateType?: string;
    institution?: string;
    honors?: string;
    registrationNumber?: string;
};

interface User {
    email: string;
    name?: string;
    role?: string;
    walletAddress?: string;
    university?: string;
    organizationName?: string;
}

interface AuditLog {
    id?: string;
    timestamp?: string;
    createdAt?: string;
    action: string;
    email?: string;
    userId?: string;
    details?: string;
    ip?: string;
}

interface PreviewData {
    recipientName: string;
    title: string;
    year: string;
    grade?: string;
    description?: string;
    certificateType?: string;
    institution?: string;
    honors?: string;
    issuedBy?: string;
    dateIssued: string;
    certificateId?: string;
    status?: string;
    issuerName?: string;
    registrationNumber?: string;
    transactionHash?: string;
}

interface CertificateRequest {
    id: string;
    studentId: string;
    studentEmail: string;
    studentName: string;
    university: string;
    registrationNumber: string;
    course: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    documents?: {
        transcripts?: string;
        idPassport?: string;
    };
    createdAt: string;
}

const RegistrarPortal = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [certificates, setCertificates] = useState<Cert[]>([]);
    const [linkingWallet, setLinkingWallet] = useState(false);
    const { isConnected, address, connect } = useWeb3();
    const certificateRef = useRef<HTMLDivElement>(null);

    // Issue Certificate Form State - Enhanced
    const [recipientName, setRecipientName] = useState('');
    const [title, setTitle] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [studentEmail, setStudentEmail] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [grade, setGrade] = useState('');
    const [description, setDescription] = useState('');
    const [certificateType, setCertificateType] = useState('Certificate of Achievement');
    const [institution, setInstitution] = useState('');
    const [honors, setHonors] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [issuing, setIssuing] = useState(false);
    const [generatingBulk, setGeneratingBulk] = useState(false);

    // Preview Modal State
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'revoked'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    // Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'logs' | 'security'>('overview');
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Security Form State
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        password: '',
        confirmPassword: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);

    // Certificate Requests State
    const [certRequests, setCertRequests] = useState<CertificateRequest[]>([]);
    const [actingOnRequest, setActingOnRequest] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        valid: 0,
        revoked: 0,
        thisMonth: 0,
        thisWeek: 0,
        today: 0
    });

    const calculateStats = (certs: Cert[]) => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        setStats({
            total: certs.length,
            valid: certs.filter(c => c.status === 'valid').length,
            revoked: certs.filter(c => c.status === 'revoked').length,
            today: certs.filter(c => new Date(c.issuedAt) >= todayStart).length,
            thisWeek: certs.filter(c => new Date(c.issuedAt) >= weekStart).length,
            thisMonth: certs.filter(c => new Date(c.issuedAt) >= monthStart).length,
        });
    };

    const loadCertificates = useCallback(async () => {
        try {
            const certs = await certificateService.getMyCertificates('');
            setCertificates(certs);
            calculateStats(certs);
        } catch (err) {
            console.error('Failed to load certificates', err);
            toast.error('Failed to load certificates');
        }
    }, []);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await fetch('/registrar/requests', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setCertRequests(data.requests || []);
            }
        } catch (err) {
            console.error('Failed to fetch requests', err);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            setLoadingLogs(true);
            const res = await fetch('/admin/logs', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data.logs || []);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/auth/me', { credentials: 'include' });
                if (!res.ok) {
                    navigate('/login');
                    return;
                }
                const data = await res.json();
                const role = data.user?.role?.toLowerCase();
                if (!data.user || (role !== 'admin' && role !== 'registrar')) {
                    toast.error('Access denied: Unauthorized role');
                    navigate('/');
                    return;
                }
                setUser(data.user);
                await loadCertificates();
                if (data.user.role === 'admin' || data.user.role === 'registrar') {
                    fetchLogs();
                    fetchRequests();
                }
            } catch (err) {
                console.error(err);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        check();
    }, [navigate, loadCertificates, fetchLogs, fetchRequests]);

    // Pre-fill institution when user is loaded
    useEffect(() => {
        if (user?.university || user?.organizationName) {
            setInstitution(user.university || user.organizationName || '');
        }
    }, [user]);

    // Auto-connect wallet if user has a linked address
    useEffect(() => {
        const autoConnect = async () => {
            if (user?.walletAddress && !isConnected && typeof window.ethereum !== 'undefined') {
                try {
                    // Try to connect silently
                    await connect();
                } catch (err) {
                    console.log('Silent auto-connect failed or rejected');
                }
            }
        };
        if (user) autoConnect();
    }, [user, isConnected, connect]);



    const handleIssueCertificate = async () => {
        if (!recipientName || !title) {
            return toast.error('Please fill in recipient name and certificate title');
        }

        if (!isConnected || !address) {
            return toast.error('Authorized Wallet Connection Required');
        }

        setIssuing(true);
        const loadingId = toast.loading('Initiating Blockchain Issuance...');
        try {
            const cert = await certificateService.issueCertificate({
                recipientName,
                title,
                year,
                studentEmail: studentEmail || undefined,
                recipientAddress: recipientAddress || undefined,
                grade,
                description,
                certificateType,
                institution,
                honors,
                registrationNumber,
                registrarAddress: address
            });

            toast.dismiss(loadingId);
            toast.success('Certificate issued successfully on the blockchain!');
            setCertificates(prev => [cert, ...prev]);
            calculateStats([cert, ...certificates]);
            setShowPreview(false); // Close preview if open

            // Reset form - including new fields
            setRecipientName('');
            setTitle('');
            setStudentEmail('');
            setRecipientAddress('');
            setYear(new Date().getFullYear().toString());
            setGrade('');
            setDescription('');
            setHonors('');
            setRegistrationNumber('');
        } catch (err: unknown) {
            toast.dismiss(loadingId);
            console.error(err);
            toast.error(err instanceof Error ? err.message : 'Failed to issue certificate');
        } finally {
            setIssuing(false);
        }
    };

    const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected', reason?: string) => {
        setActingOnRequest(requestId);
        try {
            const res = await fetch(`/registrar/requests/${requestId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, rejectionReason: reason }),
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Action failed');

            toast.success(`Request ${status} successfully!`);

            // If approved, pre-fill the issue form
            if (status === 'approved') {
                const req = certRequests.find(r => r.id === requestId);
                if (req) {
                    setRecipientName(req.studentName);
                    setTitle(req.course);
                    setRegistrationNumber(req.registrationNumber);
                    setStudentEmail(req.studentEmail);
                    setActiveTab('overview'); // Overview contains the issue form
                    toast.info('Issue form pre-filled with student data.');
                }
            }

            await fetchRequests();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActingOnRequest(null);
        }
    };

    const handleAutoFill = () => {
        const names = ["Alice Mutheu", "Kevin Omondi", "Sarah Wambui", "David Otieno", "Grace Nyambura", "John Doe", "Jane Smith", "Michael Kiptoo"];
        const courses = ["Blockchain Architecture", "Smart Contract Development", "Ethereum Full Stack", "Web3 Security", "DeFi Core Concepts", "Cryptography 101"];
        const grades = ["A", "A+", "B+", "First Class Honours", "Distinction"];

        setRecipientName(names[Math.floor(Math.random() * names.length)]);
        setTitle(courses[Math.floor(Math.random() * courses.length)]);
        setGrade(grades[Math.floor(Math.random() * grades.length)]);
        setYear("2024");
        setDescription("This sample certificate was automatically generated to demonstrate system capabilities.");
        setHonors(Math.random() > 0.5 ? "With Honors" : "");
        setStudentEmail(`student.${Math.floor(Math.random() * 1000)}@test.com`);
        setRegistrationNumber(`REG-${Math.floor(Math.random() * 900000) + 100000}`);
        toast.success("Form auto-filled with sample data!");
    };

    const handleBulkGenerate = async (count = 3) => {
        if (generatingBulk) return;

        const names = ["Alice Mutheu", "Kevin Omondi", "Sarah Wambui", "David Otieno", "Grace Nyambura"];
        const courses = ["Blockchain Architecture", "Smart Contract Development", "Web3 Security"];

        setGeneratingBulk(true);
        const loadingId = toast.loading(`Bulk issuing ${count} certificates...`);

        try {
            for (let i = 0; i < count; i++) {
                const randomName = names[Math.floor(Math.random() * names.length)];
                const randomTitle = courses[Math.floor(Math.random() * courses.length)];

                await certificateService.issueCertificate({
                    recipientName: randomName,
                    title: randomTitle,
                    year: "2024",
                    institution: "University Blockchain Institute",
                    grade: "A",
                    description: "Automatically generated sample certificate."
                });
            }
            toast.dismiss(loadingId);
            toast.success(`Successfully issued ${count} certificates!`);
            await loadCertificates();
        } catch (err) {
            toast.dismiss(loadingId);
            console.error(err);
            toast.error("Failed during bulk issuance");
        } finally {
            setGeneratingBulk(false);
        }
    };

    const handlePreviewCertificate = () => {
        if (!recipientName || !title) {
            return toast.error('Please fill in recipient name and certificate title to preview');
        }

        setPreviewData({
            recipientName,
            title,
            year,
            grade,
            description,
            certificateType,
            institution,
            honors,
            issuedBy: user?.email,
            dateIssued: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            registrationNumber,
        });
        setShowPreview(true);
    };

    const handleViewCertificate = (cert: Cert) => {
        setPreviewData({
            recipientName: cert.recipientName,
            title: cert.title,
            year: cert.year || new Date(cert.issuedAt).getFullYear().toString(),
            grade: cert.grade,
            description: cert.description,
            certificateType: cert.certificateType || 'Certificate of Achievement',
            institution: cert.institution || 'University Blockchain Institute',
            honors: cert.honors,
            dateIssued: new Date(cert.issuedAt).toLocaleDateString(),
            certificateId: cert.id,
            status: cert.status,
            issuerName: cert.issuerName,
            registrationNumber: cert.registrationNumber || cert.id.slice(0, 8).toUpperCase(),
            transactionHash: cert.transactionHash
        });
        setShowPreview(true);
    };

    const handleDownloadPDF = async () => {
        if (!certificateRef.current || !previewData) return;

        try {
            toast.info('Generating High-Resolution Certificate...');

            // Dimensions for 1120x792 certificate
            const width = 1120;
            const height = 792;

            const canvas = await html2canvas(certificateRef.current, {
                useCORS: true,
                scale: 3,
                logging: false,
                backgroundColor: '#ffffff',
                width: width,
                height: height,
                allowTaint: true,
                imageTimeout: 0,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('certificate-to-capture');
                    if (el instanceof HTMLElement) {
                        el.style.transform = 'none';
                        el.style.display = 'block';
                        el.style.margin = '0';
                    }
                }
            } as any);

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [width, height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, width, height, undefined, 'FAST');
            pdf.save(`Certificate-${previewData.recipientName.replace(/\s+/g, '_')}-${previewData.certificateId || 'ID'}.pdf`);
            toast.success('Professional Certificate Downloaded!');
        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Failed to generate high-quality PDF');
        }
    };

    const handleConnectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            toast.error('MetaMask not detected. Please install the MetaMask extension.');
            return;
        }

        try {
            const addr = await connect();
            if (addr) {
                toast.success('Wallet Authorized: Registrar Identity Secured');
            } else {
                toast.error('Connection failed: No address returned.');
            }
        } catch (err: unknown) {
            console.error('Wallet connection error:', err);
            toast.error(err instanceof Error ? err.message : 'Wallet Connection Failed');
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
            toast.success('Registrar logged out successfully');
            navigate('/registrar-login');
        } catch {
            navigate('/registrar-login');
        }
    };

    const handleLinkWallet = async () => {
        let currentAddress = address;

        if (!isConnected || !currentAddress) {
            try {
                currentAddress = await connect();
                if (!currentAddress) return; // Error handled by handleConnectWallet's logic or toast
            } catch (err) {
                return; // Error toast shown by useWeb3 or handled elsewhere
            }
        }

        setLinkingWallet(true);
        try {
            const res = await fetch('/auth/link-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: currentAddress }),
                credentials: 'include',
            });

            if (res.ok) {
                toast.success('Wallet linked to your registrar account!');
                // Update local user state with the linked wallet
                setUser(prev => prev ? { ...prev, walletAddress: currentAddress?.toLowerCase() } : null);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to link wallet');
            }
        } catch (err) {
            toast.error('Error linking wallet');
        } finally {
            setLinkingWallet(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.password !== passwordForm.confirmPassword) {
            return toast.error('New passwords do not match');
        }
        if (!isNewPasswordValid) {
            return toast.error('Password does not meet security requirements');
        }

        setIsChangingPassword(true);
        try {
            const res = await fetch('/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldPassword: passwordForm.oldPassword,
                    password: passwordForm.password
                }),
                credentials: 'include'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Failed to update password');
            }

            toast.success('Password updated successfully');
            setPasswordForm({ oldPassword: '', password: '', confirmPassword: '' });
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Filter certificates
    const filteredCertificates = certificates.filter(cert => {
        // Status filter
        if (filterStatus !== 'all' && cert.status !== filterStatus) return false;

        // Date filter
        if (dateFilter !== 'all') {
            const certDate = new Date(cert.issuedAt);
            const now = new Date();

            if (dateFilter === 'today') {
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (certDate < todayStart) return false;
            } else if (dateFilter === 'week') {
                const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (certDate < weekStart) return false;
            } else if (dateFilter === 'month') {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                if (certDate < monthStart) return false;
            }
        }

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return (
                cert.recipientName?.toLowerCase().includes(search) ||
                cert.title?.toLowerCase().includes(search) ||
                cert.id?.toLowerCase().includes(search)
            );
        }

        return true;
    });

    // Chart data
    const statusChartData = [
        { name: 'Valid', value: stats.valid, color: '#10b981' },
        { name: 'Revoked', value: stats.revoked, color: '#ef4444' },
    ];

    const trendData = Object.entries(
        certificates.reduce((acc: Record<string, number>, curr) => {
            const date = new Date(curr.issuedAt).toLocaleDateString();
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {})
    ).map(([date, count]) => ({ date, count })).slice(-7);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading Registrar Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-transparent">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4 relative">
                    <div className="flex justify-between items-center">
                        {/* Left: MoE Logo & Portal Title */}
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 flex items-center justify-center p-1.5 bg-white rounded-2xl shadow-md border-2 border-slate-100 overflow-hidden group transition-all duration-300 hover:shadow-lg">
                                <img
                                    src="/logos/moe-logo.png"
                                    alt="Ministry of Education Logo"
                                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                    }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-black tracking-tight leading-none text-slate-800">REGISTRAR</h1>
                                <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-[0.2em] mt-1.5">Institutional Portal</p>
                            </div>
                        </div>

                        {/* Right: University Logo & Actions */}
                        <div className="flex items-center gap-5">
                            <div className="hidden lg:flex flex-col items-end mr-2">
                                <span className="text-sm font-black text-foreground">{user?.email.split('@')[0]}</span>
                                <span className="text-[11px] font-bold text-muted-foreground/80">{user?.email}</span>
                            </div>

                            {/* University Logo */}
                            <div className="flex items-center gap-4 pr-5 border-r-2 border-slate-100 mr-2">
                                <div className="h-16 w-16 flex items-center justify-center p-1.5 bg-white rounded-2xl shadow-lg border-2 border-primary/20 overflow-hidden transform hover:scale-105 transition-all duration-300 hover:border-primary/40 group">
                                    <img
                                        src={`/logos/${(user?.university || user?.organizationName || '').toLowerCase().replace(/'/g, '').replace(/\./g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}.png`}
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                            const container = img.parentElement;
                                            const institutionName = user?.university || user?.organizationName || 'University';
                                            if (container) {
                                                container.innerHTML = `<div class="flex flex-col items-center justify-center h-full w-full bg-primary/5 rounded-xl border border-primary/20">
                                                    <span class="text-[14px] font-black text-primary uppercase tracking-tighter">${institutionName.split(' ').map(n => n[0]).join('')}</span>
                                                </div>`;
                                            }
                                        }}
                                        alt="University Logo"
                                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary leading-none">Recognized By</p>
                                    <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mt-2 max-w-[150px] truncate">{user?.university || user?.organizationName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isConnected ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs font-mono text-green-600 font-bold">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConnectWallet}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-black uppercase tracking-widest text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Authorize
                                    </button>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 text-destructive bg-destructive/10 rounded-xl hover:bg-destructive/20 transition-all border border-destructive/10"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {!user?.walletAddress && !isConnected && (
                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full glass p-8 rounded-[2.5rem] border border-primary/20 text-center shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500"></div>
                        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20 rotate-3">
                            <Shield className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black mb-4 tracking-tight text-foreground">Wallet Authorization Required</h2>
                        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                            For enhanced security, the University Registrar Portal requires a linked blockchain identity to perform any administrative actions. Please connect your authorized registrar wallet.
                        </p>
                        <button
                            onClick={handleConnectWallet}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white/10"
                        >
                            <Wallet className="w-5 h-5" />
                            Connect Registrar Wallet
                        </button>
                        <p className="mt-6 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            Authorized Access Only • Cryptographically Verified
                        </p>
                    </motion.div>
                </div>
            )}

            {!user?.walletAddress && isConnected && (
                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md w-full glass p-8 rounded-[2.5rem] border border-orange-500/20 text-center shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"></div>
                        <div className="h-20 w-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                            <LinkIcon className="w-10 h-10 text-orange-600" />
                        </div>
                        <h2 className="text-3xl font-black mb-4 tracking-tight text-foreground">Link Your Identity</h2>
                        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                            Your wallet <span className="text-foreground font-mono font-bold bg-muted px-2 py-1 rounded-md">{address?.slice(0, 6)}...{address?.slice(-4)}</span> is connected. Now, link it to your registrar account to enable blockchain-backed issuance.
                        </p>
                        <button
                            onClick={handleLinkWallet}
                            disabled={linkingWallet}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white/10 disabled:opacity-50"
                        >
                            {linkingWallet ? (
                                <><RefreshCw className="w-5 h-5 animate-spin" /> Finalizing Link...</>
                            ) : (
                                <><Zap className="w-5 h-5" /> Link Wallet for Issuance</>
                            )}
                        </button>
                        <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <p className="text-[10px] uppercase font-bold text-blue-600 tracking-widest text-center">
                                One-time requirement • This wallet will be permanently linked to your account
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}

            {user?.walletAddress && (
                <>
                    {/* Tab Navigation */}
                    <div className="container mx-auto px-4 mt-6">
                        <div className="flex bg-muted/50 p-1 rounded-lg w-fit border">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'overview'
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Award className="w-4 h-4" />
                                Overview & Issuance
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'requests'
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                Student Requests
                                {certRequests.filter(r => r.status === 'pending').length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                                        {certRequests.filter(r => r.status === 'pending').length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'logs'
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                Security Audit Logs
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'security'
                                    ? 'bg-background text-primary shadow-sm ring-1 ring-border'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                Password Settings
                            </button>
                        </div>
                    </div>

                    <main className="flex-1 container mx-auto px-4 py-8">
                        {activeTab === 'overview' ? (
                            <>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="glass p-6 rounded-xl border bg-gradient-to-br from-card to-primary/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <FileText className="w-8 h-8 text-primary" />
                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                        </div>
                                        <p className="text-3xl font-bold">{stats.total}</p>
                                        <p className="text-sm text-muted-foreground">Total Certificates</p>
                                    </div>

                                    <div className="glass p-6 rounded-xl border bg-gradient-to-br from-card to-green-500/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                            <span className="text-xs font-semibold text-green-500">ACTIVE</span>
                                        </div>
                                        <p className="text-3xl font-bold">{stats.valid}</p>
                                        <p className="text-sm text-muted-foreground">Valid Certificates</p>
                                    </div>

                                    <div className="glass p-6 rounded-xl border bg-gradient-to-br from-card to-blue-500/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <Calendar className="w-8 h-8 text-blue-500" />
                                            <span className="text-xs font-semibold text-blue-500">THIS MONTH</span>
                                        </div>
                                        <p className="text-3xl font-bold">{stats.thisMonth}</p>
                                        <p className="text-sm text-muted-foreground">Issued This Month</p>
                                    </div>

                                    <div className="glass p-6 rounded-xl border bg-gradient-to-br from-card to-purple-500/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <BarChart3 className="w-8 h-8 text-purple-500" />
                                            <span className="text-xs font-semibold text-purple-500">TODAY</span>
                                        </div>
                                        <p className="text-3xl font-bold">{stats.today}</p>
                                        <p className="text-sm text-muted-foreground">Issued Today</p>
                                    </div>
                                </div>

                                {/* Issue Certificate Section */}
                                <section className="glass p-8 rounded-xl mb-8 border bg-gradient-to-br from-card to-primary/5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Plus className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">Issue New Certificate</h2>
                                            <p className="text-muted-foreground">Create and issue a blockchain-verified certificate</p>
                                        </div>
                                        <div className="ml-auto flex gap-2">
                                            <button
                                                onClick={handleAutoFill}
                                                className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-all flex items-center gap-2 text-sm font-medium"
                                                title="Fill form with sample data"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Auto-Fill
                                            </button>
                                            <button
                                                onClick={() => handleBulkGenerate(3)}
                                                disabled={generatingBulk}
                                                className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                                                title="Issue 3 random certificates at once"
                                            >
                                                {generatingBulk ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                                                Bulk Generate
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Recipient Full Name *</label>
                                            <input
                                                placeholder="e.g., John Doe"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={recipientName}
                                                onChange={(e) => setRecipientName(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Certificate Title / Course *</label>
                                            <input
                                                placeholder="e.g., Blockchain Development"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Student Registration Number *</label>
                                            <input
                                                placeholder="e.g., SCT221-0001/2020"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={registrationNumber}
                                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Certificate Type</label>
                                            <select
                                                aria-label="Select certificate type"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={certificateType}
                                                onChange={(e) => setCertificateType(e.target.value)}
                                            >
                                                <option value="Certificate of Achievement">Certificate of Achievement</option>
                                                <option value="Certificate of Completion">Certificate of Completion</option>
                                                <option value="Certificate of Excellence">Certificate of Excellence</option>
                                                <option value="Diploma">Diploma</option>
                                                <option value="Degree Certificate">Degree Certificate</option>
                                                <option value="Professional Certificate">Professional Certificate</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Institution Name (Locked)</label>
                                            <input
                                                readOnly
                                                placeholder="e.g., University Blockchain Institute"
                                                className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:ring-1 focus:ring-primary outline-none transition-all cursor-not-allowed font-bold"
                                                value={institution}
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Verified Registrar for: {user?.university || user?.organizationName}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Year</label>
                                            <input
                                                type="number"
                                                placeholder="2024"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Grade (Optional)</label>
                                            <input
                                                placeholder="e.g., A+, 95%, First Class"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={grade}
                                                onChange={(e) => setGrade(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Honors / Distinction (Optional)</label>
                                            <input
                                                placeholder="e.g., With Honors, Summa Cum Laude"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={honors}
                                                onChange={(e) => setHonors(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Student Email (Optional)</label>
                                            <input
                                                type="email"
                                                placeholder="student@university.edu"
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                                value={studentEmail}
                                                onChange={(e) => setStudentEmail(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Recipient Wallet Address (For Blockchain)</label>
                                            <input
                                                placeholder="0x..."
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all font-mono text-sm"
                                                value={recipientAddress}
                                                onChange={(e) => setRecipientAddress(e.target.value)}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                                            <textarea
                                                placeholder="e.g., A comprehensive course covering blockchain fundamentals, smart contracts, and decentralized applications..."
                                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                                rows={3}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <button
                                            onClick={handlePreviewCertificate}
                                            className="px-8 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-all hover:scale-105 flex items-center gap-2"
                                        >
                                            <Eye className="w-5 h-5" />
                                            Preview Certificate
                                        </button>

                                        <button
                                            onClick={handleIssueCertificate}
                                            disabled={issuing}
                                            className="px-8 py-3 rounded-lg gradient-primary text-primary-foreground font-medium disabled:opacity-50 transition-all hover:scale-105 flex items-center gap-2"
                                        >
                                            {issuing ? (
                                                <>
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Issuing Certificate...
                                                </>
                                            ) : (
                                                <>
                                                    <Award className="w-5 h-5 shadow-glow-sm" />
                                                    Finalize & Issue Blockchain Certificate
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </section>

                                {/* Analytics Section */}
                                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                                    {/* Trend Chart */}
                                    <section className="glass p-6 rounded-xl border">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-primary" />
                                            Issuance Trend (Last 7 Days)
                                        </h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={trendData}>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                    <XAxis dataKey="date" className="text-xs" />
                                                    <YAxis allowDecimals={false} className="text-xs" />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                                                    />
                                                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', r: 5 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </section>

                                    {/* Status Distribution */}
                                    <section className="glass p-6 rounded-xl border">
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <PieChartIcon className="w-5 h-5 text-primary" />
                                            Certificate Status Distribution
                                        </h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={statusChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                                        outerRadius={100}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {statusChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </section>
                                </div>

                                {/* Certificates List */}
                                <section className="glass p-6 rounded-xl border">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                        <h3 className="font-semibold text-xl flex items-center gap-2">
                                            <FileText className="w-6 h-6 text-primary" />
                                            Certificate Management
                                        </h3>

                                        <div className="flex flex-wrap gap-3">
                                            {/* Search */}
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    placeholder="Search certificates..."
                                                    className="pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>

                                            {/* Status Filter */}
                                            <select
                                                aria-label="Filter certificates by status"
                                                className="px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'valid' | 'revoked')}
                                            >
                                                <option value="all">All Status</option>
                                                <option value="valid">Valid Only</option>
                                                <option value="revoked">Revoked Only</option>
                                            </select>

                                            {/* Date Filter */}
                                            <select
                                                aria-label="Filter certificates by date"
                                                className="px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                                value={dateFilter}
                                                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                                            >
                                                <option value="all">All Time</option>
                                                <option value="today">Today</option>
                                                <option value="week">This Week</option>
                                                <option value="month">This Month</option>
                                            </select>

                                            <button
                                                onClick={loadCertificates}
                                                className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Refresh
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-4">
                                        Showing {filteredCertificates.length} of {certificates.length} certificates
                                    </p>

                                    {filteredCertificates.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                                            <p className="text-muted-foreground">No certificates found</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {filteredCertificates.map((cert) => (
                                                <div key={cert.id} className="p-5 rounded-lg border bg-card hover:shadow-lg transition-all">
                                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${cert.status === 'revoked' ? 'bg-red-500/20' : 'bg-green-500/20'
                                                                    }`}>
                                                                    {cert.status === 'revoked' ? (
                                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                                    ) : (
                                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-semibold text-lg">{cert.title}</h4>
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cert.status === 'revoked'
                                                                            ? 'bg-red-500/20 text-red-500'
                                                                            : 'bg-green-500/20 text-green-500'
                                                                            }`}>
                                                                            {cert.status.toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground mb-2">
                                                                        <Users className="w-3 h-3 inline mr-1" />
                                                                        Recipient: <span className="font-medium">{cert.recipientName}</span>
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                                        <span>📅 {new Date(cert.issuedAt).toLocaleDateString()}</span>
                                                                        {cert.year && <span>🎓 Year: {cert.year}</span>}
                                                                        <span>👤 By: {cert.issuerName}</span>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground mt-2 font-mono">ID: {cert.id}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex md:flex-col gap-2">
                                                            <button
                                                                onClick={() => handleViewCertificate(cert)}
                                                                className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-2 text-sm font-medium"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View
                                                            </button>
                                                            <a
                                                                href={`/certificate/${cert.id}`}
                                                                target="_blank"
                                                                className="px-4 py-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all flex items-center gap-2 text-xs font-medium justify-center"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                                Link
                                                            </a>
                                                            {cert.transactionHash && (
                                                                <span className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium flex items-center gap-1">
                                                                    ⛓️ On-Chain
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        ) : activeTab === 'requests' ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-secondary/10 border border-white/5 rounded-[2rem] backdrop-blur-sm">
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">Student Requests</h2>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Manage institutional issuance applications</p>
                                    </div>
                                    <button onClick={fetchRequests} className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-2 text-xs font-bold uppercase">
                                        <RefreshCw className="w-3 h-3" /> Sync Requests
                                    </button>
                                </div>

                                <div className="grid gap-4">
                                    {certRequests.length === 0 ? (
                                        <div className="text-center py-24 bg-card rounded-[2.5rem] border border-dashed border-primary/20">
                                            <Users className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                                            <p className="text-muted-foreground font-bold text-sm">No certificate requests found for your university.</p>
                                        </div>
                                    ) : (
                                        certRequests.map((req) => (
                                            <div key={req.id} className="p-8 rounded-[2rem] border bg-card hover:shadow-xl transition-all group overflow-hidden relative">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-primary/10 transition-colors"></div>

                                                <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
                                                    <div className="space-y-6 flex-1">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                                                <FilePlus className="w-7 h-7" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-xl tracking-tight leading-none mb-1">{req.studentName}</h4>
                                                                <p className="text-xs text-muted-foreground font-medium">{req.studentEmail}</p>
                                                            </div>
                                                            <Badge className={`ml-3 rounded-lg uppercase text-[9px] font-black tracking-widest px-3 py-1 ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                req.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                                                }`}>
                                                                {req.status}
                                                            </Badge>
                                                        </div>

                                                        <div className="grid sm:grid-cols-2 gap-4">
                                                            <div className="p-4 rounded-2xl bg-secondary/5 border border-white/5">
                                                                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-2">Applied Program</p>
                                                                <p className="font-bold text-sm">{req.course}</p>
                                                            </div>
                                                            <div className="p-4 rounded-2xl bg-secondary/5 border border-white/5">
                                                                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-2">Institutional ID</p>
                                                                <p className="font-bold text-sm font-mono tracking-tighter">{req.registrationNumber}</p>
                                                            </div>
                                                        </div>

                                                        {req.documents && (
                                                            <div className="flex flex-wrap gap-4 pt-2">
                                                                {req.documents.transcripts && (
                                                                    <a
                                                                        href={`/${req.documents.transcripts}`}
                                                                        target="_blank"
                                                                        className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all border border-blue-500/20 shadow-sm"
                                                                    >
                                                                        <FileText className="w-4 h-4" /> Verify Transcripts
                                                                    </a>
                                                                )}
                                                                {req.documents.idPassport && (
                                                                    <a
                                                                        href={`/${req.documents.idPassport}`}
                                                                        target="_blank"
                                                                        className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all border border-purple-500/20 shadow-sm"
                                                                    >
                                                                        <Shield className="w-4 h-4" /> Identity Verification
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {req.status === 'pending' && (
                                                        <div className="flex lg:flex-col gap-3 justify-center lg:min-w-[180px] pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-8">
                                                            <button
                                                                onClick={() => handleRequestAction(req.id, 'approved')}
                                                                disabled={actingOnRequest === req.id}
                                                                className="flex-1 px-6 py-4 rounded-2xl bg-green-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                                            >
                                                                {actingOnRequest === req.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                Approve Request
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Specify rejection reason:');
                                                                    if (reason) handleRequestAction(req.id, 'rejected', reason);
                                                                }}
                                                                disabled={actingOnRequest === req.id}
                                                                className="flex-1 px-6 py-4 rounded-2xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                Reject Request
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'logs' ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Security Audit Logs</h2>
                                        <p className="text-muted-foreground">Track all sensitive actions performed in the university portal</p>
                                    </div>
                                    <button
                                        onClick={fetchLogs}
                                        disabled={loadingLogs}
                                        className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                                        Refresh Logs
                                    </button>
                                </div>

                                <div className="glass rounded-xl border overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Timestamp</th>
                                                <th className="px-6 py-4 font-semibold">Action</th>
                                                <th className="px-6 py-4 font-semibold">User</th>
                                                <th className="px-6 py-4 font-semibold">IP Address</th>
                                                <th className="px-6 py-4 font-semibold">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {auditLogs.length > 0 ? auditLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.action.includes('SUCCESS') ? 'bg-green-100 text-green-700' :
                                                            log.action.includes('ISSUED') ? 'bg-blue-100 text-blue-700' :
                                                                'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">{log.email || 'System'}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{log.ip}</td>
                                                    <td className="px-6 py-4 max-w-xs truncate text-muted-foreground" title={log.details}>
                                                        {log.details}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                                        No security logs found. Activity will appear here as the system is used.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Security Credentials</h2>
                                        <p className="text-muted-foreground">Manage your university portal access security</p>
                                    </div>
                                </div>

                                <div className="glass rounded-2xl border p-8 shadow-sm">
                                    <form onSubmit={handleChangePassword} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-primary">Current Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="password"
                                                    placeholder="Enter current password"
                                                    className="w-full h-11 pl-10 pr-4 bg-muted/30 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    value={passwordForm.oldPassword}
                                                    onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                                    disabled={isChangingPassword}
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-border w-full" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-primary">New Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="password"
                                                        placeholder="Min 8 characters"
                                                        className="w-full h-11 pl-10 pr-4 bg-muted/30 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                        value={passwordForm.password}
                                                        onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                                        disabled={isChangingPassword}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-primary">Confirm New Password</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="password"
                                                        placeholder="Repeat new password"
                                                        className="w-full h-11 pl-10 pr-4 bg-muted/30 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                        disabled={isChangingPassword}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <PasswordStrengthIndicator
                                            password={passwordForm.password}
                                            onValidationChange={setIsNewPasswordValid}
                                        />

                                        <div className="bg-orange-500/5 border border-orange-200/50 p-4 rounded-lg flex items-start gap-3">
                                            <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-orange-800 leading-relaxed font-medium">
                                                Important: Registrar accounts must use strong passwords. You cannot reuse any of your previously used passwords.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isChangingPassword}
                                            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold shadow-sm hover:shadow-md hover:translate-y-[-1px] active:translate-y-[0] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isChangingPassword ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Authorize Password Update"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </main>
                </>
            )}

            {/* Certificate Preview Modal */}
            {
                showPreview && previewData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-auto">
                        <div className="relative max-w-7xl w-full">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center mb-4 bg-background/95 backdrop-blur p-4 rounded-lg border">
                                <div>
                                    <h3 className="text-xl font-bold">Certificate Preview</h3>
                                    <p className="text-sm text-muted-foreground">Review before issuing</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all flex items-center gap-2 font-bold"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Download PDF
                                    </button>
                                    {!previewData.status && (
                                        <button
                                            onClick={handleIssueCertificate}
                                            disabled={issuing}
                                            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 font-bold shadow-lg shadow-primary/20"
                                        >
                                            {issuing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                                            Finalize & Issue
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all flex items-center gap-2 font-bold"
                                    >
                                        <X className="w-4 h-4" />
                                        Close
                                    </button>
                                </div>
                            </div>

                            {/* Certificate Display */}
                            <div className="bg-white p-8 rounded-lg shadow-2xl overflow-auto max-h-[80vh] flex justify-center">
                                <div className="origin-top scale-[0.5] sm:scale-75 md:scale-90 lg:scale-100 transition-transform">
                                    <CertificateTemplate ref={certificateRef} data={previewData} />
                                </div>
                            </div>

                            {/* Footer Info */}
                            <div className="mt-4 bg-background/95 backdrop-blur p-4 rounded-lg border">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground text-center tracking-widest">
                                    📜 This is a preview. Review all details carefully before clicking "Finalize & Issue".
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RegistrarPortal;
