"use client";

import { useState } from "react";
import Link from "next/link";
import { mockOrgs, mockOffices } from "@/mock/mockData";
import { mockStudents } from "@/mock/mockStudents";

const WEEK_DATA = [
  { week: "Wk 1", total: 20, cleared: 10 },
  { week: "Wk 2", total: 35, cleared: 15 },
  { week: "Wk 3", total: 45, cleared: 25 },
  { week: "Wk 4", total: 60, cleared: 35 },
  { week: "Wk 5", total: 75, cleared: 50 },
  { week: "Wk 6", total: 85, cleared: 65 },
  { week: "Wk 7", total: 95, cleared: 80 },
];

const STAT_CARDS = [
  {
    label: "Total Students",
    value: "24,592",
    icon: "groups",
    trend: "+2.4% this semester",
    trendUp: true,
    highlight: false,
  },
  {
    label: "Active Orgs",
    value: "148",
    icon: "hub",
    trend: "Stable",
    trendUp: null,
    highlight: false,
  },
  {
    label: "Head Offices",
    value: "12",
    icon: "domain",
    trend: "Stable",
    trendUp: null,
    highlight: false,
  },
  {
    label: "Pending",
    value: "8,430",
    icon: "pending_actions",
    trend: "Requires attention",
    trendUp: false,
    highlight: false,
    error: true,
  },
  {
    label: "Cleared",
    value: "16,162",
    icon: "check_circle",
    trend: "65.7% Completion",
    trendUp: true,
    highlight: true,
  },
];

export default function AdminDashboard() {
  const activeOrgs = mockOrgs.filter((o) => o.status === "Active").length;

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h3 className="font-title-md text-title-md text-on-surface mb-xs">System Overview</h3>
          <p className="font-body-sm text-body-sm text-secondary">
            Monitor university-wide clearance metrics and statuses.
          </p>
        </div>
        <button className="flex items-center gap-xs px-md py-sm bg-brand-red text-white rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary transition-colors btn-hover">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Report
        </button>
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
              <h4 className="font-title-md text-title-md text-on-surface">Clearance Completion Rate</h4>
              <p className="font-body-sm text-body-sm text-secondary">Historical trend over the current semester</p>
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
              {WEEK_DATA.map((d) => {
                const totalPct = d.total;
                const clearedPct = (d.cleared / 100) * 100;
                return (
                  <div key={d.week} className="flex flex-col items-center gap-1 flex-1 h-full justify-end relative group">
                    <div
                      className="w-[70%] rounded-t-sm relative overflow-hidden transition-all duration-300 hover:opacity-90"
                      style={{ height: `${totalPct}%` }}
                    >
                      <div className="absolute inset-0 bg-surface-container-high rounded-t-sm" />
                      <div
                        className="absolute bottom-0 w-full bg-brand-red rounded-t-sm transition-all duration-500"
                        style={{ height: `${d.cleared}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface-container-lowest text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {d.cleared}% cleared
                      </div>
                    </div>
                    <span className="absolute -bottom-7 font-label-md text-label-md text-secondary whitespace-nowrap">
                      {d.week}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Active Orgs */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-md shadow-[0px_1px_3px_rgba(0,0,0,0.05)] flex-1">
            <h4 className="font-title-md text-title-md text-on-surface mb-md">Org Status</h4>
            <div className="space-y-sm">
              {mockOrgs.slice(0, 4).map((org) => (
                <div key={org.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-7 h-7 rounded bg-secondary-container text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                      {org.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
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
            </div>
            <Link href="/admin/user-management/orgs" className="mt-md flex items-center gap-1 font-label-md text-label-md text-brand-red hover:text-primary transition-colors">
              View all orgs <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          {/* Office Clearance Quick View */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high p-md shadow-[0px_1px_3px_rgba(0,0,0,0.05)] flex-1">
            <h4 className="font-title-md text-title-md text-on-surface mb-md">Office Pending</h4>
            <div className="space-y-sm">
              {mockOffices.slice(0, 4).map((office) => (
                <div key={office.id} className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface">{office.name}</span>
                  <span className="font-label-md text-label-md text-brand-red font-semibold">{office.pending}</span>
                </div>
              ))}
            </div>
            <Link href="/admin/offices" className="mt-md flex items-center gap-1 font-label-md text-label-md text-brand-red hover:text-primary transition-colors">
              Manage offices <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
