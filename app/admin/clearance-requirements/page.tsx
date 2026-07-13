"use client";

import { useState } from "react";

import { mockTerms as TERMS, mockTemplates } from "@/mock/mockData";

export default function ClearanceRequirementsPage() {
  const [activeTerm, setActiveTerm] = useState(TERMS[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", type: "", description: "" });

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Requirement Templates</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Manage institutional clearance workflows per academic term.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-surface-container-lowest border border-surface-container-high rounded text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-sm">history</span>
            Archive
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2 bg-brand-red text-white rounded font-label-md text-label-md shadow-sm hover:bg-primary transition-all flex items-center gap-2 btn-hover"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Template
          </button>
        </div>
      </div>

      {/* Term Selector */}
      <div className="flex gap-6 border-b border-surface-container-high mb-8 relative">
        {TERMS.map((term) => (
          <button
            key={term}
            onClick={() => setActiveTerm(term)}
            className={`pb-3 font-title-md text-title-md border-b-2 transition-colors flex items-center gap-2 ${
              activeTerm === term
                ? "text-brand-red border-brand-red"
                : "text-secondary hover:text-on-surface border-transparent"
            }`}
          >
            {term}
            {term === TERMS[0] && (
              <span className="px-2 py-0.5 rounded-full bg-brand-red/10 text-brand-red font-label-md text-[10px] uppercase tracking-wider">
                Active
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
        {mockTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className={`bg-surface-container-lowest rounded-xl border ${
              tmpl.status === "Draft" ? "border-dashed border-tertiary-fixed-dim" : "border-surface-container-high"
            } p-6 flex flex-col shadow-[0px_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_16px_rgba(0,0,0,0.04)] transition-all group relative overflow-hidden`}
          >
            {/* Left accent bar */}
            {tmpl.status !== "Draft" && (
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-red/20 group-hover:bg-brand-red transition-colors" />
            )}

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded flex items-center justify-center ${tmpl.iconBg}`}>
                  <span className="material-symbols-outlined">{tmpl.icon}</span>
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">{tmpl.name}</h3>
                  <span className="font-label-md text-label-md text-secondary">{tmpl.type}</span>
                </div>
              </div>
              {tmpl.status === "Draft" ? (
                <div className="px-2 py-1 rounded bg-surface-container-highest text-secondary font-label-md text-[11px] uppercase tracking-wide shrink-0">
                  Draft
                </div>
              ) : (
                <button className="text-secondary hover:text-primary transition-colors p-1 shrink-0">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              )}
            </div>

            <p className={`font-body-sm text-body-sm text-secondary mb-6 flex-1 ${tmpl.status === "Draft" ? "opacity-80" : ""}`}>
              {tmpl.description}
            </p>

            <div className={`grid grid-cols-2 gap-4 mb-6 ${tmpl.status === "Draft" ? "opacity-60" : ""}`}>
              <div className="bg-surface-container-low rounded-lg p-3">
                <div className="font-label-md text-label-md text-secondary mb-1">Requirements</div>
                <div className="font-title-md text-title-md text-on-surface">{tmpl.steps} Steps</div>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3">
                <div className="font-label-md text-label-md text-secondary mb-1">Applicable To</div>
                <div className="font-title-md text-title-md text-on-surface">{tmpl.applicable}</div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-surface-container-high pt-4 mt-auto">
              {tmpl.status === "Published" ? (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-label-md text-label-md">Published</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span className="font-label-md text-label-md">Last edited {tmpl.lastEdited}</span>
                </div>
              )}
              <button className={`font-label-md text-label-md flex items-center gap-1 transition-colors ${tmpl.status === "Draft" ? "text-secondary hover:text-primary" : "text-brand-red hover:text-primary"}`}>
                {tmpl.status === "Draft" ? "Continue Editing" : "Edit Template"}
                {tmpl.status !== "Draft" && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
              </button>
            </div>
          </div>
        ))}

        {/* Add Template Card */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-surface-container-low rounded-xl border-2 border-dashed border-surface-container-high p-6 flex flex-col items-center justify-center text-secondary hover:text-primary hover:border-brand-red/40 hover:bg-brand-red/5 transition-all min-h-[200px] group"
        >
          <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">add_circle</span>
          <span className="font-body-sm text-body-sm">New Template</span>
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-title-md text-title-md text-on-surface">Create New Template</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-md">
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1">Template Name *</label>
                <input
                  className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                  placeholder="e.g. Transfer Students"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1">Workflow Type</label>
                <input
                  className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                  placeholder="e.g. Specialized Workflow"
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1">Description</label>
                <textarea
                  className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none resize-none h-24"
                  placeholder="Describe the clearance workflow..."
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-sm mt-lg">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors font-label-md text-label-md">Cancel</button>
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors font-label-md text-label-md btn-hover">
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
