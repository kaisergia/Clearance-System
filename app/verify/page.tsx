"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ShieldCheck, QrCode, Building2, ArrowRight } from "lucide-react";

export default function VerificationSearchPage() {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) {
      setError("Please enter a Student ID or Clearance Verification Code.");
      return;
    }
    router.push(`/verify/${encodeURIComponent(codeInput.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 md:p-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-10">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#b51b15]/10 text-[#b51b15] mb-1">
            <img src="/images/logos/cjc-logo.webp" alt="Cor Jesu College Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Cor Jesu College
          </h1>
          <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Public Clearance Certificate Verification Portal
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="verifyCode" className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
              Verification Code or Student ID Number
            </label>
            <div className="relative">
              <input
                id="verifyCode"
                type="text"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setError("");
                }}
                placeholder="e.g. CJC-CLR-2026-2021-0492 or 2021-0492"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium text-sm outline-none focus:ring-2 focus:ring-[#b51b15]/20 focus:border-[#b51b15] transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            {error && <p className="text-red-500 text-xs font-semibold mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#b51b15] hover:bg-[#961410] text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            Verify Certificate
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Informational Cards */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5">
            <QrCode className="w-4 h-4 text-[#b51b15] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">QR Code Scan</span>
              <span className="text-slate-500 text-[11px]">Scan QR code on printed certificate to open verification directly.</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">Real-time Check</span>
              <span className="text-slate-500 text-[11px]">Direct live query against official CJC Registrar database.</span>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-xs font-semibold text-slate-500 hover:text-[#b51b15] transition-colors">
            Return to Login Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
