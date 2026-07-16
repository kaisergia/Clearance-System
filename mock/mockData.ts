// Organizations / Clubs
export const mockOrgs = [
  {
    id: 1,
    name: "Computer Science Society",
    category: "Academic",
    type: "AcademicClub",
    department: "CCIS",
    program: "BSCS",
    adviser: "Prof. Santos",
    status: "Active",
    dateAdded: "Aug 1, 2024",
    memberCount: 45,
  },
  {
    id: 2,
    name: "Junior Marketing Association",
    category: "Academic",
    type: "AcademicClub",
    department: "CABE",
    program: "BSBA",
    adviser: "Prof. Reyes",
    status: "Active",
    dateAdded: "Aug 1, 2024",
    memberCount: 32,
  },
  {
    id: 3,
    name: "University Dance Troupe",
    category: "Cultural",
    type: "NonAcademicClub",
    department: null,
    program: null,
    adviser: "Prof. Lim",
    status: "Active",
    dateAdded: "Aug 5, 2024",
    memberCount: 20,
  },
  {
    id: 4,
    name: "Engineering Society",
    category: "Academic",
    type: "AcademicClub",
    department: "COE",
    program: "BSCE",
    adviser: "Prof. Cruz",
    status: "Active",
    dateAdded: "Aug 1, 2024",
    memberCount: 60,
  },
  {
    id: 5,
    name: "Student Government",
    category: "Governance",
    type: "Gov",
    department: null,
    program: null,
    adviser: "Prof. Villanueva",
    status: "Active",
    dateAdded: "Jul 28, 2024",
    memberCount: 15,
  },
  {
    id: 6,
    name: "CCIS LGU",
    category: "Governance",
    type: "LGU",
    department: "CCIS",
    program: null,
    adviser: "Prof. Dimaculangan",
    status: "Active",
    dateAdded: "Jul 30, 2024",
    memberCount: 150,
  },
];

// Explicit membership mapping for Non-Academic Clubs and some default students
export const mockOrgMembers = [
  { orgId: 3, studentId: "2021-00001" }, // Juan Dela Cruz in Dance Troupe
  { orgId: 3, studentId: "2022-00003" }, // Pedro Reyes in Dance Troupe
  { orgId: 1, studentId: "2021-0492" }, // Eleanor - Computer Science Society
  { orgId: 5, studentId: "2021-0492" }, // Eleanor - Student Government
  { orgId: 4, studentId: "2022-1103" }, // Chidi - Engineering Society
];


// Departments
export const mockDepartments = [
  {
    id: 1,
    name: "College of Computer and Information Sciences",
    abbreviation: "CCIS",
    head: "Dr. Alan Turing",
    email: "ccis@uni.edu.ph",
    pending: 5,
    approved: 120,
    rejected: 1,
  },
  {
    id: 2,
    name: "College of Engineering",
    abbreviation: "COE",
    head: "Engr. Nikola Tesla",
    email: "coe@uni.edu.ph",
    pending: 10,
    approved: 90,
    rejected: 0,
  },
];

// Head Offices
export const mockOffices = [
  {
    id: 1,
    name: "Registrar",
    head: "Ms. Reyes",
    email: "registrar@uni.edu.ph",
    pending: 12,
    approved: 45,
    rejected: 3,
  },
  {
    id: 2,
    name: "Library",
    head: "Mr. Santos",
    email: "library@uni.edu.ph",
    pending: 8,
    approved: 50,
    rejected: 2,
  },
  {
    id: 3,
    name: "Guidance Office",
    head: "Ms. Garcia",
    email: "guidance@uni.edu.ph",
    pending: 15,
    approved: 40,
    rejected: 5,
  },
  {
    id: 4,
    name: "Accounting",
    head: "Mr. Dela Cruz",
    email: "accounting@uni.edu.ph",
    pending: 20,
    approved: 35,
    rejected: 5,
  },
  {
    id: 5,
    name: "Discipline Office",
    head: "Ms. Mendoza",
    email: "discipline@uni.edu.ph",
    pending: 5,
    approved: 55,
    rejected: 0,
  },
];

