"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, Layers, HelpCircle, Download } from "lucide-react";

interface BatchCsvImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "office" | "department" | "org";
  entityId: number | string;
  entityName?: string;
  onSuccess?: () => void;
}

interface ParsedRow {
  studentId: string;
  status: "Cleared" | "Pending";
  remarks: string;
  isValid: boolean;
}

export function BatchCsvImporterModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName = "Office Evaluator",
  onSuccess,
}: BatchCsvImporterModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMode, setActionMode] = useState<"deficiency" | "clear" | "auto">("deficiency");
  const [defaultRemarks, setDefaultRemarks] = useState("Unresolved Deficiency");
  const [resultSummary, setResultSummary] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (inputFile: File) => {
    setFile(inputFile);
    setErrorMsg(null);
    setResultSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        setErrorMsg("Failed to read file content.");
        return;
      }
      parseCSV(text);
    };
    reader.readAsText(inputFile);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setErrorMsg("CSV file is empty.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
    
    let idIdx = headers.findIndex((h) => h.includes("student") || h.includes("id") || h.includes("no") || h.includes("code"));
    let statusIdx = headers.findIndex((h) => h.includes("status") || h.includes("state"));
    let remarksIdx = headers.findIndex((h) => h.includes("remark") || h.includes("reason") || h.includes("deficiency") || h.includes("note") || h.includes("penalty"));

    if (idIdx === -1) idIdx = 0; // Default to first column if header not matched

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
      if (cols.length === 0 || !cols[0]) continue;

      const rawId = cols[idIdx] || "";
      const rawStatus = statusIdx !== -1 ? cols[statusIdx] : "";
      const rawRemarks = remarksIdx !== -1 ? cols[remarksIdx] : "";

      const studentId = rawId.trim();
      let status: "Cleared" | "Pending" = "Pending";

      if (actionMode === "clear") {
        status = "Cleared";
      } else if (actionMode === "deficiency") {
        status = "Pending";
      } else {
        status = rawStatus.toLowerCase().includes("clear") ? "Cleared" : "Pending";
      }

      const remarks = rawRemarks || (status === "Pending" ? defaultRemarks : "");

      rows.push({
        studentId,
        status,
        remarks,
        isValid: studentId.length >= 3,
      });
    }

    setParsedRows(rows);
  };

  const handleModeChange = (newMode: "deficiency" | "clear" | "auto") => {
    setActionMode(newMode);
    setParsedRows((prev) =>
      prev.map((r) => {
        let st: "Cleared" | "Pending" = "Pending";
        if (newMode === "clear") st = "Cleared";
        else if (newMode === "deficiency") st = "Pending";
        return {
          ...r,
          status: st,
          remarks: st === "Pending" && !r.remarks ? defaultRemarks : r.remarks,
        };
      })
    );
  };

  const handleExecuteBatch = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg("No valid student records found in file to process.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/clearance-records/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId: Number(entityId),
          records: validRows.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            remarks: r.remarks,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch execution failed");

      setResultSummary(data);
      if (onSuccess) onSuccess();
      window.dispatchEvent(new Event("clearanceRecordsUpdated"));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete batch CSV import.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sample = "student_id,status,deficiency_remarks\n2024-0001,Pending,Unreturned Library Book\n2024-0002,Cleared,Fees Paid\n2024-0003,Pending,Guidance Form Deficiency";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clearance_batch_sample.csv";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-snug">CSV Deficiency Import & Batch Clearance</h3>
              <p className="text-xs text-slate-300">Bulk flag deficiencies or auto-clear 500+ students at once</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultSummary ? (
            /* Success Summary View */
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Batch Update Completed!</h4>
              <p className="text-xs text-gray-600 max-w-md mx-auto">{resultSummary.message}</p>

              <div className="grid grid-cols-3 gap-3 pt-3 max-w-md mx-auto">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-gray-500 font-medium">Total CSV Rows</div>
                  <div className="text-base font-bold text-gray-900">{resultSummary.totalRequested}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-700 font-medium">Updated Records</div>
                  <div className="text-base font-bold text-emerald-800">{resultSummary.updatedCount}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                  <div className="text-xs text-amber-700 font-medium">Unmatched IDs</div>
                  <div className="text-base font-bold text-amber-800">
                    {resultSummary.missingStudents?.length || 0}
                  </div>
                </div>
              </div>

              {resultSummary.missingStudents && resultSummary.missingStudents.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-left text-xs max-w-md mx-auto">
                  <span className="font-bold text-amber-900 block mb-1">⚠️ Unmatched Student IDs in System:</span>
                  <div className="font-mono text-[11px] text-amber-800 max-h-24 overflow-y-auto">
                    {resultSummary.missingStudents.join(", ")}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload & Config Form */
            <>
              {/* Step 1: File Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  file ? "border-emerald-400 bg-emerald-50/30" : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx,.tsv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-500 font-mono">
                        {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows detected
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg ml-auto">
                      Change File
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-9 h-9 text-slate-400 mx-auto" />
                    <div className="text-sm font-bold text-slate-800">
                      Drop CSV file here or <span className="text-[#c41e2a] hover:underline">browse computer</span>
                    </div>
                    <p className="text-xs text-slate-500">Supports CSV, XLSX, TSV with student_id, status, and remarks columns</p>
                  </div>
                )}
              </div>

              {/* Step 2: Action Mode Controls */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span>Batch Action Policy:</span>
                  <button
                    onClick={downloadSampleCSV}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-normal inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Download Sample CSV
                  </button>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange("deficiency")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      actionMode === "deficiency"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    ⚠️ Flag Deficiencies
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("clear")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      actionMode === "clear"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    ✅ Batch Auto-Clear
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("auto")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      actionMode === "auto"
                        ? "bg-slate-900 text-white border-slate-950 shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    ⚡ CSV Column Mode
                  </button>
                </div>
              </div>

              {/* Step 3: Default Remarks input */}
              {actionMode === "deficiency" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Default Deficiency Remark (for rows missing remarks):</label>
                  <input
                    type="text"
                    value={defaultRemarks}
                    onChange={(e) => setDefaultRemarks(e.target.value)}
                    placeholder="e.g. Unreturned Library Book or Unpaid Balance"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              )}

              {/* Step 4: Parsed CSV Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                    <span>Parsed Preview ({parsedRows.length} constituents):</span>
                    <span className="text-emerald-700 text-[11px] font-medium">
                      Ready to execute {parsedRows.filter((r) => r.isValid).length} valid records
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto bg-slate-50/50 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Student ID</th>
                          <th className="px-3 py-2">Batch Action</th>
                          <th className="px-3 py-2">Remarks / Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedRows.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="px-3 py-2 font-mono font-bold text-gray-900">{row.studentId}</td>
                            <td className="px-3 py-2">
                              {row.status === "Cleared" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Cleared
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Deficiency
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600 truncate max-w-xs">{row.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 50 && (
                    <p className="text-[11px] text-gray-500 text-center">
                      Showing first 50 of {parsedRows.length} records. All rows will be processed on execution.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {resultSummary ? "Close Window" : "Cancel"}
          </button>

          {!resultSummary && (
            <button
              onClick={handleExecuteBatch}
              disabled={loading || parsedRows.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-950 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Batch CSV...
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-amber-400" /> Execute Batch Update ({parsedRows.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
