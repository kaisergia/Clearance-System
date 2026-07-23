"use client";

import { useState, useEffect } from "react";
import { BrandingSettings } from "@/components/settings/BrandingSettings";
import { Settings, Loader2 } from "lucide-react";

function getEntityId(key: string): number | null {
  if (typeof window === "undefined") return null;
  const devOverride = localStorage.getItem("dev-entityId-override");
  if (devOverride) return parseInt(devOverride, 10) || null;
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) || null : null;
}

export default function DepartmentSettingsPage() {
  const [department, setDepartment] = useState<{ id: number; name: string; logoUrl?: string | null; coverUrl?: string | null; themeColor?: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const id = getEntityId("departmentId");
        if (!id) {
          setError("Department ID not found. Are you logged in?");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/departments/${id}`);
        if (!res.ok) throw new Error("Failed to fetch department details");
        
        const data = await res.json();
        setDepartment(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartment();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-outline-variant pb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-headline-lg text-on-surface">Department Settings</h1>
          <p className="text-secondary font-body-md">Manage branding and preferences for {department?.name || "your department"}</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-headline-lg text-on-surface">Branding</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12 bg-surface-container-low rounded-2xl border border-outline-variant">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-800 rounded-2xl border border-red-100 font-body-md">
            {error}
          </div>
        ) : department ? (
          <BrandingSettings
            entityType="departments"
            entityId={department.id}
            entityName={department.name}
            currentLogoUrl={department.logoUrl}
            currentCoverUrl={department.coverUrl}
            currentThemeColor={department.themeColor}
          />
        ) : null}
      </div>
    </div>
  );
}
