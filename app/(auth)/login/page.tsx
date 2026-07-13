"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockOrgs } from "@/mock/mockData";

// Role options for mock login
const ROLES = [
  { value: "admin", label: "System Admin" },
  { value: "head-office", label: "Head Office" },
  { value: "org", label: "Org / Club Officer" },
  { value: "student", label: "Student" },
];

// Role → dashboard route mapping
const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin/dashboard",
  "head-office": "/head-office/dashboard",
  org: "/org/dashboard",
  student: "/student/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!selectedRole) {
      setError("Please select a role to continue.");
      return;
    }

    if (selectedRole === "org") {
      if (!selectedOrgId) {
        setError("Please select an organization to continue.");
        return;
      }
      // Save selected organization ID to localStorage and cookies
      localStorage.setItem("orgId", selectedOrgId);
      document.cookie = `orgId=${selectedOrgId}; path=/; max-age=86400`;
    } else {
      localStorage.removeItem("orgId");
      document.cookie = "orgId=; path=/; max-age=0";
    }

    // Save role to localStorage AND cookie (cookie is read by middleware RoleGuard)
    localStorage.setItem("role", selectedRole);
    document.cookie = `role=${selectedRole}; path=/; max-age=86400`;

    // Redirect to role's dashboard
    router.push(ROLE_ROUTES[selectedRole]);
  };

  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-0">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] border border-surface-container-high overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-surface-container-high bg-surface-bright">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-surface-container-low mb-4 text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
              school
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Clearance System
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Sign in to access the clearance system
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-8 space-y-6">

          {/* Role Selector — Mock auth only, replace with real login later */}
          <div className="space-y-2">
            <label
              htmlFor="role"
              className="block font-body-sm text-body-sm text-on-surface font-medium"
            >
              Select your role
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setSelectedOrgId("");
                setError("");
              }}
              className="custom-ring w-full px-4 py-3 rounded-md border border-surface-container-high bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-colors"
            >
              <option value="" disabled>
                Choose a role...
              </option>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Org Selector — Shown only if role is Org Officer */}
          {selectedRole === "org" && (
            <div className="space-y-2">
              <label
                htmlFor="org"
                className="block font-body-sm text-body-sm text-on-surface font-medium"
              >
                Select your organization
              </label>
              <select
                id="org"
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setError("");
                }}
                className="custom-ring w-full px-4 py-3 rounded-md border border-surface-container-high bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-colors"
              >
                <option value="" disabled>
                  Choose an organization...
                </option>
                {mockOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.category} {org.type === "LGU" ? "LGU" : "Club"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-error font-body-sm text-body-sm">{error}</p>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="btn-hover w-full py-3 px-4 bg-brand-red text-white rounded-md font-medium text-body-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red"
          >
            Sign In
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-container-high" />
            </div>
            <div className="relative flex justify-center text-body-sm">
              <span className="px-2 bg-surface-container-lowest text-tertiary">
                or
              </span>
            </div>
          </div>

          {/* Google Sign In — keep from Stitch, wire up later */}
          <button
            type="button"
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-surface-container-high rounded-md shadow-sm text-on-surface bg-surface-container-lowest font-medium text-body-md hover:bg-surface-bright transition-colors duration-200 focus:outline-none"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-surface-bright border-t border-surface-container-high text-center">
          <p className="font-body-sm text-body-sm text-tertiary">
            Secure access for authorized personnel only.{" "}
            <br />
            Need help?{" "}
            <a
              href="#"
              className="text-secondary font-medium hover:text-brand-red transition-colors"
            >
              Contact IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
