"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Check, Loader2, Trash2 } from "lucide-react";

interface BrandingSettingsProps {
  entityType: "offices" | "departments" | "orgs";
  entityId: number;
  entityName: string;
  currentLogoUrl?: string | null;
}

export function BrandingSettings({
  entityType,
  entityId,
  entityName,
  currentLogoUrl,
}: BrandingSettingsProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showFeedback("Please select an image file", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showFeedback("File must be less than 2MB", "error");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showFeedback("Please select an image file", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showFeedback("File must be less than 2MB", "error");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("folder", "logos");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image");
      const { url } = await uploadRes.json();

      // 2. Update entity
      const updateRes = await fetch(`/api/${entityType}/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url }),
      });

      if (!updateRes.ok) throw new Error("Failed to update entity");

      setLogoUrl(url);
      setPreviewUrl(null);
      setSelectedFile(null);
      showFeedback("Logo updated successfully", "success");
    } catch (error) {
      console.error("Upload error:", error);
      showFeedback("Failed to update logo", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      const updateRes = await fetch(`/api/${entityType}/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
      });

      if (!updateRes.ok) throw new Error("Failed to remove logo");

      setLogoUrl(null);
      showFeedback("Logo removed successfully", "success");
    } catch (error) {
      console.error("Remove error:", error);
      showFeedback("Failed to remove logo", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || logoUrl;
  const initial = entityName ? entityName.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex flex-col gap-6 max-w-md">
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 font-body-md ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {feedback.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      <div className="flex flex-col items-center gap-6 p-6 bg-surface-container-low rounded-2xl border border-outline-variant">
        <div className="relative w-32 h-32 flex-shrink-0">
          {displayUrl ? (
            <div className="w-full h-full relative rounded-full overflow-hidden border-2 border-outline-variant bg-surface-container">
              <Image
                src={displayUrl}
                alt={`${entityName} logo`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center bg-primary text-white text-5xl font-bold font-headline-lg">
              {initial}
            </div>
          )}
        </div>

        {!previewUrl ? (
          <div className="w-full flex flex-col gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-container transition-colors group"
            >
              <Upload className="w-8 h-8 text-secondary group-hover:text-primary transition-colors" />
              <p className="text-secondary font-body-md text-center">
                Click or drag to upload logo<br/>
                <span className="text-xs opacity-70">JPG, PNG, GIF (Max 2MB)</span>
              </p>
            </div>
            
            {logoUrl && (
              <button
                onClick={handleRemove}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 px-4 py-2 text-primary hover:bg-red-50 rounded-lg font-body-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove Logo
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex gap-3">
            <button
              onClick={() => {
                setPreviewUrl(null);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={isUploading}
              className="flex-1 py-2 px-4 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container font-body-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading}
              className="flex-1 py-2 px-4 rounded-lg bg-primary text-white hover:bg-red-700 font-body-md transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Logo"
              )}
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
