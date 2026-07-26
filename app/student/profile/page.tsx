"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import * as clearanceService from "@/services/clearanceService";


export default function StudentProfile() {
  const { data: session } = useSession();
  const [student, setStudent] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const currentStudent = await clearanceService.getStudentProfile();
      if (!currentStudent) return;
      setStudent(currentStudent);

      const memberships = await clearanceService.getStudentOrgMemberships(currentStudent.id);
      const affiliated = memberships.map((m: any) => m.org).filter(Boolean);
      setOrgs(affiliated);

      const sessionAvatar = (session?.user as any)?.image || (session?.user as any)?.avatarUrl;
      setAvatarUrl(currentStudent.avatarUrl || sessionAvatar || localStorage.getItem("avatarUrl"));
    };
    loadProfile();
  }, [session]);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-red"></div>
      </div>
    );
  }

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case "Gov":
        return "Student Government";
      case "LGU":
        return "Local Government Unit (LGU)";
      case "AcademicClub":
        return "Academic Club";
      case "NonAcademicClub":
        return "Non-Academic / Cultural Club";
      default:
        return "Student Organization";
    }
  };

  const getOrgIcon = (type: string) => {
    switch (type) {
      case "Gov":
        return "account_balance";
      case "LGU":
        return "apartment";
      default:
        return "diversity_3";
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            My Profile
          </h2>
          <p className="text-secondary text-body-sm">
            View and manage your student profile information
          </p>
        </div>
      </section>

      {/* Profile Details Card */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-surface-container-high">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={student.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-20 h-20 rounded-full object-cover border-2 border-surface-container-highest shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-red text-white flex items-center justify-center text-3xl font-bold shadow-sm">
              <span>{student.name ? student.name.charAt(0) : "S"}</span>
            </div>
          )}
          <div className="text-center sm:text-left space-y-1.5">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
              {student.name}
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 tracking-wider">
              {student.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Student ID", value: student.id, icon: "badge" },
            { label: "Email Address", value: student.email, icon: "mail" },
            { label: "Department", value: student.department, icon: "domain" },
            { label: "Academic Program", value: student.program, icon: "school" },
            { label: "Year Level", value: student.year, icon: "grade" },
            { label: "Active Semester", value: student.semester, icon: "calendar_today" },
          ].map((info) => (
            <div key={info.label} className="flex gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40">
              <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">
                {info.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-0.5">
                  {info.label}
                </p>
                <p className="font-body-md text-body-md text-on-surface font-medium truncate">
                  {info.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affiliated Organizations Section */}
      <div className="space-y-4">
        <h3 className="font-title-lg text-title-lg text-on-background font-bold px-1">
          Affiliated Organizations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Org Type Badge & Status */}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-secondary uppercase bg-surface-container-high px-2.5 py-1 rounded">
                    {getOrgTypeLabel(org.type)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {org.status}
                  </span>
                </div>

                {/* Org Name */}
                <h4 className="font-title-md text-on-surface font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl shrink-0">
                    {getOrgIcon(org.type)}
                  </span>
                  {org.name}
                </h4>
              </div>

              {/* Adviser Info */}
              {org.adviser && (
                <div className="mt-4 pt-3 border-t border-surface-container-high flex items-center gap-2 text-xs text-secondary">
                  <span className="material-symbols-outlined text-base">person</span>
                  <span>Adviser: <span className="font-semibold text-on-surface">{org.adviser}</span></span>
                </div>
              )}
            </div>
          ))}
          {orgs.length === 0 && (
            <div className="col-span-full bg-surface-container-lowest border border-surface-container-high rounded-xl p-8 text-center text-secondary font-medium">
              No affiliated organizations found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
