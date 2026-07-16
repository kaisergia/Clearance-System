"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDepartments } from "@/components/contexts/DepartmentsContext";

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = Number(params.departmentId);
  const { departments } = useDepartments();
  const department = departments.find((d) => d.id === departmentId);

  const [requirements, setRequirements] = useState<string[]>(
    ["Submit clearance form"] // We'll show a default since we don't have mockRequirementsByDepartment yet, or we can leave it empty
  );

  if (!department) {
    return (
      <div className="p-margin-desktop flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-6xl text-surface-container-high mb-4">account_balance</span>
        <h3 className="font-title-md text-title-md text-on-surface mb-2">Department Not Found</h3>
        <p className="font-body-sm text-body-sm text-secondary mb-6">This department doesn't exist or was removed.</p>
        <Link href="/admin/departments" className="px-md py-sm bg-brand-red text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors">
          Back to Departments
        </Link>
      </div>
    );
  }

  return (
    <div className="p-margin-desktop max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-body-sm text-body-sm text-secondary mb-lg">
        <Link href="/admin/departments" className="hover:text-primary transition-colors">Departments</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface font-medium">{department.name}</span>
      </nav>

      {/* Department Header */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg mb-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="flex items-center gap-lg">
            <div className="w-16 h-16 rounded-xl bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">{department.name}</h2>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">Academic / Non-Academic Department</p>
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
            { label: "Department Head", value: department.head?.name },
            { label: "Email", value: department.head?.email },
            { label: "Pending", value: String(department.pending || 0) },
            { label: "Approved", value: String(department.approved || 0) },
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
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">Current semester requirement checklist for this department</p>
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
