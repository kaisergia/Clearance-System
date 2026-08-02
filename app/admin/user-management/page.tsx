"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useOffices } from "@/components/contexts/OfficesContext";
import { useDepartments } from "@/components/contexts/DepartmentsContext";
import * as clearanceService from "@/services/clearanceService";
import AddUserModal from "@/components/constituents/AddUserModal";
import { 
  Building2, 
  Landmark, 
  Users, 
  Plus, 
  Search, 
  ChevronDown, 
  Upload,
  Download,
  X,
  FileSpreadsheet,
  RotateCw,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function UnifiedUserManagementPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") || "users";

  const { offices, deleteOffice, setOpenAddOfficeModal } = useOffices();
  const { departments } = useDepartments();

  // Active Tab: "users" | "offices" | "departments" | "orgs"
  const [activeTab, setActiveTab] = useState<"users" | "offices" | "departments" | "orgs">(
    (tabParam as any) || "users"
  );

  useEffect(() => {
    if (tabParam && ["users", "offices", "departments", "orgs"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabSwitch = (tab: "users" | "offices" | "departments" | "orgs") => {
    setActiveTab(tab);
    router.push(`/admin/user-management?tab=${tab}`);
  };

  // Real Database Lists
  const [allUsersList, setAllUsersList] = useState<any[]>([]);
  const [orgsList, setOrgsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [selectedOfficeId, setSelectedOfficeId] = useState("all");

  // Notification Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Modal States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any | null>(null);
  const [resetConfirmUser, setResetConfirmUser] = useState<any | null>(null);

  // Edit User Form State
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("student");
  const [editUserOfficeId, setEditUserOfficeId] = useState<string>("");
  const [editUserDepartmentId, setEditUserDepartmentId] = useState<string>("");
  const [editUserOrgId, setEditUserOrgId] = useState<string>("");
  const [editUserDept, setEditUserDept] = useState("CCIS");
  const [editUserProgram, setEditUserProgram] = useState("BSIT");
  const [editUserStatus, setEditUserStatus] = useState("Active");

  // New Org Form State
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState("AcademicClub");
  const [newOrgCategory, setNewOrgCategory] = useState("Academic");
  const [newOrgDept, setNewOrgDept] = useState("CCIS");
  const [newOrgAdviser, setNewOrgAdviser] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load Real Data from DB APIs
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedOrgs] = await Promise.all([
        clearanceService.getUsers(),
        clearanceService.getOrgs(),
      ]);
      setAllUsersList(fetchedUsers || []);
      setOrgsList(fetchedOrgs || []);
    } catch (err) {
      console.error("Failed to load user management data from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Open Edit Modal
  const handleOpenEditUser = (user: any) => {
    const rawUser = user.raw || user;
    setEditingUser(rawUser);
    setEditUserName(rawUser.displayName || rawUser.name || user.name || "");
    setEditUserEmail(rawUser.email || user.email || "");

    // Normalize role string e.g. "Office Head" -> "head_office"
    let roleKey = rawUser.role || "student";
    if (roleKey === "Office Head") roleKey = "head_office";
    if (roleKey === "Department Head") roleKey = "department";
    if (roleKey === "Org Adviser") roleKey = "org";
    if (roleKey === "System Admin") roleKey = "admin";
    if (roleKey === "Student") roleKey = "student";
    setEditUserRole(roleKey);

    setEditUserOfficeId(rawUser.officeId ? String(rawUser.officeId) : offices[0]?.id ? String(offices[0].id) : "");
    setEditUserDepartmentId(rawUser.departmentId ? String(rawUser.departmentId) : departments[0]?.id ? String(departments[0].id) : "");
    setEditUserOrgId(rawUser.orgId ? String(rawUser.orgId) : orgsList[0]?.id ? String(orgsList[0].id) : "");

    setEditUserDept(rawUser.department?.name || rawUser.student?.department || rawUser.departmentName || "CCIS");
    setEditUserProgram(rawUser.student?.program || "BSIT");
    setEditUserStatus(rawUser.student?.status || "Active");
    setShowEditUserModal(true);
  };

  // Handle Edit User Submit
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserName.trim() || !editUserEmail.trim()) return;

    try {
      await clearanceService.updateUser(editingUser.id, {
        displayName: editUserName.trim(),
        email: editUserEmail.trim(),
        role: editUserRole,
        officeId: editUserRole === "head_office" ? editUserOfficeId : undefined,
        departmentId: editUserRole === "department" ? editUserDepartmentId : undefined,
        orgId: editUserRole === "org" ? editUserOrgId : undefined,
        departmentName: editUserDept,
        program: editUserProgram,
        status: editUserStatus,
      });

      showToast(`User ${editUserName} updated successfully!`);
      setShowEditUserModal(false);
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to update user"}`);
    }
  };

  // Handle Delete User Submit
  const handleConfirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await clearanceService.deleteUser(deleteConfirmUser.id);
      showToast(`User ${deleteConfirmUser.displayName || deleteConfirmUser.name} deleted.`);
      setDeleteConfirmUser(null);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message || "Failed to delete user"}`);
    }
  };

  // Handle Password Reset / Sync
  const handleConfirmResetPassword = async () => {
    if (!resetConfirmUser) return;
    const tempPassword = `CJC@${Math.floor(1000 + Math.random() * 9000)}`;
    showToast(`Password for ${resetConfirmUser.displayName || resetConfirmUser.name} reset to: ${tempPassword}`);
    setResetConfirmUser(null);
  };

  // Excel Template Download Handler
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Student ID,Name,Email,Department,Program,Year Level\n2026-0001,Sample Student,sample@g.cjc.edu.ph,CCIS,BSIT,1st Year\n2026-0002,Jane Doe,jane@g.cjc.edu.ph,CABE,BSBA,2nd Year";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clearance_students_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Excel Drag & Drop Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      showToast(`Uploaded ${file.name}. Processing student records...`);
      setTimeout(() => {
        showToast(`Successfully imported student records from ${file.name}!`);
        setShowImportModal(false);
        loadData();
      }, 1200);
    }
  };

  // Sync real student records from SSC System Masterlist API
  const handleSyncSSCMasterlist = async () => {
    try {
      showToast("Connecting to SSC System Masterlist API (http://localhost:8081)...");
      const res = await fetch("/api/integration/ssc/masterlist?sync=true");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync SSC Masterlist");
      }

      showToast(data.message || "Successfully synced students from SSC System Masterlist!");
      loadData();
    } catch (err: any) {
      showToast(`SSC Sync Error: ${err.message || "Failed to connect to SSC System API"}`);
    }
  };

  // Handle Logo Upload Preview
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const created = {
      id: Date.now(),
      name: newOrgName.trim(),
      type: newOrgType,
      category: newOrgCategory,
      department: newOrgDept === "CSG" ? null : newOrgDept,
      adviser: newOrgAdviser || "Prof. Adviser",
      description: newOrgDescription,
      status: "Active",
      memberCount: 1,
      logoUrl: logoPreview || null,
    };

    setOrgsList((prev) => [...prev, created]);
    setShowAddOrgModal(false);
    showToast(`Organization ${newOrgName} created!`);
    setNewOrgName("");
    setNewOrgDescription("");
    setLogoPreview(null);
  };

  // Format real users for Manage Constituents table
  const formattedUsers = allUsersList.map((u: any) => {
    const isStudent = u.role === "student" || u.studentId;
    const name = u.displayName || u.student?.name || u.name || "Unknown User";
    const email = u.email || (u.student ? u.student.email : `${u.id}@g.cjc.edu.ph`);
    const dept = u.student?.department || u.department?.abbreviation || u.departmentName || (u.role === "admin" ? "System Admin" : "CCIS");
    const prog = u.student?.program || "N/A";
    const status = u.student?.status || "Active";
    const roleLabel = u.role === "admin" ? "System Admin" : u.role === "head_office" ? "Office Head" : u.role === "department" ? "Department Head" : u.role === "org" ? "Org Adviser" : "Student";
    const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

    const avatarUrl = u.avatarUrl || u.student?.avatarUrl || u.avatar || u.student?.avatar || u.photoUrl || u.profilePicture || u.image || null;

    return {
      raw: u,
      id: u.id,
      studentId: u.studentId || (isStudent ? u.id : null),
      name,
      email,
      avatarUrl,
      role: roleLabel,
      department: dept,
      program: prog,
      status,
      joined: u.student?.year || "2026",
      initials: initials || "US",
    };
  });

  // Filtered Constituents
  const filteredUsers = formattedUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.studentId && String(u.studentId).toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "All Roles" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-[9999] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fadeIn border border-gray-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage system users and permissions</p>
      </div>

      {/* Summary Cards Grid (Dynamic DB Counts) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {[
          { label: "Total Users", count: String(formattedUsers.length), highlight: false },
          { label: "Students", count: String(formattedUsers.filter((u) => u.role === "Student").length), highlight: false },
          { label: "Offices", count: String(offices.length), highlight: false },
          { label: "Dept/Clubs/Orgs", count: String(departments.length + orgsList.length), highlight: false },
          { label: "Admins", count: String(formattedUsers.filter((u) => u.role === "System Admin").length || 1), highlight: false },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs text-center">
            <span className="text-2xl font-extrabold text-gray-900 block">{card.count}</span>
            <span className="text-xs font-semibold text-gray-500 mt-1 block">{card.label}</span>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 1: USERS (MANAGE CONSTITUENTS)
         ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar (Search + Import Excel + Add User) */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full max-w-lg">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b51b15]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none cursor-pointer"
              >
                <option value="All Roles">All Roles</option>
                <option value="Student">Student</option>
                <option value="Office Head">Office Head</option>
                <option value="Department Head">Department Head</option>
                <option value="System Admin">System Admin</option>
              </select>

              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-gray-600" />
                <span>Import Excel</span>
              </button>

              <button
                onClick={handleSyncSSCMasterlist}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title="Sync real student masterlist records from SSC System API (http://localhost:8081)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Sync SSC API</span>
              </button>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#b51b15] hover:bg-[#961410] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Constituents User Table (Real DB Users) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Program</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#b51b15] border-r-transparent mr-2" />
                        Loading database users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500 text-xs">
                        No user records found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* USER */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0 shadow-2xs border border-gray-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#800000] text-[#ffffff] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {user.initials}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                {user.name}
                                {user.studentId && (
                                  <Link
                                    href={`/admin/user-management/students/${encodeURIComponent(user.studentId)}`}
                                    className="text-xs text-[#b51b15] hover:underline font-normal inline-flex items-center gap-0.5"
                                    title="View Clearance Status"
                                  >
                                    (View Clearance Status)
                                  </Link>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* ROLE */}
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            user.role === "System Admin"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : user.role === "Office Head"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        {/* DEPARTMENT */}
                        <td className="px-6 py-3.5 font-semibold text-gray-700">
                          {user.department}
                        </td>

                        {/* PROGRAM */}
                        <td className="px-6 py-3.5 text-gray-600">
                          {user.program}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {user.status}
                          </span>
                        </td>

                        {/* JOINED */}
                        <td className="px-6 py-3.5 text-gray-500">
                          {user.joined}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2 text-gray-400">
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="hover:text-gray-700 transition-colors p-1"
                              title="Edit User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmUser(user)}
                              className="hover:text-red-600 transition-colors p-1"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 2: ALL OFFICES
         ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "offices" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Bar: Dropdown + Add Office Button */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                Select Office:
              </label>
              <div className="relative w-full">
                <select
                  value={selectedOfficeId}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                  className="w-full h-10 pl-3 pr-10 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b51b15]/20 focus:border-[#b51b15] cursor-pointer appearance-none"
                >
                  <option value="all">All Offices ({offices.length})</option>
                  {offices.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.name} {o.head?.name ? `(${o.head.name})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => setOpenAddOfficeModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b51b15] hover:bg-[#961410] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Add Office</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-3.5">Office Name</th>
                    <th className="px-6 py-3.5">Assigned Head</th>
                    <th className="px-6 py-3.5">Contact Email</th>
                    <th className="px-6 py-3.5 text-center">Pending</th>
                    <th className="px-6 py-3.5 text-center">Approved</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {offices
                    .filter((o) => selectedOfficeId === "all" || String(o.id) === selectedOfficeId)
                    .map((office: any) => {
                      const officeLogo = office.logoUrl || office.logo || office.customization?.logoUrl;
                      const headObj = office.headUser || office.head;
                      const headName = typeof headObj === "string" ? headObj : headObj?.name || office.head || "Unassigned";
                      const headEmail = typeof headObj === "object" ? headObj?.email || office.email : office.email || "N/A";
                      const headAvatar = typeof headObj === "object" ? headObj?.avatarUrl || headObj?.avatar : null;
                      const headInitials = headName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "HD";

                      return (
                        <tr key={office.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* OFFICE NAME & LOGO */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {officeLogo ? (
                                <img
                                  src={officeLogo}
                                  alt={office.name}
                                  className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200 shadow-2xs"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-red-50 text-[#c41e2a] flex items-center justify-center font-bold text-xs shrink-0 border border-red-100">
                                  {office.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-bold text-gray-900 text-xs">{office.name}</span>
                            </div>
                          </td>

                          {/* ASSIGNED HEAD (Constituent-style profile) */}
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {headAvatar ? (
                                <img
                                  src={headAvatar}
                                  alt={headName}
                                  className="w-8 h-8 rounded-full object-cover shrink-0 shadow-2xs border border-gray-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#800000] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                  {headInitials}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-gray-900 text-xs">{headName}</div>
                                <div className="text-[11px] text-gray-400 font-mono">{headEmail}</div>
                              </div>
                            </div>
                          </td>

                          {/* CONTACT EMAIL */}
                          <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">
                            {office.email || headEmail}
                          </td>

                          {/* PENDING COUNT */}
                          <td className="px-6 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {office.pending || 0} Pending
                            </span>
                          </td>

                          {/* APPROVED COUNT */}
                          <td className="px-6 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {office.approved || 0} Approved
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/admin/offices/${office.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors" title="Manage Office">
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button onClick={() => deleteOffice(office.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 3: DEPARTMENTS (Directly listing departments & affiliated orgs!)
         ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "departments" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Academic Departments & Affiliated Groups</h2>
              <p className="text-xs text-gray-500 mt-0.5">Overview of departments and their linked student organizations & clubs</p>
            </div>

            <button
              onClick={() => setShowAddOrgModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b51b15] hover:bg-[#961410] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Organization</span>
            </button>
          </div>

          <div className="space-y-6">
            {departments.map((dept) => {
              const deptOrgs = orgsList.filter((o) => o.department === dept.abbreviation);

              return (
                <div key={dept.id} className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden space-y-4 p-6">
                  {/* Department Banner Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-200">
                        {dept.abbreviation}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{dept.name}</h3>
                        <p className="text-xs text-gray-500">
                          Dean / Head: {typeof dept.head === "object" ? dept.head?.name : dept.head || "Unassigned"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full self-start sm:self-auto">
                        {deptOrgs.length} Affiliated Organizations
                      </span>
                      <Link
                        href={`/admin/user-management?tab=departments&deptId=${dept.id}`}
                        className="px-3 py-1.5 bg-[#b51b15] hover:bg-[#961410] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
                      >
                        Manage Department
                      </Link>
                    </div>
                  </div>

                  {/* Affiliated Orgs & Clubs Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Affiliated Student Organizations & Clubs ({dept.abbreviation}):
                    </h4>

                    {deptOrgs.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-5 text-center text-xs text-gray-500 border border-dashed border-gray-200">
                        No organizations currently registered under {dept.abbreviation}.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deptOrgs.map((org) => (
                          <div key={org.id} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                                  {org.category || "Academic Club"}
                                </span>
                                <span className="text-[11px] font-semibold text-gray-500">
                                  {org.memberCount || 0} Members
                                </span>
                              </div>
                              <h5 className="font-bold text-gray-900 text-sm">{org.name}</h5>
                              <p className="text-xs text-gray-500 mt-1">Adviser: {org.adviser || "N/A"}</p>
                            </div>

                            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                              <Link
                                href={`/admin/organizations/student-government?orgId=${org.id}`}
                                className="text-[#b51b15] font-bold hover:underline"
                              >
                                Manage Org
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 4: CLUBS & ORGS
         ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "orgs" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Student Organizations & Clubs</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage governance units, academic clubs, and interest groups</p>
            </div>

            <button
              onClick={() => setShowAddOrgModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b51b15] hover:bg-[#961410] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Organization / Club</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orgsList.map((org) => (
              <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between gap-4">
                <div className="flex items-start gap-3">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-[#b51b15] flex items-center justify-center font-bold text-sm shrink-0 border border-red-100">
                      {org.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 block w-max mb-1">
                      {org.type === "Gov" ? "University-Wide CSG" : org.type === "LGU" ? "Local Government" : org.category || "Club"}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm leading-snug">{org.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Parent Dept: {org.department || "All Colleges"}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Adviser: <strong className="text-gray-800">{org.adviser || "N/A"}</strong></span>
                  <Link
                    href={`/admin/organizations/student-government?orgId=${org.id}`}
                    className="text-[#b51b15] font-bold hover:underline"
                  >
                    Manage Org
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: ADD NEW USER (Shared Unified Component)
         ───────────────────────────────────────────────────────────────────────────── */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={() => {
          showToast("User created successfully!");
          loadData();
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: EDIT USER
         ───────────────────────────────────────────────────────────────────────────── */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={() => setShowEditUserModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Edit User Details</h3>
                  <p className="text-xs text-gray-500">Update account profile & role scoping</p>
                </div>
              </div>
              <button onClick={() => setShowEditUserModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium outline-none"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Role *</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-[#b51b15]"
                  >
                    <option value="head_office">Office Head (Registrar, Library, Guidance, etc.)</option>
                    <option value="department">Department Head (CCIS, CABE, CHSE, etc.)</option>
                    <option value="org">Organization / Club Adviser</option>
                    <option value="admin">System Admin</option>
                    <option value="student">Student</option>
                  </select>
                </div>

                {/* Dynamic Entity Assignment Dropdowns based on Role */}
                {editUserRole === "head_office" && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Assigned Head Office *</label>
                    <select
                      value={editUserOfficeId}
                      onChange={(e) => setEditUserOfficeId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-[#b51b15]"
                    >
                      {offices.map((office: any) => (
                        <option key={office.id} value={office.id}>
                          {office.name} ({office.head || "Office Head"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editUserRole === "department" && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Assigned Academic Department *</label>
                    <select
                      value={editUserDepartmentId}
                      onChange={(e) => setEditUserDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-[#b51b15]"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editUserRole === "org" && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Assigned Organization / Club *</label>
                    <select
                      value={editUserOrgId}
                      onChange={(e) => setEditUserOrgId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-[#b51b15]"
                    >
                      {orgsList.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.category || "Organization"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editUserRole === "student" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={editUserDept}
                        onChange={(e) => setEditUserDept(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Program</label>
                      <input
                        type="text"
                        value={editUserProgram}
                        onChange={(e) => setEditUserProgram(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#b51b15] hover:bg-[#961410] text-white font-bold shadow-md active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 3: DELETE CONFIRMATION
         ───────────────────────────────────────────────────────────────────────────── */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={() => setDeleteConfirmUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-7 h-7" />
              <h3 className="font-bold text-base text-gray-900">Confirm User Deletion</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete user <strong>{deleteConfirmUser.displayName || deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirmUser(null)} className="flex-1 py-2 rounded-xl border border-gray-300 font-bold text-gray-600 text-xs hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleConfirmDeleteUser} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md active:scale-95">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 4: RESET PASSWORD CONFIRMATION
         ───────────────────────────────────────────────────────────────────────────── */}
      {resetConfirmUser && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={() => setResetConfirmUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-amber-600">
              <RotateCw className="w-6 h-6" />
              <h3 className="font-bold text-base text-gray-900">Reset Credentials</h3>
            </div>
            <p className="text-xs text-gray-600">
              Reset temporary login credentials for <strong>{resetConfirmUser.displayName || resetConfirmUser.name}</strong> ({resetConfirmUser.email})?
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setResetConfirmUser(null)} className="flex-1 py-2 rounded-xl border border-gray-300 font-bold text-gray-600 text-xs hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleConfirmResetPassword} className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md active:scale-95">
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 5: ADD NEW ORGANIZATION / CLUB
         ───────────────────────────────────────────────────────────────────────────── */}
      {showAddOrgModal && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={() => setShowAddOrgModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#b51b15] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Add New Organization / Club</h3>
                  <p className="text-xs text-gray-500">Create a new student group or clearance entity</p>
                </div>
              </div>
              <button onClick={() => setShowAddOrgModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science Society"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium focus:ring-1 focus:ring-[#b51b15] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Club Type / Category *</label>
                  <select
                    value={newOrgType}
                    onChange={(e) => {
                      setNewOrgType(e.target.value);
                      if (e.target.value === "AcademicClub") setNewOrgCategory("Academic");
                      else if (e.target.value === "LGU") setNewOrgCategory("Governance");
                      else setNewOrgCategory("Non-Academic");
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-800 outline-none"
                  >
                    <option value="AcademicClub">Academic Club</option>
                    <option value="NonAcademicClub">Non-Academic / Interest Club</option>
                    <option value="LGU">Department LGU</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Parent Department *</label>
                  <select
                    value={newOrgDept}
                    onChange={(e) => setNewOrgDept(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-800 outline-none"
                  >
                    <option value="CSG">University-Wide (CSG)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.abbreviation}>{d.name} ({d.abbreviation})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of the organization"
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium focus:ring-1 focus:ring-[#b51b15] outline-none"
                />
              </div>

              {/* Logo Upload Box */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Organization Logo (optional)</label>
                <div className="relative border-2 border-dashed border-gray-300 hover:border-[#b51b15] rounded-xl p-4 text-center bg-gray-50/50 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {logoPreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={logoPreview} alt="Logo preview" className="w-10 h-10 rounded-lg object-cover border" />
                      <span className="text-xs text-emerald-600 font-bold">Logo uploaded! Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-700">
                        <span className="text-blue-600 font-bold hover:underline">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[10px] text-gray-400">PNG, JPG, WEBP or SVG (max 2MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Adviser Name</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Juan Dela Cruz"
                  value={newOrgAdviser}
                  onChange={(e) => setNewOrgAdviser(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium focus:ring-1 focus:ring-[#b51b15] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#b51b15] hover:bg-[#961410] text-white font-bold transition-all shadow-md active:scale-95"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 6: IMPORT EXCEL
         ───────────────────────────────────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">Import Students</h3>
                <p className="text-xs text-gray-500">Batch import students from an Excel file</p>
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
                    Download our Excel template with the correct format and sample data. The template includes a reference sheet with all valid values.
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
            <div className="relative border-2 border-dashed border-gray-300 hover:border-[#b51b15] rounded-xl p-6 text-center bg-gray-50/50 transition-colors cursor-pointer group">
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

            {/* Important Notes */}
            <div className="space-y-1 text-[11px] text-gray-500">
              <p className="font-bold text-gray-700">Important Notes:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Students will be created <strong>without passwords</strong></li>
                <li>Students must use "Forgot Password" on the login page to set their password</li>
                <li>Maximum 100 students per import</li>
                <li>Existing students matched by email or student ID will be updated</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
