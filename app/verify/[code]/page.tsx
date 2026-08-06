"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Award, Calendar, Building2, CheckCircle2, XCircle, Search, ArrowLeft, ExternalLink } from "lucide-react";

export default function VerificationResultPage() {
  const params = useParams();
  const rawParam = params?.code;
  const code = Array.isArray(rawParam) ? rawParam[0] : (rawParam as string) || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    const verifyCode = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(code)}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Invalid or unverified clearance slip code.");
          setData(null);
        } else {
          setData(json);
          setError("");
        }
      } catch (err) {
        setError("Failed to connect to verification server.");
      } finally {
        setLoading(false);
      }
    };
    verifyCode();
  }, [code]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 md:p-10 flex flex-col items-center">
      {/* Top Header */}
      <header className="w-full max-w-3xl flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <Link href="/verify" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#b51b15] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Verify Another Code
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Cor Jesu College Verification Portal
        </span>
      </header>

      <main className="w-full max-w-3xl">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-12 h-12 border-4 border-[#b51b15] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900">Verifying Clearance Record...</h2>
            <p className="text-sm text-slate-500 mt-1">Checking official Cor Jesu College Registrar records...</p>
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Invalid or Unverified Clearance Slip</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {error || "The verification code provided does not match an official cleared student record."}
            </p>
            <div className="pt-4">
              <Link
                href="/verify"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                Search Again
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Verification Status Banner */}
            <div className={`p-6 sm:p-8 ${data.valid ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"} flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  {data.valid ? <ShieldCheck className="w-8 h-8 text-white" /> : <ShieldAlert className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-1">
                    {data.valid ? "Official Authenticated Record" : "Pending Requirements"}
                  </div>
                  <h1 className="text-2xl font-black leading-tight">
                    {data.valid ? "Clearance Authenticated & Valid" : "Clearance Incomplete"}
                  </h1>
                </div>
              </div>

              <div className="text-center sm:text-right shrink-0 bg-black/10 px-4 py-2 rounded-xl backdrop-blur-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">Verification Code</span>
                <span className="text-sm font-mono font-bold tracking-wide">{data.verificationCode}</span>
              </div>
            </div>

            {/* Institution Brand */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/images/logos/cjc-logo.webp" alt="Cor Jesu College Logo" className="w-10 h-10 object-contain rounded-full shadow-sm" />
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Cor Jesu College</h2>
                  <p className="text-xs text-slate-500">Sacred Heart Avenue, Digos City, Davao del Sur</p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                Issued: {data.issuedDate}
              </span>
            </div>

            {/* Student Info Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Student Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                  <div>
                    <span className="text-xs text-slate-500 block">Full Name</span>
                    <span className="text-base font-bold text-slate-900">{data.student.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Student ID Number</span>
                    <span className="text-base font-mono font-bold text-slate-900">{data.student.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Department / College</span>
                    <span className="text-sm font-semibold text-slate-800">{data.student.department}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Course / Program</span>
                    <span className="text-sm font-semibold text-slate-800">{data.student.program}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Year Level</span>
                    <span className="text-sm font-semibold text-slate-800">{data.student.year}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Academic Term</span>
                    <span className="text-sm font-semibold text-slate-800">{data.student.semester}</span>
                  </div>
                </div>
              </div>

              {/* Clearance Summary Status */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Signatory Verification Summary</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="px-4 py-3 bg-slate-50 flex items-center justify-between font-bold text-xs text-slate-600 uppercase tracking-wider">
                    <span>Clearance Signatories</span>
                    <span>Status</span>
                  </div>

                  {data.records && data.records.length > 0 ? (
                    data.records.map((rec: any, idx: number) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-800 capitalize">
                          {rec.entityName || `${rec.entityType} Signatory #${rec.entityId}`}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          rec.status === "Cleared" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {rec.status === "Cleared" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {rec.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-center text-xs text-slate-500">
                      All required office, department, and org sign-offs are verified complete.
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-700 block mb-0.5">Official Verification Note:</span>
                This digital verification result is queried directly from Cor Jesu College's Clearance Management Database. For formal transcript release or graduation processing, present this digital record or the printed clearance certificate.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
