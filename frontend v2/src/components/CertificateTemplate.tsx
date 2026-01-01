import { Award, Shield, Scan, ShieldCheck } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { sha256, toUtf8Bytes } from 'ethers';

interface CertificateData {
    recipientName: string;
    title: string;
    year: string;
    studentEmail?: string;
    grade?: string;
    description?: string;
    certificateType?: string;
    institution?: string;
    honors?: string;
    issuedBy?: string;
    dateIssued?: string;
    certificateId?: string;
    registrationNumber?: string;
    transactionHash?: string;
}

interface CertificateTemplateProps {
    data: CertificateData;
    preview?: boolean;
}

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
    ({ data }, ref) => {
        const {
            recipientName,
            title,
            year,
            grade,
            description,
            certificateType = 'DEGREE CERTIFICATE',
            institution = 'UNIVERSITY OF TECHNOLOGY',
            issuedBy,
            dateIssued,
            certificateId,
            registrationNumber,
            transactionHash,
        } = data;

        const [contentHash, setContentHash] = useState('');

        const qrPayload = JSON.stringify({
            id: certificateId || 'PENDING',
            regNo: registrationNumber,
            name: recipientName,
            program: title,
            date: dateIssued,
            hash: contentHash,
            issuer: institution
        });

        useEffect(() => {
            if (recipientName && title) {
                const raw = `${recipientName}|${title}|${year}|${grade || ''}|${certificateId || ''}`;
                const hash = sha256(toUtf8Bytes(raw));
                setContentHash(hash);
            }
        }, [recipientName, title, year, grade, certificateId]);

        return (
            <div
                ref={ref}
                id="certificate-to-capture"
                className="bg-[#fdfcf7] text-slate-900 relative p-0 shadow-2xl w-[1120px] h-[792px] min-w-[1120px] min-h-[792px] font-serif mx-auto overflow-hidden border-[1px] border-slate-200"
            >
                {/* Main Border System */}
                <div className="absolute inset-4 border-[3px] border-[#92400e] opacity-80" />
                <div className="absolute inset-6 border-[1px] border-[#92400e] opacity-40" />

                {/* Corner Decorative Elements */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-[6px] border-l-[6px] border-[#92400e]" />
                <div className="absolute top-4 right-4 w-16 h-16 border-t-[6px] border-r-[6px] border-[#92400e]" />
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-[6px] border-l-[6px] border-[#92400e]" />
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-[6px] border-r-[6px] border-[#92400e]" />

                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <Shield className="w-[500px] h-[500px]" />
                </div>

                {/* Content Layout */}
                <div className="relative h-full flex flex-col items-center justify-between py-16 px-24">

                    {/* Header with Dual Logos */}
                    <div className="w-full flex items-center justify-between gap-8 mb-4">
                        {/* Left: Ministry of Education Logo */}
                        <div className="flex-shrink-0">
                            <div className="h-32 w-32 flex items-center justify-center p-1 bg-white rounded-2xl shadow-md border-2 border-slate-100/80 overflow-hidden backdrop-blur-sm">
                                <img
                                    src="/logos/moe-logo.png"
                                    alt="Ministry of Education Logo"
                                    className="max-w-full max-h-full object-contain transform hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                    }}
                                />
                            </div>
                            <p className="text-[8px] text-center font-bold text-slate-400 mt-2 uppercase tracking-widest">Ministry of Education</p>
                        </div>

                        {/* Center: Institution Name */}
                        <div className="text-center flex-1 mx-4">
                            <h1 className="text-4xl font-black tracking-widest text-[#1e293b] uppercase mb-1 leading-tight">
                                {institution}
                            </h1>
                            <p className="text-sm font-bold tracking-[0.4em] text-[#92400e] uppercase">
                                {certificateType}
                            </p>
                        </div>

                        {/* Right: University Logo */}
                        <div className="flex-shrink-0">
                            {institution && (
                                <div className="h-32 w-32 flex items-center justify-center p-1 bg-white rounded-2xl shadow-md border-2 border-slate-100/80 overflow-hidden backdrop-blur-sm">
                                    <img
                                        src={`/logos/${institution.toLowerCase().replace(/'/g, '').replace(/\./g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}.png`}
                                        alt={`${institution} Logo`}
                                        className="max-w-full max-h-full object-contain transform hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                            <p className="text-[10px] text-center font-black text-slate-800 mt-2 uppercase tracking-tight max-w-[128px] leading-tight drop-shadow-sm">
                                {institution}
                            </p>
                        </div>
                    </div>

                    {/* Certifies Center Piece */}
                    <div className="text-center space-y-4">
                        <p className="text-xl italic text-slate-500 font-serif">This certifies that</p>
                        <h2 className="text-6xl font-black text-[#0f172a] tracking-tight">
                            {recipientName || 'Recipient Name'}
                        </h2>
                        <p className="text-lg text-slate-500 font-medium">has successfully completed the program</p>
                        <h3 className="text-4xl font-extrabold text-[#92400e] uppercase tracking-wide max-w-3xl leading-tight">
                            {title || 'Course Title'}
                        </h3>
                        {description && (
                            <p className="text-xs text-slate-400 italic max-w-xl mx-auto">{description}</p>
                        )}
                    </div>

                    {/* Academic Metadata */}
                    <div className="flex gap-12 items-center text-sm font-bold">
                        <p className="text-slate-500 uppercase tracking-widest">Academic Year: <span className="text-[#92400e]">{year || '2025'}</span></p>
                        <p className="text-slate-500 uppercase tracking-widest">Reg No: <span className="text-[#92400e]">{registrationNumber || 'N/A'}</span></p>
                    </div>

                    {/* Footer Section */}
                    <div className="w-full grid grid-cols-3 items-end mt-4">

                        {/* Left: QR Code & Verification */}
                        <div className="flex flex-col items-start gap-3">
                            <div className="bg-white p-2 border border-slate-200 shadow-sm rounded-sm">
                                <QRCodeSVG value={qrPayload} size={90} />
                            </div>
                            <div className="text-left">
                                <p className="text-[7px] font-mono text-slate-400 max-w-[120px] truncate">HASH: {contentHash.slice(0, 16)}...</p>
                                <div className="flex items-center gap-1 text-[#0284c7] font-bold">
                                    <Scan className="w-3 h-3" />
                                    <span className="text-[10px] uppercase tracking-tighter">Digital Verify</span>
                                </div>
                            </div>
                        </div>

                        {/* Center: Authentic Seal */}
                        <div className="flex flex-col items-center justify-center relative group">
                            <div className="relative flex items-center justify-center scale-125">
                                {/* Outer Starburst/Glow effect */}
                                <div className="absolute inset-0 bg-[#d97706]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                {/* The Main Seal Body */}
                                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#92400e] via-[#d97706] to-[#fcd34d] p-[1.5px] shadow-[0_10px_40px_-10px_rgba(180,83,9,0.5)] relative overflow-hidden">
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#fcd34d] via-[#d97706] to-[#92400e] flex items-center justify-center relative">

                                        {/* Embossed Ring Effect */}
                                        <div className="absolute inset-1.5 rounded-full border-[1.5px] border-[#fffbeb]/40 shadow-inner" />
                                        <div className="absolute inset-2.5 rounded-full border-[0.5px] border-[#451a03]/20" />

                                        {/* Rotating Security Text / Elements */}
                                        <div className="absolute inset-0 flex items-center justify-center animate-[spin_30s_linear_infinite]">
                                            <div className="w-28 h-28 rounded-full border border-dashed border-[#fffbeb]/20" />
                                        </div>

                                        {/* Center Icon & Branding */}
                                        <div className="flex flex-col items-center justify-center z-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            <div className="relative p-2">
                                                <div className="absolute inset-0 bg-[#fffbeb]/20 blur-md rounded-full scale-150" />
                                                <ShieldCheck className="w-12 h-12 relative" strokeWidth={1.5} />
                                            </div>
                                            <div className="flex flex-col items-center -mt-1">
                                                <div className="h-[1px] w-8 bg-white/40 mb-1" />
                                                <span className="text-[7px] font-black uppercase tracking-[0.4em] leading-none mb-0.5">Verified</span>
                                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#fffbeb]">AUTHENTIC</span>
                                                <div className="h-[1px] w-8 bg-white/40 mt-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Starburst/Seal Edge Details */}
                                <div className="absolute -inset-1 border-[6px] border-[#d97706]/10 rounded-full opacity-50" />
                            </div>
                        </div>

                        {/* Right: Signature & ID */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-center w-full max-w-[200px] relative">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-16 pointer-events-none overflow-hidden">
                                    <img
                                        src="/registrar-signature.png"
                                        alt="Registrar Signature"
                                        className="w-full h-full object-contain -rotate-3 opacity-90 transition-opacity hover:opacity-100"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                                <p className="font-serif text-2xl italic text-[#1e293b] mb-1">{issuedBy || 'Registrar'}</p>
                                <div className="h-[1px] bg-[#1e293b] w-full" />
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Authorized Registrar Signature</p>
                            </div>
                            <div className="mt-4 text-right">
                                <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">
                                    Certificate ID: <span className="text-[#0f172a]">{certificateId || 'PENDING'}</span>
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 mt-0.5">
                                    Issued On: {dateIssued || new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Blockchain Microtext Footer */}
                {transactionHash && (
                    <div className="absolute bottom-2 w-full text-center">
                        <span className="text-[6px] font-mono text-slate-300 uppercase tracking-widest opacity-50">
                            Immutable Ledger Record: {transactionHash} • Secured by Ethereum Blockchain
                        </span>
                    </div>
                )}
            </div>
        );
    }
);

CertificateTemplate.displayName = 'CertificateTemplate';

export default CertificateTemplate;
