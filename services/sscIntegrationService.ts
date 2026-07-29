/**
 * SSC System External API Integration Client Service
 * Documented according to SSC System — External API Integration Manual (Clearance System)
 */

const SSC_BACKEND_URL = process.env.SSC_BACKEND_URL || "http://localhost:8081";
const SSC_BACKEND_API_KEY = process.env.SSC_BACKEND_API_KEY || "064f4002044e257d5410bc0fb0a31d091a4a06c7a530e30e0c08b5c011b73b54";

const SSC_FILESERVER_URL = process.env.SSC_FILESERVER_URL || "http://localhost:8080";
const SSC_FILESERVER_API_KEY = process.env.SSC_FILESERVER_API_KEY || "f7d2b66d3664739181b4eed50cd05d9687918b10780936cd4e611fed3836f1c3";

export interface SSCStudent {
  studentId: string;
  familyName: string;
  givenName: string;
  middleName?: string;
  suffix?: string;
  fullName: string;
  email: string;
  departmentId: number;
  program: string;
  major?: string;
  yearLevel: string;
  academicStatus?: string;
  studentType?: string;
  contactNumber?: string;
  isActive: boolean;
  // Sensitive fields (requires includeSensitive=true)
  dateOfBirth?: string;
  placeOfBirth?: string;
  sex?: string;
  civilStatus?: string;
  religion?: string;
  permanentAddress?: string;
  currentAddress?: string;
  guardianName?: string;
  guardianContactNumber?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
}

export interface SSCDepartment {
  departmentId: number;
  name: string;
  code: string;
  collegeName: string;
  isActive: boolean;
  createdAt: string;
}

export interface SSCOrganization {
  orgId: number;
  name: string;
  acronym: string;
  departmentId?: number;
  departmentName?: string;
  departmentCode?: string;
  category: "ACADEMIC" | "NON_ACADEMIC" | "ACCO" | "CSG";
  isActive: boolean;
  createdAt: string;
}

export interface SSCFileUploadResponse {
  key: string;
  size: number;
  contentType: string;
  overwritten: boolean;
  uploadedAt: string;
}

export interface SSCPresignedUrlResponse {
  presignedUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export interface SSCFileInfo {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
}

export interface SSCFileListResponse {
  files: SSCFileInfo[];
  truncated: boolean;
  nextStartAfter?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND API CLIENT (Masterlist, Departments, Organizations)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all students from SSC Masterlist
 */
export async function getSSCMasterlist(includeSensitive = true): Promise<SSCStudent[]> {
  try {
    const url = `${SSC_BACKEND_URL}/api/v1/integration/masterlist?includeSensitive=${includeSensitive}`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": SSC_BACKEND_API_KEY,
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `SSC Masterlist fetch failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("getSSCMasterlist error:", err);
    throw err;
  }
}

/**
 * Fetch a single student by studentId from SSC Masterlist
 */
export async function getSSCStudentById(studentId: string, includeSensitive = true): Promise<SSCStudent> {
  try {
    const url = `${SSC_BACKEND_URL}/api/v1/integration/masterlist/${encodeURIComponent(studentId)}?includeSensitive=${includeSensitive}`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": SSC_BACKEND_API_KEY,
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `SSC Student ${studentId} fetch failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`getSSCStudentById (${studentId}) error:`, err);
    throw err;
  }
}

/**
 * Fetch all active departments from SSC System
 */
export async function getSSCDepartments(): Promise<SSCDepartment[]> {
  try {
    const url = `${SSC_BACKEND_URL}/api/v1/integration/departments`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": SSC_BACKEND_API_KEY,
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `SSC Departments fetch failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("getSSCDepartments error:", err);
    throw err;
  }
}

/**
 * Fetch organizations from SSC System
 */
export async function getSSCOrganizations(options?: { active?: boolean; category?: string; departmentId?: number }): Promise<SSCOrganization[]> {
  try {
    const params = new URLSearchParams();
    if (options?.active !== undefined) params.set("active", String(options.active));
    if (options?.category) params.set("category", options.category);
    if (options?.departmentId) params.set("departmentId", String(options.departmentId));

    const url = `${SSC_BACKEND_URL}/api/v1/integration/organizations?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": SSC_BACKEND_API_KEY,
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `SSC Organizations fetch failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("getSSCOrganizations error:", err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE SERVER API CLIENT (Scoped project storage for clearance-system)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload or overwrite a file in SSC File Server
 */
export async function uploadSSCFile(fileData: Blob | Buffer, remotePath: string, fileName = "file.dat"): Promise<SSCFileUploadResponse> {
  try {
    const formData = new FormData();
    const blob = fileData instanceof Blob ? fileData : new Blob([fileData as unknown as BlobPart]);
    formData.append("file", blob, fileName);
    formData.append("path", remotePath);

    const res = await fetch(`${SSC_FILESERVER_URL}/api/v1/integration/files`, {
      method: "POST",
      headers: {
        "X-API-Key": SSC_FILESERVER_API_KEY,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `SSC File Upload failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`uploadSSCFile (${remotePath}) error:`, err);
    throw err;
  }
}

/**
 * Get presigned download URL for a file in SSC File Server
 */
export async function getSSCPresignedUrl(remotePath: string): Promise<SSCPresignedUrlResponse> {
  try {
    const url = `${SSC_FILESERVER_URL}/api/v1/integration/files/url?path=${encodeURIComponent(remotePath)}`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": SSC_FILESERVER_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `SSC Presigned URL request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`getSSCPresignedUrl (${remotePath}) error:`, err);
    throw err;
  }
}

/**
 * List files in SSC File Server under clearance-system scope
 */
export async function listSSCFiles(prefix?: string, maxKeys = 100, startAfter?: string): Promise<SSCFileListResponse> {
  try {
    const params = new URLSearchParams();
    if (prefix) params.set("prefix", prefix);
    if (maxKeys) params.set("maxKeys", String(maxKeys));
    if (startAfter) params.set("startAfter", startAfter);

    const url = `${SSC_FILESERVER_URL}/api/v1/integration/files?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        "X-API-Key": SSC_FILESERVER_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `SSC List Files failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("listSSCFiles error:", err);
    throw err;
  }
}

/**
 * Delete a file in SSC File Server
 */
export async function deleteSSCFile(remotePath: string): Promise<boolean> {
  try {
    const url = `${SSC_FILESERVER_URL}/api/v1/integration/files?path=${encodeURIComponent(remotePath)}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "X-API-Key": SSC_FILESERVER_API_KEY,
      },
    });

    return res.status === 204 || res.ok;
  } catch (err) {
    console.error(`deleteSSCFile (${remotePath}) error:`, err);
    throw err;
  }
}
