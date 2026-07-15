"use client";

import { useState, useEffect } from "react";
import { mockStudents } from "@/mock/mockStudents";

export default function StudentProfile() {
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    // Load student profile dynamically
    const storedStudents = localStorage.getItem("students");
    const studentsList = storedStudents ? JSON.parse(storedStudents) : mockStudents;
    const activeStudentId = localStorage.getItem("activeStudentId") || "2021-0492";
    const currentStudent = studentsList.find((s: any) => s.id === activeStudentId) || studentsList[0];
    setStudent(currentStudent);
  }, []);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header Section */}
      <section className="pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-background">
            My Profile
          </h2>
          <p className="text-secondary text-body-sm">
            View and manage your student profile information
          </p>
        </div>
      </section>

      {/* Profile Details Card */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-surface-container-high">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-3xl shadow-sm">
            <span>{student.name.charAt(0)}</span>
          </div>
          <div className="text-center sm:text-left space-y-1.5">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
              {student.name}
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 tracking-wider">
              {student.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Student ID", value: student.id, icon: "badge" },
            { label: "Email Address", value: student.email, icon: "mail" },
            { label: "Department", value: student.department, icon: "domain" },
            { label: "Academic Program", value: student.program, icon: "school" },
            { label: "Year Level", value: student.year, icon: "grade" },
            { label: "Active Semester", value: student.semester, icon: "calendar_today" },
          ].map((info) => (
            <div key={info.label} className="flex gap-4 p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40">
              <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">
                {info.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-0.5">
                  {info.label}
                </p>
                <p className="font-body-md text-body-md text-on-surface font-medium truncate">
                  {info.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
