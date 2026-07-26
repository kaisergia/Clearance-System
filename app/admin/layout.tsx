"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOffices } from "@/components/contexts/OfficesContext";
import { useDepartments } from "@/components/contexts/DepartmentsContext";
import { mockStudents, mockOfficeHeads } from "@/mock/mockStudents";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, LogOut } from "lucide-react";

function AddOfficeForm({ onCancel, onAdd }: { onCancel: () => void; onAdd: (data: any) => void }) {
  const [name, setName] = useState("");
  const [headName, setHeadName] = useState("");
  const [headEmail, setHeadEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const allConstituents = [...mockStudents, ...mockOfficeHeads];
  const filteredConstituents = headName 
    ? allConstituents.filter(c => c.name.toLowerCase().includes(headName.toLowerCase()) || c.email.toLowerCase().includes(headName.toLowerCase()))
    : allConstituents;

  const handleSelectHead = (constituent: any) => {
    setHeadName(constituent.name);
    setHeadEmail(constituent.email);
    setIsSearching(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !headName.trim() || !headEmail.trim()) return;
    onAdd({ name: name.trim(), description: description.trim(), head: { name: headName.trim(), email: headEmail.trim() } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <h3 className="font-title-md text-title-md text-on-surface">Add Office</h3>
        <button onClick={onCancel} className="p-1 rounded text-secondary hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="space-y-md">
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Office Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Registrar" />
        </div>
        <div className="relative">
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Office Head Name *</label>
          <input 
            value={headName} 
            onChange={(e) => {
              setHeadName(e.target.value);
              setIsSearching(true);
            }} 
            onFocus={() => setIsSearching(true)}
            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
            placeholder="Search for a constituent..." 
          />
          {isSearching && filteredConstituents.length > 0 && (
            <ul className="absolute z-10 w-full bg-surface-container-lowest border border-surface-container-high mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredConstituents.map(c => (
                <li 
                  key={c.id} 
                  className="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex flex-col"
                  onClick={() => handleSelectHead(c)}
                >
                  <span className="font-medium text-on-surface">{c.name}</span>
                  <span className="text-xs text-secondary">{c.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Office Head Email *</label>
          <input value={headEmail} onChange={(e) => setHeadEmail(e.target.value)} type="email" className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. head@uni.edu.ph" />
        </div>
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Optional description" />
        </div>
      </div>
      <div className="flex gap-sm mt-lg">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors">Cancel</button>
        <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors">Add Office</button>
      </div>
    </div>
  );
}

function AddDepartmentForm({ onCancel, onAdd }: { onCancel: () => void; onAdd: (data: any) => void }) {
  const [name, setName] = useState("");
  const [headName, setHeadName] = useState("");
  const [headEmail, setHeadEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const allConstituents = [...mockStudents, ...mockOfficeHeads];
  const filteredConstituents = headName 
    ? allConstituents.filter(c => c.name.toLowerCase().includes(headName.toLowerCase()) || c.email.toLowerCase().includes(headName.toLowerCase()))
    : allConstituents;

  const handleSelectHead = (constituent: any) => {
    setHeadName(constituent.name);
    setHeadEmail(constituent.email);
    setIsSearching(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || !headName.trim() || !headEmail.trim()) return;
    onAdd({ name: name.trim(), description: description.trim(), head: { name: headName.trim(), email: headEmail.trim() } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <h3 className="font-title-md text-title-md text-on-surface">Add Department</h3>
        <button onClick={onCancel} className="p-1 rounded text-secondary hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="space-y-md">
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Department Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. College of Engineering" />
        </div>
        <div className="relative">
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Department Head Name *</label>
          <input 
            value={headName} 
            onChange={(e) => {
              setHeadName(e.target.value);
              setIsSearching(true);
            }} 
            onFocus={() => setIsSearching(true)}
            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
            placeholder="Search for a constituent..." 
          />
          {isSearching && filteredConstituents.length > 0 && (
            <ul className="absolute z-10 w-full bg-surface-container-lowest border border-surface-container-high mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredConstituents.map(c => (
                <li 
                  key={c.id} 
                  className="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex flex-col"
                  onClick={() => handleSelectHead(c)}
                >
                  <span className="font-medium text-on-surface">{c.name}</span>
                  <span className="text-xs text-secondary">{c.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Department Head Email *</label>
          <input value={headEmail} onChange={(e) => setHeadEmail(e.target.value)} type="email" className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. dean@uni.edu.ph" />
        </div>
        <div>
          <label className="block font-body-sm text-body-sm text-on-surface mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-container-high bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Optional description" />
        </div>
      </div>
      <div className="flex gap-sm mt-lg">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-surface-container-high text-secondary hover:bg-surface-container-low transition-colors">Cancel</button>
        <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg bg-brand-red text-white hover:bg-primary transition-colors">Add Department</button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { offices, addOffice } = useOffices();
  const { departments, addDepartment } = useDepartments();

  const [expandedSection, setExpandedSection] = useState<string | null>("Offices");
  const [openAddOfficeModal, setOpenAddOfficeModal] = useState(false);
  const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    const devKeys = ["dev-role-override", "dev-entityId-override", "role", "officeId", "departmentId", "orgId", "activeStudentId", "avatarUrl"];
    devKeys.forEach((key) => {
      localStorage.removeItem(key);
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    });
    signOut({ callbackUrl: "/login" });
  };

  const toggleSection = (name: string) => {
    setExpandedSection(expandedSection === name ? null : name);
  };

  const isPathActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/admin/dashboard" },
    { label: "Announcements", icon: "campaign", href: "/admin/announcements" },
    { label: "Reports", icon: "assessment", href: "/admin/reports" },
    { label: "Audit Logs", icon: "history", href: "/admin/activity-logs" },
    { label: "Settings", icon: "settings", href: "/admin/settings" },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-4 z-40 md:hidden">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/logos/cjc-logo.webp"
            alt="Cor Jesu College Logo"
            className="h-8 w-8 object-contain rounded-full shadow-sm"
          />
          <div>
            <h1 className="font-bold text-primary text-sm leading-none">Cor Jesu College</h1>
            <p className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">Admin Portal</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-container-high transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Navigation */}
      <div
        className={`fixed top-16 left-0 right-0 bg-surface-container-lowest border-b border-outline-variant shadow-xl z-40 transition-all duration-200 transform md:hidden overflow-y-auto max-h-[85vh] ${
          mobileMenuOpen ? "opacity-100 py-4" : "max-h-0 opacity-0 py-0 overflow-hidden"
        }`}
      >
        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const active = isPathActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  active ? "bg-primary-fixed text-primary font-bold" : "text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-4 mt-2 border-t border-outline-variant px-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">System Admin</span>
            <button
              onClick={handleLogout}
              className="text-secondary hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-container-high flex items-center gap-1.5 text-xs"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop Sidebar Nav */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col py-6 hidden md:flex z-50 overflow-y-auto">
        <div className="px-6 mb-6 flex items-center gap-3">
          <img
            src="/images/logos/cjc-logo.webp"
            alt="Cor Jesu College Logo"
            className="h-10 w-10 object-contain rounded-full shadow-sm"
          />
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary whitespace-nowrap">
              Cor Jesu College
            </h1>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              ADMIN PORTAL
            </p>
          </div>
        </div>

        <nav className="flex-1 w-full space-y-1">
          <ul className="flex flex-col gap-1 w-full">
            {navItems.map((item) => {
              const active = isPathActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-4 ${
                      active
                        ? "bg-primary-fixed text-primary border-primary font-bold"
                        : "text-secondary hover:bg-surface-container-high border-transparent"
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="font-body-md text-body-md">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Profile Footer */}
        <div className="px-4 mt-auto pt-4 border-t border-outline-variant">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                <span>A</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-on-surface text-body-sm leading-tight truncate w-32">
                  System Admin
                </span>
                <span className="text-secondary text-label-sm truncate w-32">
                  admin@clearance.edu
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-secondary hover:text-primary transition-colors p-1"
              title="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[280px] min-h-screen flex flex-col pt-16 md:pt-0">
        <main className="flex-1 bg-background p-4 sm:p-6 md:p-10">
          {children}
        </main>
      </div>

      {/* Add Office Modal (global) */}
      {openAddOfficeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpenAddOfficeModal(false)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-lg" onClick={(e) => e.stopPropagation()}>
            <AddOfficeForm onCancel={() => setOpenAddOfficeModal(false)} onAdd={(data) => addOffice(data)} />
          </div>
        </div>
      )}

      {/* Add Department Modal (global) */}
      {openAddDepartmentModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpenAddDepartmentModal(false)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-md p-lg" onClick={(e) => e.stopPropagation()}>
            <AddDepartmentForm onCancel={() => setOpenAddDepartmentModal(false)} onAdd={(data) => addDepartment(data)} />
          </div>
        </div>
      )}
    </div>
  );
}
