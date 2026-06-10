"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import QRCode from "qrcode";

// Helper to check if user is admin
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required.");
  }
  return session;
}

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized: Please log in.");
  }
  return session;
}

export async function getAssets(search?: string, category?: string) {
  try {
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (category && category !== "All") {
      where.category = category;
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return { success: true, assets };
  } catch (error: any) {
    console.error("getAssets error:", error);
    return { success: false, error: error.message || "Failed to fetch assets." };
  }
}

export async function getAssetById(id: string) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
    });
    if (!asset) {
      return { success: false, error: "Asset not found." };
    }
    return { success: true, asset };
  } catch (error: any) {
    console.error("getAssetById error:", error);
    return { success: false, error: error.message || "Failed to fetch asset." };
  }
}

// Sweep-line algorithm to check if an asset is available during [start, end]
export async function checkAssetAvailability(
  assetId: string,
  startDateStr: string | Date,
  endDateStr: string | Date,
  requestedQuantity: number
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return { success: false, error: "Asset not found.", available: false };
    }

    if (requestedQuantity > asset.totalQuantity) {
      return {
        success: true,
        available: false,
        maxAvailable: 0,
        error: `Requested quantity (${requestedQuantity}) exceeds total inventory (${asset.totalQuantity}).`,
      };
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (start >= end) {
      return { success: false, error: "Start date must be before end date.", available: false };
    }

    // Find all bookings that are APPROVED, ISSUED, or OVERDUE that overlap with requested period
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        assetId,
        status: { in: ["APPROVED", "ISSUED", "OVERDUE"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: {
        quantity: true,
        startDate: true,
        endDate: true,
      },
    });

    // Sweep-line algorithm
    // Collect time events: start of booking adds quantity, end of booking subtracts quantity
    const events: { time: number; type: number; quantity: number }[] = [];

    // Add boundaries for our check interval to evaluate allocation at start/end
    events.push({ time: start.getTime(), type: 0, quantity: 0 });
    events.push({ time: end.getTime(), type: 0, quantity: 0 });

    for (const b of overlappingBookings) {
      events.push({ time: new Date(b.startDate).getTime(), type: 1, quantity: b.quantity });
      events.push({ time: new Date(b.endDate).getTime(), type: -1, quantity: b.quantity });
    }

    // Sort events:
    // Primary: by timestamp
    // Secondary: end events (-1) before start events (+1) to be safe/lenient
    events.sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time;
      return a.type - b.type;
    });

    let currentAllocated = 0;
    let maxAllocatedDuringInterval = 0;

    for (const event of events) {
      if (event.type === 1) {
        currentAllocated += event.quantity;
      } else if (event.type === -1) {
        currentAllocated -= event.quantity;
      }

      // Check if event time falls within the requested booking interval
      if (event.time >= start.getTime() && event.time <= end.getTime()) {
        if (currentAllocated > maxAllocatedDuringInterval) {
          maxAllocatedDuringInterval = currentAllocated;
        }
      }
    }

    const availableQuantity = asset.totalQuantity - maxAllocatedDuringInterval;

    if (requestedQuantity > availableQuantity) {
      return {
        success: true,
        available: false,
        maxAvailable: availableQuantity,
        error: `Insufficient inventory for the selected dates. Maximum available quantity during this period is ${availableQuantity}.`,
      };
    }

    return { success: true, available: true, maxAvailable: availableQuantity };
  } catch (error: any) {
    console.error("checkAssetAvailability error:", error);
    return { success: false, error: error.message || "Failed to check availability.", available: false };
  }
}

export async function createAsset(formData: {
  name: string;
  category: string;
  description: string;
  totalQuantity: number;
  condition: string;
  status?: string;
}) {
  try {
    const session = await requireAdmin();
    const { name, category, description, totalQuantity, condition, status = "AVAILABLE" } = formData;

    if (!name || !category || totalQuantity === undefined) {
      return { success: false, error: "Asset name, category, and quantity are required." };
    }

    // Create the asset first
    const asset = await prisma.asset.create({
      data: {
        name,
        category,
        description,
        totalQuantity,
        availableQuantity: totalQuantity, // physically in stock initially
        condition,
        status,
      },
    });

    // Generate base64 QR code
    const qrData = JSON.stringify({
      id: asset.id,
      name: asset.name,
      category: asset.category,
    });
    const qrCodeBase64 = await QRCode.toDataURL(qrData);

    // Update with QR
    const updatedAsset = await prisma.asset.update({
      where: { id: asset.id },
      data: { qrCode: qrCodeBase64 },
    });

    // Log the action in Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_ASSET",
        details: JSON.stringify({
          assetId: asset.id,
          name: asset.name,
          category: asset.category,
          quantity: asset.totalQuantity,
        }),
      },
    });

    return { success: true, asset: updatedAsset, message: "Asset created successfully!" };
  } catch (error: any) {
    console.error("createAsset error:", error);
    return { success: false, error: error.message || "Failed to create asset." };
  }
}

export async function updateAsset(
  id: string,
  formData: {
    name: string;
    category: string;
    description: string;
    totalQuantity: number;
    condition: string;
    status: string;
  }
) {
  try {
    const session = await requireAdmin();
    const { name, category, description, totalQuantity, condition, status } = formData;

    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      return { success: false, error: "Asset not found." };
    }

    // Calculate updated available quantity based on total quantity difference
    const quantityDifference = totalQuantity - existingAsset.totalQuantity;
    const newAvailable = Math.max(0, existingAsset.availableQuantity + quantityDifference);

    // Generate a new QR code (in case name or category changed)
    const qrData = JSON.stringify({
      id,
      name,
      category,
    });
    const qrCodeBase64 = await QRCode.toDataURL(qrData);

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        category,
        description,
        totalQuantity,
        availableQuantity: newAvailable,
        condition,
        status,
        qrCode: qrCodeBase64,
      },
    });

    // Log the action in Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_ASSET",
        details: JSON.stringify({
          assetId: id,
          previous: { name: existingAsset.name, quantity: existingAsset.totalQuantity },
          current: { name, quantity: totalQuantity },
        }),
      },
    });

    return { success: true, asset, message: "Asset updated successfully!" };
  } catch (error: any) {
    console.error("updateAsset error:", error);
    return { success: false, error: error.message || "Failed to update asset." };
  }
}

export async function deleteAsset(id: string) {
  try {
    const session = await requireAdmin();

    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return { success: false, error: "Asset not found." };
    }

    // Delete asset
    await prisma.asset.delete({
      where: { id },
    });

    // Log the action in Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_ASSET",
        details: JSON.stringify({
          assetId: id,
          name: asset.name,
          category: asset.category,
        }),
      },
    });

    return { success: true, message: "Asset deleted successfully!" };
  } catch (error: any) {
    console.error("deleteAsset error:", error);
    return { success: false, error: error.message || "Failed to delete asset." };
  }
}
