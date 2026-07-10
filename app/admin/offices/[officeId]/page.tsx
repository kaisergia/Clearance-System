"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOffices } from "@/components/contexts/OfficesContext";

const mockRequirementsByOffice: Record<number, string[]> = {
  1: ["Submit grade sheets", "Verify enrollment records", "Clear academic holds"],
  2: ["Return all borrowed materials", "Settle overdue fines", "Submit research documents"],
  3: ["Complete exit interview", "Submit counseling forms", "Clear behavioral records"],
  4: ["Pay all outstanding fees", "Submit financial clearance form", "Clear scholarship obligations"],
  5: ["Resolve pending cases", "Submit incident report acknowledgment"],
};

export default function OfficeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const officeId = Number(params.officeId);
  const { offices } = useOffices();
  const office = offices.find((o) => o.id === officeId);

  const [requirements, setRequirements] = useState<string[]>(
    mockRequirementsByOffice[officeId] || ["Submit clearance form"]
  );
  const [newReq, setNewReq] = useState("");
  const [editing, setEditing] = useState(false);

  if (!office) {
    return (
      <div className="p-margin-desktop flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-6xl text-surface-container-high mb-4">domain_disabled</span>
        <h3 className="font-title-md text-title-md text-on-surface mb-2">Office Not Found</h3>
        <p className="font-body-sm text-body-sm text-secondary mb-6">This office doesn't exist or was removed.</p>
        <Link href="/admin/offices" className="px-md py-sm bg-brand-red text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors">
          Back to Offices
        </Link>
      </div>
    );
  }

  const addReq = () => {
    if (!newReq.trim()) return;
    setRequirements((prev) => [...prev, newReq.trim()]);
    setNewReq("");
  };

  const removeReq = (idx: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-margin-desktop max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-body-sm text-body-sm text-secondary mb-lg">
        <Link href="/admin/offices" className="hover:text-primary transition-colors">Offices</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface font-medium">{office.name}</span>
      </nav>

      {/* Office Header */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg mb-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="flex items-center gap-lg">
            <div className="w-16 h-16 rounded-xl bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>corporate_fare</span>
            </div>
            <div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">{office.name}</h2>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">Head Office — Administrative Unit</p>
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
            { label: "Office Head", value: office.head?.name },
            { label: "Email", value: office.head?.email },
            { label: "Pending", value: String(office.pending || 0) },
            { label: "Approved", value: String(office.approved || 0) },
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
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">Current semester requirement checklist for this office</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1 px-md py-sm rounded-lg font-label-md text-label-md transition-colors ${editing ? "bg-brand-red text-white hover:bg-primary" : "border border-surface-container-high text-secondary hover:bg-surface-container-low"}`}
          >
            <span className="material-symbols-outlined text-sm">{editing ? "check" : "edit"}</span>
            {editing ? "Save" : "Edit"}
          </button>
        </div>

        <div className="space-y-sm">
          {requirements.map((req, idx) => (
            <div key={idx} className="flex items-center gap-sm p-sm rounded-lg bg-surface-container-low group">
              <span className="material-symbols-outlined text-emerald-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="flex-1 font-body-sm text-body-sm text-on-surface">{req}</span>
              {editing && (
                <button onClick={() => removeReq(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-secondary hover:text-error rounded transition-colors">
                  <span className="material-symbols-outlined text-sm">remove_circle</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {editing && (
          <div className="flex gap-sm mt-md">
            <input
              className="custom-ring flex-1 px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
              placeholder="Add new requirement..."
              value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addReq()}
            />
            <button onClick={addReq} className="px-md py-2.5 bg-brand-red text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors btn-hover">
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
