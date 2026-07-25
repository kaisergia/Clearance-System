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
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    setMounted(true);

    // Generate real scannable QR Code URL linking to /verify/[code]
    const generateQR = async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        const verifyUrl = `${origin}/verify/${encodeURIComponent(verificationCode)}`;
        const url = await QRCode.toDataURL(verifyUrl, {
          width: 250,
          margin: 1,
          color: {
            dark: "#1e293b",
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Container Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col my-auto border border-slate-200 overflow-hidden">
        
        {/* Action Header bar (Hidden during print) */}
        <div className="print:hidden sticky top-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Official Certificate of Clearance</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#b51b15] hover:bg-[#961410] text-white font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div className="p-6 sm:p-10 md:p-12 overflow-y-auto flex-1 bg-white print:p-0 print:shadow-none print:max-w-none">
          
          {/* Certificate Inner Frame with Double Border */}
          <div className="border-4 border-double border-[#b51b15]/80 p-6 sm:p-10 rounded-xl relative bg-[#faf8f5]/40 print:border-[#b51b15]">
            
            {/* Watermark Logo Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <img src="/images/logos/cjc-logo.webp" alt="Watermark Seal" className="w-[420px] h-[420px] object-contain" />
            </div>

            {/* Top Institutional Header */}
            <div className="text-center space-y-2 mb-8 border-b border-slate-200/80 pb-6 relative z-10">
              <div className="flex justify-center mb-3">
                <img
                  src="/images/logos/cjc-logo.webp"
                  alt="Cor Jesu College Official Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-sm"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wider text-[#b51b15] uppercase">
                Cor Jesu College
              </h1>
              <p className="text-xs font-semibold text-slate-600 tracking-widest uppercase">
                Sacred Heart Avenue, Digos City, Davao del Sur, Philippines
              </p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                Office of the Registrar & Student Services
              </p>
            </div>

            {/* Certificate Title */}
            <div className="text-center space-y-1 mb-8 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight uppercase">
                Official Certificate of Clearance
              </h2>
              <div className="w-32 h-1 bg-[#b51b15] mx-auto rounded-full" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">
                Academic Period: {student.semester || "1st Semester 2025-2026"}
              </p>
            </div>

            {/* Wording Content */}
            <div className="text-center space-y-6 max-w-2xl mx-auto my-8 relative z-10 text-slate-800 leading-relaxed font-serif">
              <p className="text-base text-slate-600 italic">
                This is to certify that
              </p>
              
              <div className="py-2 border-b-2 border-slate-900/10 inline-block px-8">
                <h3 className="text-2xl sm:text-3xl font-sans font-black text-slate-900 uppercase tracking-wide">
                  {student.name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans text-slate-700 bg-white/80 p-3 rounded-lg border border-slate-200/80 max-w-lg mx-auto">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Student ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{student.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Year Level</span>
                  <span className="font-bold text-slate-900 text-sm">{student.year}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Department & Program</span>
                  <span className="font-semibold text-slate-900 text-sm">{student.program} ({student.department})</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-700 font-sans leading-relaxed text-justify px-4">
                has satisfactorily cleared all financial, academic, administrative, library, clinic, and departmental requirements for Cor Jesu College. No outstanding holds or deficiencies remain on record as of <strong>{currentDate}</strong>.
              </p>
            </div>

            {/* QR Code & Signatures Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end relative z-10">
              
              {/* QR Code Section */}
              <div className="flex flex-col items-center sm:items-start space-y-1.5">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Verification QR Code" className="w-24 h-24 rounded border border-slate-200 bg-white p-1" />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs font-bold">QR Loading</div>
                )}
                <span className="text-[10px] font-mono font-bold text-slate-500">{verificationCode}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Scan to Verify Authenticity</span>
              </div>

              {/* Official Seal Badge */}
              <div className="text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#b51b15] flex flex-col items-center justify-center p-2 text-center bg-[#b51b15]/5">
                  <ShieldCheck className="w-8 h-8 text-[#b51b15]" />
                  <span className="text-[8px] font-bold text-[#b51b15] uppercase tracking-tighter mt-0.5">Official Seal</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">Issued Date: {currentDate}</span>
              </div>

              {/* Signatory Block */}
              <div className="text-center space-y-1">
                <div className="h-12 border-b border-slate-800 flex items-end justify-center pb-1">
                  <span className="font-serif italic text-slate-600 text-sm font-semibold">Cor Jesu Registrar</span>
                </div>
                <span className="font-sans font-bold text-xs text-slate-900 block uppercase">College Registrar</span>
                <span className="font-sans text-[10px] text-slate-500 block">Cor Jesu College Head of Admissions</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
