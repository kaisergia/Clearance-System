"use client";

import { useSettings } from "@/components/contexts/SettingsContext";
import { useState, useEffect } from "react";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export default function AdminSettingsPage() {
  const { settings, saveSettings } = useSettings();

  const [instName, setInstName] = useState("");
  const [newAy, setNewAy] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Confirmation dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Sync local instName state with settings context
  useEffect(() => {
    if (settings) {
      setInstName(settings.institutionName);
    }
  }, [settings?.institutionName]);

  const triggerSuccessBanner = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const requestConfirmation = (config: {
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const handleInstNameBlur = () => {
    if (instName.trim() && instName !== settings.institutionName) {
      saveSettings({
        ...settings,
        institutionName: instName.trim(),
      });
      triggerSuccessBanner();
    }
  };

  const handleActiveTermChange = async (ay: string, sem: string) => {
    saveSettings({
      ...settings,
      currentAcademicYear: ay,
      currentSemester: sem,
    });
    triggerSuccessBanner();

    try {
      const termName = `${sem} ${ay}`;
      const res = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: termName, status: "Active" }),
      });
      if (!res.ok) {
        console.error("Failed to sync active term to database");
      } else {
        window.dispatchEvent(new Event("clearanceTermsUpdated"));
      }
    } catch (err) {
      console.error("Error syncing active term to database:", err);
    }
  };

  const handleActiveYearChangeClick = (newAy: string) => {
    if (newAy === settings.currentAcademicYear) return;
    requestConfirmation({
      title: "Change Active Academic Year",
      message: `Are you sure you want to change the active academic year to "${newAy}"? This will archive the current active term and activate the new term in the database.\n\n⚠️ WARNING: This will automatically unpublish (set to Draft) all clearance flows in the previously active term.`,
      confirmText: "Change Year",
      onConfirm: () => handleActiveTermChange(newAy, settings.currentSemester),
    });
  };

  const handleActiveSemChangeClick = (newSem: string) => {
    if (newSem === settings.currentSemester) return;
    requestConfirmation({
      title: "Change Active Semester",
      message: `Are you sure you want to change the active semester to "${newSem}"? This will archive the current active term and activate the new term in the database.\n\n⚠️ WARNING: This will automatically unpublish (set to Draft) all clearance flows in the previously active term.`,
      confirmText: "Change Semester",
      onConfirm: () => handleActiveTermChange(settings.currentAcademicYear, newSem),
    });
  };

  const handleAddAy = () => {
    const trimmed = newAy.trim();
    if (!trimmed) return;
    if (settings.academicYears.includes(trimmed)) {
      alert("Academic Year already exists.");
      return;
    }
    // Pattern validation (e.g. 2025-2026)
    const ayPattern = /^\d{4}-\d{4}$/;
    if (!ayPattern.test(trimmed)) {
      alert("Please use YYYY-YYYY format (e.g., 2025-2026).");
      return;
    }
    const updatedYears = [...settings.academicYears, trimmed];
    saveSettings({
      ...settings,
      academicYears: updatedYears,
    });
    setNewAy("");
    triggerSuccessBanner();
  };

  const handleRemoveAy = async (ay: string) => {
    try {
      const res = await fetch(`/api/terms?ay=${ay}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.skippedCount > 0) {
          alert(
            `Removed academic year from settings. However, the database records for:\n- ${data.skippedTerms.join(
              "\n- "
            )}\nwere preserved to prevent deleting historical student clearance records.`
          );
        }
      } else {
        console.error("Failed to clean up terms from database");
      }
    } catch (err) {
      console.error("Error cleaning up terms from database:", err);
    }

    const updatedYears = settings.academicYears.filter((item) => item !== ay);
    saveSettings({
      ...settings,
      academicYears: updatedYears,
    });
    triggerSuccessBanner();
  };

  const handleRemoveAyClick = (ay: string) => {
    if (ay === settings.currentAcademicYear) {
      alert("Cannot remove the active academic year.");
      return;
    }
    requestConfirmation({
      title: "Remove Academic Year",
      message: `Are you sure you want to remove the academic year "${ay}" from the settings?\n\n⚠️ WARNING: This will permanently delete any associated term records in the database that do not contain clearance data. This action cannot be undone.`,
      confirmText: "Remove",
      onConfirm: () => handleRemoveAy(ay),
    });
  };

  const handleToggleSem = (sem: string) => {
    const activeSems = settings.activeSemesters;
    if (activeSems.includes(sem)) {
      if (sem === settings.currentSemester) {
        alert("Cannot deactivate the current active semester.");
        return;
      }
      if (activeSems.length <= 1) {
        alert("At least one semester must remain active.");
        return;
      }
      const updatedSems = activeSems.filter((s) => s !== sem);
      saveSettings({
        ...settings,
        activeSemesters: updatedSems,
      });
    } else {
      const updatedSems = [...activeSems, sem];
      saveSettings({
        ...settings,
        activeSemesters: updatedSems,
      });
    }
    triggerSuccessBanner();
  };

  const handleSaveAll = () => {
    handleInstNameBlur();
    handleActiveTermChange(settings.currentAcademicYear, settings.currentSemester);
  };

  return (
    <div className="p-margin-desktop max-w-3xl mx-auto space-y-lg">
      <div className="mb-lg flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Settings</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">System configuration and preferences.</p>
        </div>
        {saveSuccess && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-body-sm text-sm border border-green-200 animate-fade-in flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">check_circle</span>
            Settings saved successfully!
          </div>
        )}
      </div>

      <div className="space-y-lg">
        {/* General Settings */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg space-y-lg">
          <h3 className="font-title-md text-title-md text-on-surface border-b border-surface-container-high pb-3">General Settings</h3>

          <div className="space-y-md">
            <div>
              <label className="block font-body-sm text-body-sm text-on-surface mb-1 font-semibold">Institution Name</label>
              <input
                className="custom-ring w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                onBlur={handleInstNameBlur}
                placeholder="Enter Institution Name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1 font-semibold">Current Academic Year</label>
                <select
                  className="custom-ring w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none cursor-pointer"
                  value={settings.currentAcademicYear}
                  onChange={(e) => handleActiveYearChangeClick(e.target.value)}
                >
                  {settings.academicYears.map((ay) => (
                    <option key={ay} value={ay}>
                      {ay}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1 font-semibold">Current Semester</label>
                <select
                  className="custom-ring w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none cursor-pointer"
                  value={settings.currentSemester}
                  onChange={(e) => handleActiveSemChangeClick(e.target.value)}
                >
                  {settings.activeSemesters.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Years Management */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg space-y-md">
          <h3 className="font-title-md text-title-md text-on-surface border-b border-surface-container-high pb-3 font-bold">Manage Academic Years</h3>
          
          <div className="flex gap-sm items-end">
            <div className="flex-1">
              <label className="block font-body-sm text-body-sm text-on-surface mb-1">Add Academic Year</label>
              <input
                className="custom-ring w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none"
                value={newAy}
                onChange={(e) => setNewAy(e.target.value)}
                placeholder="e.g. 2026-2027"
              />
            </div>
            <button
              onClick={handleAddAy}
              className="px-md py-2.5 bg-brand-red text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors h-11"
            >
              Add Year
            </button>
          </div>

          <div className="border border-surface-container-high rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-left border-b border-surface-container-high">
                  <th className="py-2.5 px-4 font-label-md text-xs font-semibold text-secondary uppercase">Academic Year</th>
                  <th className="py-2.5 px-4 font-label-md text-xs font-semibold text-secondary uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-body-sm text-sm">
                {settings.academicYears.map((ay) => (
                  <tr key={ay} className="hover:bg-surface-container-low/20">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      {ay}
                      {ay === settings.currentAcademicYear && (
                        <span className="bg-brand-red/10 text-brand-red text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-red/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveAyClick(ay)}
                        disabled={ay === settings.currentAcademicYear}
                        className={`text-error hover:text-red-700 font-semibold text-xs cursor-pointer ${ay === settings.currentAcademicYear ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Semester/Term Management */}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-lg space-y-md">
          <h3 className="font-title-md text-title-md text-on-surface border-b border-surface-container-high pb-3 font-bold">Manage Semesters & Terms</h3>
          <p className="font-body-sm text-body-sm text-secondary">
            Select which semesters or terms are part of your academic calendar (the standard is 1st Semester, 2nd Semester, and Summer).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-md pt-2">
            {["1st Semester", "2nd Semester", "Summer"].map((sem) => {
              const isActive = settings.activeSemesters.includes(sem);
              return (
                <button
                  key={sem}
                  onClick={() => handleToggleSem(sem)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? "border-brand-red bg-brand-red/5 text-on-surface ring-2 ring-brand-red/10"
                      : "border-outline-variant hover:bg-surface-container-low text-secondary"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{sem}</span>
                    <span className="text-xs text-secondary mt-0.5">
                      {isActive ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <span className={`material-symbols-outlined text-lg ${isActive ? "text-brand-red" : "text-outline-variant"}`}>
                    {isActive ? "check_circle" : "radio_button_unchecked"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-end gap-sm pt-4">
          <button
            onClick={handleSaveAll}
            className="px-lg py-sm bg-brand-red text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors btn-hover shadow-sm font-semibold cursor-pointer"
          >
            Save All Changes
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-surface-container-lowest rounded-xl border border-error/20 shadow-sm p-lg mt-6">
          <h3 className="font-title-md text-title-md text-error mb-sm">Danger Zone</h3>
          <p className="font-body-sm text-body-sm text-secondary mb-lg">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="flex gap-sm">
            <button className="px-md py-sm border border-error text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors cursor-pointer">
              Reset All Clearances
            </button>
            <button className="px-md py-sm border border-error text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors cursor-pointer">
              Archive Semester Data
            </button>
          </div>
        </div>
      </div>

      {confirmConfig && (
        <ConfirmationDialog
          isOpen={confirmOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          onConfirm={() => {
            confirmConfig.onConfirm();
            setConfirmOpen(false);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
