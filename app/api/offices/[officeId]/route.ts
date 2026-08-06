import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET handler to fetch a single office by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const id = parseInt(officeId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid office ID" }, { status: 400 });
    }

    const office = await prisma.office.findUnique({
      where: { id },
    });

    if (!office) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    return NextResponse.json(office);
  } catch (err) {
    console.error("GET /api/offices/[officeId] error:", err);
    return NextResponse.json({ error: "Failed to fetch office" }, { status: 500 });
  }
}

/**
 * PATCH handler to update office fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const id = parseInt(officeId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid office ID" }, { status: 400 });
    }

    const body = await request.json();
    let { logoUrl, coverUrl, themeColor, name, head, email } = body;

    // Robust Unpacking Safeguard: If head is passed as an object, unpack its fields
    let headName = typeof head === "string" ? head : "";
    let headEmail = typeof email === "string" ? email : "";
    if (head && typeof head === "object") {
      if (head.name) headName = head.name;
      if (head.email) headEmail = head.email;
    }

    // Fetch existing office state
    const currentOffice = await prisma.office.findUnique({
      where: { id }
    });

    if (!currentOffice) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    let parsedEmail = currentOffice.email;
    if (headEmail && headEmail !== currentOffice.email) {
      parsedEmail = headEmail.trim().toLowerCase();

      // Check role collision
      const existingUser = await prisma.user.findUnique({
        where: { email: parsedEmail }
      });

      if (existingUser) {
        if (existingUser.role === "admin") {
          return NextResponse.json({ error: `The email ${parsedEmail} is already registered as a System Administrator.` }, { status: 400 });
        }
        if (existingUser.officeId && existingUser.officeId !== id) {
          return NextResponse.json({ error: `The email ${parsedEmail} is already assigned to another office.` }, { status: 400 });
        }
        if (existingUser.departmentId) {
          return NextResponse.json({ error: `The email ${parsedEmail} is already assigned as head of a department.` }, { status: 400 });
        }
        if (existingUser.orgId) {
          return NextResponse.json({ error: `The email ${parsedEmail} is already assigned as adviser of an organization.` }, { status: 400 });
        }
      }

      // Safe update user records:
      // 1. Unlink the old head user if they exist
      if (currentOffice.email) {
        await prisma.user.updateMany({
          where: { email: currentOffice.email, officeId: id },
          data: { officeId: null }
        });
      }

      // 2. Link/promote the new head user
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: "head_office",
            officeId: id,
            displayName: headName || existingUser.displayName,
            studentId: null, // Clear student association if they were promoted from student
          }
        });
      } else {
        await prisma.user.create({
          data: {
            email: parsedEmail,
            displayName: headName || "Office Head",
            role: "head_office",
            officeId: id,
          }
        });
      }
    } else if (headName && headName !== currentOffice.head) {
      // Just update display name for the current head user
      if (currentOffice.email) {
        await prisma.user.updateMany({
          where: { email: currentOffice.email, officeId: id },
          data: { displayName: headName }
        });
      }
    }
    
    const updateData: any = {};
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (themeColor !== undefined) updateData.themeColor = themeColor;
    if (name !== undefined) updateData.name = name;
    if (headName !== "") updateData.head = headName;
    if (headEmail !== "") updateData.email = parsedEmail;

    const updated = await prisma.office.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/offices/[officeId] error:", err);
    return NextResponse.json({ error: "Failed to update office" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ officeId: string }> }
) {
  try {
    const { officeId } = await params;
    const id = parseInt(officeId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid office ID" }, { status: 400 });
    }

    // Clean up related records in a transaction to prevent constraint violations
    await prisma.$transaction([
      // 1. Delete associated office requirements
      prisma.officeRequirement.deleteMany({
        where: { officeId: id }
      }),
      // 2. Delete associated clearance records
      prisma.clearanceRecord.deleteMany({
        where: { officeId: id }
      }),
      // 3. Delete associated flow steps
      prisma.flowStep.deleteMany({
        where: { officeId: id }
      }),
      // 4. Set officeId to null for linked users
      prisma.user.updateMany({
        where: { officeId: id },
        data: { officeId: null }
      }),
      // 5. Delete the office
      prisma.office.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/offices/[officeId] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete office" }, { status: 500 });
  }
}
