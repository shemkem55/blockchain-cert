import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { toast } from 'sonner';
import { certificateService } from '@/services/certificateService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Award, User, Upload, Shield, CheckCircle2, Clock, Target, Zap, BookOpen, LogOut, Loader2, AlertCircle, TrendingUp, BarChart3, Search, ShieldCheck, AlertTriangle, FilePlus, Send, History, UserCheck, XCircle, RefreshCw, Share2, ExternalLink, Copy, Check, Download, Users, Building, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AIAssistant } from '@/components/blockchain/AIAssistant';
import { kenyanUniversities } from '@/data/kenyanUniversities';
import { useWeb3 } from '@/contexts/Web3Context';
import { Wallet, Lock as LockIcon } from 'lucide-react';
import jsQR from 'jsqr';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { OnboardingTour } from '@/components/OnboardingTour';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { QuickActionsMenu } from '@/components/QuickActionsMenu';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type Cert = {
  id: string;
  recipientName: string;
  title: string;
  issuedAt: string;
  issuerName: string;
  status: string;
};

type UserProfile = {
  id: string;
  email: string;
  role: string;
  university?: string;
  registrationNumber?: string;
  graduationYear?: string;
  degreeType?: string;
  isVerified?: boolean;
  walletAddress?: string;
  certificateFile?: string;
  transcriptsFile?: string;
  idPassportFile?: string;
};

interface VerifyResult extends Partial<Cert> {
  valid?: boolean;
  error?: string;
  transactionHash?: string;
  recipientAddress?: string;
  institution?: string;
  certificateType?: string;
  description?: string;
  honors?: string;
  reasons?: string[];
  year?: string;
}

type AIInsights = {
  careerPath: string[];
  skills: string[];
  marketDemand: string;
  recommendedCerts: string[];
};

interface CertificateRequest {
  id: string;
  university: string;
  course: string;
  registrationNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  studentName: string;
  studentEmail: string;
  rejectionReason?: string;
}

interface VerificationHistoryItem {
  id: string;
  employerEmail: string;
  certificateId: string;
  status: string;
  createdAt: string;
  result: VerifyResult;
  reasons: string[];
}

