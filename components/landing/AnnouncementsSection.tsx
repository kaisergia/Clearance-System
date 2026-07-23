"use client";

import { ArrowRight, Calendar, MapPin, X } from "lucide-react";
import { useState } from "react";

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  isSystemWide: boolean;
  eventDate: string | null;
  eventLocation: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  onOpenLogin?: () => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const priorityLabel: Record<string, string> = {
  urgent: "Urgent",
  high: "Important",
  normal: "New",
  low: "Notice",
};

const priorityColor: Record<string, string> = {
  urgent: "text-red-600",
  high: "text-amber-600",
  normal: "text-[#c41e2a]",
  low: "text-gray-500",
};

const priorityBadge: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-700 border-amber-200",
  normal: "bg-red-50 text-[#c41e2a] border-red-100",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

// ── Detail Modal ─────────────────────────────────────────────────────────────
function AnnouncementModal({
  announcement,
  onClose,
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 rounded-t-2xl z-10">
          <div className="flex-1">
            <span
              className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border mb-2 ${priorityBadge[announcement.priority] ?? priorityBadge.normal}`}
            >
              {priorityLabel[announcement.priority] ?? "Notice"}
            </span>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {announcement.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 mb-5 text-sm text-gray-500">
            <span>Posted {formatDate(announcement.createdAt)}</span>
            {announcement.eventDate && (
              <span className="flex items-center gap-1.5 text-gray-700">
                <Calendar className="w-4 h-4 text-[#c41e2a]" />
                {formatDate(announcement.eventDate)}
              </span>
            )}
            {announcement.eventLocation && (
              <span className="flex items-center gap-1.5 text-gray-700">
                <MapPin className="w-4 h-4 text-[#c41e2a]" />
                {announcement.eventLocation}
              </span>
            )}
          </div>

          {/* Content */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {announcement.content}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Section ─────────────────────────────────────────────────────────────
export function AnnouncementsSection({ announcements, onOpenLogin }: AnnouncementsSectionProps) {
  const [selected, setSelected] = useState<Announcement | null>(null);

  if (announcements.length === 0) return null;

  const featured = announcements[0];
  const secondary = announcements.slice(1, 3);

  return (
    <>
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">News and Updates</h2>
            <div className="w-14 h-0.5 bg-[#c41e2a] mx-auto mt-4" />
          </div>

          {/* Grid: featured (left 3/5) + secondary stack (right 2/5) */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Featured card */}
            <button
              onClick={() => setSelected(featured)}
              className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden text-left cursor-pointer group hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-7 sm:p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${priorityColor[featured.priority] ?? priorityColor.normal}`}>
                    {priorityLabel[featured.priority] ?? "New"}
                  </span>
                  <span className="text-sm text-gray-400">{formatDate(featured.createdAt)}</span>
                </div>

                <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-3 group-hover:text-[#c41e2a] transition-colors line-clamp-3 leading-snug">
                  {featured.title}
                </h3>

                <p className="text-gray-500 leading-relaxed line-clamp-4 mb-5 text-sm">
                  {featured.content}
                </p>

                {(featured.eventDate || featured.eventLocation) && (
                  <div className="flex flex-wrap gap-4 mb-5 text-sm">
                    {featured.eventDate && (
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <Calendar className="w-4 h-4 text-[#c41e2a]" />
                        {formatDate(featured.eventDate)}
                      </span>
                    )}
                    {featured.eventLocation && (
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="w-4 h-4 text-[#c41e2a]" />
                        {featured.eventLocation}
                      </span>
                    )}
                  </div>
                )}

                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#c41e2a] group-hover:gap-3 transition-all">
                  Read more <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>

            {/* Secondary stack */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {secondary.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left cursor-pointer group hover:shadow-md transition-shadow duration-200 flex-1"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${priorityColor[a.priority] ?? priorityColor.normal}`}>
                      {priorityLabel[a.priority] ?? "New"}
                    </span>
                    <span className="text-xs text-gray-400">{formatShortDate(a.createdAt)}</span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-[#c41e2a] transition-colors leading-snug">
                    {a.title}
                  </h3>

                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">
                    {a.content}
                  </p>

                  {(a.eventDate || a.eventLocation) && (
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-2">
                      {a.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#c41e2a]" />
                          {formatShortDate(a.eventDate)}
                        </span>
                      )}
                      {a.eventLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#c41e2a]" />
                          {a.eventLocation}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}

              {/* Sign in nudge */}
              <div className="bg-[#8b1a22] rounded-xl p-5 text-white flex flex-col justify-between gap-3">
                <p className="text-sm text-white/80 leading-relaxed">
                  Sign in to view department and organization announcements specific to you.
                </p>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-2 bg-white text-[#c41e2a] text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors self-start"
                >
                  Sign In <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      {selected && (
        <AnnouncementModal announcement={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
