"use client";

import { useState } from "react";

const mockStaff = [
  { id: 1, name: "Maria Reyes", office: "Registrar", email: "m.reyes@uni.edu.ph", role: "Head", status: "Active" },
  { id: 2, name: "Jose Santos", office: "Library", email: "j.santos@uni.edu.ph", role: "Staff", status: "Active" },
  { id: 3, name: "Luz Garcia", office: "Guidance Office", email: "l.garcia@uni.edu.ph", role: "Head", status: "Active" },
  { id: 4, name: "Ramon Cruz", office: "Accounting", email: "r.cruz@uni.edu.ph", role: "Staff", status: "Inactive" },
  { id: 5, name: "Alma Mendoza", office: "Discipline Office", email: "a.mendoza@uni.edu.ph", role: "Head", status: "Active" },
];

export default function HeadOfficeAccountsPage() {
  const [staff, setStaff] = useState(mockStaff);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", office: "", email: "", role: "Staff" });

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.office.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const handleAdd = () => {
    if (!newStaff.name.trim() || !newStaff.office.trim()) return;
    setStaff((prev) => [...prev, { id: prev.length + 1, ...newStaff, status: "Active" }]);
    setNewStaff({ name: "", office: "", email: "", role: "Staff" });
    setShowModal(false);
  };

  const handleRemove = (id: number) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Head Office Accounts</h2>
          <p className="font-body-md text-body-md text-secondary">Manage staff accounts assigned to head offices.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-10 px-5 inline-flex items-center gap-2 rounded-lg bg-brand-red text-white hover:bg-primary transition-all font-label-md text-label-md shadow-sm btn-hover"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Add Staff Account
        </button>
      </div>

      {/* Search */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm mb-6 p-4">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">search</span>
          <input
            className="w-full h-11 pl-10 pr-4 bg-surface rounded-lg border border-surface-container-high focus:border-primary focus:ring-2 focus:ring-brand-red/20 font-body-sm text-body-sm outline-none transition-all"
            placeholder="Search by name, office, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface border-b border-surface-container-high">
                {["Name", "Office", "Email", "Role", "Status", "Actions"].map((h) => (
                  <th key={h} className={`px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
              {filtered.map((s) => (
                <tr key={s.id} className="group hover:bg-surface-bright transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                        {initials(s.name)}
                      </div>
                      <span className="font-medium text-on-surface">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-secondary">{s.office}</td>
                  <td className="px-6 py-4 text-secondary">{s.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-md text-label-md ${s.role === "Head" ? "bg-brand-red/10 text-brand-red" : "bg-secondary-container text-secondary"}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-surface-container-high text-secondary border border-surface-container-highest"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === "Active" ? "bg-emerald-500" : "bg-secondary"}`} />
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-secondary hover:text-primary rounded hover:bg-surface-container-low transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleRemove(s.id)} className="p-1.5 text-secondary hover:text-error rounded hover:bg-error-container transition-colors" title="Remove">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-surface-container-high bg-surface font-body-sm text-body-sm text-secondary">
          Showing {filtered.length} of {staff.length} accounts
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-title-md text-title-md text-on-surface">Add Staff Account</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-secondary hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-md">
              {[
                { label: "Full Name *", key: "name", placeholder: "e.g. Maria Reyes" },
                { label: "Office *", key: "office", placeholder: "e.g. Registrar" },
                { label: "Email", key: "email", placeholder: "e.g. m.reyes@uni.edu.ph" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block font-body-sm text-body-sm text-on-surface mb-1">{f.label}</label>
                  <input
                    className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface font-body-sm text-body-sm outline-none"
                    placeholder={f.placeholder}
                    value={newStaff[f.key as keyof typeof newStaff]}
                    onChange={(e) => setNewStaff({ ...newStaff, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="block font-body-sm text-body-sm text-on-surface mb-1">Role</label>
                <select
                  className="custom-ring w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-on-surface font-body-sm text-body-sm outline-none"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option>Head</option>
                  <option>Staff</option>
                </select>
              </div>
            </div>
            <div className="flex gap-sm mt-lg">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors font-label-md text-label-md">Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors font-label-md text-label-md btn-hover">Add Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