// Clearance Requirements (Student view) - Legacy static array (kept for fallback)
export const mockRequirements = [
  // Offices
  {
    id: 2,
    name: "Library Clearance",
    responsible: "Library",
    type: "office",
    status: "Cleared",
    dateCleared: "Jan 10, 2025",
    remarks: "No outstanding books or fines.",
  },
  {
    id: 4,
    name: "Accounting Clearance",
    responsible: "Accounting",
    type: "office",
    status: "Pending",
    dateCleared: null,
    remarks: "",
  },
  {
    id: 1,
    name: "Registrar Clearance",
    responsible: "Registrar",
    type: "office",
    status: "Pending",
    dateCleared: null,
    remarks: "",
  },
  {
    id: 3,
    name: "Guidance Clearance",
    responsible: "Guidance Office",
    type: "office",
    status: "Cleared",
    dateCleared: "Jan 8, 2025",
    remarks: "No concerns.",
  },
  {
    id: 5,
    name: "Discipline Clearance",
    responsible: "Discipline Office",
    type: "office",
    status: "Pending",
    dateCleared: null,
    remarks: "Pending resolution of disciplinary case.",
  },
  // Orgs
  {
    id: 6,
    name: "Org Membership Clearance",
    responsible: "Computer Science Society",
    type: "org",
    status: "Cleared",
    dateCleared: "Jan 12, 2025",
    remarks: "Dues paid. Attendance met.",
  },
  {
    id: 7,
    name: "Org Membership Clearance",
    responsible: "Student Government",
    type: "org",
    status: "Pending",
    dateCleared: null,
    remarks: "",
  },
];

// Dynamic explicit mock clearance status per student for offices and orgs
export const mockStudentClearanceRecords: Record<string, any[]> = {
  // Eleanor Shellstrop
  "2021-0492": [
    { officeId: 1, status: "Pending", dateCleared: null, remarks: "" },
    { officeId: 2, status: "Pending", dateCleared: null, remarks: "" },
    { officeId: 3, status: "Pending", dateCleared: null, remarks: "" },
    { officeId: 4, status: "Pending", dateCleared: null, remarks: "" },
    { officeId: 5, status: "Pending", dateCleared: null, remarks: "" },
    { orgId: 1, status: "Pending", dateCleared: null, remarks: "" },
    { orgId: 5, status: "Pending", dateCleared: null, remarks: "" }
  ],
  // Chidi Anagonye
  "2022-1103": [
    { officeId: 1, status: "Pending", dateCleared: null, remarks: "" },
    { officeId: 2, status: "Pending", dateCleared: null, remarks: "" },
    { officeId: 3, status: "Pending", dateCleared: null, remarks: "" },
    { officeId: 4, status: "Pending", dateCleared: null, remarks: "" },
    { officeId: 5, status: "Pending", dateCleared: null, remarks: "" },
    { orgId: 4, status: "Pending", dateCleared: null, remarks: "" }
  ]
};

export const mockTerms = ["1st Sem 2024-2025", "2nd Sem 2023-2024", "1st Sem 2023-2024"];

export const mockTemplates = [
  {
    id: 1,
    name: "General Student Base",
    type: "Default Workflow",
    description: "Standard clearance requirements for all actively enrolled undergraduate and graduate students. Includes finance, library, and basic disciplinary checks.",
    steps: 5,
    applicable: "~12,400",
    status: "Published",
    lastEdited: "Jan 2, 2025",
    icon: "description",
    iconBg: "bg-secondary-container/30 text-tertiary",
  },
  {
    id: 2,
    name: "Graduating Seniors",
    type: "Specialized Workflow",
    description: "Extended clearance process requiring registrar audit, alumni association opt-in, and final financial settlement for diploma release.",
    steps: 9,
    applicable: "~2,100",
    status: "Published",
    lastEdited: "Dec 18, 2024",
    icon: "school",
    iconBg: "bg-primary-container/10 text-primary",
  },
  {
    id: 3,
    name: "Student Org Officers",
    type: "Condition-Based",
    description: "Additional requirements for recognized student organization officers, including equipment return and budget reconciliation.",
    steps: 3,
    applicable: "--",
    status: "Draft",
    lastEdited: "2 days ago",
    icon: "groups",
    iconBg: "bg-surface-container-high text-secondary",
  },
];

