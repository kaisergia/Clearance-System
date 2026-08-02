"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, History, Clock, User, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

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

interface StudentAuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
}

export function StudentAuditTrailModal({
  isOpen,
  onClose,
  studentId,
  studentName = "Student",
}: StudentAuditTrailModalProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/audit-logs?studentId=${encodeURIComponent(studentId)}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isOpen, studentId]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-snug">Clearance Audit Trail History</h3>
              <p className="text-xs text-slate-300">
                Official authorization timeline for <span className="text-amber-300 font-semibold">{studentName} ({studentId})</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body — Audit Timeline */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-gray-500 font-medium">
              Loading audit trail records...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-xs text-gray-400">
              <History className="w-10 h-10 text-gray-300 mx-auto mb-2 opacity-50" />
              No audit log entries recorded yet for this constituent.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-slate-900 ring-4 ring-white shadow-xs" />

                  <div className="bg-slate-50/80 hover:bg-slate-100/60 p-4 rounded-xl border border-slate-200 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-600" />
                          {log.actorName}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                          {log.actorRole}
                        </span>
                      </div>
                      {getActionBadge(log.action)}
                    </div>

                    <p className="text-xs text-gray-700 font-medium leading-relaxed mb-2">
                      {log.details || log.action}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {log.entityName && (
                        <span>• Signatory: <strong className="text-gray-600">{log.entityName}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Official Institutional Record • Immutable Audit Trail</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
