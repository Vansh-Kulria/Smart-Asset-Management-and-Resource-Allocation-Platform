"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized: Please log in first.");
  }
  return session;
}

export async function getNotifications() {
  try {
    const session = await requireUser();
    
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return { success: true, notifications, unreadCount };
  } catch (error: any) {
    console.error("getNotifications error:", error);
    return { success: false, error: error.message || "Failed to fetch notifications." };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const session = await requireUser();

    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif || notif.userId !== session.user.id) {
      return { success: false, error: "Notification not found or unauthorized." };
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return { success: true, notification: updated };
  } catch (error: any) {
    console.error("markNotificationAsRead error:", error);
    return { success: false, error: error.message || "Failed to update notification." };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await requireUser();

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true, message: "All notifications marked as read." };
  } catch (error: any) {
    console.error("markAllNotificationsAsRead error:", error);
    return { success: false, error: error.message || "Failed to update notifications." };
  }
}
