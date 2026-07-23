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

export default function HeadOfficeSettingsPage() {
  const [office, setOffice] = useState<{ id: number; name: string; logoUrl?: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffice = async () => {
      try {
        const id = getEntityId("officeId");
        if (!id) {
          setError("Office ID not found. Are you logged in?");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/offices/${id}`);
        if (!res.ok) throw new Error("Failed to fetch office details");
        
        const data = await res.json();
        setOffice(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffice();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-outline-variant pb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-headline-lg text-on-surface">Office Settings</h1>
          <p className="text-secondary font-body-md">Manage branding and preferences for {office?.name || "your office"}</p>
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
        ) : office ? (
          <BrandingSettings
            entityType="offices"
            entityId={office.id}
            entityName={office.name}
            currentLogoUrl={office.logoUrl}
          />
        ) : null}
      </div>
    </div>
  );
}
