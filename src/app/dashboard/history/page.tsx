"use client";

import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { getBookings } from "../../actions/bookings";
import { Clock, Filter, Loader2, Calendar, Clipboard, HelpCircle } from "lucide-react";

interface Booking {
  id: string;
  assetId: string;
  quantity: number;
  startDate: string | Date;
  endDate: string | Date;
  purpose: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string | Date;
  asset: {
    name: string;
    category: string;
  };
  returnLog?: {
    returnedAt: string | Date;
    conditionOnReturn: string;
    comments?: string | null;
  } | null;
}

const FILTER_STATUSES = ["ALL", "PENDING", "APPROVED", "ISSUED", "RETURNED", "OVERDUE"];

export default function BorrowHistory() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getBookings(filter);
      if (res.success && res.bookings) {
        setBookings(res.bookings as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [filter]);

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

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "EXCELLENT":
        return "text-emerald-400 font-semibold";
      case "GOOD":
        return "text-blue-400 font-semibold";
      case "FAIR":
        return "text-amber-400 font-semibold";
      default:
        return "text-rose-400 font-semibold";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Borrow History" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Filter className="w-4 h-4" /> Filter Status
          </div>
          <div className="w-full md:w-auto overflow-x-auto flex gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl max-w-full">
            {FILTER_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  filter === status
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* History content */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading historical data...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center bg-slate-905/20 border border-dashed border-slate-800 rounded-2xl max-w-3xl mx-auto">
            <Clipboard className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-400">No bookings recorded</h3>
            <p className="text-slate-600 text-sm mt-1">Submit booking requests in the browse catalog page.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md hover:border-slate-800 transition-all duration-200 flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="space-y-4 flex-1">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-base text-white">{booking.asset.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {booking.asset.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Requested: <span className="font-semibold text-slate-200">{booking.quantity}x</span> &bull; Purpose: {booking.purpose}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/40 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Start Date</p>
                      <p className="font-medium text-slate-300 mt-1">{new Date(booking.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Due Date</p>
                      <p className="font-medium text-slate-300 mt-1">{new Date(booking.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Request Date</p>
                      <p className="font-medium text-slate-400 mt-1">{new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    {booking.returnLog && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Returned Date</p>
                        <p className="font-medium text-slate-400 mt-1">{new Date(booking.returnLog.returnedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Return Logs display */}
                  {booking.returnLog && (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Return Condition & remarks</p>
                      <p className="text-slate-300 mt-1">
                        Condition on Return: <span className={getConditionColor(booking.returnLog.conditionOnReturn)}>{booking.returnLog.conditionOnReturn}</span>
                      </p>
                      {booking.returnLog.comments && (
                        <p className="text-slate-400 mt-1.5 italic">&quot;{booking.returnLog.comments}&quot;</p>
                      )}
                    </div>
                  )}

                  {/* Rejection reason display */}
                  {booking.status === "REJECTED" && booking.rejectionReason && (
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs space-y-1">
                      <p className="text-[10px] uppercase font-bold text-rose-400/80 tracking-wider">Rejection Reason</p>
                      <p className="text-rose-400 italic mt-1.5">&quot;{booking.rejectionReason}&quot;</p>
                    </div>
                  )}
                </div>

                <div className="md:text-right flex flex-col justify-between items-start md:items-end gap-3 self-stretch border-t md:border-t-0 md:border-l border-slate-800/60 pt-4 md:pt-0 md:pl-6 shrink-0 md:w-48">
                  <div className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </div>

                  <div className="text-left md:text-right mt-auto">
                    <p className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Allocation ID</p>
                    <p className="text-xxs text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">{booking.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
