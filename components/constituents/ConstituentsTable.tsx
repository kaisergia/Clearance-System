"use client";

export interface TableStudent {
  id: string;
  name: string;
  department: string;
  program?: string;
  course?: string;
  year: string;
  status: string;
}

interface ConstituentsTableProps {
  students: TableStudent[];
  selectedIds: string[];
  onSelectStudent: (id: string, checked: boolean) => void;
  onSelectAllChange: (checked: boolean) => void;
  onToggleStatus: (id: string) => void;
  onBulkStatusChange: (status: "Cleared" | "Pending") => void;
  onViewDetails?: (student: TableStudent) => void;
  isAllSelected: boolean;
}

export function ConstituentsTable({
  students,
  selectedIds,
  onSelectStudent,
  onSelectAllChange,
  onToggleStatus,
  onBulkStatusChange,
  onViewDetails,
  isAllSelected,
}: ConstituentsTableProps) {
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
      {selectedIds.length > 0 && (
        <div className="bg-primary/5 px-6 py-3 border-b border-outline-variant flex justify-between items-center">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.length} {selectedIds.length === 1 ? "student" : "students"} selected for bulk actions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkStatusChange("Cleared")}
              className="bg-green-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm font-bold">done</span>
              Mark Cleared
            </button>
            <button
              onClick={() => onBulkStatusChange("Pending")}
              className="bg-red-50 text-coral-red border border-coral-red text-xs font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-coral-red hover:text-white active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm font-bold">close</span>
              Mark Uncleared
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant text-left">
            <tr className="font-label-md text-xs font-semibold text-secondary uppercase tracking-wider">
              <th className="py-4 px-6 text-left">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAllChange(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                  />
                  <span>All</span>
                </div>
              </th>
              <th className="py-4 px-6 text-left">Student ID</th>
              <th className="py-4 px-6 text-left">Name</th>
              <th className="py-4 px-6 text-left">Department</th>
              <th className="py-4 px-6 text-left">Program</th>
              <th className="py-4 px-6 text-left">Year</th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6 text-center">Action</th>
              <th className="py-4 px-6 text-center">Progress</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-sm text-on-surface divide-y divide-outline-variant/30">
            {students.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-secondary font-medium">
                  No constituents found matching the filter criteria.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-surface-container-low/20 transition-all duration-150"
                >
                  <td className="py-4 px-6 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={(e) => onSelectStudent(student.id, e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-6 font-mono font-medium text-xs text-secondary">{student.id}</td>
                  <td className="py-4 px-6 font-bold">{student.name}</td>
                  <td className="py-4 px-6 text-secondary">{student.department}</td>
                  <td className="py-4 px-6 text-secondary">{student.course || student.program}</td>
                  <td className="py-4 px-6 text-secondary">{student.year}</td>
                  <td className="py-4 px-6 text-center">
                    {student.status === "Cleared" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                        Cleared
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-200">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {student.status === "Cleared" ? (
                      <button
                        onClick={() => onToggleStatus(student.id)}
                        className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-red-50 text-coral-red hover:bg-coral-red hover:text-white border border-coral-red active:scale-95 shadow-sm"
                      >
                        Mark Uncleared
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(student.id)}
                        className="px-3 py-1.5 rounded-lg font-bold text-xs transition-all bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-600 active:scale-95 shadow-sm"
                      >
                        Mark Cleared
                      </button>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => onViewDetails?.(student)}
                      className="text-coral-red hover:text-primary transition-colors font-bold text-xs"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
