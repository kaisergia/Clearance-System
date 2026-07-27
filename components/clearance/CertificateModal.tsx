"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { Printer, Download, X, ShieldCheck, QrCode as QrIcon, CheckCircle2, ExternalLink } from "lucide-react";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    department: string;
    program: string;
    year: string;
    semester?: string;
  };
}

export function CertificateModal({ isOpen, onClose, student }: CertificateModalProps) {
  const [mounted, setMounted] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const verificationCode = `CJC-CLR-2026-${student.id}`;
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    setMounted(true);

    // Generate high-resolution scannable QR Code URL linking to /verify/[code]
    const generateQR = async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        const verifyUrl = `${origin}/verify/${encodeURIComponent(verificationCode)}`;
        const url = await QRCode.toDataURL(verifyUrl, {
          width: 320,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error("QR Code generation error", err);
      }
    };

    generateQR();
  }, [student.id, verificationCode]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div id="certificate-modal-root" className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible">
      {/* Outer Card Wrapper */}
      <div className="relative bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col my-auto border border-slate-800 overflow-hidden print:max-h-none print:shadow-none print:border-none print:bg-white print:w-full print:max-w-none">
        
        {/* Action Header bar (Hidden during print) */}
        <div className="print:hidden sticky top-0 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800/80 z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">Clearance Pass</h3>
              <p className="text-[10px] text-slate-400 font-mono">Mobile &amp; Scan Ready</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white font-semibold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-950/40 print:p-0 print:bg-white print:overflow-visible flex flex-col items-center">
          
          {/* Official Clearance Slip Ticket Card */}
          <div className="relative w-full bg-white text-slate-900 rounded-2xl shadow-xl border-2 border-red-900/20 p-5 sm:p-6 print:border-slate-300 print:shadow-none print:rounded-none overflow-hidden">
            
            {/* Watermark Logo Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <img src="/images/logos/cjc-logo.webp" alt="" className="w-72 h-72 object-contain" />
            </div>

            {/* Header: College Branding & Title */}
            <div className="text-center pb-4 border-b border-dashed border-slate-200 relative z-10">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <img
                  src="/images/logos/cjc-logo.webp"
                  alt="Cor Jesu College Logo"
                  className="w-10 h-10 object-contain drop-shadow-sm"
                />
                <div className="text-left">
                  <h1 className="text-sm font-serif font-black tracking-wider text-[#881337] uppercase leading-none">
                    Cor Jesu College
                  </h1>
                  <span className="text-[9px] font-semibold text-slate-500 tracking-wider uppercase block mt-0.5">
                    Digos City, Davao del Sur
                  </span>
                </div>
              </div>
              
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Official Clearance Slip</span>
              </div>
            </div>

            {/* Hero QR Code Container */}
            <div className="my-5 text-center flex flex-col items-center justify-center relative z-10">
              <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md ring-4 ring-emerald-500/10">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Verification QR Code" className="w-44 h-44 object-contain rounded-lg" />
                ) : (
                  <div className="w-44 h-44 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold">
                    Generating QR...
                  </div>
                )}
              </div>
              
              {/* Verification Code Box */}
              <div className="mt-3 px-3 py-1 bg-slate-100 rounded-md border border-slate-200 inline-block">
                <span className="text-xs font-mono font-bold tracking-wider text-slate-800 select-all">{verificationCode}</span>
              </div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                Show to Staff for Scanning
              </p>
            </div>

            {/* Student Details Section */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 relative z-10">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Student Name</span>
                <span className="font-bold text-sm text-slate-900 uppercase block">{student.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Student ID</span>
                  <span className="font-mono font-bold text-slate-800">{student.id}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Year Level</span>
                  <span className="font-bold text-slate-800">{student.year || "N/A"}</span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-200/60 text-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Department &amp; Program</span>
                <span className="font-semibold text-slate-800">{student.program} ({student.department})</span>
              </div>

              <div className="pt-1 border-t border-slate-200/60 text-xs flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Term</span>
                  <span className="font-medium text-slate-700 text-[11px]">{student.semester || "1st Sem 2025-2026"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date Cleared</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{currentDate}</span>
                </div>
              </div>
            </div>

            {/* Footer Authentication Notice */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-slate-500 relative z-10 text-[9px]">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">Digitally Verified</span>
              </div>
              <span className="font-serif italic text-slate-400">Office of the Registrar</span>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
