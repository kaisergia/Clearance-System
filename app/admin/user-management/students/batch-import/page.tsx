"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Download, UploadCloud, Info, AlertTriangle, AlertCircle, Edit, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

export default function BatchImportPage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <div className="p-margin-desktop max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Link href="/admin/user-management/students" className="hover:text-primary transition-colors">
              User Management
            </Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary font-bold">Batch User Import</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Batch User Import</h2>
          <p className="text-secondary mt-1">Onboard staff and students by uploading a formatted spreadsheet.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-outline text-secondary font-medium hover:bg-surface-container-low transition-all">
            <Download size={20} />
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* Bento Layout Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Upload Zone */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-container shadow-sm">
            <h3 className="font-title-md text-title-md mb-4 font-bold text-on-surface">1. Upload File</h3>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                dragOver 
                  ? "border-primary bg-primary/5" 
                  : "border-outline-variant hover:border-primary/50 bg-surface-container-low/30"
              }`}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="text-primary" size={32} />
              </div>
              <p className="font-title-md text-on-surface mb-1 font-semibold">
                {file ? file.name : "Drag & Drop file"}
              </p>
              <p className="text-sm text-secondary mb-6">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : "Support CSV, XLSX up to 10MB"}
              </p>
              <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95">
                Browse Files
              </button>
              <input 
                ref={fileInputRef}
                accept=".csv,.xlsx" 
                className="hidden" 
                type="file"
                onChange={handleFileChange}
              />
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-secondary-container/20 rounded-lg">
                <Info className="text-secondary shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-secondary">
                  <p className="font-bold mb-1 text-on-surface">Import Instructions:</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Ensure all required fields (*) are filled.</li>
                    <li>Use official university email formats.</li>
                    <li>Max 5,000 records per batch.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-container shadow-sm">
            <h3 className="font-title-md text-title-md mb-4 font-bold text-on-surface">Import Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant">
                <p className="text-sm text-secondary">Total Rows</p>
                <p className="text-3xl text-on-surface font-bold">124</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">Valid</p>
                <p className="text-3xl text-green-800 font-bold">118</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium">Errors</p>
                <p className="text-3xl text-red-800 font-bold">6</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 font-medium">Warnings</p>
                <p className="text-3xl text-amber-800 font-bold">2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Table */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-surface-container flex items-center justify-between">
              <div>
                <h3 className="font-title-md text-title-md font-bold text-on-surface">2. Data Preview & Validation</h3>
                <p className="text-sm text-secondary">Review the data below before confirming the import.</p>
              </div>
              <div className="flex gap-4">
                <button className="px-4 py-2 text-secondary font-medium hover:bg-surface-container-low rounded-lg transition-all">
                  Clear All
                </button>
                <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/20 hover:bg-primary-dark flex items-center gap-2 transition-all active:scale-95">
                  <UploadCloud size={18} />
                  Import All (118)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-container">
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider w-12">#</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Email Address</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {/* Valid Row */}
                  <tr className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="px-6 py-4 text-secondary text-sm">1</td>
                    <td className="px-6 py-4 font-medium text-on-surface text-sm">STD-2024-001</td>
                    <td className="px-6 py-4 text-sm">Alice Johnson</td>
                    <td className="px-6 py-4 text-secondary text-sm">alice.j@uni.edu</td>
                    <td className="px-6 py-4 text-secondary text-sm">Computer Science</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                        Ready to Import
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 text-secondary hover:text-primary transition-all">
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>

                  {/* Error Row: Missing Email */}
                  <tr className="bg-red-50/30 hover:bg-red-50/50 transition-colors group">
                    <td className="px-6 py-4 text-red-400 text-sm">2</td>
                    <td className="px-6 py-4 font-medium text-on-surface text-sm">STD-2024-002</td>
                    <td className="px-6 py-4 text-sm">Bob Smith</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="italic text-red-600 bg-red-100/50 px-2 py-1 rounded font-medium">Missing Email</span>
                    </td>
                    <td className="px-6 py-4 text-secondary text-sm">Mathematics</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">
                        Critical Error
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all">
                        <AlertCircle size={18} />
                      </button>
                    </td>
                  </tr>

                  {/* Warning Row: Duplication risk */}
                  <tr className="bg-amber-50/30 hover:bg-amber-50/50 transition-colors group">
                    <td className="px-6 py-4 text-amber-500 text-sm">3</td>
                    <td className="px-6 py-4 font-medium text-on-surface text-sm">STD-2024-004</td>
                    <td className="px-6 py-4 text-sm">Diana Prince</td>
                    <td className="px-6 py-4 text-secondary text-sm">diana.p@uni.edu</td>
                    <td className="px-6 py-4 text-secondary text-sm">Physics</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">
                        Potential Duplicate
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-all">
                        <AlertTriangle size={18} />
                      </button>
                    </td>
                  </tr>

                  {/* Valid Row */}
                  <tr className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="px-6 py-4 text-secondary text-sm">4</td>
                    <td className="px-6 py-4 font-medium text-on-surface text-sm">STA-2024-990</td>
                    <td className="px-6 py-4 text-sm">Edward Norton</td>
                    <td className="px-6 py-4 text-secondary text-sm">edward.n@staff.uni.edu</td>
                    <td className="px-6 py-4 text-secondary text-sm">Administration</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                        Ready to Import
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 text-secondary hover:text-primary transition-all">
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="mt-auto p-6 bg-surface-container-low border-t border-surface-container flex items-center justify-between">
              <span className="text-sm text-secondary font-medium">Showing 4 of 124 records</span>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-lowest transition-colors disabled:opacity-50" disabled>
                  <ChevronLeft size={20} />
                </button>
                <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-lowest transition-colors text-on-surface">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && file && (
        <div className="fixed bottom-8 right-8 bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-4 animate-bounce">
          <CheckCircle2 className="text-green-400" size={24} />
          <div>
            <p className="font-bold">File Uploaded</p>
            <p className="text-sm opacity-80">{file.name} is ready for validation.</p>
          </div>
        </div>
      )}
    </div>
  );
}
