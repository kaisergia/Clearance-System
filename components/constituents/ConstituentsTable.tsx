"use client";

import { getDepartmentForProgram } from "@/lib/constants";

export interface TableStudent {
  id: string;
  name: string;
  email?: string;
  department: string;
  program?: string;
  course?: string;
  year: string;
  status: string;
  initials?: string;
  role?: string;
  avatarUrl?: string;
  hasRequirements?: boolean;
}

interface ConstituentsTableProps {
  students: TableStudent[];
  selectedIds: string[];
  onSelectStudent: (id: string, checked: boolean) => void;
  onSelectAllChange: (checked: boolean) => void;
  onToggleStatus: (studentId: string, currentStatus: string) => void;
  onBulkStatusChange: (status: "Cleared" | "Pending") => void;
  isAllSelected: boolean;
  isSysAdmin?: boolean;
  basePath?: string;
  onViewDetails?: (student: TableStudent) => void;
  onResetPassword?: (student: TableStudent) => void;
}

function getInitials(name: string): string {
  if (!name) return "ST";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ConstituentsTable({
  students,
  selectedIds,
  onSelectStudent,
  onSelectAllChange,
  onToggleStatus,
  onBulkStatusChange,
  isAllSelected,
  isSysAdmin = false,
  basePath = "/head-office/constituents",
  onViewDetails,
  onResetPassword,
}: ConstituentsTableProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50/50 px-6 py-3 border-b border-emerald-100 flex justify-between items-center">
          <span className="text-xs font-bold text-emerald-800">
            {selectedIds.length} {selectedIds.length === 1 ? "student" : "students"} selected for bulk actions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkStatusChange("Cleared")}
              className="bg-green-600 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg shadow-xs hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">done</span>
              Mark Cleared
            </button>
            <button
              onClick={() => onBulkStatusChange("Pending")}
              className="bg-red-50 text-coral-red border border-coral-red text-xs font-bold py-1.5 px-3.5 rounded-lg shadow-xs hover:bg-coral-red hover:text-white active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">close</span>
              Mark Uncleared
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-gray-200">
              {!isSysAdmin && (
                <th className="px-6 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAllChange(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-6 py-3.5">User</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Program</th>
              <th className="px-6 py-3.5 text-center">Status</th>
              <th className="px-6 py-3.5">Joined</th>
              <th className="px-6 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-medium">
            {students.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  No constituents found matching the filter criteria.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const isCleared = student.status === "Cleared";
                const isSelected = selectedIds.includes(student.id);
                const deptCode = student.department || getDepartmentForProgram(student.program || student.course);
                const userInitials = student.initials || getInitials(student.name);
                const avatarSrc = student.avatarUrl || (student as any).avatar || (student as any).photoUrl || (student as any).profilePicture || (student as any).image;

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${isSelected ? "bg-emerald-50/20" : ""}`}
                  >
                    {!isSysAdmin && (
                      <td className="px-6 py-3.5">
                        {student.hasRequirements !== false && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelectStudent(student.id, e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                          />
                        )}
                      </td>
                    )}

                    {/* USER Column: Avatar + Name + View Clearance Status Link + Email/ID */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={student.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 shadow-2xs border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#800000] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {userInitials}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{student.name}</span>
                            {onViewDetails ? (
                              <button
                                onClick={() => onViewDetails(student)}
                                className="text-xs text-[#c41e2a] hover:underline font-normal inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 outline-none"
                                title="View Clearance Details"
                              >
                                (View Clearance Status)
                              </button>
                            ) : (
                              <a
                                href={`${basePath}/${student.id}`}
                                className="text-xs text-[#c41e2a] hover:underline font-normal inline-flex items-center gap-0.5"
                                title="View Clearance Details"
                              >
                                (View Clearance Status)
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {student.email || `${student.id}@g.cjc.edu.ph`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ROLE Column */}
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
                        {student.role || "Student"}
                      </span>
                    </td>

                    {/* DEPARTMENT Column */}
                    <td className="px-6 py-3.5 font-semibold text-gray-700">
                      {deptCode}
                    </td>

                    {/* PROGRAM Column */}
                    <td className="px-6 py-3.5 text-gray-600">
                      {student.program || student.course}
                    </td>

                    {/* STATUS Column */}
                    <td className="px-6 py-3.5 text-center">
                      {student.status === "Cleared" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Cleared
                        </span>
                      ) : student.status === "Submitted" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Submitted
                        </span>
                      ) : student.status === "Rejected" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* JOINED / YEAR Column */}
                    <td className="px-6 py-3.5 text-gray-500">
                      {student.year}
                    </td>

                    {/* ACTIONS Column */}
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {student.hasRequirements === false ? (
                          <button
                            disabled
                            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          >
                            No Requirements
                          </button>
                        ) : isCleared ? (
                          <button
                            onClick={() => onToggleStatus(student.id, student.status)}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-red-50 text-coral-red hover:bg-coral-red hover:text-white border border-coral-red active:scale-95 shadow-xs cursor-pointer"
                          >
                            Mark Uncleared
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleStatus(student.id, student.status)}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-600 active:scale-95 shadow-xs cursor-pointer"
                          >
                            Mark Cleared
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
