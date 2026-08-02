"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCircle2, AlertTriangle, Clock, MessageSquare, X, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: "evaluation" | "deadline_warning" | "announcement" | "general" | string;
  status: "unread" | "read";
  readAt?: string | null;
  linkUrl?: string | null;
  createdAt: string;
}

interface StudentNotificationCenterProps {
  studentId?: string;
  align?: "right" | "left";
}

export function StudentNotificationCenter({ studentId: propStudentId, align = "right" }: StudentNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread" | "evaluation" | "deadline">("all");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [activeStudentId, setActiveStudentId] = useState<string>(propStudentId || "");

  useEffect(() => {
    if (propStudentId) {
      setActiveStudentId(propStudentId);
    } else {
      const stored = localStorage.getItem("activeStudentId");
      if (stored) setActiveStudentId(stored);
    }
  }, [propStudentId]);

  const fetchNotifications = async () => {
    if (!activeStudentId) return;
    try {
      const res = await fetch(`/api/notifications?studentId=${encodeURIComponent(activeStudentId)}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [activeStudentId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!activeStudentId || unreadCount === 0) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: activeStudentId, markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return n.status === "unread";
    if (filter === "evaluation") return n.type === "evaluation";
    if (filter === "deadline") return n.type === "deadline_warning";
    return true;
  });

  const formatTime = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer outline-none"
        title="Notifications & Evaluation Alerts"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#c41e2a] text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown Panel */}
      {isOpen && (
        <div className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-white">Clearance Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === "all" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              All ({notifications.length})
            </button>

            <button
              onClick={() => setFilter("unread")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === "unread" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Unread ({unreadCount})
            </button>

            <button
              onClick={() => setFilter("evaluation")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === "evaluation" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Evaluations
            </button>

            <button
              onClick={() => setFilter("deadline")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === "deadline" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Deadlines
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                No notifications found.
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = notif.status === "unread";
                const isApproved = notif.title.includes("APPROVED") || notif.title.includes("✅");
                const isRejected = notif.title.includes("REJECTED") || notif.title.includes("⚠️");
                const isDeadline = notif.type === "deadline_warning" || notif.title.includes("Deadline");

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (isUnread) handleMarkAsRead(notif.id);
                    }}
                    className={`p-3.5 transition-colors relative flex gap-3 items-start ${
                      isUnread ? "bg-amber-50/30" : "bg-white hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 animate-pulse" />
                    )}

                    {/* Notification Icon */}
                    <div className="shrink-0 mt-0.5">
                      {isApproved && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {isRejected && (
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {isDeadline && !isApproved && !isRejected && (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      {!isApproved && !isRejected && !isDeadline && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="font-bold text-xs text-gray-900 truncate leading-snug">{notif.title}</h4>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono">{formatTime(notif.createdAt)}</span>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>

                      {/* Action / Navigation Link */}
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          href={notif.linkUrl || "/student/clearance-status"}
                          onClick={() => setIsOpen(false)}
                          className="text-[11px] font-bold text-[#c41e2a] hover:underline inline-flex items-center gap-1"
                        >
                          <span>{isRejected ? "Fix Submission & Re-evaluate" : "View Clearance Status"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
