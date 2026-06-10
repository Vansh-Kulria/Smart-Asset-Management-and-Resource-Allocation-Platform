"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkAssetAvailability } from "./assets";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized: Please log in first.");
  }
  return session;
}

export async function getBookings(status?: string) {
  try {
    const session = await requireUser();
    const where: any = {};

    // Filter by user unless they are an ADMIN
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, section: true },
        },
        asset: {
          select: { name: true, category: true, totalQuantity: true, availableQuantity: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, bookings };
  } catch (error: any) {
    console.error("getBookings error:", error);
    return { success: false, error: error.message || "Failed to fetch bookings." };
  }
}

export async function createBooking(formData: {
  assetId: string;
  quantity: number;
  startDate: string | Date;
  endDate: string | Date;
  purpose: string;
}) {
  try {
    const session = await requireUser();
    const { assetId, quantity, startDate, endDate, purpose } = formData;

    if (!assetId || !quantity || !startDate || !endDate || !purpose) {
      return { success: false, error: "Please provide all required fields." };
    }

    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startNormalized = new Date(start);
    startNormalized.setHours(0, 0, 0, 0);

    if (startNormalized < today) {
      return { success: false, error: "Booking start date cannot be before today." };
    }

    // Call availability checker
    const availCheck = await checkAssetAvailability(assetId, startDate, endDate, quantity);
    if (!availCheck.success || !availCheck.available) {
      return {
        success: false,
        error: availCheck.error || "Asset is not available for the selected dates.",
      };
    }

    // Create Booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        assetId,
        quantity,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        purpose,
        status: "PENDING",
      },
      include: {
        asset: { select: { name: true } },
      },
    });

    // Notify Admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "New Booking Request",
        message: `${session.user.name} (${session.user.section}) requested ${quantity}x ${booking.asset.name} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
        type: "INFO",
      })),
    });

    return { success: true, booking, message: "Booking request submitted successfully!" };
  } catch (error: any) {
    console.error("createBooking error:", error);
    return { success: false, error: error.message || "Failed to submit booking request." };
  }
}

export async function updateBookingStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Admin access required.");
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        asset: true,
        user: true,
      },
    });

    if (!booking) {
      return { success: false, error: "Booking request not found." };
    }

    if (booking.status !== "PENDING") {
      return { success: false, error: `Booking request is already ${booking.status.toLowerCase()}.` };
    }

    // If approving, do a final availability check to prevent race conditions
    if (status === "APPROVED") {
      const availCheck = await checkAssetAvailability(
        booking.assetId,
        booking.startDate,
        booking.endDate,
        booking.quantity
      );
      if (!availCheck.success || !availCheck.available) {
        return {
          success: false,
          error: `Cannot approve. Asset is no longer available: ${availCheck.error}`,
        };
      }
    }

    // Update the booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
    });

    // Notify User
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: status === "APPROVED" ? "Booking Approved" : "Booking Rejected",
        message: status === "APPROVED"
          ? `Your request for ${booking.quantity}x ${booking.asset.name} was approved! You can pick it up on ${new Date(booking.startDate).toLocaleDateString()}.`
          : `Your request for ${booking.quantity}x ${booking.asset.name} was rejected. Reason: ${rejectionReason || "None specified"}.`,
        type: status === "APPROVED" ? "SUCCESS" : "DANGER",
      },
    });

    // Log Action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: status === "APPROVED" ? "APPROVE_BOOKING" : "REJECT_BOOKING",
        details: JSON.stringify({
          bookingId: id,
          assetName: booking.asset.name,
          borrower: booking.user.name,
          quantity: booking.quantity,
          reason: status === "REJECTED" ? rejectionReason : undefined,
        }),
      },
    });

    return {
      success: true,
      booking: updatedBooking,
      message: `Booking has been successfully ${status.toLowerCase()}!`,
    };
  } catch (error: any) {
    console.error("updateBookingStatus error:", error);
    return { success: false, error: error.message || "Failed to update booking status." };
  }
}
