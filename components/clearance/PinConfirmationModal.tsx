"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, KeyRound, X, Check, ShieldAlert } from "lucide-react";

interface PinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  officeIdOrKey?: string | number;
}

export function PinConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Security PIN Required",
  description = "Please enter your Office Approval PIN to clear this student requirement.",
  officeIdOrKey = "default",
}: PinConfirmationModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Retrieve stored office PIN or default to "1234"
  const storedPin = typeof window !== "undefined" 
    ? localStorage.getItem(`office_clearance_pin_${officeIdOrKey}`) || localStorage.getItem("office_clearance_pin_default") || "1234"
    : "1234";

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === storedPin) {
      setError("");
      setPin("");
      onConfirm();
      onClose();
    } else {
      setError("Incorrect PIN. Please try again (Default: 1234).");
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
                className="w-full h-12 px-4 text-center tracking-[0.5em] text-lg font-mono font-bold bg-white border border-gray-300 rounded-2xl outline-none focus:border-[#c82333]"
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-2xl bg-[#c82333] hover:bg-[#a71d2a] text-white font-bold shadow-md text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" /> Confirm & Clear
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
  officeIdOrKey = "default",
}: {
  isOpen: boolean;
  onClose: () => void;
  officeIdOrKey?: string | number;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const existingPin = typeof window !== "undefined" 
    ? localStorage.getItem(`office_clearance_pin_${officeIdOrKey}`) || localStorage.getItem("office_clearance_pin_default") || "1234"
    : "1234";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (currentPin !== existingPin) {
      setError("Current PIN is incorrect.");
      return;
    }

    if (newPin.length < 4) {
      setError("New PIN must be at least 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("New PINs do not match.");
      return;
    }

    localStorage.setItem(`office_clearance_pin_${officeIdOrKey}`, newPin);
    localStorage.setItem("office_clearance_pin_default", newPin);
    setSuccess("Office Clearance PIN updated successfully!");

    setTimeout(() => {
      onClose();
      setSuccess("");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    }, 1200);
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
              <h3 className="font-bold text-base text-gray-900">Set Office PIN</h3>
              <p className="text-xs text-gray-500">Configure clearance PIN</p>
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
              className="w-full h-11 px-4 tracking-widest text-center font-mono font-bold bg-white border border-gray-300 rounded-2xl outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-800 mb-1">New PIN (4-6 Digits)</label>
            <input
              type="password"
              maxLength={6}
              required
              placeholder="Enter new PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full h-11 px-4 tracking-widest text-center font-mono font-bold bg-white border border-gray-300 rounded-2xl outline-none focus:border-blue-600"
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
              className="w-full h-11 px-4 tracking-widest text-center font-mono font-bold bg-white border border-gray-300 rounded-2xl outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
            >
              Save PIN
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
