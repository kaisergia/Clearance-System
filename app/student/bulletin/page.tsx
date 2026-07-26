"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Megaphone, Calendar, MapPin, ExternalLink, Share2, Copy, Check, X } from "lucide-react";
import * as clearanceService from "@/services/clearanceService";

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  isSystemWide: boolean;
  eventDate: string | null;
  eventLocation: string | null;
  expiresAt: string | null;
  imageUrls: string[] | null;
  linkLabel: string | null;
  linkUrl: string | null;
  createdAt: string;
  office?: { id: number; name: string; logoUrl?: string | null; themeColor?: string | null } | null;
  department?: { id: number; name: string; abbreviation: string; logoUrl?: string | null; themeColor?: string | null } | null;
  org?: { id: number; name: string; logoUrl?: string | null; themeColor?: string | null } | null;
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "Important",
  normal: "New",
  low: "Notice",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  normal: "bg-red-50 text-primary border-red-100",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getEntityInfo(item: AnnouncementItem): { name: string; logoUrl?: string | null; themeColor?: string | null } {
  if (item.office) return { name: item.office.name, logoUrl: item.office.logoUrl, themeColor: item.office.themeColor };
  if (item.department) return { name: `${item.department.name} (${item.department.abbreviation})`, logoUrl: item.department.logoUrl, themeColor: item.department.themeColor };
  if (item.org) return { name: item.org.name, logoUrl: item.org.logoUrl, themeColor: item.org.themeColor };
  return { name: "Cor Jesu College", logoUrl: "/images/logos/cjc-logo.webp", themeColor: "#b51b15" };
}

function getPostedBy(item: AnnouncementItem): string {
  return getEntityInfo(item).name;
}

