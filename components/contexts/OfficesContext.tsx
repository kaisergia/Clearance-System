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

  return (
    <OfficesContext.Provider value={{ offices, addOffice, openAddOfficeModal, setOpenAddOfficeModal, addStaff }}>
      {children}
    </OfficesContext.Provider>
  );
}

export function useOffices() {
  const ctx = useContext(OfficesContext);
  if (!ctx) throw new Error("useOffices must be used within OfficesProvider");
  return ctx;
}

export type { Office, Staff };
