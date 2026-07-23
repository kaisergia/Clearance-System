"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-[#9a1820] py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
          Ready to check your clearance?
        </h2>
        <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Sign in to see which departments and offices have cleared you, and what requirements you still
          need to complete.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-white text-[#c41e2a] hover:bg-gray-100 font-bold text-base px-10 py-4 rounded-md transition-colors duration-150 shadow-lg"
        >
          Sign In to Get Started
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
