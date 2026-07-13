"use client";

import { useSettings } from "@/components/contexts/SettingsContext";
import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const { settings, saveSettings } = useSettings();

  const [instName, setInstName] = useState("");
  const [currentAY, setCurrentAY] = useState("");
  const [currentSem, setCurrentSem] = useState("");
  const [ayList, setAyList] = useState<string[]>([]);
  const [activeSems, setActiveSems] = useState<string[]>([]);
  const [newAy, setNewAy] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setInstName(settings.institutionName);
      setCurrentAY(settings.currentAcademicYear);
      setCurrentSem(settings.currentSemester);
      setAyList(settings.academicYears);
      setActiveSems(settings.activeSemesters);
    }
  }, [settings]);

  const handleAddAy = () => {
    const trimmed = newAy.trim();
    if (!trimmed) return;
    if (ayList.includes(trimmed)) {
      alert("Academic Year already exists.");
      return;
    }
    // Pattern validation (e.g. 2025-2026)
    const ayPattern = /^\d{4}-\d{4}$/;
    if (!ayPattern.test(trimmed)) {
      alert("Please use YYYY-YYYY format (e.g., 2025-2026).");
      return;
    }
    setAyList([...ayList, trimmed]);
    setNewAy("");
  };

  const handleRemoveAy = (ay: string) => {
    if (ay === currentAY) {
      alert("Cannot remove the active academic year.");
      return;
    }
    setAyList(ayList.filter((item) => item !== ay));
  };

  const handleToggleSem = (sem: string) => {
    if (activeSems.includes(sem)) {
      if (sem === currentSem) {
        alert("Cannot deactivate the current active semester.");
        return;
      }
      if (activeSems.length <= 1) {
        alert("At least one semester must remain active.");
        return;
      }
      setActiveSems(activeSems.filter((s) => s !== sem));
    } else {
      setActiveSems([...activeSems, sem]);
    }
  };

  const handleSave = () => {
    if (!instName.trim()) {
      alert("Institution Name cannot be empty.");
      return;
    }
    if (!ayList.includes(currentAY)) {
      alert("Active Academic Year must be in the list of academic years.");
      return;
    }
    if (!activeSems.includes(currentSem)) {
      alert("Active Semester must be in the active semesters list.");
      return;
    }

    saveSettings({
      institutionName: instName,
      currentAcademicYear: currentAY,
      currentSemester: currentSem,
      academicYears: ayList,
      activeSemesters: activeSems,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
                placeholder="Enter Institution Name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1 font-semibold">Current Academic Year</label>
                <select
                  className="custom-ring w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none cursor-pointer"
                  value={currentAY}
                  onChange={(e) => setCurrentAY(e.target.value)}
                >
                  {ayList.map((ay) => (
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
                  value={currentSem}
                  onChange={(e) => setCurrentSem(e.target.value)}
                >
                  {activeSems.map((sem) => (
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
                {ayList.map((ay) => (
                  <tr key={ay} className="hover:bg-surface-container-low/20">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      {ay}
                      {ay === currentAY && (
                        <span className="bg-brand-red/10 text-brand-red text-[10px] font-bold px-2 py-0.5 rounded-full border border-brand-red/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveAy(ay)}
                        disabled={ay === currentAY}
                        className={`text-error hover:text-red-700 font-semibold text-xs ${ay === currentAY ? "opacity-30 cursor-not-allowed" : ""}`}
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
              const isActive = activeSems.includes(sem);
              return (
                <button
                  key={sem}
                  onClick={() => handleToggleSem(sem)}
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
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
            onClick={handleSave}
            className="px-lg py-sm bg-brand-red text-white rounded-lg font-label-md text-label-md hover:bg-primary transition-colors btn-hover shadow-sm font-semibold"
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
            <button className="px-md py-sm border border-error text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors">
              Reset All Clearances
            </button>
            <button className="px-md py-sm border border-error text-error rounded-lg font-label-md text-label-md hover:bg-error-container transition-colors">
              Archive Semester Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
