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

export default function OrgSettingsPage() {
  const [org, setOrg] = useState<{ id: number; name: string; logoUrl?: string | null; coverUrl?: string | null; themeColor?: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const id = getEntityId("orgId");
        if (!id) {
          setError("Organization ID not found. Are you logged in?");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`/api/orgs/${id}`);
        if (!res.ok) throw new Error("Failed to fetch organization details");
        
        const data = await res.json();
        setOrg(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrg();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-outline-variant pb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-headline-lg text-on-surface">Organization Settings</h1>
          <p className="text-secondary font-body-md">Manage branding and preferences for {org?.name || "your organization"}</p>
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
        ) : org ? (
          <BrandingSettings
            entityType="orgs"
            entityId={org.id}
            entityName={org.name}
            currentLogoUrl={org.logoUrl}
            currentCoverUrl={org.coverUrl}
            currentThemeColor={org.themeColor}
          />
        ) : null}
      </div>
    </div>
  );
}
