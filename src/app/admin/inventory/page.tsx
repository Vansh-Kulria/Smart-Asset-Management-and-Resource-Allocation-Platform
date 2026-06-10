"use client";

import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { getAssets, createAsset, updateAsset, deleteAsset } from "../../actions/assets";
import { Boxes, Plus, Pencil, Trash2, QrCode, Printer, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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

const CATEGORIES = ["Cameras", "Lighting", "Audio Systems", "Costumes", "Stage Props", "Event Infrastructure"];
const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "DAMAGED"];
const STATUSES = ["AVAILABLE", "MAINTENANCE", "OUT_OF_STOCK"];

export default function ManageInventory() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingQrAsset, setViewingQrAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [status, setStatus] = useState(STATUSES[0]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await getAssets();
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
    loadInventory();
  }, []);

  const handleOpenAdd = () => {
    setName("");
    setCategory(CATEGORIES[0]);
    setDescription("");
    setTotalQuantity(1);
    setCondition(CONDITIONS[0]);
    setStatus(STATUSES[0]);
    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setCategory(asset.category);
    setDescription(asset.description);
    setTotalQuantity(asset.totalQuantity);
    setCondition(asset.condition);
    setStatus(asset.status);
    setError("");
    setSuccess("");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await createAsset({
        name,
        category,
        description,
        totalQuantity,
        condition,
        status,
      });

      if (!res.success) {
        setError(res.error || "Failed to create asset.");
        setSubmitting(false);
      } else {
        setSuccess(res.message || "Asset created successfully!");
        loadInventory();
        setTimeout(() => {
          setShowAddModal(false);
        }, 1200);
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await updateAsset(editingAsset.id, {
        name,
        category,
        description,
        totalQuantity,
        condition,
        status,
      });

      if (!res.success) {
        setError(res.error || "Failed to update asset.");
        setSubmitting(false);
      } else {
        setSuccess(res.message || "Asset updated successfully!");
        loadInventory();
        setTimeout(() => {
          setEditingAsset(null);
        }, 1200);
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset? This action is irreversible.")) return;

    try {
      const res = await deleteAsset(id);
      if (res.success) {
        setSuccess("Asset deleted successfully!");
        loadInventory();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.error || "Failed to delete asset.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintQR = () => {
    if (!viewingQrAsset?.qrCode) return;
    
    // Open a simple printable window
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${viewingQrAsset.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px solid #000; border-radius: 12px; padding: 20px; display: inline-block; }
            img { width: 200px; height: 200px; }
            h2 { margin: 10px 0 5px 0; }
            p { margin: 0; color: #555; font-size: 14px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <img src="${viewingQrAsset.qrCode}" />
            <h2>${viewingQrAsset.name}</h2>
            <p>Category: ${viewingQrAsset.category}</p>
            <p style="font-size: 10px; color: #888; margin-top: 5px;">ID: ${viewingQrAsset.id}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Manage Inventory" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Alerts */}
        {error && !editingAsset && !showAddModal && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && !editingAsset && !showAddModal && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5 animate-pulse">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <Boxes className="w-5 h-5 text-violet-400" /> Active Inventory List
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-600/10"
          >
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>

        {/* Inventory listing */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading active inventory...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500 text-sm">No assets registered yet. Click &apos;Add Asset&apos; to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-md">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Asset Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Condition</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-white block">{asset.name}</span>
                      <span className="text-xxs text-slate-500 block truncate max-w-[200px] mt-0.5">{asset.id}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{asset.category}</td>
                    <td className="py-4 px-6 font-semibold">
                      {asset.availableQuantity} <span className="text-slate-500 font-normal">/ {asset.totalQuantity}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold ${getConditionColor(asset.condition)}`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        asset.status === "AVAILABLE" && asset.availableQuantity > 0
                          ? "bg-emerald-500"
                          : asset.status === "MAINTENANCE"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`} />
                      <span className="text-xs">{asset.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setViewingQrAsset(asset)}
                        className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(asset)}
                        className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="Edit Asset"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 bg-slate-950 border border-slate-800 hover:border-rose-500/20 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Asset Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                &times;
              </button>

              <h3 className="text-lg font-bold text-white mb-5">Add New Asset</h3>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Asset Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sony FX3"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed equipment specifications, modifier links, kit details..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Qty</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 cursor-pointer"
                    >
                      {CONDITIONS.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 cursor-pointer"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Asset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Asset Modal */}
        {editingAsset && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setEditingAsset(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                &times;
              </button>

              <h3 className="text-lg font-bold text-white mb-5">Edit Asset Info</h3>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Asset Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Qty</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 cursor-pointer"
                    >
                      {CONDITIONS.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 cursor-pointer"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditingAsset(null)}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View QR Code Modal */}
        {viewingQrAsset && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-center">
              <button
                onClick={() => setViewingQrAsset(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                &times;
              </button>

              <h3 className="text-lg font-bold text-white mb-1.5">Asset QR Label</h3>
              <p className="text-xs text-slate-500 mb-6">Print label to attach on physical asset</p>

              {viewingQrAsset.qrCode ? (
                <div className="bg-white p-4 rounded-xl inline-block border border-slate-200 shadow-md">
                  <img src={viewingQrAsset.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
                </div>
              ) : (
                <div className="py-12 bg-slate-950 border border-slate-800 rounded-xl text-slate-600">
                  QR Code not generated
                </div>
              )}

              <h4 className="font-bold text-base text-white mt-4">{viewingQrAsset.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{viewingQrAsset.category}</p>

              <button
                onClick={handlePrintQR}
                className="mt-6 w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Label
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
