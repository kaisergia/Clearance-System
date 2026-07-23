"use client";

import Image from "next/image";
import { ArrowRight, Calendar, ChevronDown } from "lucide-react";
import { InstallPwaButton } from "@/components/landing/InstallPwaButton";

interface HeroSectionProps {
  totalSources: number;
  onOpenLogin: () => void;
}

export function HeroSection({ totalSources, onOpenLogin }: HeroSectionProps) {
  const scrollDown = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-[88vh] min-h-[600px] max-h-[1000px] overflow-hidden">
      {/* Full-bleed background image */}
      <Image
        src="/images/landing_page_pic_1.jpg"
        alt="Cor Jesu College campus"
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

      {/* Content — anchored to bottom-left */}
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="max-w-6xl mx-auto px-6 pb-16 lg:pb-24 w-full">
          {/* Institutional label */}
          <p className="text-sm text-white/60 uppercase tracking-widest mb-3 animate-fadeIn">
            Cor Jesu College &mdash; Digos City
          </p>

          {/* Semester badge row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5 animate-fadeIn">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              AY 2025-2026 · 1st Semester
            </span>
          </div>

          {/* Headline */}
          <div className="mb-5 animate-fadeIn">
            <h1 className="font-bold text-white">
              <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] leading-tight">
                Student Clearance
              </span>
              <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] leading-tight">
                System
              </span>
            </h1>
          </div>

          <p className="text-base lg:text-lg text-white/80 mb-8 max-w-2xl leading-relaxed animate-fadeIn">
            Track your clearance across {totalSources || 17} departments, offices, and organizations.
            Check your status, upload documents, and see what you still need to settle — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fadeIn">
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center justify-center gap-2 bg-[#c41e2a] hover:bg-[#9a1820] text-white font-semibold text-base px-8 py-3.5 rounded-lg transition-colors duration-150 shadow-lg"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
            <InstallPwaButton variant="hero" />
            <button
              type="button"
              onClick={scrollDown}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/50 hover:border-white text-white font-semibold text-base px-8 py-3.5 rounded-lg transition-colors duration-150 backdrop-blur-sm"
            >
              Learn More
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
