"use client";



import { CheckCircle2, Users, FileCheck, ScanLine } from "lucide-react";
import type { ClearanceSource } from "@/app/page";

interface FeaturesSectionProps {
  clearanceSources: ClearanceSource[];
}

const typeIconColor: Record<string, string> = {
  department: "text-yellow-400",
  office: "text-red-300",
  org: "text-green-400",
};

export function FeaturesSection({ clearanceSources }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What You Get</h2>
        </div>

        {/* Dark red clearance sources card */}
        <div className="bg-[#8b1a22] text-white rounded-xl p-6 sm:p-10 mb-8">
          <div className="mb-8">
            <h3 className="text-2xl lg:text-3xl font-bold mb-3">All your clearance sources</h3>
            <p className="text-white/70 text-base leading-relaxed max-w-2xl">
              See your status across every department, office, club, student government, and organization.
              Check what you still need to settle before heading to each one.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {clearanceSources.length > 0 ? (
              clearanceSources.map((source) => (
                <div
                  key={`${source.type}-${source.name}`}
                  className="flex items-center gap-2.5 py-3 px-3 sm:px-4 rounded-lg bg-white/15 hover:bg-white/25 transition-colors duration-200"
                  style={source.themeColor ? { borderLeft: `3px solid ${source.themeColor}` } : undefined}
                >
                  {source.logoUrl ? (
                    <img
                      src={source.logoUrl}
                      alt={`${source.name} logo`}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : source.themeColor ? (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: source.themeColor }}
                    />
                  ) : (
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 ${typeIconColor[source.type] ?? "text-white/60"}`}
                    />
                  )}
                  <span className="text-sm text-white/90 leading-tight">{source.name}</span>
                </div>
              ))
            ) : (
              // Skeleton loading state
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/15 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex-shrink-0" />
                  <div className="h-3 w-24 bg-white/20 rounded" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3 feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-lg bg-[#8b1a22] flex items-center justify-center mb-5">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Dashboards for Every Role</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Students, department staff, organization officers, deans, and admins each get their own
              dashboard designed for their needs.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-lg bg-[#c41e2a] flex items-center justify-center mb-5">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Document Uploads</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Upload required documents online. Your files are saved securely so you won&apos;t lose them.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="w-12 h-12 rounded-lg bg-[#8b1a22] flex items-center justify-center mb-5">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Attendance Scanner</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Some requirements are fulfilled automatically when staff scan your ID at an event. No upload
              needed — attendance is recorded on the spot.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
