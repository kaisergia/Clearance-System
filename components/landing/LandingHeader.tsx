"use client";

import Image from "next/image";
import Link from "next/link";
import { InstallPwaButton } from "@/components/landing/InstallPwaButton";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <nav className="max-w-6xl mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white flex-shrink-0">
              <Image
                src="/images/logos/cjc-logo.webp"
                alt="CJC Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-gray-900 text-sm tracking-wide uppercase leading-tight">
                Cor Jesu College
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                Student Clearance System
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <InstallPwaButton variant="header" />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#c41e2a] hover:bg-[#9a1820] text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors duration-150 shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
