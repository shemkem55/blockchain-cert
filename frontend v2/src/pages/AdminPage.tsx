import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Users, Activity, Settings,
    Search, RefreshCw, LogOut, AlertTriangle,
    CheckCircle, XCircle, Server,
    BarChart3, Ban, Unlock, FileCheck, ArrowLeft,
    Eye, EyeOff, Terminal, Database, Cpu, ShieldAlert,
    HardDrive, Power, Zap, Bug, Radio, Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';

interface User {
    id: string;
    email: string;
    role: string;
    isBanned: boolean;
    riskScore: number;
    isVerified: boolean;
    walletAddress?: string;
    university?: string;
    organizationName?: string;
}

interface Log {
    timestamp: string;
    createdAt?: string;
    action: string;
    email?: string;
    userId?: string;
    details?: string;
    ip?: string;
    userAgent?: string;
}

interface Certificate {
    id: string;
    name: string;
    course: string;
    revoked: boolean;
}

interface CertificateRequest {
    id: string;
    studentId: string;
    studentEmail: string;
    studentName: string;
    university: string;
    course: string;
    status: string;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    activeSessions: number;
    totalCertificates: number;
    revokedCertificates: number;
    totalLogs: number;
    verificationPending: number;
    securityEvents: number;
}

interface Trend {
    date: string;
    users: number;
    certs: number;
}

interface SystemSettings {
    maintenanceMode?: string;
    allowRegistration?: string;
    minRiskScore?: string;
}

interface SystemHealth {
    uptime: number;
    memory: { usage: number; total: number; free: number };
    cpu: number[];
    nodeVersion: string;
    platform: string;
    dbStatus: string;
}

interface DBColumn {
    name: string;
    type: string;
    notnull: number;
    pk: number;
}

