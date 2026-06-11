"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import { getBookings } from "../../actions/bookings";
import { issueAsset, returnAsset } from "../../actions/operations";
import { QrCode, Search, User, ClipboardCheck, ArrowRight, Shuffle, Loader2, AlertCircle, CheckCircle2, Video, VideoOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

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
    id: string;
    name: string;
    category: string;
  };
}

export default function IssueReturn() {
  const [approvedBookings, setApprovedBookings] = useState<Booking[]>([]);
  const [activeAllocations, setActiveAllocations] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Scan states
  const [showScanner, setShowScanner] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("Camera off");
  const qrRef = useRef<Html5Qrcode | null>(null);

  // Return Process Modal States
  const [processingReturn, setProcessingReturn] = useState<Booking | null>(null);
  const [returnCondition, setReturnCondition] = useState("EXCELLENT");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const resApproved = await getBookings("APPROVED");
      const resIssued = await getBookings("ISSUED");
      const resOverdue = await getBookings("OVERDUE");

      if (resApproved.success && resApproved.bookings) {
        setApprovedBookings(resApproved.bookings as any);
      }
      if (resIssued.success && resIssued.bookings) {
        // Merge issued and overdue
        const active = [
          ...(resIssued.bookings || []),
          ...(resOverdue.bookings || []),
        ];
        setActiveAllocations(active as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssue = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await issueAsset(id);
      if (res.success) {
        setSuccess(res.message || "Asset checked out successfully!");
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.error || "Failed to issue asset.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnOpen = (booking: Booking) => {
    setProcessingReturn(booking);
    setReturnCondition("EXCELLENT");
    setComments("");
    setError("");
    setSuccess("");
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingReturn) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await returnAsset(processingReturn.id, returnCondition, comments);
      if (res.success) {
        setSuccess(res.message || "Return processed successfully!");
        setProcessingReturn(null);
        loadData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.error || "Failed to process return.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  // QR Code Camera Toggle
  const toggleScanner = async () => {
    if (showScanner) {
      // Stop scanner
      if (qrRef.current) {
        try {
          if (qrRef.current.isScanning) {
            await qrRef.current.stop();
          }
          qrRef.current.clear();
        } catch (err) {
          console.error("Scanner stop error:", err);
        }
      }
      setShowScanner(false);
      setScanningStatus("Camera off");
    } else {
      setShowScanner(true);
      setScanningStatus("Initializing camera...");
      
      // Give DOM time to mount #qr-reader
      setTimeout(() => {
        const qrScanner = new Html5Qrcode("qr-reader");
        qrRef.current = qrScanner;

        qrScanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Silence scanning frame debug failures
          }
        ).then(() => {
          setScanningStatus("Scanning... Point camera at asset label QR Code");
        }).catch((err) => {
          console.error(err);
          setScanningStatus("Failed to access camera. Check browser permissions.");
        });
      }, 300);
    }
  };

  const handleScanSuccess = async (text: string) => {
    // Text is expected to be a JSON string like: {"id":"assetId","name":"Sony FX3","category":"Cameras"}
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.id) {
        setSearch(parsed.name || parsed.id); // set search box to filter
        setSuccess(`QR Code Scanned Successfully! Filtered by: ${parsed.name || "Asset ID"}`);
        setTimeout(() => setSuccess(""), 4000);
        
        // Auto-close scanner
        toggleScanner();
      } else {
        setError("Invalid QR Code content: Missing Asset ID.");
        setTimeout(() => setError(""), 4000);
      }
    } catch (err) {
      setError("Unable to parse QR Code data. Make sure it is an asset label.");
      setTimeout(() => setError(""), 4000);
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrRef.current && qrRef.current.isScanning) {
        qrRef.current.stop().then(() => {
          qrRef.current?.clear();
        }).catch(err => console.error(err));
      }
    };
  }, []);

  // Filter lists based on search string
  const filterList = (list: Booking[]) => {
    if (!search) return list;
    const lower = search.toLowerCase();
    return list.filter((b) =>
      b.user.name.toLowerCase().includes(lower) ||
      b.asset.name.toLowerCase().includes(lower) ||
      b.asset.id.toLowerCase().includes(lower) ||
      b.user.section.toLowerCase().includes(lower)
    );
  };

  const filteredApproved = filterList(approvedBookings);
  const filteredActive = filterList(activeAllocations);

  const getStatusColor = (status: string) => {
    return status === "OVERDUE"
      ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
      : "text-blue-400 bg-blue-500/10 border-blue-500/20";
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Issue & Return Portal" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Global Warnings */}
        {error && !processingReturn && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && !processingReturn && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5 animate-pulse">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* QR Scanner and Search Bar */}
        <div className="bg-slate-900/40 p-6 border border-slate-800/60 rounded-2xl backdrop-blur-md space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <form onSubmit={(e) => e.preventDefault()} className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search active checkouts by borrower, section, or asset..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-all text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-300 font-semibold uppercase cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>

            {/* QR Scanner Trigger */}
            <button
              type="button"
              onClick={toggleScanner}
              className={`px-4.5 py-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                showScanner
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                  : "bg-violet-600 text-white border-transparent hover:bg-violet-500 shadow-lg shadow-violet-600/10"
              }`}
            >
              {showScanner ? (
                <>
                  <VideoOff className="w-4.5 h-4.5" /> Stop Scanner
                </>
              ) : (
                <>
                  <Video className="w-4.5 h-4.5" /> Scan Asset Label
                </>
              )}
            </button>
          </div>

          {/* Scanner Camera Screen */}
          {showScanner && (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-xl max-w-md mx-auto animate-in slide-in-from-top-4 duration-200">
              <div id="qr-reader" className="w-full bg-black rounded-lg overflow-hidden border border-slate-800" />
              <p className="text-[10px] text-slate-500 mt-4 text-center leading-relaxed italic">
                {scanningStatus}
              </p>
            </div>
          )}
        </div>

        {/* Dual Lists */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Synchronizing operations records...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Approved Bookings for Issue */}
            <div className="bg-slate-900/40 p-6 border border-slate-800/60 rounded-2xl backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <ClipboardCheck className="w-4.5 h-4.5 text-emerald-400" />
                  <span>Approved Bookings (Pending Issue)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold">
                  {filteredApproved.length}
                </span>
              </div>

              {filteredApproved.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 leading-relaxed italic">
                  No approved bookings awaiting check-out.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApproved.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-wrap justify-between items-center gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{b.asset.name}</h4>
                        <p className="text-xs text-slate-400">
                          Borrower: <span className="font-semibold text-slate-200">{b.user.name} ({b.user.section})</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Qty: {b.quantity} &bull; Period: {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleIssue(b.id)}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Issue <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Active Borrowings for Return */}
            <div className="bg-slate-900/40 p-6 border border-slate-800/60 rounded-2xl backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <Shuffle className="w-4.5 h-4.5 text-blue-400" />
                  <span>Active Checked Out Assets (Pending Return)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold">
                  {filteredActive.length}
                </span>
              </div>

              {filteredActive.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 leading-relaxed italic">
                  No active allocations checked out.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActive.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-wrap justify-between items-center gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{b.asset.name}</h4>
                        <p className="text-xs text-slate-400">
                          Borrower: <span className="font-semibold text-slate-200">{b.user.name} ({b.user.section})</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Qty: {b.quantity} &bull; Due date: <span className="font-medium text-slate-400">{new Date(b.endDate).toLocaleDateString()}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getStatusColor(b.status)}`}>
                          {b.status}
                        </span>
                        <button
                          onClick={() => handleReturnOpen(b)}
                          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer"
                        >
                          Check In
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Check In Return Modal */}
        {processingReturn && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setProcessingReturn(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                &times;
              </button>

              <h3 className="text-lg font-bold text-white mb-1.5">Process Resource Return</h3>
              <p className="text-xs text-slate-400 mb-5 pb-4 border-b border-slate-800">
                Asset: {processingReturn.asset.name} &bull; Borrower: {processingReturn.user.name}
              </p>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Returned Condition</label>
                  <select
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 cursor-pointer"
                  >
                    <option value="EXCELLENT">Excellent (Good as new)</option>
                    <option value="GOOD">Good (Light wear/normal use)</option>
                    <option value="FAIR">Fair (Noticeable wear, fully functional)</option>
                    <option value="DAMAGED">Damaged (Needs repair / non-functional)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Check-in comments</label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter any details about condition wear, items missing, or damage reports..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 placeholder-slate-700 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setProcessingReturn(null)}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      "Confirm Return"
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
