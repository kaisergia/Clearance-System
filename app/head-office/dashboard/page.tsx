"use client";

import { useState } from "react";
import Link from "next/link";

export default function HeadOfficeDashboard() {
  const [selectedTerm, setSelectedTerm] = useState("Fall Semester 2024");

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-container-high">
        <div>
          <h2 className="font-headline-lg text-3xl font-bold text-on-surface">
            Dashboard
          </h2>
          <p className="font-body-md text-secondary mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">domain</span>
            Office: <span className="font-semibold text-on-surface">Guidance Office</span>
          </p>
        </div>
        {/* Term Selector */}
        <div className="relative min-w-[220px]">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-4 pr-10 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer shadow-sm hover:bg-surface-bright transition-all appearance-none"
          >
            <option>Fall Semester 2024</option>
            <option>Spring Semester 2024</option>
            <option>Fall Semester 2023</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-xl">
            expand_more
          </span>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1: Assigned Students */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                Assigned Students
              </span>
              <span className="font-display-lg text-4xl font-extrabold text-on-surface mt-1">1,240</span>
            </div>
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm text-green-600">trending_up</span>
            <span>+4.2% from last term</span>
          </div>
        </div>

        {/* Stat Card 2: Cleared */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-green-600">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                Cleared
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display-lg text-4xl font-extrabold text-on-surface">850</span>
                <span className="text-xs font-bold text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                  68%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center gap-1.5 text-xs text-secondary">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Progressing steadily</span>
          </div>
        </div>

        {/* Stat Card 3: Not Yet Cleared */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-l-4 border-l-yellow-500">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                Not Yet Cleared
              </span>
              <span className="font-display-lg text-4xl font-extrabold text-on-surface mt-1">320</span>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-all duration-300">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center gap-1.5 text-xs text-secondary">
            <span className="material-symbols-outlined text-sm text-yellow-600">schedule</span>
            <span>Needs attention before deadline</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">history</span>
            Recently Updated Records
          </h3>
          <Link
            href="/head-office/constituents"
            className="font-label-md text-sm text-primary hover:text-surface-tint font-semibold flex items-center gap-1 transition-all group"
          >
            View All Constituents
            <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-0.5">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-left">
                <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Student ID
                </th>
                <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Department
                </th>
                <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Program
                </th>
                <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
                  Year
                </th>
                <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="py-4 px-6 font-label-md text-xs font-semibold text-secondary uppercase tracking-wider text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-sm text-on-surface divide-y divide-outline-variant/30">
              {/* Row 1 */}
              <tr className="hover:bg-surface-container-low/20 transition-all duration-150">
                <td className="py-4 px-6 font-mono font-medium text-xs">2021-0492</td>
                <td className="py-4 px-6 font-semibold">Eleanor Shellstrop</td>
                <td className="py-4 px-6 text-secondary">Philosophy</td>
                <td className="py-4 px-6 text-secondary">BA Philosophy</td>
                <td className="py-4 px-6 text-secondary">4th Year</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                    Cleared
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <Link
                    href="/head-office/constituents"
                    className="inline-flex items-center gap-1 text-primary hover:text-surface-tint font-bold text-xs"
                  >
                    View Progress
                  </Link>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-surface-container-low/20 transition-all duration-150 bg-[#FEF2F2]/10">
                <td className="py-4 px-6 font-mono font-medium text-xs">2022-1103</td>
                <td className="py-4 px-6 font-semibold">Chidi Anagonye</td>
                <td className="py-4 px-6 text-secondary">Ethics</td>
                <td className="py-4 px-6 text-secondary">BA Ethics</td>
                <td className="py-4 px-6 text-secondary">3rd Year</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                    Deficient
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <Link
                    href="/head-office/constituents"
                    className="inline-flex items-center gap-1 text-primary hover:text-surface-tint font-bold text-xs"
                  >
                    View Progress
                  </Link>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-surface-container-low/20 transition-all duration-150">
                <td className="py-4 px-6 font-mono font-medium text-xs">2020-8831</td>
                <td className="py-4 px-6 font-semibold">Tahani Al-Jamil</td>
                <td className="py-4 px-6 text-secondary">Arts</td>
                <td className="py-4 px-6 text-secondary">BFA Arts</td>
                <td className="py-4 px-6 text-secondary">2nd Year</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-200">
                    Pending
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <Link
                    href="/head-office/constituents"
                    className="inline-flex items-center gap-1 text-primary hover:text-surface-tint font-bold text-xs"
                  >
                    View Progress
                  </Link>
                </td>
              </tr>
              {/* Row 4 */}
              <tr className="hover:bg-surface-container-low/20 transition-all duration-150">
                <td className="py-4 px-6 font-mono font-medium text-xs">2023-0012</td>
                <td className="py-4 px-6 font-semibold">Jason Mendoza</td>
                <td className="py-4 px-6 text-secondary">Business</td>
                <td className="py-4 px-6 text-secondary">BS Business</td>
                <td className="py-4 px-6 text-secondary">1st Year</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                    Cleared
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <Link
                    href="/head-office/constituents"
                    className="inline-flex items-center gap-1 text-primary hover:text-surface-tint font-bold text-xs"
                  >
                    View Progress
                  </Link>
                </td>
              </tr>
              {/* Row 5 */}
              <tr className="hover:bg-surface-container-low/20 transition-all duration-150">
                <td className="py-4 px-6 font-mono font-medium text-xs">2021-5529</td>
                <td className="py-4 px-6 font-semibold">Michael Realman</td>
                <td className="py-4 px-6 text-secondary">Architecture</td>
                <td className="py-4 px-6 text-secondary">BS Architecture</td>
                <td className="py-4 px-6 text-secondary">5th Year</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                    Cleared
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <Link
                    href="/head-office/constituents"
                    className="inline-flex items-center gap-1 text-primary hover:text-surface-tint font-bold text-xs"
                  >
                    View Progress
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
