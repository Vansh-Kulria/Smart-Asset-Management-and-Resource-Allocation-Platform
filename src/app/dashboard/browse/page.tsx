"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "../../../components/Header";
import { getAssets, checkAssetAvailability } from "../../actions/assets";
import { createBooking } from "../../actions/bookings";
import { Search, SlidersHorizontal, Info, ShieldAlert, CheckCircle2, Loader2, Calendar, Clipboard } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  category: string;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  condition: string;
  status: string;
  qrCode?: string | null;
}

const CATEGORIES = ["All", "Cameras", "Lighting", "Audio Systems", "Costumes", "Stage Props", "Event Infrastructure"];

export default function BrowseAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // Booking Modal States
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();

  // Live Availability Check States
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    checked: boolean;
    available: boolean;
    maxAvailable?: number;
    error?: string;
  }>({ checked: false, available: false });

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await getAssets(search, category);
      if (res.success && res.assets) {
        setAssets(res.assets as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const delayDebounce = setTimeout(() => {
      loadAssets();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, category]);

  // Live Availability check effect when dates/quantity change
  useEffect(() => {
    if (!selectedAsset || !startDate || !endDate || quantity < 1) {
      setAvailabilityStatus({ checked: false, available: false });
      return;
    }

    const checkLive = async () => {
      setCheckingAvailability(true);
      try {
        const res = await checkAssetAvailability(selectedAsset.id, startDate, endDate, quantity);
        if (res.success) {
          setAvailabilityStatus({
            checked: true,
            available: res.available || false,
            maxAvailable: res.maxAvailable,
            error: res.error,
          });
        } else {
          setAvailabilityStatus({
            checked: true,
            available: false,
            error: res.error || "Failed to verify dates",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const delayCheck = setTimeout(checkLive, 500);
    return () => clearTimeout(delayCheck);
  }, [startDate, endDate, quantity, selectedAsset]);

  const handleOpenBooking = (asset: Asset) => {
    setSelectedAsset(asset);
    setQuantity(1);
    setStartDate("");
    setEndDate("");
    setPurpose("");
    setModalError("");
    setModalSuccess("");
    setAvailabilityStatus({ checked: false, available: false });
  };

  const handleCloseBooking = () => {
    setSelectedAsset(null);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !startDate || !endDate || !purpose || quantity < 1) {
      setModalError("Please fill out all fields correctly.");
      return;
    }

    setSubmitting(true);
    setModalError("");
    setModalSuccess("");

    try {
      const res = await createBooking({
        assetId: selectedAsset.id,
        quantity,
        startDate,
        endDate,
        purpose,
      });

      if (!res.success) {
        setModalError(res.error || "Failed to submit booking request.");
        setSubmitting(false);
      } else {
        setModalSuccess(res.message || "Request submitted successfully!");
        loadAssets(); // reload to reflect quantities if immediate
        setTimeout(() => {
          handleCloseBooking();
        }, 1500);
      }
    } catch (err: any) {
      setModalError("Unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "EXCELLENT":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "GOOD":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "FAIR":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    }
  };

  const getStatusBadge = (status: string, availableQty: number) => {
    if (status === "MAINTENANCE") {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          Maintenance
        </span>
      );
    }
    if (availableQty === 0 || status === "OUT_OF_STOCK") {
      return (
        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
          Out of Stock
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
        Available
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Browse Assets" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl backdrop-blur-md">
          {/* Search Box */}
          <form onSubmit={(e) => e.preventDefault()} className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by name or details..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-all text-sm"
            />
          </form>

          {/* Category Tabs */}
          <div className="w-full md:w-auto overflow-x-auto no-scrollbar flex gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  category === cat
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Listing */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading asset catalog...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl max-w-3xl mx-auto">
            <SlidersHorizontal className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-400">No assets found</h3>
            <p className="text-slate-600 text-sm mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex flex-col justify-between p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-900/60 transition-all duration-300 relative group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                      {asset.category}
                    </span>
                    <div className="flex gap-1.5 items-center">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold ${getConditionColor(asset.condition)}`}>
                        {asset.condition}
                      </span>
                      {getStatusBadge(asset.status, asset.availableQuantity)}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2 leading-snug">{asset.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-6">
                    {asset.description || "No description provided."}
                  </p>
                </div>

                <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between mt-auto">
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">In Stock</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">
                      {asset.availableQuantity} <span className="text-slate-500 font-normal">/ {asset.totalQuantity}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenBooking(asset)}
                    disabled={asset.status === "MAINTENANCE" || asset.availableQuantity === 0}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800/40 hover:scale-[1.02] border border-transparent text-white font-semibold text-xs shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 transition-all cursor-pointer"
                  >
                    Request Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Request Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={handleCloseBooking}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                &times;
              </button>

              <h3 className="text-lg font-bold text-white mb-1.5">Request Asset Booking</h3>
              <p className="text-xs text-slate-400 mb-5 pb-4 border-b border-slate-800">
                Asset: <span className="text-violet-400 font-semibold">{selectedAsset.name}</span> &bull; Category: {selectedAsset.category}
              </p>

              {modalError && (
                <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5 animate-pulse">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Quantity */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Quantity Requested</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedAsset.totalQuantity}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Maximum total inventory: {selectedAsset.totalQuantity}</span>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Start Date</label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-3 w-4 h-4 text-slate-500 cursor-pointer z-10"
                        onClick={() => startDateRef.current?.showPicker()}
                      />
                      <input
                        ref={startDateRef}
                        type="date"
                        required
                        min={todayStr}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-violet-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">End Date (Due Date)</label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-3 w-4 h-4 text-slate-500 cursor-pointer z-10"
                        onClick={() => endDateRef.current?.showPicker()}
                      />
                      <input
                        ref={endDateRef}
                        type="date"
                        required
                        min={startDate || todayStr}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-violet-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Overlap Checker Notice */}
                {checkingAvailability && (
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                    <span className="text-[11px] text-slate-500">Checking availability database...</span>
                  </div>
                )}

                {availabilityStatus.checked && !checkingAvailability && (
                  <div className={`p-3.5 rounded-xl border text-[11px] flex items-start gap-2.5 leading-relaxed ${
                    availabilityStatus.available
                      ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/5 border-rose-500/10 text-rose-400"
                  }`}>
                    {availabilityStatus.available ? (
                      <>
                        <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                        <span>Dates are available! There are no overlapping reservations blocking your checkout.</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                        <span>{availabilityStatus.error || "Conflict detected."}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Purpose */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Purpose of Booking</label>
                  <textarea
                    required
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Provide details about the event, usage location, and council section..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 placeholder-slate-700 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleCloseBooking}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (availabilityStatus.checked && !availabilityStatus.available)}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800/40 rounded-xl text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit Request"
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
