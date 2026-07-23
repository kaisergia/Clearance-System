"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Terminal } from "lucide-react";
import { InstallPwaButton } from "@/components/landing/InstallPwaButton";

interface LandingHeaderProps {
  onOpenLogin: () => void;
  onOpenDev: () => void;
}

export function LandingHeader({ onOpenLogin, onOpenDev }: LandingHeaderProps) {
  const [clickCount, setClickCount] = useState(0);
  const [devUnlocked, setDevUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("dev_unlocked") === "true") {
        setDevUnlocked(true);
      }
    }
  }, []);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 5) {
      setDevUnlocked(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("dev_unlocked", "true");
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <nav className="max-w-6xl mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">
          
          {/* Logo — 5 Clicks to unlock Developer Diagnostics */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer select-none group"
            title={devUnlocked ? "Developer mode unlocked!" : "Click 5 times for Developer Diagnostics"}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white flex-shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/images/logos/cjc-logo.webp"
                alt="CJC Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-gray-900 text-sm tracking-wide uppercase leading-tight group-hover:text-[#c41e2a] transition-colors">
                Cor Jesu College
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                Student Clearance System
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Developer Diagnostics Button (Appears after 5 clicks on school logo) */}
            {devUnlocked && (
              <button
                type="button"
                onClick={onOpenDev}
                className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-2 rounded-lg transition-all duration-150 animate-in fade-in"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-600" />
                <span>Dev Diagnostics</span>
              </button>
            )}

            <InstallPwaButton variant="header" />

            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 bg-[#c41e2a] hover:bg-[#9a1820] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors duration-150 shadow-sm"
            >
              Sign In
            </button>
          </div>

        </div>
      </nav>
    </header>
  );
}
