"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Staff = { id: number; name: string; email: string; role: string; status: string };
type Department = {
  id: number;
  name: string;
  abbreviation?: string;
  description?: string;
  head: { name: string; email?: string; contact?: string };
  staff: Staff[];
  pending?: number;
  approved?: number;
  rejected?: number;
  active?: boolean;
};

type DepartmentsContextType = {
  departments: Department[];
  addDepartment: (d: Omit<Department, "id" | "staff">) => void;
  openAddDepartmentModal: boolean;
  setOpenAddDepartmentModal: (v: boolean) => void;
  addStaff: (departmentId: number, staff: Omit<Staff, "id">) => void;
  deleteDepartment: (id: number) => void;
  updateDepartment: (id: number, data: Partial<Omit<Department, "id" | "staff">>) => Promise<boolean>;
};

const DepartmentsContext = createContext<DepartmentsContextType | undefined>(undefined);

export function DepartmentsProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<number | null>(null);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          abbreviation: d.abbreviation || "",
          description: d.description || "",
          head: { name: d.head || "", email: d.email || "" },
          staff: [],
          pending: d.pending || 0,
          approved: d.approved || 0,
          rejected: d.rejected || 0,
          active: true,
        }));
        setDepartments(mapped);
      }
    } catch (err) {
      console.error("Error fetching departments from database:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const addDepartment = async (d: Omit<Department, "id" | "staff">) => {
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name,
          abbreviation: d.abbreviation,
          head: d.head.name,
          email: d.head.email
        })
      });
      if (res.ok) {
        await fetchDepartments();
        setOpenAddDepartmentModal(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create department");
      }
    } catch (err) {
      console.error("Error adding department:", err);
    }
  };

  const addStaff = (departmentId: number, staff: Omit<Staff, "id">) => {
    // Left as in-memory or can be extended when staff functionality is hooked to backend
    setDepartments((prev) => prev.map((d) => {
      if (d.id !== departmentId) return d;
      const nextId = d.staff.length ? Math.max(...d.staff.map((s) => s.id)) + 1 : 1;
      return { ...d, staff: [...d.staff, { id: nextId, ...staff }] };
    }));
  };

  const deleteDepartment = (id: number) => {
    setDepartmentToDelete(id);
  };

  const confirmDeleteDepartment = async () => {
    if (departmentToDelete !== null) {
      try {
        const res = await fetch(`/api/departments/${departmentToDelete}`, {
          method: "DELETE"
        });
        if (res.ok) {
          await fetchDepartments();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to delete department");
        }
      } catch (err) {
        console.error("Error deleting department:", err);
      } finally {
        setDepartmentToDelete(null);
      }
    }
  };

  const cancelDeleteDepartment = () => {
    setDepartmentToDelete(null);
  };

  const updateDepartment = async (id: number, data: Partial<Omit<Department, "id" | "staff">>) => {
    try {
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.abbreviation !== undefined) payload.abbreviation = data.abbreviation;
      if (data.head !== undefined) {
        if (data.head.name !== undefined) payload.head = data.head.name;
        if (data.head.email !== undefined) payload.email = data.head.email;
      }

      const res = await fetch(`/api/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchDepartments();
        return true;
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update department");
        return false;
      }
    } catch (err) {
      console.error("Error updating department:", err);
      return false;
    }
  };

  return (
    <DepartmentsContext.Provider value={{ departments, addDepartment, openAddDepartmentModal, setOpenAddDepartmentModal, addStaff, deleteDepartment, updateDepartment }}>
      {children}
      {departmentToDelete !== null && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={cancelDeleteDepartment}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-sm p-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-md">
              <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface">Delete Department</h3>
            </div>
            <p className="font-body-md text-body-md text-secondary mb-lg">
              Are you sure you want to delete this department? This action cannot be undone.
            </p>
            <div className="flex gap-sm justify-end">
              <button onClick={cancelDeleteDepartment} className="px-4 py-2 rounded-lg font-label-md text-label-md text-secondary hover:bg-surface-container-low transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteDepartment} className="px-4 py-2 rounded-lg font-label-md text-label-md bg-error text-on-error hover:opacity-90 transition-opacity shadow-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DepartmentsContext.Provider>
  );
}

export function useDepartments() {
  const ctx = useContext(DepartmentsContext);
  if (!ctx) throw new Error("useDepartments must be used within DepartmentsProvider");
  return ctx;
}

export type { Department, Staff };
