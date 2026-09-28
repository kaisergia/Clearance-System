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
  const [selectedTerm, setSelectedTerm] = useState<any | null>(null);
  const [publishedFlow, setPublishedFlow] = useState<any | null>(null);
  const [hasPublishedFlow, setHasPublishedFlow] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial load: terms, flows, students, orgs
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [termsRes, flowsRes, stList, orgList] = await Promise.all([
          fetch("/api/terms").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/flows").then((r) => (r.ok ? r.json() : [])),
          clearanceService.getStudents(),
          clearanceService.getOrgs(),
        ]);

        const termList = termsRes || [];

        // Identify active academic term by default, or the first available term
        const active = termList.find((t: any) => t.status === "Active") || termList[0] || null;
        setSelectedTerm(active);

        // Check if there is a published clearance flow for this term
        const pubFlow = active
          ? (flowsRes || []).find((f: any) => f.termId === active.id && f.status === "Published")
          : null;
        setPublishedFlow(pubFlow || null);
        const flowActive = Boolean(pubFlow);
        setHasPublishedFlow(flowActive);

        // If there is a published flow, load only records belonging to this term
        if (flowActive && active) {
          const recList = await fetch(`/api/clearance-records?termId=${active.id}`).then((r) =>
            r.ok ? r.json() : []
          );
          setClearanceRecords(recList || []);
        } else {
          setClearanceRecords([]);
        }

        setStudents(stList || []);
        setOrgs(orgList || []);
      } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);



  const totalStudents = students.length;
  const activeOrgs = orgs.filter((o) => o.status === "Active").length;

  // Build per-student clearance map strictly from the active term's clearance records
  // A student is cleared IF AND ONLY IF they have clearance records for this term and ALL of them are "Cleared"
  const studentClearanceMap = new Map<string, { total: number; cleared: number; isCleared: boolean }>();

  if (hasPublishedFlow && clearanceRecords.length > 0) {
    clearanceRecords.forEach((rec) => {
      if (!rec.studentId) return;
      if (!studentClearanceMap.has(rec.studentId)) {
        studentClearanceMap.set(rec.studentId, { total: 0, cleared: 0, isCleared: false });
      }
      const entry = studentClearanceMap.get(rec.studentId)!;
      entry.total += 1;
      if (rec.status === "Cleared") {
        entry.cleared += 1;
      }
    });

    studentClearanceMap.forEach((entry) => {
      entry.isCleared = entry.total > 0 && entry.cleared === entry.total;
    });
  }

  // Students participating in this term's published flow
  const participatingStudents = hasPublishedFlow
    ? students.filter((s) => studentClearanceMap.has(s.id))
    : [];

  const totalParticipating = participatingStudents.length;

  const clearedStudents = hasPublishedFlow
    ? participatingStudents.filter((s) => studentClearanceMap.get(s.id)?.isCleared)
    : [];

  const clearedClearances = clearedStudents.length;
  const pendingClearances = hasPublishedFlow ? Math.max(0, totalParticipating - clearedClearances) : 0;
  const clearedPct = hasPublishedFlow && totalParticipating > 0
    ? ((clearedClearances / totalParticipating) * 100).toFixed(1)
    : "0";

  // Dynamic Department Completion Data for Chart (only when flow is published)
  const deptsList = ["CCIS", "COE", "CEDAS", "CHS", "CABE"];
  const chartData = deptsList.map((dept) => {
    const deptStudents = participatingStudents.filter((s) => s.department === dept);
    const total = deptStudents.length;
    const cleared = deptStudents.filter((s) => studentClearanceMap.get(s.id)?.isCleared).length;
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
      trend: hasPublishedFlow ? `${totalParticipating} in clearance flow` : `${students.length} in database`,
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
      value: hasPublishedFlow ? pendingClearances.toLocaleString() : "—",
      icon: "pending_actions",
      trend: hasPublishedFlow ? "Requires attention" : "No active flow",
      trendUp: false,
      highlight: false,
      error: hasPublishedFlow && pendingClearances > 0,
    },
    {
      label: "Cleared",
      value: hasPublishedFlow ? clearedClearances.toLocaleString() : "—",
      icon: "check_circle",
      trend: hasPublishedFlow ? `${clearedPct}% Completion` : "No active flow",
      trendUp: hasPublishedFlow ? true : null,
      highlight: hasPublishedFlow && clearedClearances > 0,
    },
  ];

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-lg">
        <div>
          <div className="flex items-center gap-2.5 mb-xs flex-wrap">
            <h3 className="font-title-md text-title-md text-on-surface">System Overview</h3>
            {selectedTerm && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {selectedTerm.name} {selectedTerm.status === "Active" ? "(Active Term)" : ""}
              </span>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-secondary">
            Monitor university-wide clearance metrics and live institutional compliance.
          </p>
        </div>

      </div>

      {/* Prominent No Active Clearance Flow Warning Banner */}
      {!loading && !hasPublishedFlow && (
        <div className="mb-gutter bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-title-sm text-xs font-bold text-amber-950">No Published Clearance Flow</h4>
                {selectedTerm && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/60 text-amber-900">
                    {selectedTerm.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                There is no published clearance flow for this term. Clearance analytics cards and department completion charts are blanked until a flow is published.
              </p>
            </div>
          </div>
          <Link
            href="/admin/clearance-requirements"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#b51b15] hover:bg-[#961410] text-white text-xs font-bold rounded-lg shadow-xs transition-all whitespace-nowrap active:scale-95 shrink-0"
          >
            <span>Go to Clearance Requirements</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      )}

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
                {card.trendUp === false && (
                  <span className="material-symbols-outlined text-[16px]">trending_down</span>
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
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-high p-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-lg">
            <div>
              <h4 className="font-title-md text-title-md text-on-surface">Department Completion Rate</h4>
              <p className="font-body-sm text-body-sm text-secondary">
                {hasPublishedFlow
                  ? `Real-time compliance for ${selectedTerm?.name || "current term"}`
                  : "Real-time compliance breakdown across departments"}
              </p>
            </div>
            {hasPublishedFlow && (
              <div className="flex gap-sm">
                <span className="flex items-center gap-xs font-label-md text-label-md text-secondary">
                  <span className="w-3 h-3 rounded-full bg-surface-container-high block" /> Pending
                </span>
                <span className="flex items-center gap-xs font-label-md text-label-md text-on-surface">
                  <span className="w-3 h-3 rounded-full bg-brand-red block" /> Cleared
                </span>
              </div>
            )}
          </div>

          {!hasPublishedFlow ? (
            <div className="w-full h-[260px] flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/20 rounded-xl border border-dashed border-surface-container-high">
              <div className="w-12 h-12 rounded-full bg-surface-container-low text-secondary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl text-secondary/70">bar_chart</span>
              </div>
              <h5 className="font-title-sm text-sm font-bold text-on-surface mb-1">No Active Clearance Flow</h5>
              <p className="text-xs text-secondary max-w-sm mb-4">
                Department completion rates and charts will automatically calculate once a clearance flow for {selectedTerm ? selectedTerm.name : "the selected term"} is published.
              </p>
              <Link
                href="/admin/clearance-requirements"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-red hover:underline"
              >
                <span>Configure and publish a clearance flow</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          ) : (
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
          )}
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
            {!hasPublishedFlow ? (
              <div className="py-6 px-3 text-center bg-surface-container-low/20 rounded-xl border border-dashed border-surface-container-high">
                <span className="material-symbols-outlined text-2xl text-secondary/60 mb-1">domain_disabled</span>
                <p className="text-xs font-bold text-secondary">No Active Clearance Flow</p>
                <p className="text-[11px] text-secondary/80 mt-0.5">Office clearance metrics are inactive.</p>
              </div>
            ) : (
              <div className="space-y-sm">
                {offices.slice(0, 4).map((office) => {
                  const officeRecs = clearanceRecords.filter((r) => r.officeId === office.id);
                  const total = officeRecs.length;
                  const cleared = officeRecs.filter((r) => r.status === "Cleared").length;
                  const pending = Math.max(0, total - cleared);
                  return (
                    <div key={office.id} className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm text-on-surface">{office.name}</span>
                      <span className="font-label-md text-label-md text-secondary">
                        {total === 0 ? (
                          <span className="text-secondary/70 italic text-xs">Not in flow</span>
                        ) : (
                          <>
                            <strong className="text-brand-red font-semibold">{pending}</strong> pending /{" "}
                            <strong className="text-green-600 font-semibold">{cleared}</strong> cleared
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
                {offices.length === 0 && (
                  <p className="text-xs text-secondary py-4 text-center">No offices configured.</p>
                )}
              </div>
            )}
            <Link href="/admin/user-management?tab=offices" className="mt-md flex items-center gap-1 font-label-md text-label-md text-brand-red hover:text-primary transition-colors">
              Manage offices <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
