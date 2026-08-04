"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Settings {
  institutionName: string;
  currentAcademicYear: string;
  currentSemester: string;
  academicYears: string[];
  activeSemesters: string[];
}

interface SettingsContextType {
  settings: Settings;
  saveSettings: (newSettings: Settings) => void;
  getAvailableTerms: () => string[];
  currentTerm: string;
}

const defaultSettings: Settings = {
  institutionName: "University of Sample",
  currentAcademicYear: "2025-2026",
  currentSemester: "1st Semester",
  academicYears: ["2025-2026", "2024-2025", "2023-2024"],
  activeSemesters: ["1st Semester", "2nd Semester", "Summer"],
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  const syncActiveTermFromDb = async () => {
    try {
      const res = await fetch("/api/terms");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const activeTerm = data.find((t: any) => t.status === "Active");
          if (activeTerm) {
            const name = activeTerm.name;
            const match = name.match(/(.*)\s(\d{4}-\d{4})/);
            if (match) {
              const sem = match[1].trim(); // e.g. "Summer" or "1st Semester"
              const ay = match[2].trim();  // e.g. "2025-2026"
              
              setSettings((prev) => {
                let updatedYears = prev.academicYears;
                if (!updatedYears.includes(ay)) {
                  updatedYears = [...updatedYears, ay].sort((a, b) => b.localeCompare(a));
                }
                
                let updatedSems = prev.activeSemesters;
                if (!updatedSems.includes(sem)) {
                  updatedSems = [...updatedSems, sem];
                }

                if (
                  prev.currentAcademicYear !== ay ||
                  prev.currentSemester !== sem ||
                  JSON.stringify(prev.academicYears) !== JSON.stringify(updatedYears) ||
                  JSON.stringify(prev.activeSemesters) !== JSON.stringify(updatedSems)
                ) {
                  const updated = {
                    ...prev,
                    currentAcademicYear: ay,
                    currentSemester: sem,
                    academicYears: updatedYears,
                    activeSemesters: updatedSems,
                  };
                  localStorage.setItem("system_settings", JSON.stringify(updated));
                  return updated;
                }
                return prev;
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to sync active term from database:", err);
    }
  };

  useEffect(() => {
    // 1. Load from localStorage
    const stored = localStorage.getItem("system_settings");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setMounted(true);

    // 2. Fetch and sync from database
    syncActiveTermFromDb();

    // 3. Listen to term updates
    const handleSyncEvent = () => {
      syncActiveTermFromDb();
    };
    window.addEventListener("clearanceTermsUpdated", handleSyncEvent);
    return () => window.removeEventListener("clearanceTermsUpdated", handleSyncEvent);
  }, []);

  const saveSettings = (newSettings: Settings) => {
    // Sort academic years descending (e.g. 2026-2027 > 2025-2026)
    const sortedYears = [...newSettings.academicYears].sort((a, b) => b.localeCompare(a));
    
    // Sort semesters descending: Summer (3) > 2nd Semester (2) > 1st Semester (1)
    const semWeight = (sem: string) => {
      const lower = sem.toLowerCase();
      if (lower.includes("summer")) return 3;
      if (lower.includes("2nd") || lower.includes("second")) return 2;
      if (lower.includes("1st") || lower.includes("first")) return 1;
      return 0;
    };
    const sortedSems = [...newSettings.activeSemesters].sort((a, b) => semWeight(b) - semWeight(a));

    const sortedSettings = {
      ...newSettings,
      academicYears: sortedYears,
      activeSemesters: sortedSems,
    };

    setSettings(sortedSettings);
    localStorage.setItem("system_settings", JSON.stringify(sortedSettings));
  };

  const getAvailableTerms = () => {
    const list: string[] = [];
    
    // Sort academic years descending
    const sortedYears = [...settings.academicYears].sort((a, b) => b.localeCompare(a));
    
    // Sort semesters descending
    const semWeight = (sem: string) => {
      const lower = sem.toLowerCase();
      if (lower.includes("summer")) return 3;
      if (lower.includes("2nd") || lower.includes("second")) return 2;
      if (lower.includes("1st") || lower.includes("first")) return 1;
      return 0;
    };
    const sortedSems = [...settings.activeSemesters].sort((a, b) => semWeight(b) - semWeight(a));

    sortedYears.forEach((ay) => {
      sortedSems.forEach((sem) => {
        list.push(`${sem} ${ay}`);
      });
    });
    return list;
  };

  const currentTerm = `${settings.currentSemester} ${settings.currentAcademicYear}`;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        saveSettings,
        getAvailableTerms,
        currentTerm,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
