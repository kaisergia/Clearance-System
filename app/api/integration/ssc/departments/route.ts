import { NextResponse } from "next/server";
import { getSSCDepartments } from "@/services/sscIntegrationService";

export async function GET() {
  try {
    const departments = await getSSCDepartments();
    return NextResponse.json(departments);
  } catch (err: any) {
    console.error("SSC Departments Integration Route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch SSC Departments" },
      { status: 500 }
    );
  }
}
