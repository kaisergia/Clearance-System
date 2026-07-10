"use client";

import { useState, useMemo } from "react";
import { mockStudents } from "@/mock/mockStudents";

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  Cleared: { bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Cleared" },
  Pending: { bg: "bg-amber-50 border border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
  Rejected: { bg: "bg-red-50 border border-red-200", text: "text-red-700", dot: "bg-red-500", label: "Blocked" },
};

export default function ManageStudentsPage() {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null);
  const ROWS_PER_PAGE = 5;

  const filtered = useMemo(() => {
    return mockStudents.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      const matchCourse = courseFilter ? s.course === courseFilter : true;
      const matchYear = yearFilter ? s.year === yearFilter : true;
      const matchStatus = statusFilter ? s.status === statusFilter : true;
      return matchSearch && matchCourse && matchYear && matchStatus;
    });
  }, [search, courseFilter, yearFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Manage Constituents</h2>
          <p className="font-body-md text-body-md text-secondary max-w-2xl">
            Overview and management of student clearance statuses across all departments.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-secondary hover:text-primary hover:bg-surface-container-low transition-all font-label-md text-label-md shadow-sm">
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Export CSV
          </button>
          <button className="h-10 px-5 inline-flex items-center gap-2 rounded-lg bg-brand-red text-white hover:bg-primary transition-all font-label-md text-label-md shadow-sm btn-hover">
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              className="w-full h-11 pl-10 pr-4 bg-surface rounded-lg border border-surface-container-high focus:border-primary focus:ring-2 focus:ring-brand-red/20 font-body-sm text-body-sm transition-all outline-none"
              placeholder="Search by Student ID or Name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="md:col-span-7 flex flex-wrap md:flex-nowrap items-center gap-3 justify-end">
            {[
              {
                value: courseFilter, onChange: (v: string) => { setCourseFilter(v); setCurrentPage(1); },
                options: [["", "All Courses"], ["BSIT", "BSIT"], ["BSCS", "BSCS"], ["BSBA", "BSBA"], ["BSED", "BSED"]],
              },
              {
                value: yearFilter, onChange: (v: string) => { setYearFilter(v); setCurrentPage(1); },
                options: [["", "All Years"], ["1st Year", "1st Year"], ["2nd Year", "2nd Year"], ["3rd Year", "3rd Year"], ["4th Year", "4th Year"]],
              },
              {
                value: statusFilter, onChange: (v: string) => { setStatusFilter(v); setCurrentPage(1); },
                options: [["", "Any Status"], ["Cleared", "Cleared"], ["Pending", "Pending"], ["Rejected", "Rejected"]],
              },
            ].map((sel, i) => (
              <div key={i} className="relative min-w-[140px]">
                <select
                  value={sel.value}
                  onChange={(e) => sel.onChange(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-surface-container-lowest rounded-lg border border-surface-container-high focus:border-primary focus:ring-2 focus:ring-brand-red/20 font-body-sm text-body-sm text-on-surface appearance-none outline-none transition-all cursor-pointer"
                >
                  {sel.options.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                  expand_more
                </span>
              </div>
            ))}
            <button
              onClick={() => { setSearch(""); setCourseFilter(""); setYearFilter(""); setStatusFilter(""); setCurrentPage(1); }}
              className="h-11 w-11 flex items-center justify-center rounded-lg border border-surface-container-high text-secondary hover:bg-surface hover:text-on-surface transition-colors shrink-0"
              title="Clear Filters"
            >
              <span className="material-symbols-outlined">filter_alt_off</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface border-b border-surface-container-high">
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Course / Year</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Clearance Status</th>
                <th className="px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-surface-container-high">search_off</span>
                    No students found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((student) => {
                  const badge = STATUS_BADGE[student.status] || STATUS_BADGE.Pending;
                  return (
                    <tr key={student.id} className="group hover:bg-surface-bright transition-colors">
                      <td className="px-6 py-4 font-medium text-on-surface">{student.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                            {initials(student.name)}
                          </div>
                          <div>
                            <div className="font-medium text-on-surface">{student.name}</div>
                            <div className="text-xs text-secondary">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-secondary">{student.course} - {student.year}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${student.status === "Pending" ? "animate-pulse" : ""}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 text-secondary hover:text-primary rounded hover:bg-surface-container-low transition-colors"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button className="p-1.5 text-secondary hover:text-primary rounded hover:bg-surface-container-low transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-surface-container-high bg-surface flex items-center justify-between font-body-sm text-body-sm text-secondary">
          <div>Showing {Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of {filtered.length} students</div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-1.5 border border-surface-container-high rounded hover:bg-surface-container-lowest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded font-medium ${
                  p === currentPage ? "bg-brand-red text-white" : "hover:bg-surface-container-low text-on-surface"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-1.5 border border-surface-container-high rounded hover:bg-surface-container-lowest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
          <div
            className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-title-md text-title-md text-on-surface">Student Details</h3>
              <button onClick={() => setSelectedStudent(null)} className="p-1 rounded text-secondary hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex items-center gap-md mb-lg">
              <div className="w-14 h-14 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xl">
                {initials(selectedStudent.name)}
              </div>
              <div>
                <p className="font-title-md text-title-md text-on-surface">{selectedStudent.name}</p>
                <p className="font-body-sm text-body-sm text-secondary">{selectedStudent.email}</p>
              </div>
            </div>
            <div className="space-y-sm border-t border-surface-container-high pt-md">
              {[
                ["Student ID", selectedStudent.id],
                ["Course", selectedStudent.course],
                ["Year Level", selectedStudent.year],
                ["Semester", selectedStudent.semester],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between font-body-sm text-body-sm">
                  <span className="text-secondary">{label}</span>
                  <span className="text-on-surface font-medium">{val}</span>
                </div>
              ))}
              <div className="flex justify-between font-body-sm text-body-sm items-center pt-sm">
                <span className="text-secondary">Clearance Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[selectedStudent.status]?.bg} ${STATUS_BADGE[selectedStudent.status]?.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BADGE[selectedStudent.status]?.dot}`} />
                  {STATUS_BADGE[selectedStudent.status]?.label}
                </span>
              </div>
            </div>
            <div className="flex gap-sm mt-lg">
              <button className="flex-1 py-2 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors font-label-md text-label-md">
                Edit Student
              </button>
              <button onClick={() => setSelectedStudent(null)} className="flex-1 py-2 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors font-label-md text-label-md">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
