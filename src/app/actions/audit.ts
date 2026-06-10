"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required.");
  }
  return session;
}

export async function getAuditLogs() {
  try {
    await requireAdmin();

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, auditLogs };
  } catch (error: any) {
    console.error("getAuditLogs error:", error);
    return { success: false, error: error.message || "Failed to fetch audit logs." };
  }
}
