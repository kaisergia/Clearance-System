"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, Edit2, X, Megaphone, Globe, Building2, Image as ImageIcon, Link as LinkIcon, Upload, Check } from "lucide-react";
import Image from "next/image";
import { compressImage } from "@/lib/imageUtils";

type Priority = "low" | "normal" | "high" | "urgent";

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: Priority;
  isSystemWide: boolean;
  showOnLandingPage: Boolean;
  isActive: boolean;
  eventDate: string | null;
  eventLocation: string | null;
  expiresAt: string | null;
  imageUrls: string[] | null;
  linkLabel: string | null;
  linkUrl: string | null;
  createdAt: string;
  officeId: number | null;
  departmentId: number | null;
  orgId: number | null;
}

interface Entity { id: number; name: string; }

interface AnnouncementManagerProps {
  role: "admin" | "head_office" | "department" | "org";
  entityId?: number | null;
  title?: string;
  subtitle?: string;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgent",
  high: "Important",
  normal: "Normal",
  low: "Notice",
};
const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  normal: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Composer / Edit Modal ─────────────────────────────────────────────────────
function AnnouncementForm({
  role,
  entityId,
  initial,
  offices,
  departments,
  orgs,
  onSave,
  onClose,
}: {
  role: "admin" | "head_office" | "department" | "org";
  entityId?: number | null;
  initial?: Partial<Announcement>;
  offices: Entity[];
  departments: Entity[];
  orgs: Entity[];
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "normal");
  const [isSystemWide, setIsSystemWide] = useState(initial?.isSystemWide ?? (role === "admin"));
  const [showOnLandingPage, setShowOnLandingPage] = useState(initial?.showOnLandingPage ?? false);
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? "");
  const [eventLocation, setEventLocation] = useState(initial?.eventLocation ?? "");
  const [expiresAt, setExpiresAt] = useState(
    initial?.expiresAt ? new Date(initial.expiresAt).toISOString().substring(0, 10) : ""
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    Array.isArray(initial?.imageUrls) ? initial.imageUrls : []
  );
  const [linkLabel, setLinkLabel] = useState(initial?.linkLabel ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");

  const [officeId, setOfficeId] = useState<string>(
    role === "head_office" && entityId ? entityId.toString() : (initial?.officeId?.toString() ?? "")
  );
  const [departmentId, setDepartmentId] = useState<string>(
    role === "department" && entityId ? entityId.toString() : (initial?.departmentId?.toString() ?? "")
  );
  const [orgId, setOrgId] = useState<string>(
    role === "org" && entityId ? entityId.toString() : (initial?.orgId?.toString() ?? "")
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 4) {
      setError("Maximum 4 images allowed per announcement.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("folder", "announcements");

      const compressedFiles = await Promise.all(
        Array.from(files).map((file) => compressImage(file))
      );

      compressedFiles.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Image upload failed.");

      const data = await res.json();
      if (data.urls) {
        setImageUrls((prev) => [...prev, ...data.urls].slice(0, 4));
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image(s).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        priority,
        isSystemWide: role === "admin" ? isSystemWide : false,
        showOnLandingPage,
        eventDate: eventDate || null,
        eventLocation: eventLocation || null,
        expiresAt: expiresAt || null,
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
        linkLabel: linkLabel.trim() || null,
        linkUrl: linkUrl.trim() || null,
        officeId: officeId ? parseInt(officeId, 10) : null,
        departmentId: departmentId ? parseInt(departmentId, 10) : null,
        orgId: orgId ? parseInt(orgId, 10) : null,
      });
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-[#c41e2a] focus:ring-1 focus:ring-[#c41e2a]/20 outline-none text-sm transition-all";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {initial?.id ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className={labelCls}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Announcement title…" />
          </div>

          {/* Content */}
          <div>
            <label className={labelCls}>Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${inputCls} min-h-[120px] resize-y`}
              placeholder="Write the full announcement here…"
            />
          </div>

          {/* Images Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Attached Images (Up to 4)</label>
              <span className="text-xs text-gray-400">{imageUrls.length}/4</span>
            </div>

            {/* Preview Grid */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-3">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imageUrls.length < 4 && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-[#c41e2a] rounded-xl flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#c41e2a] bg-gray-50/50 hover:bg-red-50/30 transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading images…" : "Upload Images (PNG, JPG)"}
                </button>
              </div>
            )}
          </div>

          {/* Optional Link fields */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <label className={labelCls}>Link Label (Optional)</label>
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                className={inputCls}
                placeholder="e.g. Google Form / Registration"
              />
            </div>
            <div>
              <label className={labelCls}>Link URL (Optional)</label>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Priority & Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputCls}>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 Important</option>
                <option value="normal">🔵 Normal</option>
                <option value="low">⚪ Notice</option>
              </select>
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              {role === "admin" && (
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setIsSystemWide(!isSystemWide)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${isSystemWide ? "bg-[#c41e2a]" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isSystemWide ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">System-wide post</span>
                </label>
              )}

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setShowOnLandingPage(!showOnLandingPage)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${showOnLandingPage ? "bg-[#c41e2a]" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showOnLandingPage ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <span className="text-xs font-medium text-gray-700">Show on public login page</span>
              </label>
            </div>
          </div>

          {/* Admin Entity Scope dropdowns */}
          {role === "admin" && !isSystemWide && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity Scope (Select one)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Office</label>
                  <select value={officeId} onChange={(e) => { setOfficeId(e.target.value); setDepartmentId(""); setOrgId(""); }} className={inputCls}>
                    <option value="">— None —</option>
                    {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Department</label>
                  <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setOfficeId(""); setOrgId(""); }} className={inputCls}>
                    <option value="">— None —</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Organization</label>
                  <select value={orgId} onChange={(e) => { setOrgId(e.target.value); setOfficeId(""); setDepartmentId(""); }} className={inputCls}>
                    <option value="">— None —</option>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Event details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Event Date (Optional)</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Event Location (Optional)</label>
              <input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className={inputCls} placeholder="e.g. CJC Gym" />
            </div>
          </div>

          {/* Expires at */}
          <div>
            <label className={labelCls}>Auto-Expire Date (Optional)</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Hidden from student feed after this date. Leave blank to keep permanently.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="px-6 py-2.5 rounded-lg bg-[#c41e2a] hover:bg-[#9a1820] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : initial?.id ? "Save Changes" : "Post Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Announcement Manager Component ───────────────────────────────────────
export function AnnouncementManager({
  role,
  entityId,
  title = "Announcements",
  subtitle = "Manage announcements and bulletin posts.",
}: AnnouncementManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [offices, setOffices] = useState<Entity[]>([]);
  const [departments, setDepartments] = useState<Entity[]>([]);
  const [orgs, setOrgs] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<"active" | "archived" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/announcements";
      if (role === "admin") {
        url = "/api/announcements?scope=all";
      } else if (role === "head_office" && entityId) {
        url = `/api/announcements?officeId=${entityId}`;
      } else if (role === "department" && entityId) {
        url = `/api/announcements?departmentId=${entityId}`;
      } else if (role === "org" && entityId) {
        url = `/api/announcements?orgId=${entityId}`;
      }

      const [annRes, offRes, deptRes, orgRes] = await Promise.all([
        fetch(url),
        role === "admin" ? fetch("/api/offices") : Promise.resolve(null),
        role === "admin" ? fetch("/api/departments") : Promise.resolve(null),
        role === "admin" ? fetch("/api/orgs") : Promise.resolve(null),
      ]);

      const annData = annRes ? await annRes.json() : [];
      const offData = offRes && offRes.ok ? await offRes.json() : [];
      const deptData = deptRes && deptRes.ok ? await deptRes.json() : [];
      const orgData = orgRes && orgRes.ok ? await orgRes.json() : [];

      const list = Array.isArray(annData) ? annData : (annData.announcements ?? []);
      setAnnouncements(list);
      setOffices(Array.isArray(offData) ? offData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setOrgs(Array.isArray(orgData) ? orgData : []);
    } catch (e) {
      console.error("Failed to load announcements:", e);
    } finally {
      setLoading(false);
    }
  }, [role, entityId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || "Failed to create announcement");
    }
    await load();
  };

  const handleUpdate = async (data: any) => {
    if (!editing) return;
    const res = await fetch(`/api/announcements/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || "Failed to update announcement");
    }
    await load();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setDeleteId(null);
    await load();
  };

  const handleToggleArchive = async (a: Announcement, shouldArchive: boolean) => {
    await fetch(`/api/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !shouldArchive }),
    });
    await load();
  };

  // Expiration Checker
  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    const expDate = new Date(expiresAt);
    if (isNaN(expDate.getTime())) return false;
    expDate.setHours(23, 59, 59, 999);
    return expDate.getTime() < Date.now();
  };

  // Ownership permission checker: Admin can manage all; staff can only manage their own entity's posts
  const canManage = (a: Announcement) => {
    if (role === "admin") return true;
    if (entityId == null) return false;
    const numericEntityId = Number(entityId);
    if (role === "head_office" && a.officeId === numericEntityId) return true;
    if (role === "department" && a.departmentId === numericEntityId) return true;
    if (role === "org" && a.orgId === numericEntityId) return true;
    return false;
  };

  // Categorize Lists
  const activeAnnouncements = announcements.filter(
    (a) => a.isActive && !isExpired(a.expiresAt)
  );
  const archivedAnnouncements = announcements.filter(
    (a) => !a.isActive || isExpired(a.expiresAt)
  );

  // Apply tab filter & search
  const currentList = announcements.filter((a) => {
    const expired = isExpired(a.expiresAt);
    const isArchivedOrExpired = !a.isActive || expired;
    
    // Tab filter
    if (activeTab === "active" && isArchivedOrExpired) return false;
    if (activeTab === "archived" && !isArchivedOrExpired) return false;

    // Priority filter
    if (selectedPriority !== "all" && a.priority !== selectedPriority) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchContent = a.content.toLowerCase().includes(q);
      const matchLocation = a.eventLocation?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchLocation) return false;
    }

    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#c41e2a]" />
            {title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-[#c41e2a] hover:bg-[#9a1820] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 mb-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          {/* Active / Archived / All View Tabs */}
          <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-xl">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "active"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Active Posts
              <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-600 font-bold">
                {activeAnnouncements.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("archived")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "archived"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Archived & Expired
              <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-600 font-bold">
                {archivedAnnouncements.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Announcements
              <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-600 font-bold">
                {announcements.length}
              </span>
            </button>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 outline-none focus:border-[#c41e2a]"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">Important</option>
              <option value="normal">Normal</option>
              <option value="low">Notice</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements by title, content, or event location…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 bg-gray-50/50 focus:bg-white focus:border-[#c41e2a] focus:ring-1 focus:ring-[#c41e2a]/20 outline-none transition-all"
          />
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center shadow-sm">
          <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">
            {activeTab === "active"
              ? "No active announcements"
              : activeTab === "archived"
              ? "No archived or expired announcements"
              : "No announcements found"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery
              ? "Try adjusting your search query or filter."
              : activeTab === "active"
              ? "New announcements you post will appear here."
              : "Expired announcements or hidden posts will automatically show up in this archive view."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((a) => {
            const expired = isExpired(a.expiresAt);
            const isArchivedState = !a.isActive || expired;

            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 items-start transition-all ${
                  isArchivedState ? "border-amber-100 bg-amber-50/20" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Priority badge */}
                <span className={`flex-shrink-0 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${PRIORITY_COLORS[a.priority]}`}>
                  {PRIORITY_LABELS[a.priority]}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{a.title}</h3>

                    {/* Status Badges */}
                    {a.isActive && !expired && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        🟢 Active
                      </span>
                    )}

                    {!a.isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 border border-gray-300 px-2 py-0.5 rounded-full font-bold">
                        📁 Archived
                      </span>
                    )}

                    {expired && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                        ⏰ Expired
                      </span>
                    )}

                    {a.showOnLandingPage && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                        <Globe className="w-3 h-3" /> Landing Page
                      </span>
                    )}
                    {a.isSystemWide && (
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                        System-wide
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-2">{a.content}</p>

                  {/* Attached image preview icons */}
                  {Array.isArray(a.imageUrls) && a.imageUrls.length > 0 && (
                    <div className="flex gap-2 my-2">
                      {a.imageUrls.map((img, idx) => (
                        <div key={idx} className="w-14 h-14 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shadow-xs">
                          <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Link preview */}
                  {a.linkUrl && (
                    <a
                      href={a.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#c41e2a] hover:underline mb-2"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {a.linkLabel || a.linkUrl}
                    </a>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium">
                    <span>Posted {formatDate(a.createdAt)}</span>
                    {a.eventDate && <span>📅 Event: {a.eventDate}</span>}
                    {a.eventLocation && <span>📍 {a.eventLocation}</span>}
                    {a.expiresAt && (
                      <span className={expired ? "text-amber-700 font-bold" : ""}>
                        ⏱ {expired ? "Expired on" : "Expires"}: {formatDate(a.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canManage(a) ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Archive / Restore Button */}
                    <button
                      onClick={() => handleToggleArchive(a, a.isActive)}
                      title={a.isActive ? "Archive announcement" : "Unarchive & Restore post"}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border ${
                        a.isActive
                          ? "bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-700 border-gray-200 hover:border-amber-300"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {a.isActive ? "archive" : "unarchive"}
                      </span>
                      <span>{a.isActive ? "Archive" : "Restore"}</span>
                    </button>

                    <button
                      onClick={() => { setEditing(a); setShowForm(true); }}
                      title="Edit announcement"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(a.id)}
                      title="Delete announcement permanently"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium italic bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 flex-shrink-0 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    System Post
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <AnnouncementForm
          role={role}
          entityId={entityId}
          initial={editing ?? undefined}
          offices={offices}
          departments={departments}
          orgs={orgs}
          onSave={editing ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Announcement?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
