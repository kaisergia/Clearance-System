"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useOffices } from "@/components/contexts/OfficesContext";
import * as clearanceService from "@/services/clearanceService";

export default function AdminDashboard() {
  const { offices } = useOffices();

  const [students, setStudents] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [clearanceRecords, setClearanceRecords] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [stList, orgList, recList] = await Promise.all([
          clearanceService.getStudents(),
          clearanceService.getOrgs(),
          fetch("/api/clearance-records").then((r) => (r.ok ? r.json() : [])),
        ]);
        setStudents(stList || []);
        setOrgs(orgList || []);
        setClearanceRecords(recList || []);
      } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
      }
    };
    loadDashboard();
  }, []);

  const totalStudents = students.length;
  const activeOrgs = orgs.filter((o) => o.status === "Active").length;
  const clearedStudents = students.filter((s) => {
    const studentRecs = clearanceRecords.filter((r) => r.studentId === s.id);
    return s.status === "Cleared" || (studentRecs.length > 0 && studentRecs.every((r) => r.status === "Cleared"));
  });
  const clearedClearances = clearedStudents.length;
  const pendingClearances = Math.max(0, totalStudents - clearedClearances);
  const clearedPct = totalStudents > 0 ? ((clearedClearances / totalStudents) * 100).toFixed(1) : "0";

  // Dynamic Department Completion Data for Chart
  const deptsList = ["CCIS", "COE", "CEDAS", "CHS", "CABE"];
  const chartData = deptsList.map((dept) => {
    const deptStudents = students.filter((s) => s.department === dept);
    const total = deptStudents.length;
    const cleared = deptStudents.filter((s) => {
      const sRecs = clearanceRecords.filter((r) => r.studentId === s.id);
      return s.status === "Cleared" || (sRecs.length > 0 && sRecs.every((r) => r.status === "Cleared"));
    }).length;
    const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
    return {
      label: dept,
      total,
      cleared,
      pending: Math.max(0, total - cleared),
      pct,
    };
  });

  const STAT_CARDS = [
    {
      label: "Total Students",
      value: totalStudents.toLocaleString(),
      icon: "groups",
      trend: `${students.length} in database`,
      trendUp: true,
      highlight: false,
    },
    {
      label: "Active Orgs",
      value: activeOrgs.toString(),
      icon: "hub",
      trend: `${orgs.length} total`,
      trendUp: null,
      highlight: false,
    },
    {
      label: "Head Offices",
      value: offices.length.toString(),
      icon: "domain",
      trend: "All configured",
      trendUp: null,
      highlight: false,
    },
    {
      label: "Pending",
      value: pendingClearances.toLocaleString(),
      icon: "pending_actions",
      trend: "Requires attention",
      trendUp: false,
      highlight: false,
      error: true,
    },
    {
      label: "Cleared",
      value: clearedClearances.toLocaleString(),
      icon: "check_circle",
      trend: `${clearedPct}% Completion`,
      trendUp: true,
      highlight: true,
    },
  ];

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h3 className="font-title-md text-title-md text-on-surface mb-xs">System Overview</h3>
          <p className="font-body-sm text-body-sm text-secondary">
            Monitor university-wide clearance metrics and live institutional compliance.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter mb-gutter">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className={`bg-surface-container-lowest rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] border ${
              card.highlight ? "border-brand-red" : "border-surface-container-high"
            } p-md flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden`}
          >
            {card.highlight && (
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-brand-red/10 rounded-tl-full -mr-8 -mb-8" />
            )}
            {card.error && (
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-tl-full -mr-4 -mb-4" />
            )}
            <div className="flex justify-between items-start mb-sm relative z-10">
              <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">
                {card.label}
              </span>
              <div
                className={`p-xs rounded-md ${
                  card.error
                    ? "bg-error-container text-error"
                    : card.highlight
                    ? "bg-brand-red text-white shadow-sm"
                    : "bg-surface-container-low text-secondary"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={card.highlight ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {card.icon}
                </span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="font-display-lg text-display-lg text-on-surface mb-xs leading-none">
                {card.value}
              </div>
              <div
                className={`flex items-center gap-xs font-label-md text-label-md ${
                  card.trendUp === true
                    ? "text-brand-red"
                    : card.trendUp === false || card.error
                    ? "text-error"
                    : "text-tertiary-container"
                }`}
              >
                {card.trendUp === true && (
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                )}
                {card.trendUp === null && (
                  <span className="material-symbols-outlined text-[16px]">horizontal_rule</span>
                )}
                <span>{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-gutter">
        {/* Clearance Completion Chart */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-high p-lg">
          <div className="flex justify-between items-center mb-lg">
            <div>
              <h4 className="font-title-md text-title-md text-on-surface">Department Completion Rate</h4>
              <p className="font-body-sm text-body-sm text-secondary">Real-time compliance breakdown across departments</p>
            </div>
            <div className="flex gap-sm">
              <span className="flex items-center gap-xs font-label-md text-label-md text-secondary">
                <span className="w-3 h-3 rounded-full bg-surface-container-high block" /> Pending
              </span>
              <span className="flex items-center gap-xs font-label-md text-label-md text-on-surface">
                <span className="w-3 h-3 rounded-full bg-brand-red block" /> Cleared
              </span>
            </div>
          </div>
          <div className="w-full h-[260px] relative flex items-end pl-8">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between pb-[30px]">
              {["100%", "75%", "50%", "25%", "0%"].map((pct) => (
                <span key={pct} className="font-label-md text-label-md text-secondary text-right w-7">
                  {pct}
                </span>
              ))}
            </div>
            {/* Grid lines */}
            <div className="absolute left-8 right-0 top-0 h-full flex flex-col justify-between pb-[30px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-t border-surface-container-high/60" />
              ))}
            </div>
            {/* Bars */}
            <div className="flex-1 h-full flex items-end justify-between px-md pb-[30px] relative z-10">
              {chartData.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1 flex-1 h-full justify-end relative group">
                  <div
                    className="w-[70%] rounded-t-sm relative overflow-hidden transition-all duration-300 hover:opacity-90 cursor-pointer shadow-sm"
                    style={{ height: "100%" }}
                  >
                    <div className="absolute inset-0 bg-surface-container-high rounded-t-sm" />
                    <div
                      className="absolute bottom-0 w-full bg-brand-red rounded-t-sm transition-all duration-500"
                      style={{ height: `${d.pct}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-on-surface text-surface-container-lowest text-xs py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg pointer-events-none">
                      <div className="font-bold">{d.label}: {d.pct}%</div>
                      <div className="text-[10px] text-gray-300">Cleared: {d.cleared}/{d.total}</div>
                    </div>
                  </div>
                  <span className="absolute -bottom-7 font-label-md text-label-md text-secondary whitespace-nowrap">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Active Orgs */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-md shadow-[0px_1px_3px_rgba(0,0,0,0.05)] flex-1">
            <h4 className="font-title-md text-title-md text-on-surface mb-md">Org Status</h4>
            <div className="space-y-sm">
              {orgs.slice(0, 4).map((org) => (
                <div key={org.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-7 h-7 rounded bg-secondary-container text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                      {org.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface truncate max-w-[130px]">{org.name}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-md text-label-md ${
                      org.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-surface-container-high text-secondary border border-surface-container-highest"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${org.status === "Active" ? "bg-emerald-500" : "bg-secondary"}`} />
                    {org.status}
                  </span>
                </div>
              ))}
              {orgs.length === 0 && (
                <p className="text-xs text-secondary py-4 text-center">No organizations configured.</p>
              )}
            </div>
            <Link href="/admin/user-management?tab=orgs" className="mt-md flex items-center gap-1 font-label-md text-label-md text-brand-red hover:text-primary transition-colors">
              View all orgs <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          {/* Office Clearance Quick View */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-md shadow-[0px_1px_3px_rgba(0,0,0,0.05)] flex-1">
            <h4 className="font-title-md text-title-md text-on-surface mb-md">Office Status</h4>
            <div className="space-y-sm">
              {offices.slice(0, 4).map((office) => {
                const officeRecs = clearanceRecords.filter((r) => r.officeId === office.id);
                const cleared = officeRecs.filter((r) => r.status === "Cleared").length;
                const pending = Math.max(0, students.length - cleared);
                return (
                  <div key={office.id} className="flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface">{office.name}</span>
                    <span className="font-label-md text-label-md text-secondary">
                      <strong className="text-brand-red font-semibold">{pending}</strong> pending / <strong className="text-green-600 font-semibold">{cleared}</strong> cleared
                    </span>
                  </div>
                );
              })}
              {offices.length === 0 && (
                <p className="text-xs text-secondary py-4 text-center">No offices configured.</p>
              )}
            </div>
            <Link href="/admin/user-management?tab=offices" className="mt-md flex items-center gap-1 font-label-md text-label-md text-brand-red hover:text-primary transition-colors">
              Manage offices <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
