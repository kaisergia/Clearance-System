"use client";

import { useRouter } from "next/navigation";
import { useOffices } from "@/components/contexts/OfficesContext";

export default function HeadOfficeAccountsPage() {
  const router = useRouter();
  const { offices, setOpenAddOfficeModal } = useOffices();

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Head Office Accounts</h2>
          <p className="font-body-md text-body-md text-secondary">Office directory and staff management.</p>
        </div>
        <button
          onClick={() => setOpenAddOfficeModal(true)}
          className="h-10 px-5 inline-flex items-center gap-2 rounded-lg bg-brand-red text-white hover:bg-primary transition-all font-label-md text-label-md shadow-sm btn-hover"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Office
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface border-b border-surface-container-high">
                {["Office Name", "Office Head", "# Staff", "Actions"].map((h) => (
                  <th key={h} className={`px-6 py-4 font-label-md text-label-md text-secondary uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
              {offices.map((o) => (
                <tr key={o.id} className="group hover:bg-surface-bright transition-colors cursor-pointer" onClick={() => router.push(`/admin/offices/${o.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs shrink-0">{o.name.split(" ").map(s=>s[0]).slice(0,2).join("")}</div>
                      <span className="font-medium text-on-surface">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-secondary">{o.head?.name}{o.head?.email ? ` • ${o.head.email}` : ""}</td>
                  <td className="px-6 py-4">{o.staff.length}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e)=>{e.stopPropagation(); router.push(`/admin/offices/${o.id}`);}} className="p-1.5 text-secondary hover:text-primary rounded hover:bg-surface-container-low transition-colors" title="Open">
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
