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

// Automatically check and update overdue bookings
export async function updateOverdueBookings() {
  try {
    const now = new Date();
    
    // Find all ISSUED bookings that have passed their end date
    const overdueBookings = await prisma.booking.findMany({
      where: {
        status: "ISSUED",
        endDate: { lt: now },
      },
      include: {
        asset: true,
        user: true,
      },
    });

    if (overdueBookings.length === 0) {
      return { success: true, count: 0 };
    }

    // Update statuses to OVERDUE
    await prisma.booking.updateMany({
      where: {
        id: { in: overdueBookings.map((b) => b.id) },
      },
      data: {
        status: "OVERDUE",
      },
    });

    // Create notifications for users
    await prisma.notification.createMany({
      data: overdueBookings.map((b) => ({
        userId: b.userId,
        title: "Asset Return Overdue",
        message: `Your booking for ${b.quantity}x ${b.asset.name} was due on ${new Date(b.endDate).toLocaleDateString()}. Please return it immediately to avoid penalty.`,
        type: "DANGER",
      })),
    });

    console.log(`Updated ${overdueBookings.length} bookings to OVERDUE.`);
    return { success: true, count: overdueBookings.length };
  } catch (error: any) {
    console.error("updateOverdueBookings error:", error);
    return { success: false, error: error.message };
  }
}

export async function issueAsset(bookingId: string) {
  try {
    const session = await requireAdmin();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { asset: true, user: true },
    });

    if (!booking) {
      return { success: false, error: "Booking not found." };
    }

    if (booking.status !== "APPROVED") {
      return { success: false, error: `Only approved bookings can be issued. Current status is ${booking.status}.` };
    }

    const asset = booking.asset;

    // Check physical available stock in inventory
    if (asset.availableQuantity < booking.quantity) {
      return {
        success: false,
        error: `Insufficient stock in inventory to check out. In stock: ${asset.availableQuantity}, Requested: ${booking.quantity}.`,
      };
    }

    // Deduct physical inventory count
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "ISSUED" },
      }),
      prisma.asset.update({
        where: { id: booking.assetId },
        data: {
          availableQuantity: asset.availableQuantity - booking.quantity,
          // If available stock drops to 0, mark as OUT_OF_STOCK
          status: asset.availableQuantity - booking.quantity === 0 ? "OUT_OF_STOCK" : asset.status,
        },
      }),
    ]);

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: "Asset Issued",
        message: `You have successfully checked out ${booking.quantity}x ${asset.name}. Due return date is ${new Date(booking.endDate).toLocaleDateString()}.`,
        type: "SUCCESS",
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ISSUE_ASSET",
        details: JSON.stringify({
          bookingId,
          assetId: asset.id,
          assetName: asset.name,
          quantity: booking.quantity,
          borrower: booking.user.name,
        }),
      },
    });

    return { success: true, message: "Asset issued successfully!" };
  } catch (error: any) {
    console.error("issueAsset error:", error);
    return { success: false, error: error.message || "Failed to issue asset." };
  }
}

export async function returnAsset(
  bookingId: string,
  returnedCondition: string,
  comments?: string
) {
  try {
    const session = await requireAdmin();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { asset: true, user: true },
    });

    if (!booking) {
      return { success: false, error: "Booking not found." };
    }

    if (booking.status !== "ISSUED" && booking.status !== "OVERDUE") {
      return { success: false, error: `Only issued or overdue assets can be returned. Current status is ${booking.status}.` };
    }

    const asset = booking.asset;

    // Create Return Log, Update Booking Status, and Restore inventory availableQuantity
    await prisma.$transaction(async (tx) => {
      // 1. Create return log
      await tx.returnLog.create({
        data: {
          bookingId,
          conditionOnReturn: returnedCondition,
          comments: comments || null,
          recordedBy: session.user.id,
        },
      });

      // 2. Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "RETURNED" },
      });

      // 3. Update asset inventory quantities and condition/status if damaged
      const newAvailable = Math.min(asset.totalQuantity, asset.availableQuantity + booking.quantity);
      
      let updatedStatus = asset.status;
      if (updatedStatus === "OUT_OF_STOCK" && newAvailable > 0) {
        updatedStatus = "AVAILABLE";
      }

      if (returnedCondition === "DAMAGED") {
        updatedStatus = "MAINTENANCE";
        
        // Log maintenance issue automatically
        await tx.maintenanceLog.create({
          data: {
            assetId: asset.id,
            reportedBy: booking.userId, // reported under booking user
            issueDescription: `Asset returned DAMAGED during booking check-in. comments: ${comments || "None"}`,
            status: "REPORTED",
          },
        });
      }

      await tx.asset.update({
        where: { id: asset.id },
        data: {
          availableQuantity: newAvailable,
          status: updatedStatus,
          condition: returnedCondition === "DAMAGED" ? "DAMAGED" : asset.condition,
        },
      });
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: "Asset Returned",
        message: `Your return of ${booking.quantity}x ${asset.name} has been processed. Return condition: ${returnedCondition}.`,
        type: "SUCCESS",
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "RETURN_ASSET",
        details: JSON.stringify({
          bookingId,
          assetName: asset.name,
          borrower: booking.user.name,
          quantity: booking.quantity,
          condition: returnedCondition,
          comments,
        }),
      },
    });

    return { success: true, message: "Asset return processed successfully!" };
  } catch (error: any) {
    console.error("returnAsset error:", error);
    return { success: false, error: error.message || "Failed to process return." };
  }
}

// Query active checkout list (ISSUED or OVERDUE)
export async function getActiveAllocations() {
  try {
    await requireAdmin();
    // Run overdue checker first
    await updateOverdueBookings();

    const allocations = await prisma.booking.findMany({
      where: {
        status: { in: ["ISSUED", "OVERDUE"] },
      },
      include: {
        user: { select: { name: true, email: true, section: true } },
        asset: { select: { name: true, category: true, qrCode: true } },
      },
      orderBy: { endDate: "asc" }, // earliest due dates first
    });

    return { success: true, allocations };
  } catch (error: any) {
    console.error("getActiveAllocations error:", error);
    return { success: false, error: error.message || "Failed to fetch active allocations." };
  }
}
