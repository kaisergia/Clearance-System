"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, ArrowLeft } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl animate-pulse">
        <WifiOff className="w-10 h-10" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">You are Currently Offline</h1>
      <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">
        We couldn't reach the Cor Jesu College Clearance System servers. Please check your internet connection or Cloudflare tunnel status.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-[#c41e2a] hover:bg-[#9a1820] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>

        <Link
          href="/"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
