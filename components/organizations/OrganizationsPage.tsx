"use client";

import Link from "next/link";
import { mockOrgs, mockRequirementsByOrgType } from "@/mock/mockData";

export default function OrganizationDashboard({ title, description, orgType }: { title: string, description: string, orgType: string }) {
  // Try to find a representative org from mock data, or mock a default one
  const org = mockOrgs.find((o) => o.type === orgType) || {
    name: title,
    adviser: "Prof. Unknown",
    status: "Active",
    memberCount: 0,
  };

  const requirements = mockRequirementsByOrgType[orgType] || [
    "Submit membership forms",
    "Pay organization fees",
    "Attend general assembly",
  ];

  return (
    <div className="p-margin-desktop max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-body-sm text-body-sm text-secondary mb-lg">
        <span className="hover:text-primary transition-colors">Organizations</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface font-medium">{title}</span>
      </nav>

      {/* Office Header */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg mb-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="flex items-center gap-lg">
            <div className="w-16 h-16 rounded-xl bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">{title}</h2>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-label-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mt-lg pt-lg border-t border-surface-container-high">
          {[
            { label: "Adviser", value: org.adviser },
            { label: "Category", value: title },
            { label: "Pending", value: String(Math.floor((org.memberCount || 20) * 0.3)) },
            { label: "Approved", value: String(Math.floor((org.memberCount || 20) * 0.7)) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-label-md text-label-md text-secondary uppercase tracking-wider mb-1">{label}</p>
              <p className="font-body-md text-body-md text-on-surface font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Clearance Requirements */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg">
        <div className="flex items-center justify-between mb-lg">
          <div>
            <h3 className="font-title-md text-title-md text-on-surface">Clearance Requirements</h3>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">Current semester requirement checklist for this organization</p>
          </div>
        </div>

        <div className="space-y-sm">
          {requirements.map((req, idx) => (
            <div key={idx} className="flex items-center gap-sm p-sm rounded-lg bg-surface-container-low group">
              <span className="material-symbols-outlined text-emerald-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="flex-1 font-body-sm text-body-sm text-on-surface">{req}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
