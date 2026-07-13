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

  useEffect(() => {
    const stored = localStorage.getItem("system_settings");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setMounted(true);
  }, []);

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem("system_settings", JSON.stringify(newSettings));
  };

  const getAvailableTerms = () => {
    const list: string[] = [];
    settings.academicYears.forEach((ay) => {
      settings.activeSemesters.forEach((sem) => {
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
