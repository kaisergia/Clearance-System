/**
 * app/api/audit-logs/route.ts
 *
 * GET /api/audit-logs
 * Retrieves institutional audit logs with filtering by studentId, entityType, entityId, or search.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: any = {};

    if (studentId) {
      where.targetStudentId = studentId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = String(entityId);
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { actorName: { contains: q } },
        { details: { contains: q } },
        { targetStudentId: { contains: q } },
        { targetStudentName: { contains: q } },
        { action: { contains: q } },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      totalCount,
      limit,
      offset,
    });
  } catch (err: any) {
    console.error("[GET /api/audit-logs]", err);
    return NextResponse.json({ error: "Failed to fetch audit logs", details: err.message }, { status: 500 });
  }
}
