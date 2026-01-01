import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, CheckCircle2, XCircle, Download, Filter,
  TrendingUp, Users, Award, FileText, Calendar, Building,
  BarChart3, Clock, Shield, ArrowUpRight, Upload, Star,
  RefreshCw, Eye, AlertCircle, Lock, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { toast } from 'sonner';
import { certificateService } from '@/services/certificateService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import { WelcomeModal } from '@/components/WelcomeModal';
import './EmployerPortal.css';
import jsQR from 'jsqr';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { sha256, toUtf8Bytes } from 'ethers';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type Cert = {
  id: string;
  recipientName: string;
  title: string;
  issuedAt: string;
  issuerName: string;
  status: string;
  institutionName?: string;
  course?: string;
  grade?: string;
};

interface User {
  email: string;
  name?: string;
  role?: string;
}

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
  grade?: string;
  registrationNumber?: string;
}

interface SavedCandidate extends VerifyResult {
  savedAt: string;
  notes: string;
  tags?: string[];
  recruitmentStatus?: string;
}

interface VerificationHistoryItem {
  id: string;
  timestamp: string;
  result: VerifyResult;
  status: string;
  reasons?: string[];
}

interface ScannedQR {
  id: string;
  hash: string;
  [key: string]: any;
}

interface FraudReport {
  id: string;
  certificateId: string;
  reporterEmail: string;
  reason: string;
  details?: string;
  status: 'pending' | 'investigating' | 'resolved' | string;
  createdAt: string;
  institution?: string;
}

const EmployerPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [certificates, setCertificates] = useState<Cert[]>([]);
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [scannedPayload, setScannedPayload] = useState<ScannedQR | null>(null); // Store QR data for integrity check
  const [verifying, setVerifying] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fullDocUrl, setFullDocUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'verify' | 'saved' | 'analytics' | 'security' | 'reports'>('verify');
  const [fraudReports, setFraudReports] = useState<FraudReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'invalid'>('all');

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);

  // Fraud Report State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    reason: '',
    details: ''
  });

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (!res.ok) {
          navigate('/login');
          return;
        }
        const data = await res.json();
        if (!data.user || (data.user.role?.toLowerCase() !== 'employer' && data.user.role?.toLowerCase() !== 'admin')) {
          toast.error('Access denied: Employer portal');
          navigate('/');
          return;
        }
        setUser(data.user);

        // Load verification history from Backend (primary) and localStorage (secondary/sync)
        try {
          interface BackendHistoryItem {
            certificateId: string;
            createdAt: string;
            result: VerifyResult;
            status: string;
            reasons?: string[];
          }
          const historyRes = await fetch('/employer/history', { credentials: 'include' });
          if (historyRes.ok) {
            const dbHistory = await historyRes.json();
            const formattedHistory = dbHistory.map((h: BackendHistoryItem) => ({
              id: h.certificateId,
              timestamp: h.createdAt,
              result: h.result,
              status: h.status,
              reasons: h.reasons
            }));
            setVerificationHistory(formattedHistory);

            // Sync to local storage as well for offline/fast load
            localStorage.setItem(`verification_history_${data.user.email}`, JSON.stringify(formattedHistory));
          } else {
            // Fallback to localStorage
            const localHistory = JSON.parse(localStorage.getItem(`verification_history_${data.user.email}`) || '[]');
            setVerificationHistory(localHistory);
          }
        } catch (hErr) {
          console.error("Failed to fetch history from backend:", hErr);
          const localHistory = JSON.parse(localStorage.getItem(`verification_history_${data.user.email}`) || '[]');
          setVerificationHistory(localHistory);
        }

        // Load saved candidates
        const saved = JSON.parse(localStorage.getItem(`saved_candidates_${data.user.email}`) || '[]');
        setSavedCandidates(saved);

        // Load fraud reports
        try {
          const res = await fetch('/employer/reports', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setFraudReports(data);
          }
        } catch (err) {
          console.error("Failed to load fraud reports:", err);
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

  // 1. Helper: Check filename fallback
  const fallbackFilenameCheck = (file: File | null) => {
    if (!file) { setExtracting(false); return; }

    const filenameMatch = file.name.match(/[a-f0-9]{10}/i);
    if (filenameMatch) {
      setVerifyId(filenameMatch[0]);
      toast.info('ID detected from filename.', { description: 'Starting verification...' });
      setTimeout(() => handleVerify(), 800);
    } else {
      toast.info('No digital ID found in document.', { description: 'Please enter ID manually.' });
    }
    setExtracting(false);
  };

  // 2. Helper: Process Scanned Image Data
  const processScannedData = (imageData: ImageData, originalFile: File) => {
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data) {
      // Try JSON Parse
      try {
        const payload = JSON.parse(code.data);
        if (payload.id && payload.id !== 'PENDING') {
          setVerifyId(payload.id);
          setScannedPayload(payload); // Capture for integrity check
          toast.success('Certificate ID decoded from embedded QR!');
          setTimeout(() => handleVerify(), 500);
          setExtracting(false);
          return;
        }
      } catch (e) { /* Ignore non-JSON */ }

      // Try Regex match
      const match = code.data.match(/[a-f0-9]{10}/i);
      if (match) {
        setVerifyId(match[0]);
        toast.success('Certificate ID extracted from document scan!');
        setTimeout(() => handleVerify(), 500);
        setExtracting(false);
        return;
      }
    }
    // If QR scan failed, use fallback
    console.log("QR Scan failed, checking filename...");
    fallbackFilenameCheck(originalFile);
  };

  // 3. Main Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPG, PNG, WebP)');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    if (fullDocUrl) URL.revokeObjectURL(fullDocUrl);

    const docUrl = URL.createObjectURL(file);
    setFullDocUrl(docUrl);
    setUploadedFile(file);

    // Default preview (for images, this is overwritten below for PDFs)
    setPreviewUrl(docUrl);
    setExtracting(true);
    setVerifyId('');
    setVerifyResult(null);
    setScannedPayload(null); // Reset payload

    try {
      // Logic for Images
      if (file.type.startsWith('image/')) {
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
              // Pass file explicitly
              processScannedData(data, file);
            } else {
              fallbackFilenameCheck(file);
            }
          };
          img.onerror = () => fallbackFilenameCheck(file);
          img.src = e.target?.result as string;
        };
        reader.onerror = () => fallbackFilenameCheck(file);
        reader.readAsDataURL(file);
      }
      // Logic for PDFs
      else if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
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
            const data = context.getImageData(0, 0, canvas.width, canvas.height);

            // Set high-quality image preview instead of iframe blob
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPreviewUrl(dataUrl);

            // Extract text to help identify ID if QR fails
            const textContent = await page.getTextContent();
            const textItems = textContent.items
              // @ts-expect-error: item may not have str property
              .map((item) => item.str || '')
              .join(' ');
            const idMatch = textItems.match(/[a-f0-9]{10}/i);

            if (idMatch && !verifyId) {
              setVerifyId(idMatch[0]);
              toast.info('ID detected from document text');
            }

            processScannedData(data, file);
            return;
          } else {
            fallbackFilenameCheck(file);
          }
        } catch (pdfError) {
          console.error("PDF Scan Error:", pdfError);
          toast.warning("Could not read PDF content. Checking filename...");
          fallbackFilenameCheck(file);
        }
      } else {
        fallbackFilenameCheck(file);
      }

    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Error processing file');
      setExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const downloadReport = () => {
    if (!verifyResult) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text("Official Verification Report", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Verification ID: ${verifyResult.id || 'N/A'}`, 20, 35);

    // Status
    doc.setFillColor(236, 253, 245); // Green bg
    doc.rect(20, 45, 170, 20, 'F');
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105);
    doc.text("✓ Certificate Verified & Authentic", 30, 58);

    // Details
    doc.setTextColor(0);
    doc.setFontSize(12);
    let y = 80;
    doc.text(`Recipient: ${verifyResult.recipientName || 'N/A'}`, 20, y); y += 10;
    doc.text(`Course: ${verifyResult.title || 'N/A'}`, 20, y); y += 10;
    doc.text(`Institution: ${verifyResult.institution || verifyResult.issuerName || 'N/A'}`, 20, y); y += 10;
    doc.text(`Issued Date: ${verifyResult.issuedAt ? new Date(verifyResult.issuedAt).toLocaleDateString() : 'N/A'}`, 20, y); y += 20;

    // Reasons
    doc.setFontSize(14);
    doc.text("Validation Steps:", 20, y); y += 10;
    doc.setFontSize(10);
    verifyResult.reasons?.forEach(r => {
      doc.text(`• ${r}`, 25, y);
      y += 8;
    });

    // Hash
    if (verifyResult.transactionHash) {
      y += 10;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Blockchain Tx: ${verifyResult.transactionHash}`, 20, y, { maxWidth: 170 });
    }

    doc.save(`Verification_Report_${verifyResult.id || 'report'}.pdf`);
    toast.success("Report downloaded!");
  };

  const handleVerify = async () => {
    if (!verifyId.trim()) {
      toast.error('Please enter a certificate ID');
      return;
    }

    setVerifying(true);
    setVerifyResult(null);

    try {
      const cleanId = verifyId.trim();
      const data = await certificateService.verifyCertificate(cleanId);
      let historyItem: VerificationHistoryItem | null = null;

      if (data && data.valid) {
        // Default reasons
        const reasons = (data.reasons && data.reasons.length > 0)
          ? [...data.reasons]
          : ["Verified against official Registrar Database.", "Digital Signature is valid."];

        // INTEGRITY CHECK: Compare DB data with Scanned QR Payload (Key Factors)
        if (scannedPayload) {
          const cert = data.certificate;
          const dbName = cert.recipientName || '';
          const qrName = scannedPayload.name || '';
          const dbProgram = cert.title || '';
          const qrProgram = scannedPayload.program || '';
          const dbRegNo = cert.registrationNumber || cert.id?.slice(0, 8).toUpperCase() || '';
          const qrRegNo = scannedPayload.regNo || '';

          // 1. Basic Metadata Cross-Check
          if (qrName && dbName.toLowerCase().trim() !== qrName.toLowerCase().trim()) {
            const tamperedResult = {
              ...cert,
              valid: false,
              status: 'Tampered',
              error: `Identity Mismatch! Physical document name ('${qrName}') does not match official record ('${dbName}').`
            };
            setVerifyResult(tamperedResult);
            toast.error('Identity Verification Failed!');

            historyItem = {
              id: cleanId,
              timestamp: new Date().toISOString(),
              result: tamperedResult,
              status: 'tampered',
              reasons: reasons
            };
          }
          else if (qrProgram && dbProgram.toLowerCase().trim() !== qrProgram.toLowerCase().trim()) {
            const tamperedResult = {
              ...cert,
              valid: false,
              status: 'Tampered',
              error: `Course Mismatch! Physical document course ('${qrProgram}') does not match official record ('${dbProgram}').`
            };
            setVerifyResult(tamperedResult);
            toast.error('Course Details Mismatch!');

            historyItem = {
              id: cleanId,
              timestamp: new Date().toISOString(),
              result: tamperedResult,
              status: 'tampered',
              reasons: reasons
            };
          }
          else if (qrRegNo && dbRegNo !== qrRegNo) {
            const tamperedResult = {
              ...cert,
              valid: false,
              status: 'Tampered',
              error: `Registration Number Mismatch! Document shows '${qrRegNo}' but database holds '${dbRegNo}'.`
            };
            setVerifyResult(tamperedResult);
            toast.error('Security Credential Mismatch!');

            historyItem = {
              id: cleanId,
              timestamp: new Date().toISOString(),
              result: tamperedResult,
              status: 'tampered',
              reasons: reasons
            };
          }
          else {
            // 2. Cryptographic Hash Integrity Check
            // Re-calculate the hash precisely as the CertificateTemplate does
            const raw = `${dbName}|${dbProgram}|${cert.year || ''}|${cert.grade || ''}|${cert.id || ''}|${dbRegNo}`;
            const computedHash = sha256(toUtf8Bytes(raw));

            if (scannedPayload.hash && scannedPayload.hash !== computedHash) {
              const tamperedResult = {
                ...cert,
                valid: false,
                status: 'Tampered',
                error: "Document Fingerprint Mismatch! The certificate's security hash has been altered or re-signed without authority."
              };
              setVerifyResult(tamperedResult);
              toast.error('Cryptographic Integrity Failure!');

              historyItem = {
                id: cleanId,
                timestamp: new Date().toISOString(),
                result: tamperedResult,
                status: 'tampered',
                reasons: reasons
              };
            } else {
              // All checks passed
              reasons.push("✅ Recipient identity matches physical document.");
              reasons.push("✅ Course details match physical document.");
              reasons.push("✅ Security registration number verified.");
              reasons.push("✅ Cryptographic content hash integrity confirmed.");
              reasons.push(`✅ Authenticity verified for ${cert.institution || cert.issuerName || 'Institution'}.`);
            }
          }
        }

        if (!historyItem) {
          setVerifyResult({ ...data.certificate, reasons: reasons });

          // Save success to history
          historyItem = {
            id: cleanId,
            timestamp: new Date().toISOString(),
            result: data.certificate,
            status: 'verified',
            reasons: reasons
          };
          toast.success(data.status ? `Certificate verified: ${data.status}` : 'Certificate verified successfully!');
        }
      } else {
        const invalidResult = { valid: false, error: data?.error || 'Certificate not found' };
        setVerifyResult(invalidResult);
        toast.error(data?.error || 'Certificate verification failed');

        // Save failure to history
        historyItem = {
          id: verifyId,
          timestamp: new Date().toISOString(),
          result: invalidResult as VerifyResult,
          status: 'invalid',
          reasons: []
        };
      }

      // Finalize history update
      if (historyItem) {
        const newHistory = [historyItem, ...verificationHistory].slice(0, 50);
        setVerificationHistory(newHistory);

        // Save to Local Storage (Legacy/Sync)
        if (user?.email) {
          localStorage.setItem(`verification_history_${user.email}`, JSON.stringify(newHistory));
        }

        // Save to Backend (New Persistent Storage)
        try {
          await fetch('/employer/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              certificateId: historyItem.id,
              status: historyItem.status,
              result: historyItem.result,
              reasons: historyItem.reasons
            })
          });
        } catch (saveErr) {
          console.error("Failed to save history to backend:", saveErr);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed';
      toast.error(errorMsg);
      setVerifyResult({ valid: false, error: errorMsg });
    } finally {
      setVerifying(false);
    }
  };

  const saveCandidate = (candidate: VerifyResult) => {
    if (!user?.email) {
      toast.error('You must be logged in to save candidates');
      return;
    }
    const updated = [...savedCandidates, {
      ...candidate,
      savedAt: new Date().toISOString(),
      notes: ''
    }];
    setSavedCandidates(updated);
    localStorage.setItem(`saved_candidates_${user.email}`, JSON.stringify(updated));
    toast.success('Candidate saved to your list');
  };

  const removeCandidate = (id?: string) => {
    if (!id || !user?.email) return;
    const updated = savedCandidates.filter(c => c.id !== id);
    setSavedCandidates(updated);
    localStorage.setItem(`saved_candidates_${user.email}`, JSON.stringify(updated));
    toast.success('Candidate removed');
  };

  const exportHistory = () => {
    const csv = [
      ['Certificate ID', 'Date', 'Status', 'Candidate Name', 'Title'].join(','),
      ...verificationHistory.map(h => [
        h.id,
        new Date(h.timestamp).toLocaleDateString(),
        h.status,
        h.result?.recipientName || 'N/A',
        h.result?.title || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('History exported successfully');
  };

  // Analytics data
  const getAnalyticsData = () => {
    const verified = verificationHistory.filter(h => h.status === 'verified').length;
    const invalid = verificationHistory.filter(h => h.status === 'invalid').length;

    // Calculate daily activity for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();

    const dailyActivity = last7Days.map(dateStr => {
      const count = verificationHistory.filter(h =>
        new Date(h.timestamp).toDateString() === dateStr
      ).length;
      return {
        day: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        count
      };
    });

    // Institution-based analytics
    const institutionMap: Record<string, number> = {};
    verificationHistory.forEach(h => {
      if (h.result?.institution || h.result?.issuerName) {
        const inst = h.result.institution || h.result.issuerName;
        institutionMap[inst] = (institutionMap[inst] || 0) + 1;
      }
    });

    const institutionData = Object.entries(institutionMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average verifications per day
    const daysActive = Math.max(1, Math.ceil(
      (Date.now() - new Date(verificationHistory[verificationHistory.length - 1]?.timestamp || Date.now()).getTime())
      / (1000 * 60 * 60 * 24)
    ));

    return {
      pieData: [
        { name: 'Verified', value: verified, color: '#10b981' },
        { name: 'Invalid', value: invalid, color: '#ef4444' }
      ],
      trendData: dailyActivity,
      institutionData,
      avgPerDay: Math.round(verificationHistory.length / daysActive) || 0,
      totalDaysActive: daysActive
    };
  };

  const analytics = getAnalyticsData();

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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const filteredHistory = verificationHistory.filter(h => {
    const matchesSearch = (h.result?.recipientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'verified' && h.status === 'verified') ||
      (filterStatus === 'invalid' && (h.status === 'invalid' || h.status === 'tampered'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <WelcomeModal userRole="employer" userName={user?.name} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Employer Verification Portal
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                Welcome back, {user?.email} • {verificationHistory.length} verifications performed
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-950/50 rounded-xl hover:bg-red-950/70 transition-colors border border-red-800/30"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: 'Total Verifications',
                value: verificationHistory.length,
                icon: Shield,
                color: 'blue',
                trend: '+12%'
              },
              {
                label: 'Verified',
                value: verificationHistory.filter(h => h.status === 'verified').length,
                icon: CheckCircle2,
                color: 'green',
                trend: '+8%'
              },
              {
                label: 'Saved Candidates',
                value: savedCandidates.length,
                icon: Users,
                color: 'purple',
                trend: '+5'
              },
              {
                label: 'This Week',
                value: verificationHistory.filter(h =>
                  new Date(h.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length,
                icon: TrendingUp,
                color: 'orange',
                trend: '+24%'
              }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center backdrop-blur-sm border border-${stat.color}-400/30`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                  </div>
                  <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-400/30">
                    {stat.trend}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-300 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 w-fit">
            {[
              { id: 'verify', label: 'Verify Certificates', icon: Shield },
              { id: 'saved', label: 'Saved Candidates', icon: Star },
              { id: 'reports', label: 'Fraud Reports', icon: ShieldAlert },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'security', label: 'Security', icon: ShieldCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'verify' | 'saved' | 'analytics' | 'security')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Verify Tab */}
          {activeTab === 'verify' && (
            <div className="space-y-6">
              {/* Verification Input */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Verify Certificate
                </h2>

                {/* File Upload Drop Zone */}
                <div className="mb-6">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${isDragging
                      ? 'border-blue-400 bg-blue-500/20'
                      : 'border-white/30 bg-white/5 hover:border-blue-400 hover:bg-white/10'
                      }`}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      aria-label="Upload certificate document"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={extracting}
                    />
                    <div className="flex flex-col items-center justify-center text-center">
                      {extracting ? (
                        <>
                          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                          <p className="text-lg font-medium text-white mb-2">Processing Certificate...</p>
                          <p className="text-sm text-gray-300">Scanning for QR code or certificate ID</p>
                        </>
                      ) : uploadedFile ? (
                        <>
                          <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />
                          <p className="text-lg font-medium text-white mb-2">File Uploaded: {uploadedFile.name}</p>
                          <p className="text-sm text-gray-300">Certificate ready for verification</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400 mb-4" />
                          <p className="text-lg font-medium text-white mb-2">
                            Upload Certificate Document
                          </p>
                          <p className="text-sm text-gray-300 mb-4">
                            Drag and drop a PDF or image, or click to browse
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20">PDF</span>
                            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20">JPG</span>
                            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20">PNG</span>
                            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/20 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              QR Code Scan
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {uploadedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 space-y-3"
                    >
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <FileText className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white max-w-[200px] truncate">{uploadedFile.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-black flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              {(uploadedFile.size / 1024).toFixed(1)} KB • READY TO SCAN
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                            if (fullDocUrl) URL.revokeObjectURL(fullDocUrl);
                            setPreviewUrl(null);
                            setFullDocUrl(null);
                            setUploadedFile(null);
                            setVerifyId('');
                            setVerifyResult(null);
                          }}
                          className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-red-400"
                          title="Remove file"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        onClick={handleVerify}
                        disabled={verifying || !verifyId}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed border border-white/10"
                      >
                        {verifying ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Authenticity...</>
                        ) : (
                          <><Shield className="w-4 h-4" /> Verify Now</>
                        )}
                      </button>

                      {!verifyId && (
                        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                            Manual ID required for verification
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-900 text-gray-300 font-medium">OR ENTER CERTIFICATE ID</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter certificate ID (e.g., abc1234567)"
                      value={verifyId}
                      onChange={(e) => setVerifyId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-white placeholder-gray-400"
                      disabled={verifying}
                    />
                  </div>
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                {/* Verification Result */}
                {verifyResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 rounded-2xl border-2 overflow-hidden shadow-2xl ${verifyResult.error
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-green-200'
                      }`}
                  >
                    {/* Header */}
                    <div className={`px-6 py-4 ${verifyResult.error ? 'bg-red-600' : 'bg-green-600'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {verifyResult.error ? (
                            <XCircle className="w-8 h-8 text-white" />
                          ) : (
                            <CheckCircle2 className="w-8 h-8 text-white" />
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {verifyResult.error ? 'Invalid Certificate ✗' : 'Certificate Verified ✓'}
                            </h3>
                            <p className="text-green-100 text-sm">{verifyResult.id || 'Unknown ID'}</p>
                          </div>
                        </div>
                        {(verifyResult.id || verifyId) && (
                          <div className="flex gap-2">
                            {fullDocUrl && (
                              <button
                                onClick={() => window.open(fullDocUrl, '_blank')}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
                              >
                                <FileText className="w-4 h-4" />
                                View Uploaded
                              </button>
                            )}
                            {!verifyResult.error && (
                              <button
                                onClick={() => saveCandidate(verifyResult)}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
                              >
                                <Star className="w-4 h-4" />
                                Save Candidate
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const targetId = (verifyResult.id || verifyId || '').trim();
                                if (targetId) {
                                  window.open(`/certificate/${targetId}`, '_blank');
                                  toast.info('Opening official record...');
                                } else {
                                  toast.error('Could not resolve Certificate ID');
                                }
                              }}
                              className="px-4 py-2 bg-white text-green-600 hover:bg-green-50 rounded-lg font-bold transition-all flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95"
                            >
                              <Eye className="w-4 h-4" />
                              Official Record
                            </button>
                            <button
                              onClick={() => setIsReportModalOpen(true)}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95"
                            >
                              <AlertCircle className="w-4 h-4" />
                              Report Fraud
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className={`grid grid-cols-1 ${previewUrl ? 'lg:grid-cols-2' : ''} divide-x divide-gray-100`}>
                      {/* Data Panel */}
                      <div className="p-6">
                        {verifyResult.error ? (
                          <p className="text-red-800 font-medium text-lg text-center py-4">
                            {verifyResult.error || 'Certificate not found or invalid'}
                          </p>
                        ) : (
                          <div className="space-y-6">
                            {/* Primary Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Recipient Name</p>
                                    <p className="text-lg font-bold text-gray-900">{verifyResult.recipientName}</p>
                                    {verifyResult.recipientAddress && (
                                      <p className="text-xs text-gray-600 mt-1 font-mono">
                                        {verifyResult.recipientAddress.slice(0, 10)}...{verifyResult.recipientAddress.slice(-8)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <Award className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Certificate Title</p>
                                    <p className="text-lg font-bold text-gray-900">{verifyResult.title}</p>
                                    {verifyResult.certificateType && (
                                      <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold">
                                        {verifyResult.certificateType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <Building className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Issuing Institution</p>
                                    <p className="text-lg font-bold text-gray-900">
                                      {verifyResult.institution || verifyResult.issuerName}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">{verifyResult.issuerName}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Issue Date</p>
                                    <p className="text-lg font-bold text-gray-900">
                                      {verifyResult.issuedAt ? new Date(verifyResult.issuedAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                      }) : 'N/A'}
                                    </p>
                                    {verifyResult.year && (
                                      <p className="text-xs text-gray-600 mt-1">Class of {verifyResult.year}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional Details */}
                            {(verifyResult.grade || verifyResult.honors || verifyResult.description) && (
                              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100 mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Additional Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {verifyResult.grade && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Grade / GPA</p>
                                      <p className="text-base font-semibold text-gray-900">{verifyResult.grade}</p>
                                    </div>
                                  )}
                                  {verifyResult.honors && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">Honors</p>
                                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                                        {verifyResult.honors}
                                      </span>
                                    </div>
                                  )}
                                  {verifyResult.description && (
                                    <div className="md:col-span-3">
                                      <p className="text-xs text-gray-500 mb-1">Description</p>
                                      <p className="text-sm text-gray-700">{verifyResult.description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Blockchain & Status */}
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                Valid Certificate
                              </div>
                              {verifyResult.transactionHash && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                                  <Shield className="w-4 h-4" />
                                  Blockchain Verified
                                </div>
                              )}
                              {verifyResult.status === 'revoked' && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold">
                                  <XCircle className="w-4 h-4" />
                                  Revoked
                                </div>
                              )}
                            </div>

                            {verifyResult.transactionHash && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Blockchain Transaction</p>
                                <p className="text-xs font-mono text-gray-700 break-all">{verifyResult.transactionHash}</p>
                              </div>
                            )}

                            {/* Verification Report Section */}
                            {verifyResult.reasons && (
                              <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 mt-6">
                                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
                                  <span className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Official Verification Report
                                  </span>
                                  <button
                                    onClick={downloadReport}
                                    className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
                                  >
                                    <Download className="w-3 h-3" /> Download PDF
                                  </button>
                                </h4>
                                <div className="space-y-3">
                                  {/* Ensure reasons is an array map */}
                                  {verifyResult.reasons.map((reason, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium text-slate-700">{reason}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Verified at {new Date().toLocaleTimeString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600 italic leading-relaxed">
                                      This generated report confirms that the certificate details provided match the immutable records held by the issuing institution and the blockchain ledger. The digital signature is valid.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Preview Panel */}
                      {previewUrl && (
                        <div className="bg-gray-100 p-4 flex flex-col items-center justify-center min-h-[400px]">
                          <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 overflow-hidden flex flex-col">
                            <div className="p-2 bg-white border-b flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-500 uppercase">Document Preview</span>
                              <button
                                onClick={() => window.open(fullDocUrl || previewUrl || '', '_blank')}
                                className="text-[10px] text-blue-600 font-bold hover:underline"
                              >
                                OPEN FULL SIZE
                              </button>
                            </div>
                            <div className="flex-1 bg-white relative">
                              <img
                                src={previewUrl || ''}
                                alt="Certificate Preview"
                                className="w-full h-auto object-contain max-h-[600px] mx-auto"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Verification History */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5 text-purple-400" />
                    Verification History
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={exportHistory}
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white rounded-lg font-medium transition-colors flex items-center gap-2 border border-white/20"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-white placeholder-gray-400"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'verified' | 'invalid')}
                    aria-label="Filter verification history by status"
                    className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="invalid">Invalid / Tampered</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No verification history yet</p>
                    </div>
                  ) : (
                    filteredHistory.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => {
                          setVerifyId(h.id);
                          // Attach reasons back to the result if they exist in history
                          setVerifyResult({ ...h.result, reasons: h.reasons });
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                          toast.info(`Restored verification for ${h.result?.recipientName || 'Candidate'}`);
                        }}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          {h.status === 'verified' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <div>
                            <p className="font-semibold text-white">{h.result?.recipientName || 'Unknown'}</p>
                            <p className="text-sm text-gray-400">{h.id} • {new Date(h.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${h.status === 'verified' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                          h.status === 'tampered' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                            'bg-red-500/20 text-red-300 border-red-400/30'
                          }`}>
                          {h.status}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Saved Candidates Tab */}
          {activeTab === 'saved' && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Saved Candidates ({savedCandidates.length})
                </h2>
                {savedCandidates.length > 0 && (
                  <button
                    onClick={() => {
                      const csv = [
                        ['Name', 'Title', 'Institution', 'Issue Date', 'Saved Date', 'Notes', 'Tags', 'Status'].join(','),
                        ...savedCandidates.map(c => [
                          c.recipientName,
                          c.title,
                          c.issuerName || c.institution,
                          new Date(c.issuedAt).toLocaleDateString(),
                          new Date(c.savedAt).toLocaleDateString(),
                          (c.notes || 'No notes').replace(/,/g, ';'),
                          (c.tags || []).join('; '),
                          c.recruitmentStatus || 'New'
                        ].join(','))
                      ].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `candidates-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      toast.success('Candidates exported successfully');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
                  >
                    <Download className="w-4 h-4" />
                    Export All
                  </button>
                )}
              </div>
              <div className="grid gap-4">
                {savedCandidates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No saved candidates yet</p>
                    <p className="text-sm mt-2">Verify certificates and save promising candidates</p>
                  </div>
                ) : (
                  savedCandidates.map((candidate, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 bg-white/5 border border-white/10 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">{candidate.recipientName}</h3>
                            <select
                              value={candidate.recruitmentStatus || 'new'}
                              onChange={(e) => {
                                const updated = savedCandidates.map((c, idx) =>
                                  idx === i ? { ...c, recruitmentStatus: e.target.value } : c
                                );
                                setSavedCandidates(updated);
                                localStorage.setItem(`saved_candidates_${user.email}`, JSON.stringify(updated));
                                toast.success('Status updated');
                              }}
                              aria-label="Candidate recruitment status"
                              className={`px-3 py-1 text-xs rounded-full border-0 font-semibold focus:ring-2 focus:ring-blue-500 outline-none ${candidate.recruitmentStatus === 'hired' ? 'bg-green-200 text-green-800' :
                                candidate.recruitmentStatus === 'interviewed' ? 'bg-blue-200 text-blue-800' :
                                  candidate.recruitmentStatus === 'shortlisted' ? 'bg-yellow-200 text-yellow-800' :
                                    candidate.recruitmentStatus === 'rejected' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                              <option value="new">New</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="interviewed">Interviewed</option>
                              <option value="hired">Hired</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                          <p className="text-gray-300 mb-2">{candidate.title}</p>
                          <div className="flex flex-wrap gap-2 text-sm text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {candidate.issuerName || candidate.institution}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(candidate.issuedAt).toLocaleDateString()}
                            </span>
                            {candidate.grade && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold">
                                Grade: {candidate.grade}
                              </span>
                            )}
                            {candidate.honors && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-semibold">
                                {candidate.honors}
                              </span>
                            )}
                          </div>

                          {/* Notes Section */}
                          <div className="mt-3">
                            <textarea
                              value={candidate.notes || ''}
                              onChange={(e) => {
                                const updated = savedCandidates.map((c, idx) =>
                                  idx === i ? { ...c, notes: e.target.value } : c
                                );
                                setSavedCandidates(updated);
                                localStorage.setItem(`saved_candidates_${user.email}`, JSON.stringify(updated));
                              }}
                              placeholder="Add notes about this candidate..."
                              className="w-full px-3 py-2 text-sm bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none resize-none text-white placeholder-gray-400"
                              rows={2}
                            />
                          </div>

                          {/* Tags Section */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(candidate.tags || []).map((tag: string, tagIdx: number) => (
                              <span
                                key={tagIdx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium"
                              >
                                #{tag}
                                <button
                                  onClick={() => {
                                    const updated = savedCandidates.map((c, idx) =>
                                      idx === i ? { ...c, tags: c.tags?.filter((_tag, ti: number) => ti !== tagIdx) } : c
                                    );
                                    setSavedCandidates(updated);
                                    localStorage.setItem(`saved_candidates_${user.email}`, JSON.stringify(updated));
                                  }}
                                  className="hover:text-purple-900"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              placeholder="Add tag..."
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                  const updated = savedCandidates.map((c, idx) =>
                                    idx === i ? { ...c, tags: [...(c.tags || []), e.currentTarget.value.trim()] } : c
                                  );
                                  setSavedCandidates(updated);
                                  localStorage.setItem(`saved_candidates_${user.email}`, JSON.stringify(updated));
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="px-2 py-1 text-xs bg-white/10 border border-white/30 rounded-md focus:ring-2 focus:ring-purple-500 outline-none w-24 text-white placeholder-gray-400"
                            />
                          </div>

                          <p className="text-xs text-gray-500 mt-3">
                            Saved on {new Date(candidate.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/certificate/${candidate.id}`, '_blank')}
                            aria-label="View official record"
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="View official record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeCandidate(candidate.id)}
                            aria-label="Remove candidate"
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Remove from saved"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Verification Status */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border">
                  <h3 className="text-lg font-bold mb-6">Verification Status</h3>
                  {analytics.pieData.reduce((a, b) => a + b.value, 0) > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={analytics.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No data yet</p>
                    </div>
                  )}
                  <div className="flex justify-center gap-6 mt-4">
                    {analytics.pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="legend-indicator" data-color={item.color} aria-label={`${item.name} indicator`} />
                        <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Trend */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border">
                  <h3 className="text-lg font-bold mb-6">Weekly Activity</h3>
                  {analytics.trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No trend data yet</p>
                    </div>
                  )}
                </div>

                {/* Top Institutions */}
                {analytics.institutionData && analytics.institutionData.length > 0 && (
                  <div className="bg-white rounded-2xl p-8 shadow-sm border md:col-span-2">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Building className="w-5 h-5 text-orange-600" />
                      Top Verified Institutions
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.institutionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" stroke="#888" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={150} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#f97316" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Insights */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Average Daily Verifications',
                    value: analytics.avgPerDay || 0,
                    icon: TrendingUp,
                    color: 'blue'
                  },
                  {
                    title: 'Success Rate',
                    value: verificationHistory.length > 0
                      ? Math.round((verificationHistory.filter(h => h.status === 'verified').length / verificationHistory.length) * 100)
                      : 0,
                    unit: '%',
                    icon: CheckCircle2,
                    color: 'green'
                  },
                  {
                    title: 'Days Active',
                    value: analytics.totalDaysActive || 0,
                    icon: Calendar,
                    color: 'purple'
                  },
                  {
                    title: 'Saved Candidates',
                    value: savedCandidates.length,
                    icon: Users,
                    color: 'orange'
                  }
                ].map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border shadow-sm"
                  >
                    <insight.icon className={`w-8 h-8 text-${insight.color}-600 mb-4`} />
                    <p className="text-sm text-gray-600 mb-1">{insight.title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {insight.value}{insight.unit}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Fraud Reports History Tab */}
          {activeTab === 'reports' && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black flex items-center gap-3 text-white tracking-tight uppercase">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                  Your Fraud Reports ({fraudReports.length})
                </h2>
                <div className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em] bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full shadow-inner">
                  Real-Time Investigation Tracker
                </div>
              </div>

              <div className="space-y-4">
                {fraudReports.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                    <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-white/10" />
                    <p className="text-white font-bold text-lg">No fraud reports submitted yet.</p>
                    <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto">Use the "Report Fraud" button in verification results to flag suspicious activity for formal investigation.</p>
                  </div>
                ) : (
                  fraudReports.map((report, i) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl hover:shadow-red-500/5"
                    >
                      <div className="flex items-start gap-5">
                        <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30 shadow-lg">
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-black text-white text-lg tracking-tight uppercase">{report.certificateId}</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${report.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                              report.status === 'investigating' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                                'bg-green-500/20 text-green-400 border-green-500/40'
                              }`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white/50 mb-3 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Reported on {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <div className="text-[10px] bg-white/10 px-3 py-1.5 rounded-lg text-white font-black uppercase tracking-widest border border-white/10">
                              Reason: {report.reason.replace(/_/g, ' ')}
                            </div>
                            {report.institution && (
                              <div className="text-[10px] bg-cyan-500/10 px-3 py-1.5 rounded-lg text-cyan-400 font-black uppercase tracking-widest border border-cyan-500/20">
                                {report.institution}
                              </div>
                            )}
                          </div>
                          {report.details && (
                            <p className="mt-4 text-sm text-gray-300 leading-relaxed border-l-2 border-red-500/30 pl-4 py-1 italic">
                              "{report.details}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setVerifyId(report.certificateId);
                            setActiveTab('verify');
                            setTimeout(() => handleVerify(), 100);
                          }}
                          className="px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-red-600 text-xs font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center gap-3 shadow-lg active:scale-95"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Re-Verify Record
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Security Credentials</h2>
                    <p className="text-sm text-gray-300">Update your access keys and manage protection.</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400 ml-1">Current Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="password"
                        placeholder="Your current security key"
                        className="w-full h-12 pl-11 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none text-white transition-all"
                        value={passwordForm.oldPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                        disabled={isChangingPassword}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-white/10 w-full" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400 ml-1">New Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                        <input
                          type="password"
                          placeholder="Min 8 chars"
                          className="w-full h-12 pl-11 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none text-white transition-all"
                          value={passwordForm.password}
                          onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                          disabled={isChangingPassword}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400 ml-1">Confirm New Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                        <input
                          type="password"
                          placeholder="Re-type new security key"
                          className="w-full h-12 pl-11 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none text-white transition-all"
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

                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-400 leading-relaxed font-black uppercase tracking-widest">
                      Security Notice: Password reuse is prohibited for your last 5 security keys.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isChangingPassword ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Authorize Password Update"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Report Fraud Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Report Fraudulent Certificate
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-white/80 hover:text-white"
                aria-label="Close modal"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-xs text-red-800">
                  Reporting a certificate initiates a formal investigation. Please provide as much detail as possible to assist our security team.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="fraud-reason">
                    Primary Reason
                  </label>
                  <select
                    id="fraud-reason"
                    value={reportForm.reason}
                    onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  >
                    <option value="">Select a reason...</option>
                    <option value="fake_document">Counterfeit / Fake Document</option>
                    <option value="identity_theft">Identity Theft / Impersonation</option>
                    <option value="altered_data">Altered Grades or Details</option>
                    <option value="invalid_issuer">Issuer Not Recognized</option>
                    <option value="other">Other Suspicious Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="fraud-details">
                    Investigation Details
                  </label>
                  <textarea
                    id="fraud-details"
                    value={reportForm.details}
                    onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                    placeholder="Describe what exactly seems fraudulent about this certificate..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setIsReportModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!reportForm.reason) {
                        toast.error('Please select a reason');
                        return;
                      }
                      setSubmittingReport(true);
                      try {
                        const res = await fetch('/certificates/report', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            certificateId: verifyResult?.id || verifyId,
                            reason: reportForm.reason,
                            details: reportForm.details,
                            institution: verifyResult?.institution || verifyResult?.issuerName
                          }),
                          credentials: 'include'
                        });
                        if (res.ok) {
                          const data = await res.json();
                          toast.success(data.message);
                          setIsReportModalOpen(false);
                          setReportForm({ reason: '', details: '' });

                          // Refresh reports list
                          const refreshRes = await fetch('/employer/reports', { credentials: 'include' });
                          if (refreshRes.ok) {
                            const newData = await refreshRes.json();
                            setFraudReports(newData);
                          }
                        } else {
                          const errorData = await res.json().catch(() => ({}));
                          toast.error(errorData.error || 'Failed to submit report. Please try again later.');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Connection error while reporting.');
                      } finally {
                        setSubmittingReport(false);
                      }
                    }}
                    disabled={submittingReport}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    {submittingReport ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    Submit Report
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmployerPortal;