interface DBTableData {
    tableName: string;
    columns: DBColumn[];
    rows: Record<string, unknown>[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}

const KENYAN_UNIVERSITIES = [
    "Africa Nazarene University",
    "Catholic University of Eastern Africa",
    "Chuka University",
    "Cooperative University of Kenya",
    "Daystar University",
    "Dedan Kimathi University of Technology",
    "Egerton University",
    "Embu University",
    "Garissa University",
    "Jaramogi Oginga Odinga University of Science and Technology",
    "Jomo Kenyatta University of Agriculture and Technology",
    "Kabarak University",
    "Karatina University",
    "KCA University",
    "Kenya Methodist University",
    "Kenyatta University",
    "Kirinyaga University",
    "Kisii University",
    "Laikipia University",
    "Maasai Mara University",
    "Machakos University",
    "Maseno University",
    "Masinde Muliro University of Science and Technology",
    "Meru University of Science and Technology",
    "Moi University",
    "Mount Kenya University",
    "Multimedia University of Kenya",
    "Murang'a University of Technology",
    "Pan Africa Christian University",
    "Pioneer International University",
    "Pwani University",
    "Riara University",
    "Rongo University",
    "South Eastern Kenya University",
    "Strathmore University",
    "Taita Taveta University",
    "Technical University of Kenya",
    "Technical University of Mombasa",
    "United States International University - Africa",
    "University of Eldoret",
    "University of Kabianga",
    "University of Nairobi",
    "Zetech University"
];

const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'analytics' | 'logs' | 'users' | 'risk' | 'certs' | 'settings' | 'infrastructure' | 'requests' | 'database'>('analytics');
    const [dbTables, setDbTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [tableData, setTableData] = useState<DBTableData | null>(null);
    const [sqlQuery, setSqlQuery] = useState('');
    const [queryResult, setQueryResult] = useState<Record<string, unknown> | null>(null);
    const [dbStats, setDbStats] = useState<Record<string, unknown> | null>(null);

    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeSessions: 0,
        totalCertificates: 0,
        revokedCertificates: 0,
        totalLogs: 0,
        verificationPending: 0,
        securityEvents: 0
    });
    const [trends, setTrends] = useState<Trend[]>([]);

    const [logs, setLogs] = useState<Log[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [requests, setRequests] = useState<CertificateRequest[]>([]);
    const [settings, setSettings] = useState<SystemSettings>({});
    const [health, setHealth] = useState<SystemHealth | null>(null);

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [autoRefresh] = useState(false);

    // Check authentication
    useEffect(() => {
        const isAuthenticated = sessionStorage.getItem('admin_authenticated');
        if (!isAuthenticated) {
            toast.error('Admin authentication required');
            navigate('/admin-login');
        }
    }, [navigate]);

    const fetchData = useCallback(async () => {
        try {
            // Fetch Stats & Trends
            const resStats = await fetch('/admin/stats', { credentials: 'include' });
            if (resStats.ok) {
                const data = await resStats.json();
                setStats(data.stats);
                setTrends(data.trends);
            }

            // Fetch Logs
            const resLogs = await fetch('/admin/logs', { credentials: 'include' });
            if (resLogs.ok) {
                const data = await resLogs.json();
                const fetchedLogs = data.logs || [];
                setLogs(fetchedLogs);
                if (activeTab === 'logs') setFilteredLogs(fetchedLogs);
            }

            // Fetch Users
            const resUsers = await fetch('/admin/users', { credentials: 'include' });
            if (resUsers.ok) {
                const data = await resUsers.json();
                const fetchedUsers = data.users || [];
                setUsers(fetchedUsers);
                if (activeTab === 'users' || activeTab === 'risk') setFilteredUsers(fetchedUsers);
            }

            // Fetch Certificates
            const resCerts = await fetch('/certificates', { credentials: 'include' }); // Admin sees all
            if (resCerts.ok) {
                const data = await resCerts.json();
                setCertificates(data.certificates || []);
            }

            // Fetch Settings
            const resSettings = await fetch('/admin/settings', { credentials: 'include' });
            if (resSettings.ok) {
                const data = await resSettings.json();
                setSettings(data.settings || {});
            }

            // Fetch Health
            const resHealth = await fetch('/admin/system/health', { credentials: 'include' });
            if (resHealth.ok) {
                const data = await resHealth.json();
                setHealth(data);
            }

            // Fetch Requests
            const resReqs = await fetch('/admin/requests', { credentials: 'include' });
            if (resReqs.ok) {
                const data = await resReqs.json();
                setRequests(data.requests || []);
            }

            // Fetch DB Tables & Stats if on Database tab
            if (activeTab === 'database') {
                const resTables = await fetch('/admin/db/tables', { credentials: 'include' });
                if (resTables.ok) {
                    const data = await resTables.json();
                    setDbTables(data.tables.map((t: { name: string }) => t.name));
                }
                const resDbStats = await fetch('/admin/db/stats', { credentials: 'include' });
                if (resDbStats.ok) {
                    const data = await resDbStats.json();
                    setDbStats(data.stats);
                }
            }

        } catch (err) {
            console.error("Failed to fetch admin data", err);
            toast.error('Failed to sync system data');
        }
    }, [activeTab]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchData();
            setLoading(false);
        };
        init();
    }, [fetchData]);

    // Auto-refresh every 5 seconds if enabled
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    // Filter logic
    useEffect(() => {
        if (activeTab === 'logs') {
            let filtered = logs;
            if (searchQuery) {
                filtered = filtered.filter(log =>
                    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    log.email?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            setFilteredLogs(filtered);
        } else if (activeTab === 'users' || activeTab === 'risk') {
            let filtered = users;
            if (searchQuery) {
                filtered = filtered.filter(u =>
                    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            if (activeTab === 'risk') {
                filtered = filtered.filter(u => u.riskScore > 20 || u.isBanned);
            }
            setFilteredUsers(filtered);
        }
    }, [searchQuery, logs, users, activeTab]);

    const handleLogout = async () => {
        try {
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
            sessionStorage.removeItem('admin_authenticated');
            sessionStorage.removeItem('admin_login_time');
            toast.success('Admin logged out successfully');
            navigate('/admin-login');
        } catch (err) {
            sessionStorage.removeItem('admin_authenticated');
            sessionStorage.removeItem('admin_login_time');
            navigate('/admin-login');
        }
    };

    const handleBanUser = async (userId: string, isBanned: boolean) => {
        const action = isBanned ? 'unban' : 'ban';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        const toastId = toast.loading(`${isBanned ? 'Unbanning' : 'Banning'} user...`);
        try {
            const res = await fetch(`/admin/users/${userId}/ban`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message, { id: toastId });
                fetchData();
            } else {
                toast.error(data.error, { id: toastId });
            }
        } catch (err) {
            toast.error("Network error", { id: toastId });
        }
    };

    const handleResetLockout = async (identifier: string) => {
        const toastId = toast.loading(`Resetting lockout for ${identifier}...`);
        try {
            const res = await fetch('/admin/reset-lockout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier }),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message, { id: toastId });
                fetchData();
            } else {
                toast.error(data.error || "Failed to reset lockout", { id: toastId });
            }
        } catch (err) {
            toast.error("Network error", { id: toastId });
        }
    };

    // Revoke Certificate
    const handleRevokeCert = async (certId: string) => {
        if (!confirm("Are you sure? This action will mark the certificate as revoked.")) return;

        try {
            const res = await fetch(`/certificates/${certId}/revoke`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Certificate revoked");
                fetchData();
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error("Failed to revoke certificate");
        }
    };

    // Update Setting
    const handleUpdateSetting = async (key: string, value: string) => {
        try {
            const res = await fetch('/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
                credentials: 'include'
            });
            if (res.ok) {
                toast.success("Setting updated");
                fetchData();
            }
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleUpdateRole = async (userId: string, role: string) => {
        try {
            const res = await fetch(`/admin/users/${userId}/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
                credentials: 'include'
            });
            if (res.ok) {
                toast.success(`Role updated to ${role}`);
                fetchData();
            }
        } catch (err) {
            toast.error("Role update failed");
        }
    };

    const handleToggleVerify = async (userId: string) => {
        try {
            const res = await fetch(`/admin/users/${userId}/verify`, {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                toast.success("Verification status toggled");
                fetchData();
            }
        } catch (err) {
            toast.error("Action failed");
        }
    };

    const runSystemCommand = async (command: string) => {
        const toastId = toast.loading(`Executing ${command}...`);
        try {
            const res = await fetch(`/admin/${command}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message, { id: toastId });
                fetchData();
            } else {
                toast.error(data.error, { id: toastId });
            }
        } catch (err) {
            toast.error("Command failed", { id: toastId });
        }
    };

    const getLogIcon = (action: string) => {
        const actionLower = action?.toLowerCase() || '';
        if (actionLower.includes('login')) return <CheckCircle className="w-4 h-4 text-green-600" />;
        if (actionLower.includes('logout')) return <LogOut className="w-4 h-4 text-gray-600" />;
        if (actionLower.includes('fail') || actionLower.includes('error')) return <XCircle className="w-4 h-4 text-red-600" />;
        if (actionLower.includes('register')) return <Users className="w-4 h-4 text-blue-600" />;
        return <Activity className="w-4 h-4 text-gray-600" />;
    };

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'registrar', university: '', organizationName: '' });

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading("Creating user...");
        try {
            const res = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newUser,
                    university: newUser.university || newUser.organizationName,
                    organizationName: newUser.organizationName || newUser.university
                }),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("User created successfully", { id: toastId });
                setCreateModalOpen(false);
                setNewUser({ name: '', email: '', password: '', role: 'registrar', university: '', organizationName: '' });
                setShowPassword(false);
                fetchData();
            } else {
                toast.error(data.error || "Failed to create user", { id: toastId });
            }
        } catch (err) {
            toast.error("Network error", { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <RefreshCw className="w-12 h-12 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
            {/* Warning Header */}
            <div className="bg-red-600 text-white py-2 px-4 flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1 text-xs hover:text-gray-200 transition-colors"
                        title="Return to Site Home"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        SYSTEM ADMINISTRATION MODE - ROOT ACCESS
                    </div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 bg-red-700 hover:bg-red-800 rounded-lg">
                    <LogOut className="w-3 h-3" /> Logout
                </button>
            </div>

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
                            Admin Control Center
                        </h1>
                        <p className="text-gray-400">
                            System Status: <span className="text-green-400 font-bold">ONLINE</span> •
                            Security Level: <span className="text-red-400 font-bold">MAXIMUM</span>
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
                    {[
                        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                        { id: 'logs', icon: Activity, label: 'System Logs' },
                        { id: 'users', icon: Users, label: 'User Management' },
                        { id: 'risk', icon: Shield, label: 'Risk Dashboard' },
                        { id: 'certs', icon: FileCheck, label: 'Certificates' },
                        { id: 'requests', icon: Database, label: 'Requests' },
                        { id: 'infrastructure', icon: Terminal, label: 'Infrastructure' },
                        { id: 'database', icon: Database, label: 'Database' },
                        { id: 'settings', icon: Settings, label: 'Global Settings' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'analytics' | 'logs' | 'users' | 'risk' | 'certs' | 'settings' | 'infrastructure' | 'requests' | 'database')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-gray-800 text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 min-h-[500px]">
                    <AnimatePresence mode="wait">

                        {/* ANALYTICS TAB */}
                        {activeTab === 'analytics' && (
                            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                                        <div className="text-gray-400 text-sm">Total Users</div>
                                        <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                                        <div className="text-gray-400 text-sm">Active Certificates</div>
                                        <div className="text-3xl font-bold text-green-400">{stats.totalCertificates - stats.revokedCertificates}</div>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                                        <div className="text-gray-400 text-sm">Security Events</div>
                                        <div className="text-3xl font-bold text-red-400">{stats.securityEvents}</div>
                                    </div>
                                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                                        <div className="text-gray-400 text-sm">Pending Verifications</div>
                                        <div className="text-3xl font-bold text-yellow-400">{stats.verificationPending}</div>
                                    </div>
                                </div>

                                <div className="h-[300px] w-full bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                    <h3 className="text-lg font-bold mb-4">System Growth (Last 7 Days)</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="date" stroke="#9ca3af" />
                                            <YAxis stroke="#9ca3af" />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="New Users" />
                                            <Line type="monotone" dataKey="certs" stroke="#10b981" strokeWidth={2} name="New Certificates" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {health && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                        <div className="bg-gray-800/80 p-6 rounded-2xl border border-blue-500/20 shadow-glow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Cpu className="text-blue-400 w-5 h-5" />
                                                <h4 className="font-bold uppercase tracking-widest text-[10px] text-blue-400">Memory Engine</h4>
                                            </div>
                                            <div className="text-2xl font-black mb-1">{(health.memory.usage).toFixed(1)}%</div>
                                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="bg-blue-500 h-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${health.memory.usage}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2">Used: {((health.memory.total - health.memory.free) / 1024 / 1024 / 1024).toFixed(2)} GB / {(health.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB</p>
                                        </div>

                                        <div className="bg-gray-800/80 p-6 rounded-2xl border border-green-500/20 shadow-glow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Zap className="text-green-400 w-5 h-5" />
                                                <h4 className="font-bold uppercase tracking-widest text-[10px] text-green-400">System Uptime</h4>
                                            </div>
                                            <div className="text-2xl font-black mb-1">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</div>
                                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-tighter">Instance Heartbeat: OK</p>
                                        </div>

                                        <div className="bg-gray-800/80 p-6 rounded-2xl border border-red-500/20 shadow-glow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Database className="text-red-400 w-5 h-5" />
                                                <h4 className="font-bold uppercase tracking-widest text-[10px] text-red-400">Persistence Tier</h4>
                                            </div>
                                            <div className="text-xl font-bold mb-1 opacity-90">{health.dbStatus}</div>
                                            <p className="text-[10px] text-red-400/70 font-bold uppercase">Relational Integrity Confirmed</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* USERS & RISK TAB */}
                        {(activeTab === 'users' || activeTab === 'risk') && (
                            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            aria-label="Search users"
                                            placeholder="Search by email, role, or university..."
                                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    {activeTab === 'users' && (
                                        <button
                                            onClick={() => setCreateModalOpen(true)}
                                            className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-glow transition-all hover:scale-105"
                                        >
                                            <Users className="w-4 h-4" /> Add Registrar
                                        </button>
                                    )}
                                </div>

                                {/* Create User Modal */}
                                <AnimatePresence>
                                    {isCreateModalOpen && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                                        >
                                            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
                                                <h2 className="text-xl font-bold mb-6">Create University Registrar</h2>
                                                <form onSubmit={handleCreateUser} className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                                        <input
                                                            required
                                                            aria-label="Full Name"
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2"
                                                            value={newUser.name}
                                                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-gray-400 mb-1">University Name</label>
                                                        <select
                                                            required
                                                            aria-label="University Name"
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
                                                            value={newUser.university || newUser.organizationName || ''}
                                                            onChange={e => setNewUser({ ...newUser, university: e.target.value, organizationName: e.target.value })}
                                                        >
                                                            <option value="" disabled>Select University</option>
                                                            {KENYAN_UNIVERSITIES.map(uni => (
                                                                <option key={uni} value={uni}>{uni}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                                                        <input
                                                            required type="email"
                                                            aria-label="Email"
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2"
                                                            value={newUser.email}
                                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                                                        <div className="relative">
                                                            <input
                                                                required type={showPassword ? "text" : "password"}
                                                                aria-label="Password"
                                                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 pr-10"
                                                                value={newUser.password}
                                                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                                            >
                                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="hidden">
                                                        <label className="block text-sm text-gray-400 mb-1">Role</label>
                                                        <input
                                                            readOnly
                                                            aria-label="User Role"
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-500"
                                                            value="University Registrar"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-3 mt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCreateModalOpen(false)}
                                                            className="px-4 py-2 text-gray-400 hover:text-white"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                                                        >
                                                            Create Registrar
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* User Cards Grid */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredUsers.map(user => (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass p-6 rounded-2xl border border-gray-700 hover:border-primary/50 transition-all group"
                                        >
                                            {/* User Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-lg ${user.riskScore > 50 ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-primary to-blue-600'
                                                    }`}>
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-sm truncate">{user.email}</h3>
                                                        {user.isVerified ? (
                                                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black">
                                                            {user.role.toUpperCase()}
                                                        </Badge>
                                                        {user.university && (
                                                            <Badge className="bg-blue-900/40 text-blue-300 border-blue-800/30 text-[9px] font-black truncate max-w-[120px]">
                                                                {user.university}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* User Stats */}
                                            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-black/20 rounded-xl">
                                                <div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Risk Score</div>
                                                    <div className={`text-lg font-black ${user.riskScore > 50 ? 'text-red-400' : 'text-green-400'}`}>
                                                        {user.riskScore}<span className="text-xs text-gray-500">/100</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Status</div>
                                                    <div className="text-lg font-black">
                                                        {user.isBanned ? (
                                                            <span className="text-red-400 text-xs">BANNED</span>
                                                        ) : (
                                                            <span className="text-green-400 text-xs">ACTIVE</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* User ID */}
                                            <div className="mb-4 p-2 bg-black/20 rounded-lg">
                                                <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">User ID</div>
                                                <div className="text-xs font-mono text-gray-400 truncate">{user.id}</div>
                                            </div>

                                            {/* Actions */}
                                            {user.email !== 'root@system' ? (
                                                <div className="space-y-2">
                                                    <select
                                                        title="Update user role"
                                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg text-xs px-3 py-2 font-bold hover:border-primary/50 transition-colors"
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                    >
                                                        <option value="student">Student</option>
                                                        <option value="registrar">Registrar</option>
                                                        <option value="admin">Admin</option>
                                                    </select>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => handleToggleVerify(user.id)}
                                                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${user.isVerified
                                                                ? 'bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/50'
                                                                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                                                                }`}
                                                        >
                                                            {user.isVerified ? '✓ Verified' : 'Verify'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetLockout(user.email)}
                                                            className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-900/30 text-amber-400 border border-amber-800/50 hover:bg-amber-900/50 transition-all flex items-center justify-center gap-1"
                                                            title="Reset login attempts"
                                                        >
                                                            <Unlock className="w-3 h-3" /> Unlock
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleBanUser(user.id, user.isBanned)}
                                                        className={`w-full px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${user.isBanned
                                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                                            }`}
                                                    >
                                                        {user.isBanned ? 'Unban User' : 'Ban User'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                                    <span className="text-xs text-gray-500 font-black uppercase tracking-widest">🔒 System Root</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p className="font-bold">No users found</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* LOGS TAB */}
                        {activeTab === 'logs' && (
                            <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <table className="w-full text-left text-sm">
                                    <thead className="text-gray-400 border-b border-gray-700">
                                        <tr>
                                            <th className="p-2">Time</th>
                                            <th className="p-2">Action</th>
                                            <th className="p-2">User</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {filteredLogs.map((log, i) => (
                                            <tr key={i} className="hover:bg-gray-700/50">
                                                <td className="p-2 text-gray-500">{new Date(log.timestamp || log.createdAt || '').toLocaleTimeString()}</td>
                                                <td className="p-2 flex items-center gap-2">
                                                    {getLogIcon(log.action)} {log.action}
                                                </td>
                                                <td className="p-2 text-gray-300">{log.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </motion.div>
                        )}

                        {/* CERTIFICATES TAB */}
                        {activeTab === 'certs' && (
                            <motion.div key="certs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-900/50 text-gray-400">
                                            <tr>
                                                <th className="p-3">ID</th>
                                                <th className="p-3">Recipient</th>
                                                <th className="p-3">Course</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {certificates.map(cert => (
                                                <tr key={cert.id} className="hover:bg-gray-700/30">
                                                    <td className="p-3 font-mono text-xs">{cert.id.substring(0, 8)}...</td>
                                                    <td className="p-3">{cert.name}</td>
                                                    <td className="p-3 text-gray-400">{cert.course}</td>
                                                    <td className="p-3">
                                                        {cert.revoked ?
                                                            <span className="bg-red-900/50 text-red-200 px-2 py-1 rounded text-xs border border-red-800">REVOKED</span> :
                                                            <span className="bg-green-900/50 text-green-200 px-2 py-1 rounded text-xs border border-green-800">VALID</span>
                                                        }
                                                    </td>
                                                    <td className="p-3">
                                                        {!cert.revoked && (
                                                            <button
                                                                onClick={() => handleRevokeCert(cert.id)}
                                                                className="text-red-400 hover:text-red-300 text-xs font-bold border border-red-900 bg-red-900/20 px-3 py-1 rounded hover:bg-red-900/40"
                                                            >
                                                                Revoke
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {/* SETTINGS TAB */}
                        {activeTab === 'settings' && (
                            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Maintenance Mode */}
                                    <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Server className="w-6 h-6 text-orange-400" />
                                                <div>
                                                    <h3 className="font-bold text-white">Maintenance Mode</h3>
                                                    <p className="text-xs text-gray-400">Suspend all non-admin access</p>
                                                </div>
                                            </div>
                                            <button
                                                title="Toggle Maintenance Mode"
                                                onClick={() => handleUpdateSetting('maintenanceMode', settings.maintenanceMode === 'true' ? 'false' : 'true')}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode === 'true' ? 'bg-green-500' : 'bg-gray-600'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.maintenanceMode === 'true' ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Registration */}
                                    <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <Users className="w-6 h-6 text-blue-400" />
                                                <div>
                                                    <h3 className="font-bold text-white">Allow Public Registration</h3>
                                                    <p className="text-xs text-gray-400">Toggle new user signups</p>
                                                </div>
                                            </div>
                                            <button
                                                title="Toggle Registration"
                                                onClick={() => handleUpdateSetting('allowRegistration', settings.allowRegistration === 'true' ? 'false' : 'true')}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.allowRegistration === 'true' ? 'bg-green-500' : 'bg-gray-600'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.allowRegistration === 'true' ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Min Risk Score Input */}
                                    <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Shield className="w-6 h-6 text-red-400" />
                                            <h3 className="font-bold text-white">Automatic Ban Threshold</h3>
                                        </div>
                                        <div className="flex gap-4">
                                            <input
                                                type="number"
                                                aria-label="Minimum Risk Score"
                                                className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white"
                                                placeholder="80"
                                                value={settings.minRiskScore || ''}
                                                onChange={(e) => setSettings({ ...settings, minRiskScore: e.target.value })}
                                            />
                                            <button
                                                onClick={() => handleUpdateSetting('minRiskScore', settings.minRiskScore || '80')}
                                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    {/* Manual Identifier Reset */}
                                    <div className="bg-gray-700/30 p-6 rounded-xl border border-gray-600">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Unlock className="w-6 h-6 text-amber-400" />
                                            <h3 className="font-bold text-white">Emergency Lockout Reset</h3>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4">Manually clear login attempt limits for a specific Email or IP address.</p>
                                        <div className="flex gap-4">
                                            <input
                                                id="emergency-reset-input"
                                                type="text"
                                                aria-label="Email or IP to Reset"
                                                className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white"
                                                placeholder="email@example.com or 1.2.3.4"
                                            />
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('emergency-reset-input') as HTMLInputElement;
                                                    if (input.value) handleResetLockout(input.value);
                                                }}
                                                className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded font-bold whitespace-nowrap"
                                            >
                                                Reset Now
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}

                        {/* INFRASTRUCTURE TAB */}
                        {activeTab === 'infrastructure' && (
                            <motion.div key="infrastructure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                                                <Terminal className="w-4 h-4" /> System Command Gateway
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    { cmd: 'flush-cache', label: 'Flush System Cache', icon: Zap, color: 'text-blue-400', desc: 'Clears all server-side object caching and session metadata.' },
                                                    { cmd: 'audit-db', label: 'Database Integrity Audit', icon: Database, color: 'text-purple-400', desc: 'Validates relational constraints and pointer accuracy.' },
                                                    { cmd: 'review-access', label: 'Trigger Security Review', icon: ShieldAlert, color: 'text-amber-400', desc: 'Analyzes all active session tokens for behavioral anomalies.' },
                                                    { cmd: 'dispatch-alerts', label: 'Broadcast System Alert', icon: Radio, color: 'text-red-400', desc: 'Sends urgent security notifications to all connected nodes.' },
                                                ].map(item => (
                                                    <button
                                                        key={item.cmd}
                                                        onClick={() => runSystemCommand(item.cmd)}
                                                        className="group flex items-start gap-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:border-primary/50 hover:bg-gray-700/50 transition-all text-left"
                                                    >
                                                        <div className={`p-2 rounded-lg bg-gray-900 ${item.color}`}>
                                                            <item.icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{item.label}</p>
                                                            <p className="text-[10px] text-gray-500 mt-1">{item.desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                                                <Bug className="w-4 h-4" /> Production Diagnostics
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-black/40 rounded-xl font-mono text-[10px] leading-relaxed relative overflow-hidden">
                                                    <div className="text-green-500 mb-2">/usr/bin/node -v: {health?.nodeVersion}</div>
                                                    <div className="text-gray-400"># System Resources</div>
                                                    <div className="text-blue-400">LOAD_AVG_1M: {health?.cpu[0]?.toFixed(2)}</div>
                                                    <div className="text-blue-400">MEM_AVAILABLE: {((health?.memory.free || 0) / 1024 / 1024).toFixed(0)} MB</div>
                                                    <div className="text-blue-400">OS_PLATFORM: {health?.platform}</div>
                                                    <div className="mt-4 text-green-500/50 blink">Checking for security patches...</div>
                                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                                        <Activity className="w-12 h-12" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-4 bg-red-900/10 border border-red-900/20 rounded-xl">
                                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                                    <div>
                                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Emergency Shutdown</p>
                                                        <p className="text-[9px] text-gray-400 mt-0.5">Immediately terminates the process and enters safe-mode.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm("CRITICAL WARNING: This will immediately terminate the system process. Are you absolutely certain?"))
                                                                runSystemCommand('shutdown');
                                                        }}
                                                        title="Emergency Shutdown"
                                                        aria-label="Emergency System Shutdown"
                                                        className="ml-auto p-2 bg-red-600 rounded-lg hover:bg-red-700 shadow-glow-sm"
                                                    >
                                                        <Power className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* REQUESTS TAB */}
                        {activeTab === 'requests' && (
                            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-900/50 text-gray-400">
                                            <tr>
                                                <th className="p-3">Student</th>
                                                <th className="p-3">University</th>
                                                <th className="p-3">Course</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {requests.map(req => (
                                                <tr key={req.id} className="hover:bg-gray-700/30">
                                                    <td className="p-3 font-bold">{req.studentName}</td>
                                                    <td className="p-3 text-blue-400">{req.university}</td>
                                                    <td className="p-3 text-gray-400">{req.course}</td>
                                                    <td className="p-3">
                                                        <Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'} className="rounded-lg text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
                                                            {req.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-500">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'database' && (
                            <motion.div key="database" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    {/* Sidebar: Tables & Stats */}
                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Database className="w-3 h-3 text-primary" /> System Tables
                                            </h3>
                                            <div className="space-y-1">
                                                {dbTables.map(table => (
                                                    <button
                                                        key={table}
                                                        onClick={async () => {
                                                            setSelectedTable(table);
                                                            const res = await fetch(`/admin/db/table/${table}`, { credentials: 'include' });
                                                            if (res.ok) setTableData(await res.json());
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedTable === table ? 'bg-primary text-white shadow-glow-sm' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'}`}
                                                    >
                                                        {table}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {dbStats && (
                                            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                                                    Storage Stats
                                                    <button
                                                        onClick={() => window.open('/admin/db/download', '_blank')}
                                                        className="text-[9px] bg-primary/20 hover:bg-primary/40 text-primary px-2 py-0.5 rounded transition-all uppercase"
                                                    >
                                                        Backup
                                                    </button>
                                                </h3>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between"><span className="text-gray-500">Total Size:</span> <span>{(Number(dbStats.totalSize) / 1024).toFixed(2)} KB</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Page Size:</span> <span>{Number(dbStats.pageSize)} B</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Journal:</span> <span className="text-green-400 font-bold uppercase">{String(dbStats.journalMode)}</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Main Content: Query & Explorer */}
                                    <div className="lg:col-span-3 space-y-6">
                                        {/* Query Terminal */}
                                        <div className="bg-black/40 p-6 rounded-2xl border border-gray-700/50 shadow-2xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Terminal className="w-4 h-4 text-primary" />
                                                    <h3 className="font-bold text-sm">SQL Terminal (System Root Only)</h3>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        const toastId = toast.loading("Executing query...");
                                                        try {
                                                            const res = await fetch('/admin/db/query', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ sql: sqlQuery }),
                                                                credentials: 'include'
                                                            });
                                                            const data = await res.json();
                                                            if (res.ok) {
                                                                setQueryResult(data.result);
                                                                toast.success("Query successful", { id: toastId });
                                                            } else {
                                                                toast.error(data.error, { id: toastId });
                                                            }
                                                        } catch (err) {
                                                            toast.error("Network error", { id: toastId });
                                                        }
                                                    }}
                                                    className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-glow transition-all active:scale-95"
                                                >
                                                    Execute
                                                </button>
                                            </div>
                                            <textarea
                                                className="w-full h-24 bg-gray-900 border border-gray-700 rounded-xl p-4 font-mono text-sm text-green-400 placeholder:text-gray-600 focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                                placeholder="SELECT * FROM users WHERE role = 'admin'..."
                                                value={sqlQuery}
                                                onChange={e => setSqlQuery(e.target.value)}
                                            />
                                            {queryResult && (
                                                <div className="mt-4 p-4 bg-black/60 rounded-xl border border-white/5 overflow-auto max-h-60">
                                                    <pre className="text-[10px] text-gray-400 font-mono">
                                                        {JSON.stringify(queryResult, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>

                                        {/* Table Explorer */}
                                        <div className="bg-gray-900/30 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                                            <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
                                                <h3 className="font-bold text-sm flex items-center gap-2">
                                                    <Search className="w-3 h-3 text-gray-400" />
                                                    {selectedTable ? `Browsing: ${selectedTable}` : 'Select a table to browse data'}
                                                </h3>
                                                <div className="flex items-center gap-4">
                                                    {selectedTable && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`Are you SURE you want to WIPE all data from ${selectedTable}? This cannot be undone.`)) return;
                                                                const res = await fetch(`/admin/db/table/${selectedTable}/wipe`, { method: 'POST', credentials: 'include' });
                                                                if (res.ok) {
                                                                    toast.success("Table wiped successfully");
                                                                    // Refresh
                                                                    const resRef = await fetch(`/admin/db/table/${selectedTable}`, { credentials: 'include' });
                                                                    if (resRef.ok) setTableData(await resRef.json());
                                                                } else {
                                                                    const data = await res.json();
                                                                    toast.error(data.error || "Wipe failed");
                                                                }
                                                            }}
                                                            className="text-[9px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest border border-red-900/30 px-2 py-1 rounded transition-all"
                                                        >
                                                            Wipe Table
                                                        </button>
                                                    )}
                                                    {tableData && (
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                            {tableData.pagination.total} Total Records
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-black/20 text-gray-400 font-black uppercase tracking-tighter">
                                                        <tr>
                                                            {tableData?.columns.map(col => (
                                                                <th key={col.name} className="p-3 whitespace-nowrap">{col.name}</th>
                                                            ))}
                                                            {tableData && <th className="p-3">Actions</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-700/50">
                                                        {tableData?.rows.map((row, i) => (
                                                            <tr key={i} className="hover:bg-primary/5 transition-colors">
                                                                {tableData?.columns.map(col => (
                                                                    <td key={col.name} className="p-3 text-gray-300 font-bold truncate max-w-[200px]">
                                                                        {String(row[col.name]) || 'NULL'}
                                                                    </td>
                                                                ))}
                                                                <td className="p-3">
                                                                    <button
                                                                        onClick={async () => {
                                                                            const pkCol = tableData.columns.find(c => c.pk === 1) || tableData.columns[0];
                                                                            const pkVal = row[pkCol.name];
                                                                            if (!confirm(`Delete record where ${pkCol.name} = ${pkVal}?`)) return;

                                                                            const res = await fetch(`/admin/db/table/${selectedTable}/row/${pkCol.name}/${pkVal}`, {
                                                                                method: 'DELETE',
                                                                                credentials: 'include'
                                                                            });
                                                                            if (res.ok) {
                                                                                toast.success("Row deleted");
                                                                                // Refresh local state
                                                                                const newRows = tableData.rows.filter((_, idx) => idx !== i);
                                                                                setTableData({ ...tableData, rows: newRows, pagination: { ...tableData.pagination, total: tableData.pagination.total - 1 } });
                                                                            } else {
                                                                                toast.error("Delete failed");
                                                                            }
                                                                        }}
                                                                        className="text-red-500 hover:text-red-400 transition-colors"
                                                                        title="Delete Row"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!tableData || tableData.rows.length === 0) && (
                                                            <tr>
                                                                <td colSpan={100} className="p-12 text-center text-gray-600 font-bold italic">
                                                                    {selectedTable ? 'Table is empty' : 'Scan the ledger to begin exploration'}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}


                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
