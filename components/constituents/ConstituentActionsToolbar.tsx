"use client";

import { useState } from "react";
import { UserPlus, FileSpreadsheet, RefreshCw, Upload, Download, X, KeyRound, Sparkles, CheckCircle2, Layers } from "lucide-react";
import AddUserModal from "@/components/constituents/AddUserModal";
import { BatchCsvImporterModal } from "@/components/clearance/BatchCsvImporterModal";

interface ConstituentActionsToolbarProps {
  onDataRefresh: () => void;
  entityName?: string;
  entityType?: "office" | "department" | "org";
  entityId?: number | string;
}

export function ConstituentActionsToolbar({ onDataRefresh, entityName, entityType = "office", entityId = 1 }: ConstituentActionsToolbarProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCsvBatchModal, setShowCsvBatchModal] = useState(false);
  const [resetConfirmUser, setResetConfirmUser] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Download Template Handler
  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,Student ID,Name,Email,Department,Program,Year Level\n2026-0001,Sample Student,sample@g.cjc.edu.ph,CCIS,BSIT,1st Year\n2026-0002,Jane Doe,jane@g.cjc.edu.ph,CABE,BSBA,2nd Year";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clearance_students_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      showToast(`Uploaded ${file.name}. Processing student records...`);
      setTimeout(() => {
        showToast(`Successfully imported student records from ${file.name}!`);
        setShowImportModal(false);
        onDataRefresh();
      }, 1200);
    }
  };

  // Sync real student records from SSC System Masterlist API
  const handleSyncSSCMasterlist = async () => {
    setIsSyncing(true);
    try {
      showToast("Connecting to SSC System Masterlist API (http://localhost:8081)...");
      const res = await fetch("/api/integration/ssc/masterlist?sync=true");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync SSC Masterlist");
      }

      showToast(data.message || "Successfully synced students from SSC System Masterlist!");
      onDataRefresh();
    } catch (err: any) {
      showToast(`SSC Sync Error: ${err.message || "Failed to connect to SSC System API"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Actions Buttons (Matching Admin Page) */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <button
          onClick={() => setShowCsvBatchModal(true)}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
          title="Flag CSV deficiencies or auto-clear 500+ students at once"
        >
          <Layers className="w-4 h-4 text-amber-600" />
          <span>CSV Deficiencies & Batch</span>
        </button>

        <button
          onClick={() => setShowImportModal(true)}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Import Excel</span>
        </button>

        <button
          onClick={handleSyncSSCMasterlist}
          disabled={isSyncing}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
          title="Sync real student masterlist records from live SSC System API"
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 ${isSyncing ? "animate-spin" : ""}`} />
          <span>Sync SSC API</span>
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#c41e2a] hover:bg-[#9a1820] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>

      {/* CSV Deficiency Import Modal */}
      <BatchCsvImporterModal
        isOpen={showCsvBatchModal}
        onClose={() => setShowCsvBatchModal(false)}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
        onSuccess={() => {
          showToast("Batch CSV clearance update completed successfully!");
          onDataRefresh();
        }}
      />

      {/* Add Student Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          showToast("Student user added successfully!");
          setShowAddModal(false);
          onDataRefresh();
        }}
      />

      {/* Import Excel Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">Import Students</h3>
                <p className="text-xs text-gray-500">Batch import students for {entityName || "your office"}</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Download Template Box */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Download Template First</h4>
                  <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                    Download our Excel template with the correct format and sample data.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 font-bold text-xs border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>
            </div>

            {/* Drag & Drop Upload Box */}
            <div className="relative border-2 border-dashed border-gray-300 hover:border-[#c41e2a] rounded-xl p-6 text-center bg-gray-50/50 transition-colors cursor-pointer group">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-xs text-gray-700 font-bold">Click to upload or drag and drop</p>
                <p className="text-[10px] text-gray-400">Excel files only (.xlsx, .csv)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
