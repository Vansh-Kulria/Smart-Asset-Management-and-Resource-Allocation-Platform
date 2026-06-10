"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function updateProfile(formData: {
  name: string;
  section: string;
  image?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Unauthorized: Please log in." };
    }

    const { name, section, image } = formData;

    if (!name || !section) {
      return { success: false, error: "Name and Section/Club are required." };
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        section,
        image: image || null,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_PROFILE",
        details: JSON.stringify({
          userId: session.user.id,
          name,
          section,
        }),
      },
    });

    return {
      success: true,
      message: "Profile updated successfully!",
      user: {
        name: updatedUser.name,
        section: updatedUser.section,
        image: updatedUser.image,
      },
    };
  } catch (error: any) {
    console.error("updateProfile error:", error);
    return { success: false, error: error.message || "Failed to update profile." };
  }
}
