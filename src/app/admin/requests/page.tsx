"use client";

import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { getBookings, updateBookingStatus } from "../../actions/bookings";
import { ClipboardCheck, Check, X, Loader2, AlertCircle, CheckCircle2, FileText } from "lucide-react";

interface Booking {
  id: string;
  quantity: number;
  startDate: string | Date;
  endDate: string | Date;
  purpose: string;
  status: string;
  createdAt: string | Date;
  user: {
    name: string;
    email: string;
    section: string;
  };
  asset: {
    name: string;
    category: string;
    availableQuantity: number;
  };
}

export default function BookingRequests() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Rejection Modal States
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = async () => {
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
    loadRequests();
  }, [filter]);

  const handleApprove = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await updateBookingStatus(id, "APPROVED");
      if (res.success) {
        setSuccess(res.message || "Booking request approved!");
        loadRequests();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.error || "Failed to approve booking.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectOpen = (booking: Booking) => {
    setRejectingBooking(booking);
    setRejectionReason("");
    setError("");
    setSuccess("");
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBooking || !rejectionReason.trim()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await updateBookingStatus(rejectingBooking.id, "REJECTED", rejectionReason);
      if (res.success) {
        setSuccess(res.message || "Booking request rejected.");
        setRejectingBooking(null);
        loadRequests();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.error || "Failed to reject booking.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "APPROVED":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "REJECTED":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Booking Requests" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Global Notifications */}
        {error && !rejectingBooking && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && !rejectingBooking && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5 animate-pulse">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <ClipboardCheck className="w-5 h-5 text-violet-400" /> Pending Allocations Approval
          </div>

          <div className="w-full md:w-auto overflow-x-auto flex gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl max-w-full">
            {["PENDING", "APPROVED", "REJECTED"].map((status) => (
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

        {/* Requests Table */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading request records...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500 text-sm">No booking requests matching status: {filter.toLowerCase()}</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-md">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Requester</th>
                  <th className="py-4 px-6">Asset Details</th>
                  <th className="py-4 px-6">Dates Requested</th>
                  <th className="py-4 px-6">Purpose</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-white block">{b.user.name}</span>
                      <span className="text-xxs text-violet-400 block font-semibold mt-0.5">{b.user.section}</span>
                      <span className="text-xxs text-slate-500 block truncate max-w-[150px]">{b.user.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white block">{b.asset.name}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Requested: <span className="font-semibold text-slate-200">{b.quantity}x</span> &bull; Stock: {b.asset.availableQuantity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-slate-300 block">
                        {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                      </span>
                      <span className="text-xxs text-slate-500 block mt-0.5">
                        Request Date: {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-xs text-slate-400 line-clamp-2 max-w-xs leading-relaxed" title={b.purpose}>
                        {b.purpose}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {b.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(b.id)}
                            className="p-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Approve Booking"
                          >
                            <Check className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleRejectOpen(b)}
                            className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Reject Booking"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold tracking-wider uppercase ${getStatusColor(b.status)}`}>
                          {b.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {rejectingBooking && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setRejectingBooking(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                &times;
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Reject Booking Request</h3>
              <p className="text-xs text-slate-400 mb-5">
                Asset: {rejectingBooking.asset.name} for {rejectingBooking.user.name}
              </p>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Rejection Reason</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a clear explanation for this rejection (e.g. priority event scheduling, maintenance delays)..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 placeholder-slate-700 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setRejectingBooking(null)}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Rejecting...
                      </>
                    ) : (
                      "Reject Request"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
