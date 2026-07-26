"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { X, AlertCircle } from "lucide-react";
import Image from "next/image";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-gray-100 bg-gray-50/50">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 shadow-sm mx-auto mb-4 bg-white flex items-center justify-center">
            <Image
              src="/images/logos/cjc-logo.webp"
              alt="Cor Jesu College Logo"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Clearance System</h2>
          <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Cor Jesu College Portal</p>
        </div>

        {/* Modal Body */}
        <div className="px-8 py-8 space-y-6">
          <p className="text-center text-sm text-gray-600 font-medium leading-relaxed">
            Please sign in with your institutional Google account (<span className="text-[#c41e2a] font-semibold">@g.cjc.edu.ph</span>) to continue.
          </p>

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-[#c41e2a] shrink-0 mt-0.5" />
              <p className="font-medium leading-snug">{error}</p>
            </div>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-gray-300 rounded-xl shadow-sm text-gray-800 bg-white hover:bg-gray-50 hover:border-gray-400 font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c41e2a] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none">
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

        {/* Modal Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Secure access for authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}
