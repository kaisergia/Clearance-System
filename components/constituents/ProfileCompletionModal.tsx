"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DEPT_PROGRAMS } from "@/lib/constants";
import { useSession } from "next-auth/react";
import * as clearanceService from "@/services/clearanceService";
import { GraduationCap, Landmark, Users, ArrowRight, Loader2, CreditCard, Layers } from "lucide-react";

interface ProfileCompletionModalProps {
  isOpen: boolean;
}

export default function ProfileCompletionModal({ isOpen }: ProfileCompletionModalProps) {
  const { data: session, update } = useSession();
  const [mounted, setMounted] = useState(false);

  // Form states
  const [studentId, setStudentId] = useState("");
  const [college, setCollege] = useState(""); // Stores abbreviation like "CCIS"
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState<number | "">("");
  const [enrolledClubs, setEnrolledClubs] = useState<number[]>([]);

  // Metadata loaders
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [clubsList, setClubsList] = useState<any[]>([]);

  const [errors, setErrors] = useState<{ studentId?: string; college?: string; program?: string; yearLevel?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Portal mount check & load DB metadata (falls back to mock automatically)
  useEffect(() => {
    setMounted(true);

    const loadMetadata = async () => {
      try {
        const depts = await clearanceService.getDepartments();
        setDepartmentsList(depts || []);

        const orgs = await clearanceService.getOrgs();
        // Filter orgs to show only AcademicClub and NonAcademicClub
        const filteredClubs = (orgs || []).filter(
          (o) => o.type === "AcademicClub" || o.type === "NonAcademicClub"
        );
        setClubsList(filteredClubs);
      } catch (err) {
        console.error("Error loading dropdown metadata:", err);
      }
    };

    loadMetadata();
  }, []);

  // Reset program if college changes
  useEffect(() => {
    setProgram("");
  }, [college]);

  if (!isOpen || !mounted) return null;

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!studentId.trim()) newErrors.studentId = "Student ID is required.";
    if (!college) newErrors.college = "Department / College is required.";
    if (!program) newErrors.program = "Course / Program is required.";
    if (!yearLevel) newErrors.yearLevel = "Year Level is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClubToggle = (clubId: number) => {
    setEnrolledClubs((prev) =>
      prev.includes(clubId) ? prev.filter((id) => id !== clubId) : [...prev, clubId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/student/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: studentId.trim(),
          college,
          program,
          yearLevel: Number(yearLevel),
          enrolledClubs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      if (data.fallback) {
        // DB is offline - save to localStorage fallback pattern
        localStorage.setItem("mock_isProfileComplete", "true");
        localStorage.setItem("activeStudentProfileComplete", "true");

        const oldStudentId = localStorage.getItem("activeStudentId") || "2021-0492";
        const newStudentId = studentId.trim();

        // Update active student details in localStorage
        localStorage.setItem("activeStudentId", newStudentId);
        document.cookie = `activeStudentId=${newStudentId}; path=/; max-age=86400`;

        const storedStudents = localStorage.getItem("students");
        if (storedStudents) {
          const studentsList = JSON.parse(storedStudents);
          const yearString = `${yearLevel}${yearLevel === 1 ? "st" : yearLevel === 2 ? "nd" : yearLevel === 3 ? "rd" : "th"} Year`;
          
          let studentFound = false;
          const updatedList = studentsList.map((s: any) => {
            if (s.id === oldStudentId) {
              studentFound = true;
              return {
                ...s,
                id: newStudentId,
                department: college,
                program: program,
                year: yearString,
              };
            }
            return s;
          });

          if (!studentFound) {
            updatedList.push({
              id: newStudentId,
              name: session?.user?.name || "Student User",
              email: session?.user?.email || "",
              department: college,
              program: program,
              year: yearString,
              status: "Pending",
              semester: "1st Semester 2025-2026",
            });
          }
          localStorage.setItem("students", JSON.stringify(updatedList));
        }

        // Migrate local clearance records key to the new Student ID
        const storedRecords = localStorage.getItem("studentClearanceRecords");
        if (storedRecords) {
          const records = JSON.parse(storedRecords);
          if (records[oldStudentId]) {
            records[newStudentId] = records[oldStudentId];
            delete records[oldStudentId];
            localStorage.setItem("studentClearanceRecords", JSON.stringify(records));
          }
        }

        // Save local memberships
        const mockOrgMembersList = enrolledClubs.map((orgId) => ({
          orgId,
          studentId: newStudentId,
        }));
        localStorage.setItem("orgMemberships", JSON.stringify(mockOrgMembersList));
      }

      // Update session locally to reflect isProfileComplete = true
      await update();

      // Trigger state sync event
      window.dispatchEvent(new Event("clearanceRecordsUpdated"));
      
      // Force reload or redirect student layout to reload local states
      window.location.reload();
    } catch (err: any) {
      console.error("[ProfileCompletion] Error submitting profile:", err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-lg w-full max-w-lg p-6 md:p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header Section */}
        <div className="pb-4 border-b border-surface-container-high flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-brand-red/10 text-brand-red rounded-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-headline-lg text-lg font-bold text-on-surface">
              Complete Your Profile
            </h2>
            <p className="text-secondary text-xs mt-0.5 leading-tight">
              Please provide your student details to set up your clearance dashboard.
            </p>
          </div>
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student ID */}
          <div className="space-y-1.5">
            <label htmlFor="studentId" className="block text-xs font-bold text-secondary uppercase tracking-wide">
              Student ID
            </label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., 2021-0001-5"
              className={`w-full px-3 py-2 rounded-lg border bg-surface-container-lowest text-on-surface font-body-sm text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all ${
                errors.studentId ? "border-red-500 ring-1 ring-red-500" : "border-surface-container-high"
              }`}
            />
            {errors.studentId && <p className="text-red-500 text-xs font-semibold mt-1">{errors.studentId}</p>}
          </div>

          {/* Department / College Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="college" className="block text-xs font-bold text-secondary uppercase tracking-wide">
              Department
            </label>
            <select
              id="college"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 rounded-lg border bg-surface-container-lowest text-on-surface font-body-sm text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all ${
                errors.college ? "border-red-500 ring-1 ring-red-500" : "border-surface-container-high"
              }`}
            >
              <option value="">Select Department</option>
              {departmentsList.map((dept) => (
                <option key={dept.id} value={dept.abbreviation}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.college && <p className="text-red-500 text-xs font-semibold mt-1">{errors.college}</p>}
          </div>

          {/* Course Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="program" className="block text-xs font-bold text-secondary uppercase tracking-wide">
              Course / Program
            </label>
            <select
              id="program"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              disabled={!college || isSubmitting}
              className={`w-full px-3 py-2 rounded-lg border bg-surface-container-lowest text-on-surface font-body-sm text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all ${
                errors.program ? "border-red-500 ring-1 ring-red-500" : "border-surface-container-high"
              } ${!college ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">Select Course</option>
              {college &&
                DEPT_PROGRAMS[college]?.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
            </select>
            {errors.program && <p className="text-red-500 text-xs font-semibold mt-1">{errors.program}</p>}
          </div>

          {/* Year Level Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="yearLevel" className="block text-xs font-bold text-secondary uppercase tracking-wide">
              Year Level
            </label>
            <select
              id="yearLevel"
              value={yearLevel}
              onChange={(e) => setYearLevel(Number(e.target.value))}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 rounded-lg border bg-surface-container-lowest text-on-surface font-body-sm text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all ${
                errors.yearLevel ? "border-red-500 ring-1 ring-red-500" : "border-surface-container-high"
              }`}
            >
              <option value="">Select Year Level</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            {errors.yearLevel && <p className="text-red-500 text-xs font-semibold mt-1">{errors.yearLevel}</p>}
          </div>

          {/* Organizations / Enrolled Clubs (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wide">
              Organizations / Enrolled Clubs (Optional)
            </label>
            <div className="border border-surface-container-high bg-surface-container-lowest rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto shadow-inner">
              {clubsList.length === 0 ? (
                <p className="text-secondary text-xs">No clubs available.</p>
              ) : (
                clubsList.map((club) => (
                  <label
                    key={club.id}
                    className="flex items-center justify-between p-1.5 hover:bg-surface-container-low rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={enrolledClubs.includes(club.id)}
                        onChange={() => handleClubToggle(club.id)}
                        disabled={isSubmitting}
                        className="rounded border-surface-container-high text-brand-red focus:ring-brand-red h-4 w-4 cursor-pointer"
                      />
                      <span className="font-body-md text-sm text-on-surface">{club.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border ${
                      club.type === "AcademicClub"
                        ? "bg-brand-red/10 text-brand-red border-brand-red/20"
                        : "bg-surface-container-high text-secondary border-surface-container-high"
                    }`}>
                      {club.type === "AcademicClub" ? "academic" : "non-academic"}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
