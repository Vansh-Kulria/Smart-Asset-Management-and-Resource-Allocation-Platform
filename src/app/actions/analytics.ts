"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateOverdueBookings } from "./operations";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required.");
  }
  return session;
}

export async function getDashboardAnalytics() {
  try {
    await requireAdmin();
    
    // Auto-update overdue statuses first to ensure accurate reporting
    await updateOverdueBookings();

    // 1. Fetch count stats
    const totalAssets = await prisma.asset.count();
    
    // Sum total quantities
    const assetsSums = await prisma.asset.aggregate({
      _sum: {
        totalQuantity: true,
        availableQuantity: true,
      },
    });
    
    const totalItems = assetsSums._sum.totalQuantity || 0;
    const availableItems = assetsSums._sum.availableQuantity || 0;

    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({
      where: { status: { in: ["ISSUED", "OVERDUE"] } },
    });
    const overdueReturns = await prisma.booking.count({
      where: { status: "OVERDUE" },
    });
    const pendingApprovals = await prisma.booking.count({
      where: { status: "PENDING" },
    });

    // 2. Fetch top 5 frequently utilized assets
    // Group bookings by assetId, count they and join with Asset name
    const bookingGroups = await prisma.booking.groupBy({
      by: ["assetId"],
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const topAssets = await Promise.all(
      bookingGroups.map(async (group) => {
        const asset = await prisma.asset.findUnique({
          where: { id: group.assetId },
          select: { name: true },
        });
        return {
          name: asset?.name || "Unknown Asset",
          bookingCount: group._count.id,
          totalQuantityBooked: group._sum.quantity || 0,
        };
      })
    );

    // 3. Fetch Category Utilization rates
    // Category distribution of assets (Total vs Available)
    const assetsList = await prisma.asset.findMany({
      select: {
        category: true,
        totalQuantity: true,
        availableQuantity: true,
      },
    });

    const categoryStatsMap: Record<string, { category: string; total: number; available: number; utilized: number }> = {};
    
    for (const asset of assetsList) {
      if (!categoryStatsMap[asset.category]) {
        categoryStatsMap[asset.category] = {
          category: asset.category,
          total: 0,
          available: 0,
          utilized: 0,
        };
      }
      categoryStatsMap[asset.category].total += asset.totalQuantity;
      categoryStatsMap[asset.category].available += asset.availableQuantity;
    }

    const categoryStats = Object.values(categoryStatsMap).map((stat) => {
      const utilized = stat.total - stat.available;
      const utilizationRate = stat.total > 0 ? Math.round((utilized / stat.total) * 100) : 0;
      return {
        category: stat.category,
        totalQuantity: stat.total,
        availableQuantity: stat.available,
        utilizedQuantity: utilized,
        utilizationRate,
      };
    });

    // 4. Booking trends (last 7 days line chart data)
    const trends: { date: string; bookings: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const dayBookingsCount = await prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      trends.push({
        date: startOfDay.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        bookings: dayBookingsCount,
      });
    }

    // 5. Active allocations with detailed list
    const activeAllocations = await prisma.booking.findMany({
      where: { status: { in: ["ISSUED", "OVERDUE"] } },
      include: {
        user: { select: { name: true, section: true } },
        asset: { select: { name: true, category: true } },
      },
      orderBy: { endDate: "asc" },
      take: 5,
    });

    // 6. Overdue allocations list
    const overdueList = await prisma.booking.findMany({
      where: { status: "OVERDUE" },
      include: {
        user: { select: { name: true, section: true, email: true } },
        asset: { select: { name: true, category: true } },
      },
      orderBy: { endDate: "asc" },
    });

    return {
      success: true,
      data: {
        cards: {
          totalAssets,
          totalItems,
          availableItems,
          totalBookings,
          activeBookings,
          overdueReturns,
          pendingApprovals,
        },
        topAssets,
        categoryStats,
        trends,
        activeAllocations,
        overdueList,
      },
    };
  } catch (error: any) {
    console.error("getDashboardAnalytics error:", error);
    return { success: false, error: error.message || "Failed to fetch analytics." };
  }
}