export const mockWeekData = [
  { week: "Wk 1", total: 20, cleared: 10 },
  { week: "Wk 2", total: 35, cleared: 15 },
  { week: "Wk 3", total: 45, cleared: 25 },
  { week: "Wk 4", total: 60, cleared: 35 },
  { week: "Wk 5", total: 75, cleared: 50 },
  { week: "Wk 6", total: 85, cleared: 65 },
  { week: "Wk 7", total: 95, cleared: 80 },
];

export const mockRecentReports = [
  { name: "College of IT Clearance Q1", by: "Admin System", date: "Jan 15, 2025", status: "Completed" },
  { name: "University Wide Deficiencies", by: "Admin System", date: "Jan 12, 2025", status: "Archived" },
  { name: "Library Fees Outstanding", by: "J. Doe", date: "Jan 10, 2025", status: "Completed" },
  { name: "Accounting Clearance Report", by: "R. Cruz", date: "Jan 8, 2025", status: "Completed" },
];

export const mockRequirementsByOffice: Record<number, string[]> = {
  1: ["Submit grade sheets", "Verify enrollment records", "Clear academic holds"],
  2: ["Return all borrowed materials", "Settle overdue fines", "Submit research documents"],
  3: ["Complete exit interview", "Submit counseling forms", "Clear behavioral records"],
  4: ["Pay all outstanding fees", "Submit financial clearance form", "Clear scholarship obligations"],
  5: ["Resolve pending cases", "Submit incident report acknowledgment"],
};

export const mockRequirementsByOrgType: Record<string, string[]> = {
  "Gov": ["Submit candidacy forms", "Attend leadership training", "File turnover report"],
  "LGU": ["Submit LGU liquidation", "Attend general assembly", "Turnover of equipment"],
  "AcademicClub": ["Submit membership forms", "Pay organization fees", "Attend department seminar"],
  "NonAcademicClub": ["Submit membership forms", "Pay organization fees", "Attend cultural/sports event"],
};

export const defaultDepartmentRequirements: Record<number, any[]> = {
  1: [ // CCIS
    { id: "req-dept-1", name: "Submit thesis manuscript", description: "", status: "Live", appliesTo: ["BS Computer Science"], requiresUpload: true },
  ],
  2: [ // COE
    { id: "req-dept-2", name: "Submit engineering project", description: "", status: "Live", appliesTo: ["BS Civil Engineering"], requiresUpload: true },
  ],
};

export const defaultOfficeRequirements: Record<number, any[]> = {
  1: [ // Registrar
    { id: "req-1", name: "Submit official transcript copy", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: true },
    { id: "req-2", name: "Verify high school card / F137", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "req-3", name: "Clear academic deficiency holds", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
  ],
  2: [ // Library
    { id: "req-4", name: "Return all borrowed books", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "req-5", name: "Settle outstanding overdue fines", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "req-6", name: "Submit research thesis copy", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: true },
  ],
  3: [ // Guidance
    { id: "req-7", name: "Accomplish exit counseling interview", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "req-8", name: "Submit personality evaluation test", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: true },
    { id: "req-9", name: "Clear guidance behavior record", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
  ],
  4: [ // Accounting
    { id: "req-10", name: "Settle outstanding tuition fees", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "req-11", name: "Clear laboratory breakage fees", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "req-12", name: "Submit financial clearance form", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: true },
  ],
  5: [ // Discipline
    { id: "req-13", name: "Verify zero behavioral violations", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "req-14", name: "Clear community service hours", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "req-15", name: "Submit good moral character form", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: true },
  ],
};

export const defaultOrgRequirements: Record<number, any[]> = {
  1: [ // Computer Science Society
    { id: "org-req-1", orgId: 1, name: "Pay CSS membership dues", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: true },
    { id: "org-req-2", orgId: 1, name: "Settle project contributions", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "org-req-3", orgId: 1, name: "Verify seminar attendance", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
  ],
  5: [ // Student Government
    { id: "org-req-4", orgId: 5, name: "Pay SSG membership dues", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: true },
    { id: "org-req-5", orgId: 5, name: "Attend general assembly", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
    { id: "org-req-6", orgId: 5, name: "Verify community service attendance", description: "", status: "Live", appliesTo: ["All Students"], requiresUpload: false },
  ],
};
