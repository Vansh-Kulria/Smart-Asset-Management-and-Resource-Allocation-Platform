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

export async function getUsers() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        section: true,
        createdAt: true,
      },
    });
    return { success: true, users };
  } catch (error: any) {
    console.error("getUsers error:", error);
    return { success: false, error: error.message || "Failed to fetch users." };
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    const session = await requireAdmin();
    if (session.user.id === userId) {
      return { success: false, error: "You cannot change your own role to avoid self-lockout." };
    }

    if (role !== "ADMIN" && role !== "CONSUMER") {
      return { success: false, error: "Invalid role specified." };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: role === "ADMIN" ? "PROMOTE_USER" : "DEMOTE_USER",
        details: JSON.stringify({
          targetUserId: userId,
          targetUserEmail: updatedUser.email,
          newRole: role,
        }),
      },
    });

    return { success: true, message: `User promoted to ${role.toLowerCase()} successfully!` };
  } catch (error: any) {
    console.error("updateUserRole error:", error);
    return { success: false, error: error.message || "Failed to update user role." };
  }
}
