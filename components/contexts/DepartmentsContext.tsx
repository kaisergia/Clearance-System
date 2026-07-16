"use client";

import React, { createContext, useContext, useState } from "react";
import { mockDepartments as rawMockDepartments } from "@/mock/mockData";

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
};

const DepartmentsContext = createContext<DepartmentsContextType | undefined>(undefined);

function mapInitial() {
  return rawMockDepartments.map((d) => ({
    id: d.id,
    name: d.name,
    abbreviation: (d as any).abbreviation || "",
    description: (d as any).description || "",
    head: { name: (d as any).head || "", email: (d as any).email || "" },
    staff: [],
    pending: (d as any).pending || 0,
    approved: (d as any).approved || 0,
    rejected: (d as any).rejected || 0,
    active: true,
  }));
}

export function DepartmentsProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>(mapInitial);
  const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<number | null>(null);

  const addDepartment = (d: Omit<Department, "id" | "staff">) => {
    setDepartments((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      const newD: Department = { id: nextId, staff: [], ...d } as Department;
      return [...prev, newD];
    });
    setOpenAddDepartmentModal(false);
  };

  const addStaff = (departmentId: number, staff: Omit<Staff, "id">) => {
    setDepartments((prev) => prev.map((d) => {
      if (d.id !== departmentId) return d;
      const nextId = d.staff.length ? Math.max(...d.staff.map((s) => s.id)) + 1 : 1;
      return { ...d, staff: [...d.staff, { id: nextId, ...staff }] };
    }));
  };

  const deleteDepartment = (id: number) => {
    setDepartmentToDelete(id);
  };

  const confirmDeleteDepartment = () => {
    if (departmentToDelete !== null) {
      setDepartments((prev) => prev.filter((d) => d.id !== departmentToDelete));
      setDepartmentToDelete(null);
    }
  };

  const cancelDeleteDepartment = () => {
    setDepartmentToDelete(null);
  };

  return (
    <DepartmentsContext.Provider value={{ departments, addDepartment, openAddDepartmentModal, setOpenAddDepartmentModal, addStaff, deleteDepartment }}>
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
