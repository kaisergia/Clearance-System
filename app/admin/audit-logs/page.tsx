"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Search, Filter, RefreshCw, User, Calendar, History, AlertCircle, CheckCircle2 } from "lucide-react";

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

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/audit-logs?limit=150`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (entityFilter !== "all") url += `&entityType=${encodeURIComponent(entityFilter)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, entityFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes("CLEAR")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CLEARED
        </span>
      );
    }
    if (action.includes("DEFICIENCY") || action.includes("UNCLEAR")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" /> DEFICIENCY
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
        <History className="w-3 h-3 text-blue-600" /> {action}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Institutional Audit Trail & Activity Logs</h1>
            <p className="text-xs text-gray-500">Official timeline of clearance actions, signatory approvals, and deficiency records</p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, student ID, name, or remark..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 outline-none font-medium cursor-pointer"
          >
            <option value="all">All Entity Portals</option>
            <option value="office">Head Offices</option>
            <option value="department">Departments</option>
            <option value="org">Organizations / Clubs</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor (Evaluator)</th>
                <th className="px-5 py-3.5 text-center">Action</th>
                <th className="px-5 py-3.5">Target Student</th>
                <th className="px-5 py-3.5">Entity / Office</th>
                <th className="px-5 py-3.5">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Loading audit trail logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No activity audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-gray-500">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900">{log.actorName}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">{log.actorRole}</div>
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.targetStudentId ? (
                        <div>
                          <span className="font-bold text-gray-900">{log.targetStudentName || "Student"}</span>
                          <div className="font-mono text-[11px] text-slate-500">{log.targetStudentId}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {log.entityName || log.entityType || "System"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-sm leading-relaxed">
                      {log.details || log.action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
