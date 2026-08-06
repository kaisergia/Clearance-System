"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DEPT_PROGRAMS } from "@/lib/constants";
import { useSession } from "next-auth/react";
import * as clearanceService from "@/services/clearanceService";
import { 
  UserPlus, 
  X, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Loader2 
} from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newUser: any) => void;
  isFirstLoginMode?: boolean; // True when shown to first-time logging in student
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSuccess,
  isFirstLoginMode = false,
}: AddUserModalProps) {
  const { data: session, update } = useSession();
  const [mounted, setMounted] = useState(false);

  // Name Fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");

  // Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("student");

  // Domain & Student Type
  const [studentType, setStudentType] = useState<"regular" | "csp">("regular");
  const [department, setDepartment] = useState("");
  const [assignedOffice, setAssignedOffice] = useState("Registrar");
  const [assignedOrg, setAssignedOrg] = useState("Association Of Computer Studies Students");
  const [cspDivision, setCspDivision] = useState("");

  // Student specific fields
  const [studentId, setStudentId] = useState("");
  const [dob, setDob] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [enrolledClubs, setEnrolledClubs] = useState<number[]>([]);

  // Metadata lists
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [clubsList, setClubsList] = useState<any[]>([]);
  const [officesList, setOfficesList] = useState<any[]>([]);
  const [orgsList, setOrgsList] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setMounted(true);

    const loadMetadata = async () => {
      try {
        const depts = await clearanceService.getDepartments();
        if (depts && depts.length > 0) {
          setDepartmentsList(depts);
          // Set default department
          setDepartment(depts[0].abbreviation || depts[0].name);
        }

        const orgs = await clearanceService.getOrgs();
        if (orgs && orgs.length > 0) {
          setOrgsList(orgs);
          setAssignedOrg(orgs[0].name);
        }
        const filteredClubs = (orgs || []).filter(
          (o) => o.type === "AcademicClub" || o.type === "NonAcademicClub"
        );
        setClubsList(filteredClubs);

        // Fetch offices dynamically
        const officesRes = await fetch("/api/offices");
        if (officesRes.ok) {
          const officesData = await officesRes.json();
          setOfficesList(officesData);
          if (officesData.length > 0) {
            setAssignedOffice(officesData[0].name);
          }
        }
      } catch (err) {
        console.error("Error loading metadata for Add User modal:", err);
      }
    };

    loadMetadata();
  }, []);

  // Pre-fill email in first-login mode
  useEffect(() => {
    if (isFirstLoginMode && session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [isFirstLoginMode, session]);

  // Handle department change & load courses
  const handleDepartmentChange = (deptCode: string) => {
    setDepartment(deptCode);
    setCourse("");
  };

  if (!isOpen || !mounted) return null;

  const handleClubToggle = (clubId: number) => {
    setEnrolledClubs((prev) =>
      prev.includes(clubId) ? prev.filter((id) => id !== clubId) : [...prev, clubId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!email.trim()) {
      setSubmitError("Email address is required.");
      return;
    }

    if (!isFirstLoginMode && password && password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isFirstLoginMode) {
        // First-login mode for student profile completion
        const res = await fetch("/api/student/complete-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: studentId.trim(),
            college: studentType === "csp" ? "CSP" : department,
            program: course,
            yearLevel: Number(yearLevel.replace(/\D/g, "")) || 1,
            enrolledClubs,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to complete profile");
        }

        await update();
        if (onSuccess) onSuccess({ email, studentId });
        onClose();
        window.location.reload();
      } else {
        // Admin Add User Mode (from old version of clearance system)
        const fullName = `${firstName.trim()} ${middleName.trim()} ${lastName.trim()}`.replace(/\s+/g, " ");
        const createdUser = await clearanceService.createUser({
          email: email.trim(),
          displayName: fullName.trim() || email.split("@")[0].toUpperCase(),
          role,
          departmentName: role === "department" ? department : role === "head_office" || role === "office_staff" ? assignedOffice : role === "org_adviser" ? assignedOrg : department,
          program: role === "student" ? course : undefined,
          year: role === "student" ? yearLevel : undefined,
          studentId: role === "student" ? studentId.trim() : undefined,
        });

        if (onSuccess) onSuccess(createdUser);
        onClose();
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper courses for selected department
  const currentCourses = department ? DEPT_PROGRAMS[department] || [] : [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-[540px] max-h-[88vh] flex flex-col overflow-hidden animate-scaleUp font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-8 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#c82333] flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              <p className="text-xs text-gray-500">Create a new user account</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              {submitError}
            </div>
          )}

          <form id="addUserForm" onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            {/* Name Fields (First, Middle, Last Name in 3 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-gray-900 text-xs mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 text-xs mb-1.5">Middle Name</label>
                <input
                  type="text"
                  placeholder="(optional)"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-900 text-xs mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dela Cruz"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-bold text-gray-900 text-xs mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="username@g.cjc.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isFirstLoginMode || isSubmitting}
                  className="w-full h-12 px-4 pr-10 bg-white border border-gray-300 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-red-600"
                />
                {email && !isFirstLoginMode && (
                  <button
                    type="button"
                    onClick={() => setEmail("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 font-normal mt-1">Must be a @g.cjc.edu.ph email address</p>
            </div>

            {!isFirstLoginMode && (
              <>
                {/* Password */}
                <div>
                  <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full h-12 px-4 pr-11 bg-white border border-gray-300 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full h-12 px-4 pr-11 bg-white border border-gray-300 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Role</label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full h-12 px-4 pr-10 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600"
                    >
                      <option value="student">Student</option>
                      <option value="department">Department Head (College Dean)</option>
                      <option value="head_office">Office Head</option>
                      <option value="office_staff">Office Staff / Evaluator</option>
                      <option value="org_adviser">Club / Organization Adviser</option>
                      <option value="admin">System Admin</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Assigned Office (shown for Office Head and Office Staff) */}
                {(role === "head_office" || role === "office_staff") && (
                  <div>
                    <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Assigned Office</label>
                    <div className="relative">
                      <select
                        value={assignedOffice}
                        onChange={(e) => setAssignedOffice(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-12 px-4 pr-10 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600"
                      >
                        {officesList.map((o) => (
                          <option key={o.id} value={o.name}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Assigned Organization/Club (shown for Club / Org Adviser) */}
                {role === "org_adviser" && (
                  <div>
                    <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Assigned Organization / Club</label>
                    <div className="relative">
                      <select
                        value={assignedOrg}
                        onChange={(e) => setAssignedOrg(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-12 px-4 pr-10 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600"
                      >
                        {orgsList.map((o) => (
                          <option key={o.id} value={o.name}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Assigned Department (shown for Department Head) */}
                {role === "department" && (
                  <div>
                    <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Assigned Department</label>
                    <div className="relative">
                      <select
                        value={department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-12 px-4 pr-10 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600"
                      >
                        <option value="">Select Department</option>
                        {departmentsList.map((d) => (
                          <option key={d.id} value={d.abbreviation || d.name}>
                            {d.name} ({d.abbreviation})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}
              </>
            )}

            {(role === "student" || isFirstLoginMode) && (
              <>
                {/* Student ID */}
                <div>
                  <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Student ID</label>
                  <input
                    type="text"
                    placeholder="e.g., 2021-0001-5"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-12 px-4 bg-white border border-gray-300 rounded-2xl text-sm font-medium text-gray-800 outline-none focus:border-red-600"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-12 px-4 bg-white border border-gray-300 rounded-2xl text-sm font-medium text-gray-700 outline-none focus:border-red-600"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Optional</p>
                </div>

                {/* Student Type Selector */}
                <div>
                  <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Student Type</label>
                  <div className="relative">
                    <select
                      value={studentType}
                      onChange={(e) => {
                        const type = e.target.value as "regular" | "csp";
                        setStudentType(type);
                        if (type === "csp") {
                          setDepartment("CSP");
                          setCourse("CSP Program");
                        } else {
                          setDepartment("");
                          setCourse("");
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full h-12 px-4 pr-10 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600"
                    >
                      <option value="regular">Regular College Student</option>
                      <option value="csp">College of Special Programs (CSP) Student</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Regular Student: Department Selection */}
                {studentType === "regular" && (
                  <div>
                    <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Department</label>
                    <div className="relative">
                      <select
                        value={department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-12 px-4 pr-10 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600"
                      >
                        <option value="">Select Department</option>
                        <option value="CCIS">College of Computing and Information Sciences</option>
                        <option value="CABE">College of Business and Governance</option>
                        <option value="COE">College of Engineering</option>
                        <option value="CHS">College of Health Sciences</option>
                        <option value="CEDAS">College of Education, Arts and Sciences</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* CSP Student: Show Division selection */}
                {studentType === "csp" && (
                  <div>
                    <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">CSP Division</label>
                    <div className="relative">
                      <select
                        value={cspDivision}
                        onChange={(e) => setCspDivision(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-12 px-4 pr-10 bg-white border border-gray-300 rounded-2xl text-sm font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600"
                      >
                        <option value="">Select Division</option>
                        <option value="NIGHT">Night Division</option>
                        <option value="ETEEAP">ETEEAP Division</option>
                        <option value="DISTANCE">Distance Education Division</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Course & Year Level */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Course</label>
                    <div className="relative">
                      <select
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        disabled={isSubmitting || (studentType === "regular" && !department)}
                        className="w-full h-12 px-3.5 pr-8 bg-white border border-gray-300 rounded-2xl text-xs font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">
                          {!department && studentType === "regular" ? "Select Department First" : "Select Course"}
                        </option>
                        {currentCourses.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">Year Level</label>
                    <div className="relative">
                      <select
                        value={yearLevel}
                        onChange={(e) => setYearLevel(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-12 px-3.5 pr-8 bg-white border border-gray-300 rounded-2xl text-xs font-semibold text-gray-800 outline-none appearance-none cursor-pointer focus:border-red-600"
                      >
                        <option value="">Select Year Level</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Enrolled Clubs (Optional) */}
                <div>
                  <label className="block font-bold text-gray-900 text-xs sm:text-sm mb-1.5">
                    Enrolled Clubs <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="border border-gray-200 rounded-2xl p-3.5 bg-gray-50/50 space-y-2.5 max-h-40 overflow-y-auto">
                    {clubsList.length === 0 ? (
                      <>
                        <label className="flex items-center justify-between cursor-pointer select-none">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" className="w-4 h-4 rounded text-red-600 focus:ring-red-600 border-gray-300" />
                            <span className="text-xs font-semibold text-gray-800">Association Of Computer Studies Students</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">academic</span>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer select-none">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" className="w-4 h-4 rounded text-red-600 focus:ring-red-600 border-gray-300" />
                            <span className="text-xs font-semibold text-gray-800">College Red Cross Youth Council</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">non-academic</span>
                        </label>
                      </>
                    ) : (
                      clubsList.map((club) => (
                        <label key={club.id} className="flex items-center justify-between cursor-pointer select-none">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={enrolledClubs.includes(club.id)}
                              onChange={() => handleClubToggle(club.id)}
                              disabled={isSubmitting}
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-600 border-gray-300"
                            />
                            <span className="text-xs font-semibold text-gray-800">{club.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {club.type === "AcademicClub" ? "academic" : "non-academic"}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Fixed Footer Action Buttons */}
        <div className="p-6 sm:p-8 pt-3 border-t border-gray-100 bg-white flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-2xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="addUserForm"
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-2xl bg-[#c82333] hover:bg-[#a71d2a] text-white font-bold transition-all shadow-md active:scale-95 text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isFirstLoginMode ? (
              "Complete Profile"
            ) : (
              "Create User"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
