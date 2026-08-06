"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, KeyRound, X, Check, ShieldAlert, Loader2 } from "lucide-react";

interface PinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  /** @deprecated No longer used — PINs are now stored per-user in the database */
  officeIdOrKey?: string | number;
  /** Optional: dev-bypass email header for testing without a session */
  devEmail?: string;
}

export function PinConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Security PIN Required",
  description = "Please enter your Office Approval PIN to clear this student requirement.",
  devEmail,
}: PinConfirmationModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsVerifying(true);
    setError("");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (devEmail) headers["x-dev-email"] = devEmail;

      const res = await fetch("/api/users/pin/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed. Please try again.");
        return;
      }

      if (data.valid) {
        setError("");
        setPin("");
        onConfirm();
        onClose();
      } else {
        setError("Incorrect PIN. Please try again.");
      }
    } catch (err) {
      console.error("[PinConfirmationModal] Error verifying PIN:", err);
      setError("Unable to verify PIN. Check your connection and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-scaleUp font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#c82333] flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">Authorization required</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          {description}
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block font-bold text-gray-800 text-xs mb-1.5 flex items-center justify-between">
              <span>Approval PIN</span>
              <span className="text-[10px] text-gray-400 font-normal">Default PIN: 1234</span>
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                autoFocus
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError("");
                }}
                disabled={isVerifying}
                className="w-full h-12 px-4 text-center tracking-[0.5em] text-lg font-mono font-bold bg-white border border-gray-300 rounded-2xl outline-none focus:border-[#c82333] disabled:opacity-60"
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 h-11 rounded-2xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 text-xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !pin.trim()}
              className="flex-1 h-11 rounded-2xl bg-[#c82333] hover:bg-[#a71d2a] text-white font-bold shadow-md text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
              ) : (
                <><Check className="w-4 h-4" /> Confirm &amp; Authorize</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function SetPinModal({
  isOpen,
  onClose,
  devEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated officeIdOrKey no longer used */
  officeIdOrKey?: string | number;
  devEmail?: string;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPin.length < 4) {
      setError("New PIN must be at least 4 digits.");
      return;
    }

    if (!/^\d+$/.test(newPin)) {
      setError("PIN must contain digits only.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("New PINs do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (devEmail) headers["x-dev-email"] = devEmail;

      const res = await fetch("/api/users/pin/update", {
        method: "POST",
        headers,
        body: JSON.stringify({ currentPin: currentPin.trim(), newPin: newPin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update PIN.");
        return;
      }

      setSuccess("Security PIN updated successfully!");
      setTimeout(() => {
        onClose();
        setSuccess("");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      }, 1200);
    } catch (err) {
      console.error("[SetPinModal] Error updating PIN:", err);
      setError("Unable to update PIN. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-scaleUp font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Set Security PIN</h3>
              <p className="text-xs text-gray-500">Persisted securely in database</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-gray-800 mb-1">Current PIN</label>
            <input
              type="password"
              maxLength={6}
              required
              placeholder="Current PIN (Default: 1234)"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              disabled={isSaving}
              className="w-full h-11 px-4 tracking-widest text-center font-mono font-bold bg-white border border-gray-300 rounded-2xl outline-none focus:border-blue-600 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">New PIN (4–6 Digits)</label>
            <input
              type="password"
              maxLength={6}
              required
              placeholder="Enter new PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              disabled={isSaving}
              className="w-full h-11 px-4 tracking-widest text-center font-mono font-bold bg-white border border-gray-300 rounded-2xl outline-none focus:border-blue-600 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">Confirm New PIN</label>
            <input
              type="password"
              maxLength={6}
              required
              placeholder="Confirm new PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              disabled={isSaving}
              className="w-full h-11 px-4 tracking-widest text-center font-mono font-bold bg-white border border-gray-300 rounded-2xl outline-none focus:border-blue-600 disabled:opacity-60"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 h-11 rounded-2xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                "Save PIN"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