// ── Share Component / Dialog ──────────────────────────────────────────────────
function ShareButton({ item }: { item: AnnouncementItem }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const getPermalink = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/announcements/${item.id}`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const permalink = getPermalink();

    // Use Web Share API if supported (mobile browsers, edge, etc.)
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.title,
          url: permalink,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to menu
      }
    }

    setShowMenu((prev) => !prev);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const permalink = getPermalink();
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFacebookShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const permalink = getPermalink();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(permalink)}&quote=${encodeURIComponent(item.title)}`;
    window.open(fbUrl, "_blank", "width=600,height=400");
    setShowMenu(false);
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const permalink = getPermalink();
    const text = `${item.title} ${permalink}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    setShowMenu(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-xs font-medium"
        title="Share Announcement"
      >
        <Share2 className="w-4 h-4 text-gray-500" />
        <span>Share</span>
      </button>

      {showMenu && (
        <div
          className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleFacebookShare}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            Facebook
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm text-green-600">chat</span>
            WhatsApp
          </button>
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Link Copied!" : "Copy Link"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail Modal Component ────────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: AnnouncementItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.normal}`}>
                {PRIORITY_LABELS[item.priority] ?? "Notice"}
              </span>
              {(() => {
                const entity = getEntityInfo(item);
                return (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border"
                    style={{
                      color: entity.themeColor || "#b51b15",
                      backgroundColor: `${entity.themeColor || "#b51b15"}12`,
                      borderColor: `${entity.themeColor || "#b51b15"}30`,
                    }}
                  >
                    {entity.logoUrl && (
                      <img
                        src={entity.logoUrl}
                        alt={entity.name}
                        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    {entity.name}
                  </span>
                );
              })()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-3 border-b border-gray-100">
            <span>Posted {formatDate(item.createdAt)}</span>
            {item.eventDate && (
              <span className="flex items-center gap-1 text-gray-700 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#c41e2a]" />
                Event: {formatDate(item.eventDate)}
              </span>
            )}
            {item.eventLocation && (
              <span className="flex items-center gap-1 text-gray-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#c41e2a]" />
                {item.eventLocation}
              </span>
            )}
          </div>

          {/* Attached Images */}
          {Array.isArray(item.imageUrls) && item.imageUrls.length > 0 && (
            <div className={`grid gap-3 ${item.imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {item.imageUrls.map((url, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-auto max-h-[350px] object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Content Body */}
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>

          {/* Optional Link */}
          {item.linkUrl && (
            <div className="pt-2">
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#c41e2a] hover:bg-[#9a1820] text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {item.linkLabel || "Open External Link"}
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <ShareButton item={item} />
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Student Bulletin Board Page ──────────────────────────────────────────
export default function StudentBulletinPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AnnouncementItem | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load student profile
  useEffect(() => {
    const init = async () => {
      const profile = await clearanceService.getStudentProfile();
      if (profile?.id) {
        setStudentId(profile.id);
      } else {
        // Fallback for dev mode
        setStudentId("CJC-928994");
      }
    };
    init();
  }, []);

  // Fetch initial batch
  const fetchAnnouncements = useCallback(async (sid: string, cursor?: number | null) => {
    try {
      let url = `/api/announcements?scope=student&studentId=${sid}&limit=6`;
      if (cursor) url += `&cursor=${cursor}`;

      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      const newItems: AnnouncementItem[] = data.announcements ?? [];
      const cursorVal: number | null = data.nextCursor ?? null;

      if (cursor) {
        setAnnouncements((prev) => [...prev, ...newItems]);
      } else {
        setAnnouncements(newItems);
      }
      setNextCursor(cursorVal);
    } catch (e) {
      console.error("Failed to fetch bulletin announcements:", e);
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      setLoading(true);
      fetchAnnouncements(studentId, null).finally(() => setLoading(false));
    }
  }, [studentId, fetchAnnouncements]);

  // Load more via cursor
  const handleLoadMore = useCallback(() => {
    if (!studentId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchAnnouncements(studentId, nextCursor).finally(() => setLoadingMore(false));
  }, [studentId, nextCursor, loadingMore, fetchAnnouncements]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [nextCursor, loadingMore, handleLoadMore]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-surface-container-high pb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-[#c41e2a]" />
          Bulletin Board
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Announcements and updates from Cor Jesu College, your department, offices, and clubs.
        </p>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded w-1/4" />
              <div className="h-5 bg-gray-100 rounded w-3/4" />
              <div className="h-16 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 text-sm">No announcements to display</p>
          <p className="text-xs text-gray-400 mt-1">Check back later for updates from your college and department.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const entity = getEntityInfo(item);
            return (
              <article
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
                style={{ borderLeft: `4px solid ${entity.themeColor || "#b51b15"}` }}
              >
                <div className="p-6">
                  {/* Header row: priority + postedBy + date */}
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${PRIORITY_BADGE[item.priority] ?? PRIORITY_BADGE.normal}`}>
                        {PRIORITY_LABELS[item.priority] ?? "Notice"}
                      </span>
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 border"
                        style={{
                          color: entity.themeColor || "#b51b15",
                          backgroundColor: `${entity.themeColor || "#b51b15"}12`,
                          borderColor: `${entity.themeColor || "#b51b15"}30`,
                        }}
                      >
                        {entity.logoUrl && (
                          <img
                            src={entity.logoUrl}
                            alt={entity.name}
                            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        {entity.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                  </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#c41e2a] transition-colors leading-snug mb-2">
                  {item.title}
                </h2>

                {/* Content preview */}
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">{item.content}</p>

                {/* Attached image preview grid */}
                {Array.isArray(item.imageUrls) && item.imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {item.imageUrls.map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                        <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Event info & actions bar */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-4 text-gray-500">
                    {item.eventDate && (
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <Calendar className="w-3.5 h-3.5 text-[#c41e2a]" />
                        {item.eventDate}
                      </span>
                    )}
                    {item.eventLocation && (
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-[#c41e2a]" />
                        {item.eventLocation}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#c41e2a] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {item.linkLabel || "Link"}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        </div>
      )}

      {/* Sentinel for Infinite Scroll */}
      <div ref={sentinelRef} className="h-6 flex items-center justify-center">
        {loadingMore && (
          <div className="text-xs font-semibold text-gray-400 animate-pulse flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-[#c41e2a] animate-spin" />
            Loading more announcements…
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
