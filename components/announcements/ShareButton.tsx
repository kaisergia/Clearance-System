"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

export function ShareButton({ id, title }: { id: number; title: string }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const getPermalink = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/announcements/${id}`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const permalink = getPermalink();

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: permalink,
        });
        return;
      } catch (err) {
        // Fallback to menu if user cancelled or error
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
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(permalink)}&quote=${encodeURIComponent(title)}`;
    window.open(fbUrl, "_blank", "width=600,height=400");
    setShowMenu(false);
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const permalink = getPermalink();
    const text = `${title} ${permalink}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    setShowMenu(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors flex items-center gap-2"
        title="Share Announcement"
      >
        <Share2 className="w-4 h-4 text-gray-600" />
        <span>Share Post</span>
      </button>

      {showMenu && (
        <div
          className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
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
