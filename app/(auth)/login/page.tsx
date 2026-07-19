"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Developer Bypass States
  const [devRole, setDevRole] = useState("student");
  const [selectedOfficeId, setSelectedOfficeId] = useState("1");
  const [selectedDeptId, setSelectedDeptId] = useState("1");
  const [selectedOrgId, setSelectedOrgId] = useState("1");
  const [devOpen, setDevOpen] = useState(false);

  // Debug Reset States
  const [resetStudentId, setResetStudentId] = useState("__all__");
  const [resetStatus, setResetStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const keys = ["dev-role-override", "dev-entityId-override", "role", "officeId", "departmentId", "orgId", "activeStudentId", "displayName"];
    keys.forEach(key => {
      localStorage.removeItem(key);
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    });
    if (errorParam) {
      if (errorParam === "AccessDenied") {
        const domain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "g.cjc.edu.ph";
        setError(`Access denied. Only @${domain} Google accounts are allowed to sign in.`);
      } else if (errorParam === "Configuration") {
        setError("Database or authentication server configuration error. Please contact IT support.");
      } else {
        setError("An error occurred during authentication. Please try again.");
      }
    }
  }, [errorParam]);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Google sign in trigger failed:", err);
      setError("Failed to initialize Google sign in. Please refresh and try again.");
      setIsLoading(false);
    }
  };

  const handleDevBypass = () => {
    let entityId = "";
    if (devRole === "student") entityId = "2021-0492";
    else if (devRole === "head-office") entityId = selectedOfficeId;
    else if (devRole === "department") entityId = selectedDeptId;
    else if (devRole === "org") entityId = selectedOrgId;

    document.cookie = `dev-role-override=${devRole}; path=/; max-age=86400`;
    document.cookie = `dev-entityId-override=${entityId}; path=/; max-age=86400`;
    document.cookie = `role=${devRole}; path=/; max-age=86400`;

    if (devRole === "head-office") {
      document.cookie = `officeId=${entityId}; path=/; max-age=86400`;
      localStorage.setItem("officeId", entityId);
    } else if (devRole === "department") {
      document.cookie = `departmentId=${entityId}; path=/; max-age=86400`;
      localStorage.setItem("departmentId", entityId);
    } else if (devRole === "org") {
      document.cookie = `orgId=${entityId}; path=/; max-age=86400`;
      localStorage.setItem("orgId", entityId);
    } else if (devRole === "student") {
      document.cookie = `activeStudentId=${entityId}; path=/; max-age=86400`;
      localStorage.setItem("activeStudentId", entityId);
    }
    localStorage.setItem("role", devRole);

    const redirectUrls: Record<string, string> = {
      admin: "/admin/dashboard",
      "head-office": "/head-office/dashboard",
      department: "/department/dashboard",
      org: "/org/dashboard",
      student: "/student/dashboard",
    };
    window.location.href = redirectUrls[devRole] || "/login";
  };

  const handleDebugReset = async () => {
    const label = resetStudentId === "__all__" ? "ALL students" : `student ${resetStudentId}`;
    if (!confirm(`⚠️ Reset clearance data for ${label}?\n\nThis will:\n• Delete all file submissions\n• Remove uploaded files from disk\n• Reset all clearance statuses to Pending\n\nThis cannot be undone.`)) return;

    setIsResetting(true);
    setResetStatus(null);
    try {
      const body = resetStudentId === "__all__" ? {} : { studentId: resetStudentId };
      const res = await fetch("/api/debug/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setResetStatus({ type: "success", message: data.message });
    } catch (err: any) {
      setResetStatus({ type: "error", message: err.message || "Reset failed. Check server logs." });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-0">
      <div className="w-full max-w-md space-y-4">

        {/* ── Main Login Card ── */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] border border-surface-container-high overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center border-b border-surface-container-high bg-surface-bright">
            <img
              src="/images/logos/cjc-logo.webp"
              alt="Cor Jesu College Logo"
              className="h-16 w-16 object-contain rounded-full shadow-sm mx-auto mb-4"
            />
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Clearance System</h1>
            <p className="font-body-md text-body-md text-secondary">Cor Jesu College Portal</p>
          </div>

          <div className="px-8 py-10 space-y-6">
            <p className="text-center text-body-md text-on-surface font-medium">
              Please sign in with your institutional Google account to continue.
            </p>

            {error && (
              <div className="flex items-start gap-2.5 p-4 rounded-lg bg-red-50 border border-red-200">
                <span className="material-symbols-outlined text-brand-red text-[20px] shrink-0 mt-0.5">error</span>
                <p className="text-brand-red font-body-sm text-body-sm font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full flex justify-center items-center gap-3.5 py-3.5 px-4 border border-surface-container-high rounded-md shadow-sm text-on-surface bg-surface-container-lowest font-medium text-body-md hover:bg-surface-bright transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Connecting to Google…</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="px-8 py-5 bg-surface-bright border-t border-surface-container-high text-center">
            <p className="font-body-sm text-body-sm text-tertiary">
              Secure access for authorized personnel only.{" "}
              <a href="#" className="text-secondary font-medium hover:text-brand-red transition-colors">
                Contact IT Support
              </a>
            </p>
          </div>
        </div>

        {/* ── Developer Diagnostics Panel (collapsible) ── */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] border border-dashed border-outline/30 overflow-hidden">

          {/* Toggle header */}
          <button
            type="button"
            onClick={() => setDevOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 px-6 py-4 hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">terminal</span>
              <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Developer Diagnostics</span>
            </div>
            <svg
              className={`w-4 h-4 text-secondary transition-transform duration-200 ${devOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Collapsible body */}
          {devOpen && (
            <div className="px-6 pb-6 space-y-4 border-t border-surface-container-high">

              {/* Bypass Login */}
              <div className="space-y-3 pt-4">
                <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Bypass Login</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">Select Role</label>
                    <select
                      value={devRole}
                      onChange={(e) => setDevRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary transition-colors"
                    >
                      <option value="student">Student (Eleanor — 2021-0492)</option>
                      <option value="admin">System Admin</option>
                      <option value="head-office">Head Office</option>
                      <option value="department">Department Head</option>
                      <option value="org">Org / Club Adviser</option>
                    </select>
                  </div>

                  {devRole === "head-office" && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">Select Office</label>
                      <select value={selectedOfficeId} onChange={(e) => setSelectedOfficeId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary transition-colors">
                        <option value="1">Registrar (ID: 1)</option>
                        <option value="2">Library (ID: 2)</option>
                        <option value="3">Guidance Office (ID: 3)</option>
                        <option value="4">Accounting (ID: 4)</option>
                        <option value="5">Discipline Office (ID: 5)</option>
                      </select>
                    </div>
                  )}

                  {devRole === "department" && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">Select Department</label>
                      <select value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary transition-colors">
                        <option value="1">CCIS (ID: 1)</option>
                        <option value="2">COE (ID: 2)</option>
                      </select>
                    </div>
                  )}

                  {devRole === "org" && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">Select Org / Club</label>
                      <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary transition-colors">
                        <option value="1">Computer Science Society (ID: 1)</option>
                        <option value="6">CCIS LGU (ID: 6)</option>
                        <option value="4">Engineering Society (ID: 4)</option>
                        <option value="5">Student Government (ID: 5)</option>
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDevBypass}
                  className="w-full py-3 px-4 border border-primary/30 rounded-lg text-primary font-bold text-sm bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-sm">flash_on</span>
                  Bypass &amp; Sign In (Dev Override)
                </button>
              </div>

              {/* Debug Reset */}
              <div className="pt-3 border-t border-dashed border-red-200/60 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-red-500">delete_sweep</span>
                  <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                    Debug Reset — Clear Submissions &amp; Status
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">Target Student</label>
                  <select
                    value={resetStudentId}
                    onChange={(e) => { setResetStudentId(e.target.value); setResetStatus(null); }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-red-200 bg-red-50/40 text-xs text-on-surface outline-none focus:border-red-400 transition-colors"
                  >
                    <option value="__all__">⚠️ All Students (Full Reset)</option>
                    <option value="CJC-928994">CJC-928994 — GIELOU CHARLS SALUDO</option>
                    <option value="2021-0492">2021-0492 — Eleanor Shellstrop</option>
                    <option value="2022-1103">2022-1103 — Chidi Anagonye</option>
                    <option value="2020-8831">2020-8831 — Tahani Al-Jamil</option>
                    <option value="2023-0012">2023-0012 — Jason Mendoza</option>
                    <option value="2021-5529">2021-5529 — Michael Realman</option>
                  </select>
                </div>

                {resetStatus && (
                  <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs font-medium ${
                    resetStatus.type === "success"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    <span className="material-symbols-outlined text-[16px] shrink-0">
                      {resetStatus.type === "success" ? "check_circle" : "error"}
                    </span>
                    {resetStatus.message}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDebugReset}
                  disabled={isResetting}
                  className="w-full py-2.5 px-4 border border-red-300 rounded-lg text-red-600 font-bold text-sm bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {isResetting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Resetting…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">restart_alt</span>
                      Reset Clearance Data
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
