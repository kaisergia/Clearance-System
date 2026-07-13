"use client";

import React, { createContext, useContext, useState } from "react";
import { mockOffices as rawMockOffices } from "@/mock/mockData";

type Staff = { id: number; name: string; email: string; role: string; status: string };
type Office = {
  id: number;
  name: string;
  description?: string;
  head: { name: string; email?: string; contact?: string };
  staff: Staff[];
  pending?: number;
  approved?: number;
  rejected?: number;
  active?: boolean;
};

type OfficesContextType = {
  offices: Office[];
  addOffice: (o: Omit<Office, "id" | "staff">) => void;
  openAddOfficeModal: boolean;
  setOpenAddOfficeModal: (v: boolean) => void;
  addStaff: (officeId: number, staff: Omit<Staff, "id">) => void;
  deleteOffice: (id: number) => void;
};

const OfficesContext = createContext<OfficesContextType | undefined>(undefined);

function mapInitial() {
  return rawMockOffices.map((o) => ({
    id: o.id,
    name: o.name,
    description: (o as any).description || "",
    head: { name: (o as any).head || "", email: (o as any).email || "" },
    staff: [],
    pending: (o as any).pending,
    approved: (o as any).approved,
    rejected: (o as any).rejected,
    active: true,
  }));
}

export function OfficesProvider({ children }: { children: React.ReactNode }) {
  const [offices, setOffices] = useState<Office[]>(mapInitial);
  const [openAddOfficeModal, setOpenAddOfficeModal] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState<number | null>(null);

  const addOffice = (o: Omit<Office, "id" | "staff">) => {
    setOffices((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      const newO: Office = { id: nextId, staff: [], ...o } as Office;
      return [...prev, newO];
    });
    setOpenAddOfficeModal(false);
  };

  const addStaff = (officeId: number, staff: Omit<Staff, "id">) => {
    setOffices((prev) => prev.map((o) => {
      if (o.id !== officeId) return o;
      const nextId = o.staff.length ? Math.max(...o.staff.map((s) => s.id)) + 1 : 1;
      return { ...o, staff: [...o.staff, { id: nextId, ...staff }] };
    }));
  };

  const deleteOffice = (id: number) => {
    setOfficeToDelete(id);
  };

  const confirmDeleteOffice = () => {
    if (officeToDelete !== null) {
      setOffices((prev) => prev.filter((o) => o.id !== officeToDelete));
      setOfficeToDelete(null);
    }
  };

  const cancelDeleteOffice = () => {
    setOfficeToDelete(null);
  };

  return (
    <OfficesContext.Provider value={{ offices, addOffice, openAddOfficeModal, setOpenAddOfficeModal, addStaff, deleteOffice }}>
      {children}
      {officeToDelete !== null && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={cancelDeleteOffice}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-sm p-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-md">
              <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface">Delete Office</h3>
            </div>
            <p className="font-body-md text-body-md text-secondary mb-lg">
              Are you sure you want to delete this office? This action cannot be undone.
            </p>
            <div className="flex gap-sm justify-end">
              <button onClick={cancelDeleteOffice} className="px-4 py-2 rounded-lg font-label-md text-label-md text-secondary hover:bg-surface-container-low transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteOffice} className="px-4 py-2 rounded-lg font-label-md text-label-md bg-error text-on-error hover:opacity-90 transition-opacity shadow-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </OfficesContext.Provider>
  );
}

export function useOffices() {
  const ctx = useContext(OfficesContext);
  if (!ctx) throw new Error("useOffices must be used within OfficesProvider");
  return ctx;
}

export type { Office, Staff };
