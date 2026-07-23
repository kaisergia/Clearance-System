"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

interface InstallPwaButtonProps {
  variant?: "hero" | "header";
}

function IOSGuideModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-base">
            Install CJC Clearance App
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs text-gray-600">
            Follow these steps to install this app on your iPhone or iPad:
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[#c41e2a]">1</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">
                  Open in Safari
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Web app installation on iOS is supported in Safari.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[#c41e2a]">2</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  Tap the Share icon
                  <Share className="w-3.5 h-3.5 text-[#c41e2a]" />
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  The square icon with an arrow at the bottom of Safari.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[#c41e2a]">3</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  Tap &quot;Add to Home Screen&quot;
                  <PlusSquare className="w-3.5 h-3.5 text-[#c41e2a]" />
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Scroll down in the share menu to find it.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-[#c41e2a] hover:bg-[#9a1820] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function InstallPwaButton({ variant = "hero" }: InstallPwaButtonProps) {
  const { canInstall, isIOS, showIOSGuide, setShowIOSGuide, install } = usePwaInstall();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!canInstall) return null;

  return (
    <>
      {variant === "hero" ? (
        <button
          onClick={install}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 backdrop-blur-sm text-sm transition-all duration-200"
        >
          <Download className="w-4 h-4 text-white" />
          Install App
        </button>
      ) : (
        <button
          onClick={install}
          className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-[#c41e2a] font-semibold text-xs px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </button>
      )}

      {mounted && showIOSGuide && (
        <IOSGuideModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
}
