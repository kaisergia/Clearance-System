import { NextResponse } from "next/server";
import { getSSCOrganizations } from "@/services/sscIntegrationService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const active = searchParams.get("active") ? searchParams.get("active") === "true" : undefined;
    const departmentId = searchParams.get("departmentId") ? Number(searchParams.get("departmentId")) : undefined;

    const orgs = await getSSCOrganizations({ category, active, departmentId });
    return NextResponse.json(orgs);
  } catch (err: any) {
    console.error("SSC Organizations Integration Route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch SSC Organizations" },
      { status: 500 }
    );
  }
}
