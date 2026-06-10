import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Header from "../../components/Header";
import Link from "next/link";
import { Search, Calendar, History, ShieldAlert, CheckCircle2, Clipboard, Clock } from "lucide-react";

export default async function ConsumerDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || "";

  // Fetch count stats for this user
  const activeCount = await prisma.booking.count({
    where: {
      userId,
      status: { in: ["ISSUED", "OVERDUE"] },
    },
  });

  const pendingCount = await prisma.booking.count({
    where: {
      userId,
      status: "PENDING",
    },
  });

  const returnedCount = await prisma.booking.count({
    where: {
      userId,
      status: "RETURNED",
    },
  });

  // Fetch active borrowings
  const activeBorrowings = await prisma.booking.findMany({
    where: {
      userId,
      status: { in: ["ISSUED", "OVERDUE"] },
    },
    include: {
      asset: {
        select: { name: true, category: true },
      },
    },
    orderBy: { endDate: "asc" },
  });

  // Fetch recent requests
  const recentRequests = await prisma.booking.findMany({
    where: { userId },
    include: {
      asset: { select: { name: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "APPROVED":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "ISSUED":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "RETURNED":
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
      case "OVERDUE":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default:
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Overview" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Block */}
        <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-900 to-violet-950/20 border border-slate-800/80 backdrop-blur-md">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Hello, {session?.user?.name || "Member"}!</h2>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Welcome to the Smart Asset Management and Resource Allocation Platform. You belong to the <span className="text-violet-400 font-semibold">{session?.user?.section || "Council Member"}</span> section. Below is your resource allocation summary.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md flex items-center gap-5">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-500 uppercase tracking-widest">Active Borrowings</p>
              <h3 className="text-2xl font-bold text-white mt-1">{activeCount}</h3>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md flex items-center gap-5">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-500 uppercase tracking-widest">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-white mt-1">{pendingCount}</h3>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md flex items-center gap-5">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xxs font-bold text-slate-500 uppercase tracking-widest">Returned Assets</p>
              <h3 className="text-2xl font-bold text-white mt-1">{returnedCount}</h3>
            </div>
          </div>
        </div>

        {/* Dynamic content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Area (Active & Recent Requests) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Borrowings */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
              <h3 className="font-bold text-base text-white mb-4">Active Assets Checked Out</h3>
              {activeBorrowings.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
                  <Clipboard className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No assets currently checked out</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBorrowings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-wrap justify-between items-center gap-4"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-white">{b.asset.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">Quantity: <span className="font-semibold text-slate-200">{b.quantity}</span> &bull; {b.asset.category}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase mb-1.5 ${getStatusColor(b.status)}`}>
                          {b.status}
                        </div>
                        <p className="text-xs text-slate-500">
                          Due: <span className="font-medium text-slate-400">{new Date(b.endDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Requests list */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
              <h3 className="font-bold text-base text-white mb-4">Recent Requests</h3>
              {recentRequests.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-sm text-slate-500">No requests made yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase font-semibold">
                        <th className="py-3 px-4">Asset</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Quantity</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {recentRequests.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-white block">{b.asset.name}</span>
                            <span className="text-xxs text-slate-500 mt-0.5">{b.asset.category}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-200">{b.quantity}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider uppercase ${getStatusColor(b.status)}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area (Quick Actions & Guidelines) */}
          <div className="space-y-8">
            {/* Quick Actions Panel */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
              <h3 className="font-bold text-base text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <Link
                  href="/dashboard/browse"
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-lg shadow-violet-600/15 transition-all text-sm group"
                >
                  <Search className="w-5 h-5" /> Browse Inventory
                </Link>
                <Link
                  href="/dashboard/history"
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white transition-all text-sm"
                >
                  <History className="w-5 h-5 text-slate-400" /> View Borrowing History
                </Link>
              </div>
            </div>

            {/* Council Guidelines */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
              <h3 className="font-bold text-base text-white mb-3">Borrowing Guidelines</h3>
              <ul className="space-y-3 text-xs text-slate-400 leading-relaxed list-disc list-inside">
                <li>Check asset availability before making a request. Double-bookings are blocked automatically.</li>
                <li>Make requests at least 24 hours in advance to allow Admin approval.</li>
                <li>Pick up approved assets from the respective section room at the scheduled start time.</li>
                <li>Return assets promptly on or before the due date. Overdue notifications are sent automatically.</li>
                <li>Report any damages or maintenance requirements immediately upon return.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
