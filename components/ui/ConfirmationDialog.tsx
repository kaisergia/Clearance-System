"use client";

import { createPortal } from "react-dom";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <h3 className="font-title-lg text-lg font-bold text-on-surface mb-2">
          {title}
        </h3>
        <p className="font-body-md text-sm text-secondary mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-outline-variant text-secondary rounded-lg font-label-md text-sm hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 bg-brand-red text-white rounded-lg font-label-md text-sm shadow-sm hover:bg-primary transition-colors cursor-pointer active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
