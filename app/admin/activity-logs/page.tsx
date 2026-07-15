"use client";

import { useState } from "react";
import { Search, Calendar, Filter, Download, History, ShieldAlert, Shield, ChevronLeft, ChevronRight, CheckCircle2, Lock, ExternalLink, RefreshCw, Edit } from "lucide-react";

export default function ActivityLogsPage() {
  const [search, setSearch] = useState("");
  
  // Dummy data based on the stitch_ui mock
  const logs = [
    {
      id: 1,
      date: "Oct 31, 2023",
      time: "14:22:45 UTC",
      user: "Dr. Eleanor Vance",
      role: "System Admin",
      initials: "EV",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2H_MR9ElyyuxNVSTFtys0kg2RuZtjyiWH7LuwgyoV0V1lQQ_mINt-R1rSyM6jZpe-Pi_gCOa9rG-rhoHuV2KjcAZtCj_XwijxWLudBNfWpOd0QVEkmNbknWHRo1tQY9pEdCkWyzJ2iKhG-Chk786GsRusZsiYHb003Nu7kxLM4zgXKjk86SzCk4lqDA0lPsAKDb6rObr_ekCL5BjjfNzHC4UXMwigZqWn3TaAGT0MaBPSmvO4qLfBow",
      action: "Office Added",
      actionType: "system",
      target: "Financial Aid Office",
      ip: "192.168.1.104"
    },
    {
      id: 2,
      date: "Oct 31, 2023",
      time: "13:10:12 UTC",
      user: "Robert Kaine",
      role: "Registrar Staff",
      initials: "RK",
      action: "Requirement Updated",
      actionType: "update",
      target: "Library Clearance Ver. 2.1",
      ip: "104.22.19.45"
    },
    {
      id: 3,
      date: "Oct 31, 2023",
      time: "11:05:59 UTC",
      user: "Marcus Thorne",
      role: "Office Head",
      initials: "MT",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8LVTrlMoRKd5bCrCUGEh-IzSWMC7b9aTAaGwAmjjb0T3Ig4YnNOACy_ACKfNIzFse0s90wl7qH5QOSqXmfgZXuikx4xnKkpK8BUSsa7grIYF3KFiu79ukwgsqZ2iwXB2xsX47H3S6k4gwuCApFBmeg64F9vlnKDUWS5tqa2ZQLTzvLpiR36SH5FFMnnC21mr876yEiwTjJE7MutmupZE9Lm_KNTmgjLtg37UfsHnvNCjdRhb95QZb7w",
      action: "Status Change",
      actionType: "status",
      target: "Student #2023-112: CLEARED",
      ip: "45.112.8.201"
    },
    {
      id: 4,
      date: "Oct 31, 2023",
      time: "09:45:30 UTC",
      user: "System Kernel",
      role: "Automated Script",
      initials: "SK",
      isSystem: true,
      action: "Password Reset",
      actionType: "security",
      target: "User: s_miller@uni.edu",
      ip: "::ffff:127.0.0.1"
    },
    {
      id: 5,
      date: "Oct 31, 2023",
      time: "08:12:11 UTC",
      user: "Jane Appleseed",
      role: "Admissions Staff",
      initials: "JA",
      action: "User Provisioned",
      actionType: "create",
      target: "New Staff ID: 220941",
      ip: "172.16.254.1"
    }
  ];

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(search.toLowerCase()) || 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header & Summary Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Audit Trail</h2>
          <p className="text-secondary font-body-md">Comprehensive immutable log of all system-wide administrative changes.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">24h Logs</p>
              <p className="text-title-md font-bold text-on-surface">1,284</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Unique Users</p>
              <p className="text-title-md font-bold text-on-surface">42</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex flex-col gap-1 w-full md:w-auto md:flex-1">
          <label className="text-sm font-medium text-secondary">Search</label>
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
            <Search size={18} className="text-secondary shrink-0" />
            <input 
              className="bg-transparent border-none p-0 text-sm w-full focus:ring-0" 
              type="text" 
              placeholder="Search audit logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-secondary">Date Range</label>
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30">
            <Calendar size={18} className="text-secondary" />
            <input className="bg-transparent border-none p-0 text-sm w-48 focus:ring-0" type="text" defaultValue="Oct 24, 2023 - Oct 31, 2023" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-secondary">User Role</label>
          <select className="bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30 text-sm min-w-[160px] focus:ring-primary/20">
            <option>All Roles</option>
            <option>System Admin</option>
            <option>Office Head</option>
            <option>Registrar</option>
            <option>Staff</option>
          </select>
        </div>
        <div className="flex items-end h-full pt-6">
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-bold transition-all hover:bg-primary-dark active:scale-95 shadow-lg shadow-primary/20">
            <Filter size={18} />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-surface-container flex justify-between items-center">
          <h3 className="font-title-md text-title-md text-on-surface flex items-center gap-2 font-bold">
            Activity History
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">LIVE</span>
          </h3>
          <button className="text-primary font-bold text-sm hover:underline flex items-center gap-1.5">
            <Download size={16} />
            Export to CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low text-secondary text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Timestamp</th>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Action Type</th>
                <th className="px-6 py-4 font-bold">Target Entity</th>
                <th className="px-6 py-4 font-bold text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-medium text-sm">{log.date}</span>
                      <span className="text-secondary text-xs mt-0.5">{log.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {log.isSystem ? (
                        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                          <ShieldAlert size={16} />
                        </div>
                      ) : log.avatar ? (
                        <img className="w-9 h-9 rounded-full object-cover border border-surface-container shrink-0" src={log.avatar} alt={log.user} />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                          {log.initials}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-on-surface font-semibold text-sm truncate">{log.user}</span>
                        <span className="text-secondary text-[10px] font-bold uppercase tracking-tight truncate">{log.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 ${log.actionType === 'security' ? 'text-red-600' : 'text-on-surface'}`}>
                      {log.actionType === 'system' && <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
                      {log.actionType === 'status' && <div className="w-2 h-2 rounded-full bg-secondary"></div>}
                      {log.actionType === 'update' && <Edit size={16} className="text-secondary" />}
                      {log.actionType === 'security' && <Lock size={16} />}
                      {log.actionType === 'create' && <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>}
                      
                      <span className="font-medium text-sm">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-surface-container-high rounded text-sm text-on-surface font-medium">
                      {log.target}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-secondary font-mono text-xs">
                    {log.ip}
                  </td>
                </tr>
              ))}
              
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-secondary">
                    No logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="mt-auto p-6 bg-surface-container-low border-t border-surface-container flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary">
            Showing <span className="font-bold text-on-surface">1 - 5</span> of <span className="font-bold text-on-surface">1,284</span> entries
          </p>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded hover:bg-surface-container-highest transition-colors text-secondary disabled:opacity-30" disabled>
              <ChevronLeft size={18} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white font-bold text-sm shadow-md">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-highest transition-colors text-secondary text-sm">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-highest transition-colors text-secondary text-sm">3</button>
            <span className="px-1 text-secondary">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container-highest transition-colors text-secondary text-sm">257</button>
            <button className="p-2 rounded hover:bg-surface-container-highest transition-colors text-secondary">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Integrity Verification Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
        <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
            <CheckCircle2 size={32} className="text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="font-title-md text-on-surface font-bold">Log Chain Integrity</h4>
            <p className="text-sm text-secondary">Audit logs are cryptographically hashed and linked. This prevents retroactive manipulation of the trail. System verification was last performed 2 minutes ago.</p>
            <button className="text-[12px] font-bold text-primary flex items-center gap-1 mt-2 uppercase tracking-widest hover:underline pt-1">
              <RefreshCw size={12} />
              Verify Signature Chain
            </button>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-sm relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-all">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield size={120} />
          </div>
          <h4 className="font-title-md text-on-surface mb-2 font-bold">Retention Policy</h4>
          <p className="text-sm text-secondary mb-4 relative z-10">Logs are retained for 7 years according to University Administrative Regulation §4.2.</p>
          <span className="text-primary font-bold text-sm flex items-center gap-1.5 relative z-10">
            View Policy Document
            <ExternalLink size={16} />
          </span>
        </div>
      </div>
    </div>
  );
}
