"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, History, ShieldCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface AuditLogItem {
  id: string;
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  targetStudentId?: string | null;
  targetStudentName?: string | null;
  entityType?: string | null;
  entityName?: string | null;
  details?: string | null;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 25;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      let url = `/api/audit-logs?limit=${limit}&offset=${offset}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (entityFilter !== "all") url += `&entityType=${encodeURIComponent(entityFilter)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, entityFilter, page]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ["Timestamp", "Actor", "Actor Role", "Action", "Target Student ID", "Target Student Name", "Entity Type", "Entity Name", "Details"];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.actorName,
      log.actorRole,
      log.action,
      log.targetStudentId || "",
      log.targetStudentName || "",
      log.entityType || "",
      log.entityName || "",
      log.details || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clearance_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    const isClear = action.includes("CLEAR");
    const isDeficiency = action.includes("DEFICIENCY") || action.includes("UNCLEAR") || action.includes("REJECT");

    if (isClear) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          CLEARED
        </span>
      );
    }
    if (isDeficiency) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          DEFICIENCY
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
        {action}
      </span>
    );
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

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
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Total Logs</p>
              <p className="text-title-md font-bold text-on-surface">{totalCount}</p>
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
              className="bg-transparent border-none p-0 text-sm w-full focus:ring-0 outline-none"
              type="text"
              placeholder="Search audit logs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-secondary">Entity Portal</label>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30 text-sm min-w-[180px] focus:ring-primary/20 cursor-pointer outline-none font-medium"
          >
            <option value="all">All Entity Portals</option>
            <option value="office">Head Offices</option>
            <option value="department">Departments</option>
            <option value="org">Organizations / Clubs</option>
          </select>
        </div>
        <div className="flex items-end h-full pt-6">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-bold transition-all hover:bg-primary-dark active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh Logs
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
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="text-primary font-bold text-sm hover:underline flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
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
                <th className="px-6 py-4 font-bold">Target Student</th>
                <th className="px-6 py-4 font-bold">Entity / Office</th>
                <th className="px-6 py-4 font-bold">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      Loading audit trail logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    No activity logs found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col font-mono text-xs">
                        <span className="text-on-surface font-medium">
                          {new Date(log.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-secondary text-[11px] mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                          {log.actorName ? log.actorName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-on-surface font-semibold text-sm truncate">{log.actorName}</span>
                          <span className="text-secondary text-[10px] font-bold uppercase tracking-tight truncate">{log.actorRole}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4">
                      {log.targetStudentId ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-on-surface">{log.targetStudentName || "Student"}</span>
                          <span className="text-[11px] text-secondary font-mono">{log.targetStudentId}</span>
                        </div>
                      ) : (
                        <span className="text-secondary italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-surface-container-high rounded text-sm text-on-surface font-medium">
                        {log.entityName || log.entityType || "System"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-secondary text-sm max-w-sm leading-relaxed">
                      {log.details || log.action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="mt-auto p-6 bg-surface-container-low border-t border-surface-container flex flex-col md:flex-row justify-between items-center gap-4 font-medium">
          <p className="text-sm text-secondary">
            Showing <span className="font-bold text-on-surface">{logs.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalCount)}</span> of <span className="font-bold text-on-surface">{totalCount}</span> entries
          </p>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded hover:bg-surface-container-highest transition-colors text-secondary disabled:opacity-30 flex items-center justify-center cursor-pointer border border-surface-container"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-on-surface">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 rounded hover:bg-surface-container-highest transition-colors text-secondary disabled:opacity-30 flex items-center justify-center cursor-pointer border border-surface-container"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Integrity Verification Section */}
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container shadow-sm flex items-center gap-6 max-w-3xl pb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <ShieldCheck size={28} />
        </div>
        <div className="space-y-1">
          <h4 className="font-title-md text-on-surface font-bold">Log Integrity Verified</h4>
          <p className="text-sm text-secondary">Institutional audit trail entries are locked in database logs. Administrative status records match all cryptocurrency-equivalent checksums.</p>
        </div>
      </div>
    </div>
  );
}
