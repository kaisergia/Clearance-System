"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Check, Loader2, Trash2, Image as ImageIcon } from "lucide-react";

interface BrandingSettingsProps {
  entityType: "offices" | "departments" | "orgs";
  entityId: number;
  entityName: string;
  currentLogoUrl?: string | null;
  currentCoverUrl?: string | null;
  currentThemeColor?: string | null;
}

const THEME_COLORS = [
  "#b51b15", // Red
  "#1e40af", // Blue
  "#059669", // Green
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#be185d", // Pink
  "#0369a1", // Sky
  "#ea580c", // Orange
  "#0891b2", // Teal
  "#4f46e5", // Indigo
  "#65a30d", // Lime
  "#374151", // Slate
];

export function BrandingSettings({
  entityType,
  entityId,
  entityName,
  currentLogoUrl,
  currentCoverUrl,
  currentThemeColor,
}: BrandingSettingsProps) {
  // State for logo
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // State for cover
  const [coverUrl, setCoverUrl] = useState<string | null>(currentCoverUrl || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // State for theme
  const [themeColor, setThemeColor] = useState<string | null>(currentThemeColor || null);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Feedback auto-dismiss
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
  };

  const getInitials = (name: string) => {
    if (!name) return "XX";
    return name.substring(0, 2).toUpperCase();
  };

  // Generic upload function
  const uploadImage = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }
    const data = await res.json();
    return data.url;
  };

  // Generic patch function
  const updateEntity = async (payload: any) => {
    const res = await fetch(`/api/${entityType}/${entityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Update failed");
    }
    return res.json();
  };

  // --- LOGO HANDLERS ---
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        showFeedback("error", "Logo file size must be less than 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 2 * 1024 * 1024) {
        showFeedback("error", "Logo file size must be less than 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveLogo = async () => {
    if (!logoFile) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadImage(logoFile, "logos");
      await updateEntity({ logoUrl: url });
      setLogoUrl(url);
      setLogoFile(null);
      setLogoPreview(null);
      showFeedback("success", "Logo updated successfully");
    } catch (error) {
      showFeedback("error", "Failed to update logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setIsUploadingLogo(true);
    try {
      await updateEntity({ logoUrl: null });
      setLogoUrl(null);
      setLogoFile(null);
      setLogoPreview(null);
      showFeedback("success", "Logo removed successfully");
    } catch (error) {
      showFeedback("error", "Failed to remove logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // --- COVER HANDLERS ---
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showFeedback("error", "Cover file size must be less than 5MB");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showFeedback("error", "Cover file size must be less than 5MB");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveCover = async () => {
    if (!coverFile) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadImage(coverFile, "covers");
      await updateEntity({ coverUrl: url });
      setCoverUrl(url);
      setCoverFile(null);
      setCoverPreview(null);
      showFeedback("success", "Cover image updated successfully");
    } catch (error) {
      showFeedback("error", "Failed to update cover image");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    setIsUploadingCover(true);
    try {
      await updateEntity({ coverUrl: null });
      setCoverUrl(null);
      setCoverFile(null);
      setCoverPreview(null);
      showFeedback("success", "Cover image removed successfully");
    } catch (error) {
      showFeedback("error", "Failed to remove cover image");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // --- THEME HANDLERS ---
  const handleThemeSelect = async (color: string) => {
    setIsSavingTheme(true);
    try {
      await updateEntity({ themeColor: color });
      setThemeColor(color);
      showFeedback("success", "Theme color updated successfully");
    } catch (error) {
      showFeedback("error", "Failed to update theme color");
    } finally {
      setIsSavingTheme(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 transition-opacity duration-300 ${
            feedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="font-medium text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Section 1: Logo Upload */}
      <section className="bg-surface-container-low rounded-2xl border border-outline-variant p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-on-surface text-lg">Logo Upload</h3>
          <p className="text-secondary text-sm">Upload a square logo for {entityName}. Max size 2MB.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-32 h-32 shrink-0 rounded-full border-2 border-outline-variant overflow-hidden bg-surface-container flex items-center justify-center relative">
            {logoPreview || logoUrl ? (
              <Image
                src={logoPreview || logoUrl!}
                alt="Logo preview"
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-secondary opacity-50">
                {getInitials(entityName)}
              </span>
            )}
          </div>

          <div className="flex-1 w-full space-y-4">
            <div
              className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:bg-surface-container transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleLogoDrop}
              onClick={() => logoInputRef.current?.click()}
            >
              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoSelect}
              />
              <Upload className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-sm text-secondary font-medium">Click or drag and drop to upload</p>
              <p className="text-xs text-secondary mt-1">SVG, PNG, JPG or GIF</p>
            </div>

            <div className="flex items-center gap-3">
              {logoFile && (
                <>
                  <button
                    onClick={handleSaveLogo}
                    disabled={isUploadingLogo}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploadingLogo && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Logo
                  </button>
                  <button
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    disabled={isUploadingLogo}
                    className="border border-outline-variant text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
              {!logoFile && logoUrl && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={isUploadingLogo}
                  className="text-red-600 border border-red-200 bg-red-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Cover/Banner Image */}
      <section className="bg-surface-container-low rounded-2xl border border-outline-variant p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-on-surface text-lg">Cover/Banner Image</h3>
          <p className="text-secondary text-sm">Upload a wide banner image for {entityName}. Aspect ratio 16:5.</p>
        </div>

        <div className="space-y-6">
          {/* Preview Area */}
          <div
            className="w-full aspect-[16/5] rounded-xl border border-outline-variant overflow-hidden relative"
            style={{
              background: (!coverPreview && !coverUrl) 
                ? `linear-gradient(to right bottom, ${themeColor || '#6b7280'}, ${themeColor ? themeColor + '80' : '#4b5563'})` 
                : undefined
            }}
          >
            {(coverPreview || coverUrl) && (
              <Image
                src={coverPreview || coverUrl!}
                alt="Cover preview"
                fill
                className="object-cover"
              />
            )}
            {!coverPreview && !coverUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-white/50" />
              </div>
            )}
          </div>

          <div
            className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:bg-surface-container transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCoverDrop}
            onClick={() => coverInputRef.current?.click()}
          >
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleCoverSelect}
            />
            <Upload className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-sm text-secondary font-medium">Click or drag and drop to upload cover</p>
            <p className="text-xs text-secondary mt-1">Recommended size: 1600x500px</p>
          </div>

          <div className="flex items-center gap-3">
            {coverFile && (
              <>
                <button
                  onClick={handleSaveCover}
                  disabled={isUploadingCover}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploadingCover && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Cover
                </button>
                <button
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}
                  disabled={isUploadingCover}
                  className="border border-outline-variant text-on-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}
            {!coverFile && coverUrl && (
              <button
                onClick={handleRemoveCover}
                disabled={isUploadingCover}
                className="text-red-600 border border-red-200 bg-red-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove Cover
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Color Theme Picker */}
      <section className="bg-surface-container-low rounded-2xl border border-outline-variant p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-on-surface text-lg">Accent Color</h3>
            <p className="text-secondary text-sm">Select a primary theme color for {entityName}.</p>
          </div>
          {isSavingTheme && <Loader2 className="w-5 h-5 animate-spin text-secondary" />}
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-4 w-fit">
          {THEME_COLORS.map((color) => {
            const isSelected = themeColor === color;
            return (
              <button
                key={color}
                onClick={() => handleThemeSelect(color)}
                disabled={isSavingTheme}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                  isSelected ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              >
                {isSelected && <Check className="w-5 h-5 text-white" />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
