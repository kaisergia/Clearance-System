"use client";

import Link from "next/link";
import { useDepartments } from "@/components/contexts/DepartmentsContext";

const PALETTE = [
  "bg-primary-fixed text-primary",
  "bg-secondary-fixed text-secondary",
  "bg-tertiary-fixed text-tertiary",
  "bg-surface-variant text-on-surface-variant",
  "bg-secondary-container text-on-secondary-container",
];

export default function DepartmentsPage() {
  const { departments, deleteDepartment } = useDepartments();

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Departments</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Manage academic and non-academic departments and assign administrative roles.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-lg">
        {[
          { label: "Total Departments", value: departments.length, sub: "Active", icon: "account_balance", color: "bg-secondary-fixed text-on-secondary-fixed" },
          { label: "Assigned Heads", value: 12, sub: "Personnel", icon: "admin_panel_settings", color: "bg-tertiary-fixed text-on-tertiary-fixed" },
          { label: "Pending Clearances", value: departments.reduce((a, o) => a + (o.pending || 0), 0), sub: "Requests", icon: "assignment_late", color: "bg-primary-fixed text-on-primary-fixed-variant", highlight: true },
        ].map((card) => (
          <div key={card.label} className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant hover:shadow-md transition-shadow hover:-translate-y-1 transition-transform duration-200">
            <div className="flex items-center gap-md mb-sm">
              <div className={`p-2 ${card.color} rounded-lg`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
              </div>
              <span className="text-secondary font-medium font-body-md text-body-md">{card.label}</span>
            </div>
            <div className="flex items-baseline gap-sm">
              <span className={`font-headline-lg text-headline-lg font-bold ${card.highlight ? "text-brand-red" : "text-on-surface"}`}>{card.value}</span>
              <span className="text-secondary font-label-md text-label-md">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Department Cards Grid */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h3 className="font-title-md text-title-md text-on-surface">Department Directory</h3>
          <div className="flex items-center gap-sm">
            <button className="flex items-center gap-xs px-md py-1.5 border border-surface-container-high rounded-lg font-body-sm text-body-sm text-secondary hover:bg-surface transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span> Filter
            </button>
            <button className="flex items-center gap-xs px-md py-1.5 border border-surface-container-high rounded-lg font-body-sm text-body-sm text-secondary hover:bg-surface transition-colors">
              <span className="material-symbols-outlined text-sm">download</span> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-secondary font-label-md text-label-md uppercase tracking-wider">
                <th className="px-lg py-4 font-bold">Department Name</th>
                <th className="px-lg py-4 font-bold">Head</th>
                <th className="px-lg py-4 font-bold">Email</th>
                <th className="px-lg py-4 font-bold">Pending</th>
                <th className="px-lg py-4 font-bold">Approved</th>
                <th className="px-lg py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {departments.map((dept, idx) => (
                <tr key={dept.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-lg py-4">
                    <div className="flex items-center gap-md">
                      <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm shrink-0 ${PALETTE[idx % PALETTE.length]}`}>
                        {dept.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-on-surface">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-lg py-4">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-sm text-secondary">person</span>
                      <span className="font-body-sm text-body-sm text-on-surface">{dept.head?.name || "Unassigned"}</span>
                    </div>
                  </td>
                  <td className="px-lg py-4 font-body-sm text-body-sm text-secondary">{dept.head?.email || "N/A"}</td>
                  <td className="px-lg py-4">
                    <span className="font-semibold text-brand-red font-body-sm text-body-sm">{dept.pending || 0}</span>
                  </td>
                  <td className="px-lg py-4">
                    <span className="font-semibold text-emerald-600 font-body-sm text-body-sm">{dept.approved || 0}</span>
                  </td>
                  <td className="px-lg py-4 text-right">
                    <div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/departments/${dept.id}`}>
                        <button className="p-2 hover:bg-surface-variant rounded transition-colors text-secondary hover:text-primary">
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                      </Link>
                      <button className="p-2 hover:bg-surface-variant rounded transition-colors text-secondary hover:text-primary">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => deleteDepartment(dept.id)} className="p-2 hover:bg-brand-red/10 rounded transition-colors text-secondary hover:text-brand-red">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-lg py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center font-label-md text-label-md text-secondary">
          <span>Showing {departments.length} of {departments.length} Departments</span>
          <div className="flex items-center gap-xs">
            <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface transition-colors opacity-50 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="px-3 py-1 bg-brand-red text-white rounded-lg">1</button>
            <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface transition-colors opacity-50 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