const StudentPortal = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const { connect, address: walletAddress, isConnected } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [certificates, setCertificates] = useState<Cert[]>([]);
  const [query, setQuery] = useState('');

  // Profile Form State
  const [profile, setProfile] = useState({
    university: '',
    registrationNumber: '',
    graduationYear: '',
    degreeType: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiData, setAiData] = useState<AIInsights | null>(null);

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);

  // Advanced Features State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quickActionsPos, setQuickActionsPos] = useState<{ x: number, y: number } | null>(null);

  // Initialize Advanced Hooks
  // 1. File Upload Hook
  const fileUpload = useFileUpload({
    onSuccess: (f, preview) => {
      handleIdentityDocUpload(f, preview);
    },
    onError: (msg) => toast.error(msg)
  });

  // 2. Keyboard Shortcuts
  const shortcuts = [
    {
      key: 'v',
      ctrlKey: true,
      action: () => quickVerifyId && handleQuickVerify(),
      description: 'Quick Verify (if ID present)'
    },
    {
      key: 'u',
      ctrlKey: true,
      action: () => document.getElementById('cert-upload-v5')?.click(),
      description: 'Upload Document'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => setSearchParams({ tab: 'request-issuance' }),
      description: 'New Request'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => verificationOutcome && downloadReport(),
      description: 'Download Report'
    }
  ];
  const { showHelp: showShortcutsHelp, setShowHelp: setShowShortcutsHelp } = useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    // Check for first-time user
    const hasOnboarded = localStorage.getItem('onboarding_completed');
    if (!hasOnboarded) {
      // Small delay to allow UI to settle
      const timer = setTimeout(() => setShowOnboarding(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setQuickActionsPos({ x: e.clientX, y: e.clientY });
  };

  // Requests State
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [requestForm, setRequestForm] = useState({
    university: '',
    registrationNumber: '',
    course: '',
    studentName: ''
  });
  const [requestFiles, setRequestFiles] = useState<{
    transcripts?: File;
    idPassport?: File;
  }>({});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [scannedPayload, setScannedPayload] = useState<{
    id?: string,
    name?: string,
    program?: string,
    regNo?: string,
    institution?: string
  } | null>(null);

  // Verification History State
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Quick Verification State
  const [quickVerifyId, setQuickVerifyId] = useState('');
  const [quickVerifyResult, setQuickVerifyResult] = useState<Cert | { error: string } | null>(null);
  const [isQuickVerifying, setIsQuickVerifying] = useState(false);

  const recordVerification = async (outcome: { id?: string; isValid: boolean; reasons: string[] }) => {
    try {
      await fetch('/employer/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: outcome.id || quickVerifyId,
          status: outcome.isValid ? 'Authentic' : 'Invalid',
          result: outcome,
          reasons: outcome.reasons || []
        }),
        credentials: 'include'
      });
      fetchVerificationHistory();
    } catch (err) {
      console.error('Failed to record verification:', err);
    }
  };

  const handleQuickVerify = async () => {
    if (!quickVerifyId) return;
    setIsQuickVerifying(true);
    setQuickVerifyResult(null);
    try {
      const res = await certificateService.verifyCertificate(quickVerifyId);
      if (res && !res.error) {
        setQuickVerifyResult(res);

        const cert = res.certificate || res;

        // INTEGRITY CROSS-CHECK (Similar to Employer Portal)
        let isTampered = false;
        let tamperedError = "";

        if (scannedPayload) {
          const dbName = cert.recipientName || '';
          const qrName = scannedPayload.name || '';
          const dbProgram = cert.title || '';
          const qrProgram = scannedPayload.program || '';

          if (qrName && dbName.toLowerCase().trim() !== qrName.toLowerCase().trim()) {
            isTampered = true;
            tamperedError = `Identity Mismatch! Scanned document name ('${qrName}') does not match official record ('${dbName}').`;
          } else if (qrProgram && dbProgram.toLowerCase().trim() !== qrProgram.toLowerCase().trim()) {
            isTampered = true;
            tamperedError = `Academic Mismatch! Scanned course ('${qrProgram}') does not match official record ('${dbProgram}').`;
          }
        }

        if (isTampered) {
          const tamperedOutcome = {
            ...cert,
            isValid: false,
            status: "Tampered / Fraudulent",
            reasons: [tamperedError, "Security Alert: Document data has been modified from its original on-chain state."]
          };
          setVerificationOutcome(tamperedOutcome);
          recordVerification(tamperedOutcome);
          setQuickVerifyResult({ error: "Tampering Detected!" });
          toast.error("Security Alert: Document Tampering Detected!");
          return;
        }

        // Also update the Verification Center outcome for immediate local feedback
        const outcome = {
          ...cert,
          isValid: true,
          status: "Blockchain Authenticated",
          reasons: [
            "Cryptographic signature verified on the EVM.",
            "Certificate ID matches official on-chain anchor.",
            `Verified recipient: ${cert.recipientName}`
          ]
        };
        setVerificationOutcome(outcome);
        recordVerification(outcome);
        toast.success("Certificate Authenticated!");
      } else {
        const errorMsg = res?.error || "Invalid Certificate ID";
        setQuickVerifyResult({ error: errorMsg });
        const outcome = {
          isValid: false,
          status: "Verification Failed",
          reasons: [errorMsg, "No matching anchor found on the blockchain ledger."]
        };
        setVerificationOutcome(outcome);
        recordVerification({ ...outcome, id: quickVerifyId });
        toast.error("Verification Failed");
      }
    } catch (err) {
      setQuickVerifyResult({ error: "Service Error" });
      setVerificationOutcome({
        isValid: false,
        status: "Error",
        reasons: ["Failed to connect to blockchain service provider."]
      });
    } finally {
      setIsQuickVerifying(false);
    }
  };

  const downloadReport = () => {
    if (!verificationOutcome) return;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 102, 204);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Verification Report', 20, 25);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 50);
    doc.text(`Verification ID: ${verificationOutcome.id || 'N/A'}`, 20, 55);

    // Result
    doc.setFontSize(14);
    doc.text('Status:', 20, 70);
    if (verificationOutcome.isValid) {
      doc.setTextColor(0, 153, 0);
      doc.text('VERIFIED ✓', 40, 70);
    } else {
      doc.setTextColor(204, 0, 0);
      doc.text('FAILED ✗', 40, 70);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('Candidate Details:', 20, 85);
    doc.setFontSize(10);
    let y = 95;
    doc.text(`Recipient: ${verificationOutcome.recipientName || 'N/A'}`, 20, y); y += 7;
    doc.text(`Course: ${verificationOutcome.title || 'N/A'}`, 20, y); y += 7;
    doc.text(`Institution: ${verificationOutcome.institution || verificationOutcome.issuerName || 'N/A'}`, 20, y); y += 7;
    doc.text(`Issued Date: ${verificationOutcome.issuedAt ? new Date(verificationOutcome.issuedAt).toLocaleDateString() : 'N/A'}`, 20, y); y += 15;

    doc.setFontSize(12);
    doc.text('Verification Findings:', 20, y); y += 10;
    doc.setFontSize(10);
    verificationOutcome.reasons?.forEach(r => {
      doc.text(`- ${r}`, 20, y);
      y += 7;
    });

    y += 10;
    if (verificationOutcome.transactionHash) {
      doc.setFontSize(12);
      doc.text('Blockchain Data:', 20, y); y += 10;
      doc.setFontSize(8);
      doc.text(`Tx Hash: ${verificationOutcome.transactionHash}`, 20, y);
    }

    doc.save(`Verification_Report_${verificationOutcome.id || 'record'}.pdf`);
    toast.success('Report downloaded successfully!');
  };

  // Verification Outcome State
  const [verificationOutcome, setVerificationOutcome] = useState<(VerifyResult & { isValid: boolean, status: string, reasons: string[] }) | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/certificates/my-requests', { credentials: 'include' });
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
    } catch (err) {
      console.error('Failed to load requests', err);
    }
  };

  const fetchVerificationHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/student/verification-history', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVerificationHistory(data);
      }
    } catch (err) {
      console.error('Failed to load verification history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this history record?")) return;

    try {
      const res = await fetch(`/student/verification-history/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Record deleted");
        setVerificationHistory(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error("Failed to delete record");
      }
    } catch (err) {
      toast.error("Error deleting record");
    }
  };

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (!res.ok) {
          navigate('/login');
          return;
        }
        const data = await res.json();

        if (!data.user || data.user.role?.toLowerCase() !== 'student') {
          toast.error('Access denied: Student portal');
          navigate('/');
          return;
        }
        setUser(data.user);

        // Initialize profile form
        setProfile({
          university: data.user.university || '',
          registrationNumber: data.user.registrationNumber || '',
          graduationYear: data.user.graduationYear || '',
          degreeType: data.user.degreeType || ''
        });

        // load certificates
        try {
          const certs = await certificateService.getMyCertificates(data.user.email);
          setCertificates(certs);
          await fetchRequests();
          await fetchVerificationHistory();
        } catch (err) {
          console.error('Failed to load certificates', err);
        }
      } catch (err) {
        console.error(err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/ai/analyze', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setAiData(data.insights);
        toast.success("AI Analysis detailed report generated!");
      } else {
        toast.error("Failed to generate insights.");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI Service Unavailable");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLinkWallet = async () => {
    try {
      const addr = await connect();
      if (addr) {
        const res = await fetch('/auth/link-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: addr }),
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          const updatedUser = { ...user!, walletAddress: addr };
          setUser(updatedUser);
          toast.success('Wallet linked to profile successfully!');
          return addr;
        } else {
          toast.error(data.error || 'Failed to link wallet');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect wallet');
    }
    return null;
  };

  const copyVerificationLink = (id: string) => {
    const url = `${window.location.origin}/verify?id=${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Verification link copied to clipboard!');
  };

  // --- Upgraded Document Processing (Similar to Employer Portal) ---

  const fallbackFilenameCheck = (f: File | null) => {
    if (!f) { setIsExtracting(false); return; }
    const filenameMatch = f.name.match(/[a-f0-9]{10}/i);
    if (filenameMatch) {
      setQuickVerifyId(filenameMatch[0]);
      toast.info('ID detected from filename.', { description: 'Ready to verify.' });
    }
    setIsExtracting(false);
  };

  const processScannedData = (imageData: ImageData, originalFile: File) => {
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data) {
      try {
        const payload = JSON.parse(code.data);
        if (payload.id && payload.id !== 'PENDING') {
          setQuickVerifyId(payload.id);
          setScannedPayload(payload);
          toast.success('Certificate ID decoded from embedded QR!');
          setIsExtracting(false);
          return;
        }
      } catch (e) { /* Ignore non-JSON */ }

      const match = code.data.match(/[a-f0-9]{10}/i);
      if (match) {
        setQuickVerifyId(match[0]);
        toast.success('Certificate ID extracted from document scan!');
        setIsExtracting(false);
        return;
      }
    }
    fallbackFilenameCheck(originalFile);
  };

  const handleIdentityDocUpload = async (f: File, existingPreview?: string) => {
    if (!f) return;

    // Type validation is now handled by useFileUpload hook

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

    // For images, show immediately. For PDFs, wait for render.
    if (!isPdf) {
      if (existingPreview) {
        setPreviewUrl(existingPreview);
      } else {
        setPreviewUrl(URL.createObjectURL(f));
      }
    } else {
      // Clear preview while processing PDF
      setPreviewUrl(null);
    }

    setFile(f);
    setIsExtracting(true);
    setQuickVerifyId('');

    try {
      if (f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.name)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
              processScannedData(data, f);
            } else fallbackFilenameCheck(f);
          };
          img.onerror = () => fallbackFilenameCheck(f);
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(f);
      } else if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await f.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await page.render({ canvasContext: context, viewport } as any).promise;

          // Generate high-quality thumbnail for preview
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setPreviewUrl(dataUrl);

          const data = context.getImageData(0, 0, canvas.width, canvas.height);
          const textContent = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const textItems = textContent.items.map((item: any) => item.str || '').join(' ');
          const idMatch = textItems.match(/[a-f0-9]{10}/i);
          if (idMatch) {
            setQuickVerifyId(idMatch[0]);
            toast.info('ID detected from document text');
          }
          processScannedData(data, f);
        } else fallbackFilenameCheck(f);
      }
    } catch (err) {
      console.error(err);
      fallbackFilenameCheck(f);
    }
  };

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validation Guard
    if (!profile.university || !profile.registrationNumber) {
      toast.error("Please complete your University and Registration Number.");
      return;
    }
    if (!file && !user?.certificateFile) {
      toast.error("Please upload your Degree Certificate for verification.");
      return;
    }

    setUploading(true);
    // Immediate feedback that verification has started
    setVerificationOutcome({
      isValid: false,
      status: "In Progress",
      reasons: ["Connecting to blockchain nodes...", "Verifying document signatures...", "Cross-referencing registrar records..."]
    });

    const formData = new FormData();
    formData.append('university', profile.university);
    formData.append('registrationNumber', profile.registrationNumber);
    formData.append('graduationYear', profile.graduationYear);
    formData.append('degreeType', profile.degreeType);

    if (file) formData.append('certificateFile', file);

    try {
      const res = await fetch('/auth/update-profile', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setUser(data.user);
      setFile(null);

      // If we have a detected ID, perform an immediate blockchain verification check to show findings
      if (quickVerifyId) {
        try {
          const verifyRes = await certificateService.verifyCertificate(quickVerifyId);
          if (verifyRes && !verifyRes.error) {
            const cert = verifyRes.certificate || verifyRes;
            const profileOutcome = {
              ...cert,
              isValid: true,
              status: "Profile Updated & Blockchain Verified",
              reasons: [
                "Official records updated in Registrar database.",
                "Cryptographic signature verified on the EVM.",
                "Certificate ID matches official on-chain anchor.",
                `Verified recipient: ${cert.recipientName}`
              ]
            };
            setVerificationOutcome(profileOutcome);
            recordVerification(profileOutcome);
            toast.success("Verification Complete!");
            return;
          }
        } catch (vErr) {
          console.error("Post-update verification check failed:", vErr);
        }
      }

      if (data.verificationResult) {
        setVerificationOutcome(data.verificationResult);
      } else {
        setVerificationOutcome({
          isValid: true,
          status: "Update Successful",
          reasons: ["Academic records successfully submitted.", "Document stored securely in Digital Vault.", "Pending Registrar signature verification."]
        });
      }

      toast.success(data.message || 'Profile and certificate updated successfully!');
      if (data.anchored) {
        console.log('Document Anchored to Ledger:', data.transactionHash);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitCertificateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.university || !requestForm.registrationNumber || !requestForm.course) {
      toast.error("Please fill in all required fields (University, Registration Number, Course).");
      return;
    }

    setSubmittingRequest(true);
    const formData = new FormData();
    formData.append('university', requestForm.university);
    formData.append('registrationNumber', requestForm.registrationNumber);
    formData.append('course', requestForm.course);
    formData.append('studentName', requestForm.studentName || user?.email.split('@')[0] || '');

    if (requestFiles.transcripts) formData.append('transcriptsFile', requestFiles.transcripts);
    if (requestFiles.idPassport) formData.append('idPassportFile', requestFiles.idPassport);

    try {
      const res = await fetch('/certificates/request', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      toast.success("Certificate request submitted successfully! Your university registrar will review it.");
      setRequestForm({
        university: '',
        registrationNumber: '',
        course: '',
        studentName: ''
      });
      setRequestFiles({});
      await fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Calculate profile completion
  const calculateCompletion = () => {
    if (!user) return 0;
    let score = 25; // Base account creation
    if (user.university && user.university !== '') score += 10;
    if (user.registrationNumber && user.registrationNumber !== '') score += 10;
    if (user.graduationYear && user.graduationYear !== '') score += 10;
    if (user.degreeType && user.degreeType !== '') score += 10;
    if (user.certificateFile) score += 15;
    if (user.transcriptsFile) score += 10;
    if (user.idPassportFile) score += 10;
    return Math.min(score, 100);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.password) {
      return toast.error("Please fill in all password fields");
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (!isNewPasswordValid) {
      return toast.error("New password does not meet security requirements");
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
      if (!res.ok) throw new Error(data.error || 'Password change failed');

      toast.success("Password updated successfully!");
      setPasswordForm({ oldPassword: '', password: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="flex flex-col min-h-screen bg-transparent" onContextMenu={handleContextMenu}>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary/20 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Certified Identity Profile</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">
                Student <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-md">
                Manage your academic credentials and explore AI-driven career intelligence powered by <span className="text-primary font-bold">CertChain</span>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 relative z-10">
              <div className="flex flex-col items-end mr-4">
                <Badge variant={user?.isVerified ? "default" : "secondary"} className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider", user?.isVerified ? "bg-primary text-primary-foreground shadow-glow-sm" : "bg-white/5 text-muted-foreground border-white/10")}>
                  {user?.isVerified ? "Verified Identity" : "Verification Pending"}
                </Badge>
                {user?.walletAddress ? (
                  <span className="text-[9px] font-mono text-muted-foreground mt-2">
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </span>
                ) : (
                  <Button variant="link" size="sm" onClick={handleLinkWallet} className="text-[10px] text-primary p-0 h-auto mt-2 font-bold uppercase tracking-widest">
                    <Wallet className="w-3 h-3 mr-1" /> Link Wallet
                  </Button>
                )}
              </div>
              <Button variant="outline" size="lg" onClick={handleLogout} className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest px-6 transition-all hover:scale-105 active:scale-95">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => setSearchParams({ tab: val })}
            className="space-y-6"
          >
            <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-14">
              <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 px-6">Overview</TabsTrigger>
              <TabsTrigger value="certificates" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 px-6">Vault</TabsTrigger>
              <TabsTrigger value="request-issuance" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 px-6 gap-2">
                <FileText className="w-4 h-4" /> Request Issuance
              </TabsTrigger>
              <TabsTrigger value="ai-insights" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 px-6 gap-2">
                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> AI Matrix
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 px-6 gap-2">
                <ShieldCheck className="w-4 h-4" /> Security
              </TabsTrigger>
            </TabsList>

            {/* QUICK VERIFICATION CHECKLIST (OVERVIEW ONLY) */}
            {activeTab === 'overview' && !user?.isVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/5 border border-primary/20 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Incomplete Verification</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Anchoring documents increases your trust score.</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (file || profile.university) {
                      handleUpdateProfile();
                    } else if (quickVerifyId) {
                      handleQuickVerify();
                    } else {
                      document.getElementById('identity-verification-center')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  disabled={uploading || isQuickVerifying}
                  className="rounded-xl gradient-primary text-[10px] font-bold uppercase tracking-widest h-10 px-6"
                >
                  {isQuickVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                  Verify Now
                </Button>
              </motion.div>
            )}

            {/* TABS CONTENT WRAPPER */}
            <TabsContent value="overview" className="space-y-6 pt-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-secondary/10 border-white/5 p-6 rounded-[2rem] shadow-glow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Award className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-[10px] border-primary/20 text-primary uppercase tracking-widest">Master Ledger</Badge>
                  </div>
                  <h3 className="text-2xl font-black mb-1">{certificates.length}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Verified Credentials</p>
                </Card>

                <Card className="bg-secondary/10 border-white/5 p-6 rounded-[2rem] shadow-glow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Shield className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400 uppercase tracking-widest font-bold">Security Score</Badge>
                  </div>
                  <h3 className="text-2xl font-black mb-1">{calculateCompletion()}%</h3>
                  <div className="flex flex-col gap-2">
                    <Progress value={calculateCompletion()} className="h-1.5 bg-white/5" />
                    <p className="text-[9px] text-muted-foreground uppercase tracking-tight">Identity integrity level</p>
                  </div>
                </Card>
                <Card className="bg-primary/5 border-primary/20 p-6 rounded-[2rem] shadow-glow flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">AI Sync Status</p>
                      <p className="text-[10px] text-muted-foreground">Next update scheduled in 24h</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/student?tab=ai-insights')} className="w-full rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                    Review Career Matrix
                  </Button>
                </Card>

                <Card className="bg-secondary/10 border-white/5 p-6 rounded-[2rem] shadow-glow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 uppercase tracking-widest font-bold">Quick Verify</Badge>
                    </div>
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-cyan-400 transition-colors" />
                      <Input
                        placeholder="Enter Cert ID..."
                        value={quickVerifyId}
                        onChange={(e) => setQuickVerifyId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickVerify()}
                        className="pl-9 h-10 bg-white/5 border-white/10 rounded-xl text-[10px] focus-visible:ring-cyan-500/50"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleQuickVerify}
                    disabled={isQuickVerifying || !quickVerifyId}
                    size="sm"
                    className="w-full mt-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest h-9"
                  >
                    {isQuickVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify Now"}
                  </Button>
                </Card>
              </div>

              {quickVerifyResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between gap-4",
                    'error' in quickVerifyResult
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-cyan-500/10 border-cyan-500/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center border",
                      'error' in quickVerifyResult
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                    )}>
                      {'error' in quickVerifyResult ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest">
                        {'error' in quickVerifyResult ? "Invalid ID" : (quickVerifyResult as Cert).title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {'error' in quickVerifyResult ? quickVerifyResult.error : `Verified to ${(quickVerifyResult as Cert).recipientName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!('error' in quickVerifyResult) && (
                      <Button variant="outline" size="sm" asChild className="rounded-xl border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                        <a href={`/certificate/${(quickVerifyResult as Cert).id}`} target="_blank" rel="noreferrer">View Full</a>
                      </Button>
                    )}
                    <button
                      onClick={() => setQuickVerifyResult(null)}
                      className="text-muted-foreground hover:text-foreground p-1"
                      title="Clear result"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              )}
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-8" id="identity-verification-center">
                  <Card className="border-primary/20 bg-secondary/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-glow-sm">
                    <CardHeader className="p-8 border-b border-white/5 bg-primary/5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Identity Verification Center</CardTitle>
                          <CardDescription className="text-muted-foreground/70">
                            Complete your academic profile and verify your identity on-chain.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-10">
                      {/* Academic Information Section */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Academic Profile
                        </h3>
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">University / Institution</Label>
                            <Select
                              value={profile.university}
                              onValueChange={(val) => setProfile({ ...profile, university: val })}
                            >
                              <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10">
                                <SelectValue placeholder="Select Institution" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px] bg-background border-white/10">
                                {kenyanUniversities.map((uni) => (
                                  <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Registration Number</Label>
                            <Input
                              placeholder="e.g. REG-2024-001"
                              value={profile.registrationNumber}
                              onChange={e => setProfile({ ...profile, registrationNumber: e.target.value })}
                              className="h-12 rounded-xl bg-white/5 border-white/10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Graduation Year</Label>
                            <Input
                              placeholder="e.g. 2024"
                              value={profile.graduationYear}
                              onChange={e => setProfile({ ...profile, graduationYear: e.target.value })}
                              className="h-12 rounded-xl bg-white/5 border-white/10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Degree Type</Label>
                            <Select
                              value={profile.degreeType}
                              onValueChange={(val) => setProfile({ ...profile, degreeType: val })}
                            >
                              <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10">
                                <SelectValue placeholder="Select Degree" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-white/10">
                                <SelectItem value="Associate">Associate Degree</SelectItem>
                                <SelectItem value="Bachelor">Bachelor's Degree</SelectItem>
                                <SelectItem value="Master">Master's Degree</SelectItem>
                                <SelectItem value="Doctorate">Doctorate / PhD</SelectItem>
                                <SelectItem value="Certificate">Certificate / Diploma</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-white/5" />

                      {/* Documents Section */}
                      <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                          <Upload className="h-4 w-4" /> Verification Artifacts
                        </h3>

                        <div className={cn("grid gap-8", previewUrl ? "lg:grid-cols-2" : "grid-cols-1")}>
                          {/* File Selection / Preview */}
                          <div className="space-y-4">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Degree Certificate</Label>

                            {!file ? (
                              <div
                                className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-white/5 transition-all"
                                onDragOver={fileUpload.handleDragOver}
                                onDragLeave={fileUpload.handleDragLeave}
                                onDrop={fileUpload.handleDrop}
                              >
                                <div className="p-4 rounded-xl bg-primary/10 text-primary">
                                  <Upload className="h-8 w-8" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold">Select Official Document</p>
                                  <p className="text-xs text-muted-foreground mt-1">PDF or image of your degree</p>
                                </div>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="hidden"
                                  id="cert-upload-v5"
                                  onChange={e => e.target.files?.[0] && fileUpload.handleFile(e.target.files[0])}
                                />
                                <Button variant="outline" asChild className="rounded-xl mt-2">
                                  <label htmlFor="cert-upload-v5">Choose File</label>
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div
                                  className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40"
                                  onDragOver={fileUpload.handleDragOver}
                                  onDragLeave={fileUpload.handleDragLeave}
                                  onDrop={fileUpload.handleDrop}
                                >
                                  {previewUrl ? (
                                    <img src={previewUrl} className="w-full h-full object-contain bg-zinc-900" alt="Certificate Preview" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-900/50 animate-pulse">
                                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rendering Preview...</p>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => {
                                      setPreviewUrl(null);
                                      setFile(null);
                                      setQuickVerifyId('');
                                    }}
                                    className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
                                    title="Cancel"
                                  >
                                    <XCircle className="h-5 w-5" />
                                  </button>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                      <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold truncate max-w-[150px]">{file?.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{(file?.size || 0 / 1024).toFixed(1)} KB</p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => document.getElementById('cert-upload-v5')?.click()}
                                  >
                                    Replace
                                  </Button>
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="hidden"
                                    id="cert-upload-v5"
                                    onChange={e => e.target.files?.[0] && fileUpload.handleFile(e.target.files[0])}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Drag & Drop Overlay */}
                            {fileUpload.isDragging && (
                              <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm rounded-3xl border-2 border-primary border-dashed flex items-center justify-center z-50">
                                <div className="text-center">
                                  <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <Upload className="h-8 w-8 text-primary" />
                                  </div>
                                  <h3 className="text-lg font-bold text-primary">Drop to Upload</h3>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Intelligent Extraction Results */}
                          {previewUrl && (
                            <div className="space-y-6">
                              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-4 shadow-glow-sm">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Target className="h-4 w-4" /> Extraction Engine
                                  </h4>
                                  {isExtracting ? (
                                    <Badge className="bg-primary/20 text-primary border-primary/20">Analyzing...</Badge>
                                  ) : (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Ready</Badge>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Detected Certificate ID</Label>
                                    <div
                                      className="relative group"
                                      onDragOver={fileUpload.handleDragOver}
                                      onDragLeave={fileUpload.handleDragLeave}
                                      onDrop={fileUpload.handleDrop}
                                    >
                                      <Input
                                        value={quickVerifyId}
                                        onChange={(e) => setQuickVerifyId(e.target.value)}
                                        placeholder="No ID detected yet..."
                                        className="h-11 bg-white/5 border-white/10 rounded-xl font-mono text-sm text-primary pr-20"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleQuickVerify()}
                                        disabled={!quickVerifyId || isQuickVerifying}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-3 rounded-lg gradient-primary text-[10px] font-bold uppercase tracking-tight"
                                      >
                                        {isQuickVerifying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify"}
                                      </Button>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic">We automatically scan your document for blockchain anchors.</p>
                                  </div>

                                  <Separator className="bg-white/5" />

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Authenticity</p>
                                      <div className="flex items-center gap-1.5 text-xs font-bold">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                        <span>Digital Signature</span>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Integrity</p>
                                      <div className="flex items-center gap-1.5 text-xs font-bold">
                                        <Shield className="h-3.5 w-3.5 text-primary" />
                                        <span>On-Chain Ready</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-yellow-500/80 leading-relaxed font-medium">
                                  Ensure the Certificate ID above matches the one printed on your document. If it was not automatically detected, please enter it manually.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/20 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10" />
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Shield className="h-7 w-7" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-md font-bold text-foreground">Initiate Official Verification</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Submit your academic records for registrar approval and on-chain validation.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleUpdateProfile()}
                      disabled={uploading || isQuickVerifying}
                      className="h-12 px-8 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-105 active:scale-95 transition-all w-full md:w-auto flex items-center gap-2"
                    >
                      {uploading || isQuickVerifying ? (
                        <><Loader2 className="animate-spin h-5 w-5 mr-2" /> {isQuickVerifying ? "Verifying..." : "Initializing..."}</>
                      ) : (
                        <><Shield className="h-5 w-5 mr-2" /> Verify Now</>
                      )}
                    </Button>
                  </div>

                  {verificationOutcome && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "mt-8 rounded-3xl border-2 overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-500",
                        verificationOutcome.isValid
                          ? "bg-green-500/5 border-green-500/20 shadow-green-500/10"
                          : "bg-red-500/5 border-red-500/20 shadow-red-500/10"
                      )}
                    >
                      {/* Status Header */}
                      <div className={cn(
                        "px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4",
                        verificationOutcome.isValid ? "bg-green-600/90 text-white" : "bg-red-600/90 text-white"
                      )}>
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                            {verificationOutcome.isValid ? (
                              <CheckCircle2 className="w-8 h-8 text-white animate-pulse" />
                            ) : (
                              <XCircle className="w-8 h-8 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-2">
                              {verificationOutcome.isValid ? 'Certificate Verified ✓' : 'Verification Failed ✗'}
                            </h3>
                            <div className="flex items-center gap-2 opacity-90">
                              <Badge variant="outline" className="text-[10px] font-mono border-white/30 text-white uppercase tracking-widest">
                                {verificationOutcome.id || 'ON-CHAIN ANCHOR'}
                              </Badge>
                              {verificationOutcome.isValid && (
                                <span className="text-[10px] uppercase tracking-widest font-bold">Consensus Reached</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {verificationOutcome.isValid && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={downloadReport}
                              className="rounded-xl border-white/30 bg-white/10 hover:bg-white/20 text-white border text-xs font-bold gap-2"
                            >
                              <Download className="w-4 h-4" /> Download Report
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => window.open(`/certificate/${verificationOutcome.id}`, '_blank')}
                              className="rounded-xl border-white/30 bg-white/10 hover:bg-white opacity-90 hover:opacity-100 hover:text-green-700 text-white border text-xs font-bold gap-2"
                            >
                              <ExternalLink className="w-4 h-4" /> Official Record
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Detailed Findings Content */}
                      <div className="p-8 space-y-8">
                        {verificationOutcome.isValid ? (
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/20">
                                  <Users className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Certified Identity</p>
                              </div>
                              <p className="text-lg font-black text-foreground truncate">{verificationOutcome.recipientName}</p>
                              <p className="text-[10px] font-mono text-muted-foreground mt-1 opacity-70">
                                UID: {verificationOutcome.id || 'N/A'}
                              </p>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/20">
                                  <Award className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Academic Merit</p>
                              </div>
                              <p className="text-lg font-black text-foreground truncate">{verificationOutcome.title}</p>
                              <Badge variant="outline" className="mt-2 text-[9px] border-purple-500/30 text-purple-400 uppercase tracking-tight">
                                {verificationOutcome.certificateType || "Official Degree"}
                              </Badge>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/20">
                                  <Building className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issuing Authority</p>
                              </div>
                              <p className="text-lg font-black text-foreground truncate">
                                {verificationOutcome.institution || verificationOutcome.issuerName}
                              </p>
                              <p className="text-[10px] font-bold text-orange-400 uppercase mt-1 tracking-tighter">Verified Registrar</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2rem] text-center">
                            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h4 className="text-lg font-black text-red-500 mb-2">Technical Discrepancy Detected</h4>
                            <p className="text-sm text-red-400/80 max-w-md mx-auto italic font-medium">
                              "{verificationOutcome.reasons[0]}"
                            </p>
                          </div>
                        )}

                        {/* Report & Reasons Section */}
                        <div className="bg-white/5 rounded-3xl border border-white/10 p-8">
                          <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-primary mb-6">
                            <FileText className="h-5 w-5" /> Official Verification Report & Findings
                          </h4>
                          <div className="space-y-4">
                            {verificationOutcome.reasons.map((reason, idx) => (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx}
                                className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all shadow-glow-sm hover:shadow-primary/5"
                              >
                                {verificationOutcome.isValid ? (
                                  <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] flex-shrink-0" />
                                ) : (
                                  <div className="mt-1 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] flex-shrink-0" />
                                )}
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-foreground/90 leading-tight">{reason}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    Time-stamped: {new Date().toLocaleTimeString()} • SHA-256 Valid
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                            <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                              <p className="text-[11px] text-muted-foreground italic leading-relaxed font-medium">
                                <Shield className="h-3 w-3 inline mr-2 text-primary" />
                                Disclaimer: This report is a digital representation of a blockchain event.
                                The authenticity is guaranteed by the cryptographic anchors held on the EVM-compatible ledger.
                                Any physical tampering with the hard-copy certificate will be detected by the extraction engine.
                              </p>
                            </div>
                          </div>
                        </div>

                        {verificationOutcome.transactionHash && (
                          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 border-t-primary/20 shadow-glow-sm">
                            <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                              <span className="flex items-center gap-2"><Zap className="h-3 w-3" /> Blockchain Hash Node</span>
                              <span className="opacity-90">EVM Transaction Confirmed</span>
                            </div>
                            <p className="text-[11px] font-mono text-muted-foreground break-all bg-white/5 p-3 rounded-lg border border-white/5">
                              {verificationOutcome.transactionHash}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="grid gap-6">
                    <Card className="col-span-1 bg-secondary/10 border-white/5 rounded-[2.5rem] overflow-hidden">
                      <CardHeader className="p-6 border-b border-white/5">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Activity Ledger
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {certificates.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                              <AlertCircle className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">No activity detected on chain</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {certificates.slice(0, 3).map((c) => (
                              <div key={c.id} className="flex items-center gap-4 group">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-transform group-hover:scale-110">
                                  <Award className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{c.title}</h4>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{c.issuerName}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyVerificationLink(c.id); }}
                                      className="p-1 hover:text-primary transition-colors"
                                      title="Copy link"
                                    >
                                      <Share2 className="w-3 h-3" />
                                    </button>
                                    <a
                                      href={`/certificate/${c.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 hover:text-primary transition-colors"
                                      title="View Record"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  <p className="text-[10px] font-mono text-muted-foreground">{new Date(c.issuedAt).toLocaleDateString()}</p>
                                  <Badge variant="outline" className="text-[8px] border-green-500/20 text-green-400 uppercase tracking-widest">Anchored</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="col-span-1 bg-secondary/10 border-white/5 rounded-[2.5rem] overflow-hidden">
                      <CardHeader className="p-6 border-b border-white/5">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                          <User className="w-4 h-4" /> Digital ID
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 border-4 border-white/5 mb-6 ring-2 ring-blue-500/20">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} />
                          <AvatarFallback className="bg-blue-500/10 text-blue-400 text-2xl font-bold">ST</AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-black tracking-tight mb-1">{user?.email}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-6">Student ID Candidate</p>

                        <div className="w-full space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="flex justify-between text-[10px] items-center">
                            <span className="text-muted-foreground uppercase tracking-widest">Univ</span>
                            <span className="font-bold truncate max-w-[150px]">{user?.university || '—'}</span>
                          </div>
                          <Separator className="bg-white/5" />
                          <div className="flex justify-between text-[10px] items-center">
                            <span className="text-muted-foreground uppercase tracking-widest">Reg No</span>
                            <span className="font-bold">{user?.registrationNumber || '—'}</span>
                          </div>
                          <Separator className="bg-white/5" />
                          <div className="flex justify-between text-[10px] items-center">
                            <span className="text-muted-foreground uppercase tracking-widest">Wallet</span>
                            {user?.walletAddress ? (
                              <span className="font-mono text-primary text-[8px]">{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</span>
                            ) : (
                              <button onClick={handleLinkWallet} className="text-primary hover:underline font-bold uppercase tracking-tight">Link Now</button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Verification History integrated into Overview */}
              <Card className="bg-secondary/20 border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md mt-8">
                <CardHeader className="bg-white/5 p-8 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black mb-2 flex items-center gap-3">
                        <History className="w-8 h-8 text-primary" />
                        Verification <span className="gradient-text">History</span>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Audit log of academic verifications performed by your account.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchVerificationHistory}
                      disabled={loadingHistory}
                      className="rounded-xl border-white/10"
                    >
                      <RefreshCw className={cn("w-4 h-4 mr-2", loadingHistory && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Records...</p>
                    </div>
                  ) : verificationHistory.length > 0 ? (
                    <div className="space-y-3 px-6 pb-6">
                      {verificationHistory.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center border transition-colors",
                              (item.status === 'Authentic' || item.status === 'Verified')
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                              {(item.status === 'Authentic' || item.status === 'Verified') ? (
                                <CheckCircle2 className="h-6 w-6" />
                              ) : (
                                <XCircle className="h-6 w-6" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground mb-0.5">
                                {item.certificateId}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-tight flex items-center gap-2 font-medium">
                                <Building className="h-3 w-3" /> Blockchain Verified
                                <span className="opacity-30">|</span>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                              (item.status === 'Authentic' || item.status === 'Verified')
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
                                (item.status === 'Authentic' || item.status === 'Verified') ? "bg-green-500" : "bg-red-500"
                              )} />
                              {item.status}
                            </div>

                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity pl-2 border-l border-white/10">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
                                onClick={() => {
                                  setVerificationOutcome({
                                    ...(item.result as VerifyResult),
                                    isValid: item.status === 'Authentic' || item.status === 'Verified',
                                    status: item.status,
                                    reasons: item.reasons
                                  });
                                  document.getElementById('identity-verification-center')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                              >
                                Details
                              </Button>
                              <Button
                                title="Remove from history"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-muted-foreground/50"
                                onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-white/2 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                      <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 rounded-full border border-dashed border-primary/30 animate-spin-slow" />
                        <ShieldCheck className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No Verification Events</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-8">
                        When an employer or academic institution verifies your certificates, the record will appear here.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setSearchParams({ tab: 'certificates' })}
                        className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest px-8"
                      >
                        Visit Your Vault
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="request-issuance">
              <div className="grid gap-6 lg:grid-cols-3 pt-4">
                <div className="lg:col-span-1 space-y-6">
                  <Card className="bg-secondary/10 border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                    <CardHeader className="p-8">
                      <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/20">
                        <FilePlus className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-black tracking-tight leading-none mb-2">New Request</h2>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Request certificate issuance</p>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 space-y-4">
                      <form onSubmit={handleSubmitCertificateRequest} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">University Name</Label>
                          <Input
                            placeholder="e.g. Stanford University"
                            className="bg-white/5 border-white/10 rounded-xl"
                            value={requestForm.university}
                            onChange={(e) => setRequestForm({ ...requestForm, university: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Course / Degree</Label>
                          <Input
                            placeholder="e.g. B.Sc Computer Science"
                            className="bg-white/5 border-white/10 rounded-xl"
                            value={requestForm.course}
                            onChange={(e) => setRequestForm({ ...requestForm, course: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Registration Number</Label>
                          <Input
                            placeholder="Your student ID / Reg No"
                            className="bg-white/5 border-white/10 rounded-xl"
                            value={requestForm.registrationNumber}
                            onChange={(e) => setRequestForm({ ...requestForm, registrationNumber: e.target.value })}
                          />
                        </div>

                        <div className="pt-4 space-y-4">
                          <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer relative">
                            <input
                              type="file"
                              title="Registration transcripts"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => setRequestFiles({ ...requestFiles, transcripts: e.target.files?.[0] || undefined })}
                            />
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-400" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold truncate">
                                  {requestFiles.transcripts ? requestFiles.transcripts.name : 'Upload Transcripts'}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Academic Records (PDF/IMG)</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer relative">
                            <input
                              type="file"
                              title="ID or Passport document"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => setRequestFiles({ ...requestFiles, idPassport: e.target.files?.[0] || undefined })}
                            />
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <UserCheck className="w-4 h-4 text-purple-400" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold truncate">
                                  {requestFiles.idPassport ? requestFiles.idPassport.name : 'Upload ID / Passport'}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Identity Proof (Clear Scan)</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="w-full rounded-xl gradient-primary font-black uppercase tracking-widest text-[10px] h-12 shadow-lg shadow-primary/25"
                          disabled={submittingRequest}
                        >
                          {submittingRequest ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Submit Request
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between p-6 bg-secondary/10 border border-white/5 rounded-[2rem] backdrop-blur-sm">
                    <div className="space-y-1">
                      <h2 className="text-xl font-black tracking-tight">Request Status</h2>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Track your issuance progress</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchRequests} className="rounded-xl border-white/10 bg-white/5 text-[10px] font-bold uppercase">
                      <RefreshCw className="w-3 h-3 mr-2" /> Refresh
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {requests.length === 0 ? (
                      <div className="p-12 text-center bg-secondary/5 border border-dashed border-white/10 rounded-[2.5rem]">
                        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <History className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">No requests yet</h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">Your certificate issuance requests will appear here once submitted.</p>
                      </div>
                    ) : (
                      requests.map((req) => (
                        <div key={req.id} className="p-6 bg-secondary/10 border border-white/5 rounded-[2rem] hover:border-primary/20 transition-all">
                          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex gap-4 items-center">
                              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${req.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                req.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                }`}>
                                {req.status === 'approved' ? <CheckCircle2 className="w-6 h-6" /> :
                                  req.status === 'rejected' ? <XCircle className="w-6 h-6" /> :
                                    <Clock className="w-6 h-6" />}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-bold text-sm tracking-tight">{req.course}</h4>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{req.university}</p>
                                <p className="text-[10px] text-muted-foreground opacity-70">Submitted on {new Date(req.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Badge className={`rounded-lg uppercase text-[9px] font-black tracking-widest px-3 py-1 ${req.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                req.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                                }`}>
                                {req.status}
                              </Badge>
                              {req.status === 'rejected' && req.rejectionReason && (
                                <p className="text-[10px] text-red-400/80 italic text-right max-w-[200px]">
                                  Reason: {req.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="certificates">
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between p-6 bg-secondary/10 border border-white/5 rounded-[2rem] backdrop-blur-sm">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight">Digital Vault</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Secure blockchain anchored credentials</p>
                  </div>
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search vault..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {certificates
                    .filter((c: Cert) => {
                      if (!query) return true;
                      const q = query.toLowerCase();
                      return (c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
                    })
                    .map((c) => (
                      <motion.div
                        whileHover={{ y: -5 }}
                        key={c.id}
                        className="bg-secondary/10 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/30 transition-all flex flex-col"
                      >
                        <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 p-6 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 animate-pulse" />
                          <Award className="h-16 w-16 text-primary relative z-10 opacity-60 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-[0.2em] border-primary/20 text-primary">ERC-721 Anchor</Badge>
                              <span className="text-[10px] text-muted-foreground font-mono opacity-80">#{c.id.slice(0, 8)}</span>
                            </div>
                            <h4 className="text-lg font-black leading-tight group-hover:text-primary transition-colors">{c.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{c.issuerName}</p>
                          </div>

                          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                                Issued: {new Date(c.issuedAt).toLocaleDateString()}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyVerificationLink(c.id)}
                                  className="h-8 w-8 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                  title="Copy verification link"
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="h-8 w-8 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-all"
                                  title="Personal verification"
                                >
                                  <a href={`/verify?id=${c.id}`} target="_blank" rel="noreferrer" title="Verify certificate on public page">
                                    <ShieldCheck className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-[10px] font-bold h-9">
                                <a href={`/certificate/${c.id}`}>View Record</a>
                              </Button>
                              <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-[10px] font-bold h-9">
                                <a href={`/certificate/${c.id}?download=true`}>Download</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
                {certificates.length === 0 && (
                  <div className="text-center py-20 bg-secondary/5 rounded-[3rem] border border-dashed border-white/5">
                    <p className="text-muted-foreground uppercase tracking-[0.2em] font-bold text-sm">Vault Empty</p>
                    <p className="text-xs text-muted-foreground/50 mt-2">Certificates will manifest here once issued.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AI INSIGHTS TAB */}
            <TabsContent value="ai-insights">
              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🤖</span> AI Career Advisor
                  </CardTitle>
                  <CardDescription>
                    Analyze your profile and certificates to unlock personalized career paths.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!aiData ? (
                    <div className="text-center py-12">
                      <div className="mb-6 flex justify-center">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                          <span className="text-4xl">🔮</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-medium mb-2">Ready to explore your future?</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Our AI engine analyzes your degree, certificates, and verification documents to suggest the best career moves for you.
                      </p>
                      <Button
                        size="lg"
                        onClick={handleAIAnalysis}
                        disabled={analyzing}
                        className="gap-2"
                      >
                        {analyzing ? (
                          <>Converting caffeine to code...</>
                        ) : (
                          <>Generate AI Insights</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                      <div className="grid lg:grid-cols-3 gap-6">
                        {/* Career Focus */}
                        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:border-primary/30 transition-all">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target className="w-12 h-12" />
                          </div>
                          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                            <Target className="h-4 w-4" /> Career Trajectory
                          </h3>
                          <div className="space-y-3">
                            {aiData.careerPath.map((role: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-primary/5 transition-colors">
                                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                  {i + 1}
                                </div>
                                <span className="text-sm font-medium">{role}</span>
                              </div>
                            ))}
                          </div>
                        </Card>

                        {/* Skill Radar */}
                        <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] relative overflow-hidden group hover:border-blue-400/30 transition-all">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-12 h-12" />
                          </div>
                          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-6 flex items-center gap-2">
                            <Zap className="h-4 w-4" /> Cognitive Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {aiData.skills.map((skill: string, i: number) => (
                              <Badge key={i} variant="secondary" className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-lg">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </Card>

                        {/* Market Analysis */}
                        <Card className="bg-primary/10 border-primary/20 p-6 rounded-[2rem] relative overflow-hidden flex flex-col justify-between">
                          <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" /> Market Intelligence
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Based on current industry trends, your profile has a <span className="text-primary font-bold">{aiData.marketDemand} Demand</span> rating in the verifiable job market.
                            </p>
                          </div>
                          <div className="mt-8 p-4 bg-background/50 rounded-2xl border border-white/5 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                              <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Demand Score</p>
                              <p className="text-xl font-black text-primary">{aiData.marketDemand === 'High' ? '92/100' : '78/100'}</p>
                            </div>
                          </div>
                        </Card>
                      </div>

                      {/* Certification Roadmap */}
                      <div className="bg-white/5 border border-white/5 p-8 rounded-[3rem]">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-8 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Strategic Certification Roadmap
                        </h3>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {aiData.recommendedCerts.map((cert: string, i: number) => (
                            <motion.div
                              whileHover={{ y: -5 }}
                              key={i}
                              className="flex flex-col gap-4 p-6 rounded-[2rem] border border-white/5 bg-secondary/10 hover:bg-secondary/20 transition-all cursor-default"
                            >
                              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">
                                📜
                              </div>
                              <div>
                                <h4 className="font-bold text-sm mb-1">{cert}</h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Verified Credential Path</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-center pt-6">
                        <Button variant="link" onClick={() => setAiData(null)} className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors">
                          Reset Analysis Matrix
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="security" className="pt-4">
              <Card className="max-w-2xl mx-auto border-primary/20 bg-secondary/10 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5 bg-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black uppercase tracking-tight">Security Credentials</CardTitle>
                      <CardDescription className="text-muted-foreground/70">Update your access keys and manage identity protection.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleChangePassword} className="space-y-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Current Password</Label>
                      <div className="relative group">
                        <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          type="password"
                          placeholder="Your current security key"
                          className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50"
                          value={passwordForm.oldPassword}
                          onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                          disabled={isChangingPassword}
                        />
                      </div>
                    </div>

                    <Separator className="bg-white/5" />

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">New Password</Label>
                        <div className="relative group">
                          <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type="password"
                            placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                            className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50"
                            value={passwordForm.password}
                            onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                            disabled={isChangingPassword}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Confirm New Password</Label>
                        <div className="relative group">
                          <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type="password"
                            placeholder="Re-type new security key"
                            className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/50"
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

                    <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-400/80 leading-relaxed font-bold uppercase tracking-tight">
                        Security Notice: You cannot reuse any of your last 5 passwords. Change will be recorded in the security audit trail.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-black uppercase tracking-[0.2em] shadow-glow"
                    >
                      {isChangingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Password Update"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div >
      </main >
      <AIAssistant />
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          setShowOnboarding(false);
          toast.success("You're all set! Try Ctrl+/ to see shortcuts.");
        }}
      />

      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={shortcuts}
      />

      <QuickActionsMenu
        isOpen={!!quickActionsPos}
        onClose={() => setQuickActionsPos(null)}
        position={quickActionsPos || { x: 0, y: 0 }}
        certificateId={quickVerifyId || verificationOutcome?.id}
        onShare={() => {
          // Share logic
          toast.success('Share link copied!');
        }}
        onDownload={() => verificationOutcome && downloadReport()}
        onViewOfficial={() => {
          if (quickVerifyId) window.open(`/certificate/${quickVerifyId}`, '_blank');
        }}
      />
    </div >
  );
};

export default StudentPortal;
