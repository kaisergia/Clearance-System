"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Settings {
  institutionName: string;
  currentAcademicYear: string;
  currentSemester: string;
  academicYears: string[];
  activeSemesters: string[];
}

export interface TermInfo {
  id: number;
  academicYear: string;
  semester: string;
  name: string;
  status: string;
}

interface SettingsContextType {
  settings: Settings;
  terms: TermInfo[];
  saveSettings: (newSettings: Settings) => void;
  getAvailableTerms: () => string[];
  currentTerm: string;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  institutionName: "University of Sample",
  currentAcademicYear: "2025-2026",
  currentSemester: "1st Semester",
  academicYears: ["2025-2026"],
  activeSemesters: ["1st Semester", "2nd Semester", "Summer"],
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [terms, setTerms] = useState<TermInfo[]>([]);
  const [mounted, setMounted] = useState(false);

  const syncFromDb = useCallback(async () => {
    try {
      const [termsRes, yearsRes] = await Promise.all([
        fetch("/api/terms"),
        fetch("/api/academic-years"),
      ]);

      let dbYears: string[] = [];
      let dbTerms: TermInfo[] = [];
      let activeAy = "";
      let activeSem = "";

      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        if (Array.isArray(yearsData) && yearsData.length > 0) {
          dbYears = yearsData.map((y: any) => y.year);
        }
      }

      if (termsRes.ok) {
        const termsData = await termsRes.json();
        if (Array.isArray(termsData)) {
          dbTerms = termsData.map((t: any) => ({
            id: t.id,
            academicYear: t.academicYear,
            semester: t.semester,
            name: t.name || `${t.semester} ${t.academicYear}`,
            status: t.status,
          }));
          setTerms(dbTerms);

          // If years were not fetched from /api/academic-years, infer from terms
          if (dbYears.length === 0) {
            const extractedYears = new Set<string>();
            termsData.forEach((t: any) => {
              if (t.academicYear) extractedYears.add(t.academicYear);
              else {
                const match = t.name?.match(/(\d{4}-\d{4})/);
                if (match) extractedYears.add(match[1]);
              }
            });
            dbYears = Array.from(extractedYears);
          }

          const activeTerm = termsData.find((t: any) => t.status === "Active");
          if (activeTerm) {
            activeAy = activeTerm.academicYear;
            activeSem = activeTerm.semester;

            if (!activeAy || !activeSem) {
              const match = activeTerm.name?.match(/(.*)\s(\d{4}-\d{4})/);
              if (match) {
                activeSem = match[1].trim();
                activeAy = match[2].trim();
              }
            }
          }
        }
      }

      setSettings((prev) => {
        let updatedYears = dbYears.length > 0 ? dbYears : prev.academicYears;
        // Ensure active year is in the list
        if (activeAy && !updatedYears.includes(activeAy)) {
          updatedYears = [activeAy, ...updatedYears];
        }
        // Sort descending
        updatedYears = Array.from(new Set(updatedYears)).sort((a, b) => b.localeCompare(a));

        const nextAy = activeAy || prev.currentAcademicYear || updatedYears[0] || "2025-2026";
        const nextSem = activeSem || prev.currentSemester || "1st Semester";

        const updated: Settings = {
          ...prev,
          currentAcademicYear: nextAy,
          currentSemester: nextSem,
          academicYears: updatedYears,
        };

        localStorage.setItem("system_settings", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Failed to sync settings from database:", err);
    }
  }, []);

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
    syncFromDb();

    // 3. Listen to term / academic year updates
    const handleSyncEvent = () => {
      syncFromDb();
    };
    window.addEventListener("clearanceTermsUpdated", handleSyncEvent);
    return () => window.removeEventListener("clearanceTermsUpdated", handleSyncEvent);
  }, [syncFromDb]);

  const saveSettings = (newSettings: Settings) => {
    // Sort academic years descending (e.g. 2026-2027 > 2025-2026)
    const sortedYears = Array.from(new Set(newSettings.academicYears)).sort((a, b) =>
      b.localeCompare(a)
    );

    // Sort semesters descending: Summer (3) > 2nd Semester (2) > 1st Semester (1)
    const semWeight = (sem: string) => {
      const lower = sem.toLowerCase();
      if (lower.includes("summer")) return 3;
      if (lower.includes("2nd") || lower.includes("second")) return 2;
      if (lower.includes("1st") || lower.includes("first")) return 1;
      return 0;
    };
    const sortedSems = [...newSettings.activeSemesters].sort(
      (a, b) => semWeight(b) - semWeight(a)
    );

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
    const sortedSems = [...settings.activeSemesters].sort(
      (a, b) => semWeight(b) - semWeight(a)
    );

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
        terms,
        saveSettings,
        getAvailableTerms,
        currentTerm,
        refreshSettings: syncFromDb,
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
