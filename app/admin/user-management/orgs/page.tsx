"use client";

import { useState, useMemo } from "react";
import { mockOrgs } from "@/mock/mockData";

type Org = typeof mockOrgs[0] & { status: string };

const COLORS = ["bg-secondary-container text-secondary", "bg-tertiary-fixed text-tertiary", "bg-primary-fixed text-primary", "bg-surface-container-high text-on-surface-variant"];

export default function ManageOrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>(mockOrgs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", category: "", adviser: "", status: "Active" });
  const [confirmToggle, setConfirmToggle] = useState<Org | null>(null);

  const filtered = useMemo(() => {
    return orgs.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch = o.name.toLowerCase().includes(q) || o.adviser.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" ? true : o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orgs, search, statusFilter]);

  const toggleStatus = (id: number) => {
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: o.status === "Active" ? "Disabled" : "Active" } : o
      )
    );
    setConfirmToggle(null);
  };

  const handleAddOrg = () => {
    if (!newOrg.name.trim()) return;
    setOrgs((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: newOrg.name,
        category: newOrg.category || "General",
        adviser: newOrg.adviser || "TBA",
        status: newOrg.status,
        dateAdded: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        memberCount: 0,
      },
    ]);
    setNewOrg({ name: "", category: "", adviser: "", status: "Active" });
    setShowModal(false);
  };

  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Organizations &amp; Clubs</h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Manage campus student groups and their activity status.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-red text-white px-6 py-2.5 rounded-lg font-body-sm text-body-sm shadow-[0_4px_14px_0_rgba(244,74,59,0.2)] hover:bg-primary transition-all duration-200 flex items-center gap-2 btn-hover"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="font-semibold">Add New Org</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-lg border border-surface-container-high p-4 mb-lg shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[["All", orgs.length], ["Active", orgs.filter((o) => o.status === "Active").length], ["Disabled", orgs.filter((o) => o.status === "Disabled").length]].map(([label, count]) => (
            <button
              key={label}
              onClick={() => setStatusFilter(String(label))}
              className={`px-4 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
                statusFilter === label
                  ? "bg-brand-red/10 text-brand-red border border-brand-red/20"
                  : "bg-surface-container-low text-secondary hover:bg-surface-container border border-transparent"
              }`}
            >
              {label} {label === "All" ? "Organizations" : ""} ({count})
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-surface-container-highest rounded-full font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-primary transition-all"
            placeholder="Search orgs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-lg border border-surface-container-high shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-container-highest">
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Org Name</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Adviser</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Members</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Date Added</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-surface-container-high">search_off</span>
                    No organizations found.
                  </td>
                </tr>
              ) : (
                filtered.map((org, idx) => (
                  <tr key={org.id} className="hover:bg-surface-bright transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-sm shrink-0 ${COLORS[idx % COLORS.length]}`}>
                          {initials(org.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface">{org.name}</div>
                          <div className="text-secondary text-xs">{org.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => setConfirmToggle(org)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          org.status === "Active" ? "bg-brand-red" : "bg-surface-container-high"
                        }`}
                        role="switch"
                        aria-checked={org.status === "Active"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            org.status === "Active" ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className={`ml-2 font-label-md text-label-md ${org.status === "Active" ? "text-emerald-600" : "text-secondary"}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-secondary">{org.adviser}</td>
                    <td className="px-6 py-4 text-secondary">{org.memberCount}</td>
                    <td className="px-6 py-4 text-secondary">{org.dateAdded}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-secondary hover:text-primary rounded hover:bg-surface-container-low transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button className="p-1.5 text-secondary hover:text-error rounded hover:bg-error-container transition-colors" title="Delete">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-surface-container-high bg-surface flex items-center justify-between font-body-sm text-body-sm text-secondary">
          <span>Showing {filtered.length} of {orgs.length} organizations</span>
        </div>
      </div>

      {/* Add Org Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-title-md text-title-md text-on-surface">Add New Organization</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-secondary hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-md">
              {[
                { label: "Organization Name *", key: "name", placeholder: "e.g. Computer Science Society" },
                { label: "Category", key: "category", placeholder: "e.g. Academic, Cultural, Sports" },
                { label: "Adviser Name", key: "adviser", placeholder: "e.g. Prof. Santos" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block font-body-sm text-body-sm text-on-surface mb-1">{field.label}</label>
                  <input
                    className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface font-body-sm text-body-sm outline-none transition-colors"
                    placeholder={field.placeholder}
                    value={newOrg[field.key as keyof typeof newOrg]}
                    onChange={(e) => setNewOrg({ ...newOrg, [field.key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-2">Initial Status</label>
                <div className="flex items-center gap-md">
                  <button
                    onClick={() => setNewOrg({ ...newOrg, status: newOrg.status === "Active" ? "Disabled" : "Active" })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${newOrg.status === "Active" ? "bg-brand-red" : "bg-surface-container-high"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${newOrg.status === "Active" ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="font-body-sm text-body-sm text-secondary">{newOrg.status}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-sm mt-lg">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors font-label-md text-label-md">
                Cancel
              </button>
              <button onClick={handleAddOrg} className="flex-1 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors font-label-md text-label-md btn-hover">
                Add Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Confirm Modal */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmToggle(null)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-sm p-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-md mb-md">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmToggle.status === "Active" ? "bg-error-container text-error" : "bg-emerald-50 text-emerald-600"}`}>
                <span className="material-symbols-outlined">{confirmToggle.status === "Active" ? "block" : "check_circle"}</span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">{confirmToggle.status === "Active" ? "Disable" : "Enable"} Org?</h3>
                <p className="font-body-sm text-body-sm text-secondary">{confirmToggle.name}</p>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mb-lg">
              {confirmToggle.status === "Active"
                ? "Disabling this org will lock the officer portal and prevent clearance management."
                : "Enabling this org will restore full access for its officers."}
            </p>
            <div className="flex gap-sm">
              <button onClick={() => setConfirmToggle(null)} className="flex-1 py-2 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors font-label-md text-label-md">
                Cancel
              </button>
              <button
                onClick={() => toggleStatus(confirmToggle.id)}
                className={`flex-1 py-2 rounded-lg text-white transition-colors font-label-md text-label-md ${confirmToggle.status === "Active" ? "bg-error hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
