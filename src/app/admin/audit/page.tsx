"use client";

import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { getAuditLogs } from "../../actions/audit";
import {
  FileText,
  Loader2,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Shield,
  ShieldAlert,
  Info,
  Layers,
  Activity,
  Users as UsersIcon,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string | Date;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // UI Interactive States
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const res = await getAuditLogs();
        if (res.success && res.auditLogs) {
          setLogs(res.auditLogs as any);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  // Filter and Search Logic
  const filteredLogs = logs.filter((log) => {
    const actionMatch = selectedAction === "ALL" || log.action === selectedAction;

    let detailText = "";
    try {
      const d = JSON.parse(log.details);
      detailText = [
        d.name,
        d.assetName,
        d.category,
        d.borrower,
        d.targetUserEmail,
        d.reason,
        d.comments,
        d.previous?.name,
        d.current?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    } catch (e) {
      detailText = log.details.toLowerCase();
    }

    const searchStr = `${log.user?.name || ""} ${log.user?.email || ""} ${log.action} ${detailText}`.toLowerCase();
    const searchMatch =
      !searchQuery || searchStr.includes(searchQuery.toLowerCase());

    return actionMatch && searchMatch;
  });

  // KPI Statistics Calculations
  const stats = {
    total: logs.length,
    assetCount: logs.filter((l) =>
      ["CREATE_ASSET", "UPDATE_ASSET", "DELETE_ASSET"].includes(l.action)
    ).length,
    circulationCount: logs.filter((l) =>
      ["APPROVE_BOOKING", "REJECT_BOOKING", "ISSUE_ASSET", "RETURN_ASSET"].includes(
        l.action
      )
    ).length,
    userCount: logs.filter((l) =>
      ["PROMOTE_USER", "DEMOTE_USER", "UPDATE_PROFILE"].includes(l.action)
    ).length,
  };

  // Pagination Logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedAction("ALL");
    setCurrentPage(1);
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = ["Timestamp", "User Name", "User Email", "Action", "Details Summary"];
    const rows = filteredLogs.map((log) => {
      let summary = "";
      try {
        const details = JSON.parse(log.details);
        switch (log.action) {
          case "CREATE_ASSET":
            summary = `Created asset ${details.name} (${details.category}) Qty: ${details.quantity}`;
            break;
          case "UPDATE_ASSET":
            summary = `Updated asset. Current: ${details.current.name} (Qty: ${details.current.quantity}) Prev: ${details.previous.name} (Qty: ${details.previous.quantity})`;
            break;
          case "DELETE_ASSET":
            summary = `Deleted asset ${details.name} (${details.category})`;
            break;
          case "APPROVE_BOOKING":
            summary = `Approved booking for ${details.borrower} (Qty: ${details.quantity} of ${details.assetName})`;
            break;
          case "REJECT_BOOKING":
            summary = `Rejected booking for ${details.borrower} (Qty: ${details.quantity} of ${details.assetName}) Reason: ${details.reason || "None specified"}`;
            break;
          case "ISSUE_ASSET":
            summary = `Issued ${details.quantity}x ${details.assetName} to ${details.borrower}`;
            break;
          case "RETURN_ASSET":
            summary = `Returned ${details.quantity}x ${details.assetName} from ${details.borrower} Condition: ${details.condition}`;
            break;
          case "UPDATE_PROFILE":
            summary = `Updated profile Name: ${details.name} Section: ${details.section}`;
            break;
          case "PROMOTE_USER":
            summary = `Promoted ${details.targetUserEmail} to ADMIN`;
            break;
          case "DEMOTE_USER":
            summary = `Demoted ${details.targetUserEmail} to CONSUMER`;
            break;
          default:
            summary = log.details;
        }
      } catch {
        summary = log.details;
      }
      return [
        new Date(log.createdAt).toLocaleString(),
        log.user?.name || "Unknown",
        log.user?.email || "Unknown",
        log.action,
        summary,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `system_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON Function
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `system_audit_logs_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy details JSON function
  const handleCopyJSON = (logId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(logId);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  // Toggle Row Expansion
  const toggleRowExpansion = (logId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  // Render Action Icon & Colors
  const getActionMeta = (action: string) => {
    switch (action) {
      case "CREATE_ASSET":
        return {
          icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
          badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          title: "Create Asset",
        };
      case "UPDATE_ASSET":
        return {
          icon: <Edit2 className="w-4 h-4 text-blue-400" />,
          badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
          title: "Update Asset",
        };
      case "DELETE_ASSET":
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-400" />,
          badge: "bg-rose-500/10 border-rose-500/20 text-rose-400",
          title: "Delete Asset",
        };
      case "APPROVE_BOOKING":
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
          badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          title: "Approve Booking",
        };
      case "REJECT_BOOKING":
        return {
          icon: <XCircle className="w-4 h-4 text-rose-400" />,
          badge: "bg-rose-500/10 border-rose-500/20 text-rose-400",
          title: "Reject Booking",
        };
      case "ISSUE_ASSET":
        return {
          icon: <ArrowUpRight className="w-4 h-4 text-indigo-400" />,
          badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
          title: "Issue Asset",
        };
      case "RETURN_ASSET":
        return {
          icon: <ArrowDownLeft className="w-4 h-4 text-teal-400" />,
          badge: "bg-teal-500/10 border-teal-500/20 text-teal-400",
          title: "Return Asset",
        };
      case "UPDATE_PROFILE":
        return {
          icon: <User className="w-4 h-4 text-amber-400" />,
          badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          title: "Update Profile",
        };
      case "PROMOTE_USER":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-violet-400" />,
          badge: "bg-violet-500/10 border-violet-500/20 text-violet-400",
          title: "Promote User",
        };
      case "DEMOTE_USER":
        return {
          icon: <Shield className="w-4 h-4 text-slate-400" />,
          badge: "bg-slate-500/10 border-slate-500/20 text-slate-400",
          title: "Demote User",
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-slate-400" />,
          badge: "bg-slate-500/10 border-slate-500/20 text-slate-400",
          title: action,
        };
    }
  };

  // Structured Details Rendering
  const renderDetails = (detailsStr: string, action: string) => {
    try {
      const details = JSON.parse(detailsStr);

      switch (action) {
        case "CREATE_ASSET":
          return (
            <div className="space-y-1">
              <p>
                Created asset <strong className="text-white font-medium">{details.name}</strong>
              </p>
              <div className="flex gap-2 text-xxs mt-0.5">
                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60">
                  Category: {details.category}
                </span>
                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60">
                  Qty: {details.quantity}
                </span>
              </div>
            </div>
          );

        case "UPDATE_ASSET":
          const nameChanged = details.current.name !== details.previous.name;
          const qtyChanged = details.current.quantity !== details.previous.quantity;
          return (
            <div className="space-y-1.5">
              <p className="text-xs">Updated asset fields:</p>
              <div className="overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/40 text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-500 font-bold">
                      <th className="py-1 px-2.5">Field</th>
                      <th className="py-1 px-2.5">Previous</th>
                      <th className="py-1 px-2.5">Current</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {nameChanged && (
                      <tr>
                        <td className="py-1 px-2.5 text-slate-400 font-medium">Name</td>
                        <td className="py-1 px-2.5 line-through text-slate-500">{details.previous.name}</td>
                        <td className="py-1 px-2.5 text-blue-400 font-semibold">{details.current.name}</td>
                      </tr>
                    )}
                    {qtyChanged && (
                      <tr>
                        <td className="py-1 px-2.5 text-slate-400 font-medium">Total Qty</td>
                        <td className="py-1 px-2.5 text-slate-500">{details.previous.quantity}</td>
                        <td className="py-1 px-2.5 text-blue-400 font-semibold">{details.current.quantity}</td>
                      </tr>
                    )}
                    {!nameChanged && !qtyChanged && (
                      <tr>
                        <td colSpan={3} className="py-1 px-2.5 text-center text-slate-500 italic">
                          Other details modified (description, condition or status)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );

        case "DELETE_ASSET":
          return (
            <div>
              Deleted asset <strong className="text-rose-400 font-medium">{details.name}</strong>
              <span className="block text-xxs text-slate-500">Category: {details.category}</span>
            </div>
          );

        case "APPROVE_BOOKING":
          return (
            <div>
              Approved booking for <strong className="text-white font-medium">{details.borrower}</strong>
              <span className="block text-xxs text-slate-400 mt-0.5">
                Asset: {details.quantity}x <span className="text-slate-300">{details.assetName}</span>
              </span>
            </div>
          );

        case "REJECT_BOOKING":
          return (
            <div className="space-y-1">
              <div>
                Rejected booking for <strong className="text-white font-medium">{details.borrower}</strong>
                <span className="block text-xxs text-slate-400 mt-0.5">
                  Asset: {details.quantity}x <span className="text-slate-300">{details.assetName}</span>
                </span>
              </div>
              {details.reason && (
                <div className="bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xxs p-1.5 rounded-lg">
                  <strong className="text-rose-400">Reason:</strong> &ldquo;{details.reason}&rdquo;
                </div>
              )}
            </div>
          );

        case "ISSUE_ASSET":
          return (
            <div>
              Checked out <strong className="text-white font-medium">{details.quantity}x {details.assetName}</strong>
              <span className="block text-xxs text-slate-400 mt-0.5">
                Issued to: <span className="text-indigo-400 font-medium">{details.borrower}</span>
              </span>
            </div>
          );

        case "RETURN_ASSET":
          const condColor = (c: string) => {
            if (c === "EXCELLENT") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            if (c === "GOOD") return "text-green-400 bg-green-500/10 border-green-500/20";
            if (c === "FAIR") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
            return "text-rose-400 bg-rose-500/10 border-rose-500/20";
          };
          return (
            <div className="space-y-1">
              <div>
                Received return of <strong className="text-white font-medium">{details.quantity}x {details.assetName}</strong>
                <span className="block text-xxs text-slate-400 mt-0.5">
                  Returned by: <span className="text-slate-300 font-medium">{details.borrower}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-xxs">
                <span className={`px-1.5 py-0.5 border rounded ${condColor(details.condition)}`}>
                  Condition: {details.condition}
                </span>
                {details.comments && (
                  <span className="text-slate-500 italic max-w-[200px] truncate block" title={details.comments}>
                    &ldquo;{details.comments}&rdquo;
                  </span>
                )}
              </div>
            </div>
          );

        case "UPDATE_PROFILE":
          return (
            <div>
              Profile setup completed for <strong className="text-white font-medium">{details.name}</strong>
              <span className="block text-xxs text-slate-400 mt-0.5">
                Section: <span className="text-slate-300">{details.section || "None"}</span>
              </span>
            </div>
          );

        case "PROMOTE_USER":
          return (
            <div>
              Promoted user <strong className="text-white font-medium">{details.targetUserEmail}</strong>
              <span className="block text-xxs text-violet-400 font-medium">Assigned Role: ADMIN</span>
            </div>
          );

        case "DEMOTE_USER":
          return (
            <div>
              Demoted user <strong className="text-white font-medium">{details.targetUserEmail}</strong>
              <span className="block text-xxs text-slate-500">Revoked Role: CONSUMER</span>
            </div>
          );

        default:
          return <span className="font-mono text-xxs break-all">{JSON.stringify(details)}</span>;
      }
    } catch (err) {
      return <span className="break-all">{detailsStr}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="System Audit Logs" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* KPI Statistics Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-900/20 border border-slate-800/60 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Total Logs</span>
                <span className="text-2xl font-bold text-white mt-1 block">{stats.total}</span>
              </div>
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <Activity className="w-6 h-6 text-violet-400" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Asset Operations</span>
                <span className="text-2xl font-bold text-white mt-1 block">{stats.assetCount}</span>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Layers className="w-6 h-6 text-blue-400" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Circulation Events</span>
                <span className="text-2xl font-bold text-white mt-1 block">{stats.circulationCount}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <Calendar className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Administration</span>
                <span className="text-2xl font-bold text-white mt-1 block">{stats.userCount}</span>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <UsersIcon className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls & Export buttons */}
        <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl backdrop-blur-md flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search user name, email, asset name..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-500 focus:outline-none focus:border-violet-500/80 transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-violet-500/80 appearance-none cursor-pointer"
              >
                <option value="ALL">All Log Actions</option>
                <optgroup label="Inventory Actions" className="bg-slate-950">
                  <option value="CREATE_ASSET">Create Asset</option>
                  <option value="UPDATE_ASSET">Update Asset</option>
                  <option value="DELETE_ASSET">Delete Asset</option>
                </optgroup>
                <optgroup label="Circulation Events" className="bg-slate-950">
                  <option value="APPROVE_BOOKING">Approve Booking</option>
                  <option value="REJECT_BOOKING">Reject Booking</option>
                  <option value="ISSUE_ASSET">Issue Asset</option>
                  <option value="RETURN_ASSET">Return Asset</option>
                </optgroup>
                <optgroup label="User Management" className="bg-slate-950">
                  <option value="UPDATE_PROFILE">Update Profile</option>
                  <option value="PROMOTE_USER">Promote User</option>
                  <option value="DEMOTE_USER">Demote User</option>
                </optgroup>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Reset Filters */}
            {(searchQuery || selectedAction !== "ALL") && (
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>

          {/* Export Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              disabled={filteredLogs.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Export JSON
            </button>
          </div>
        </div>

        {/* Audit Logs list */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500 text-sm">No actions matching current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-md">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-6">Action</th>
                    <th className="py-4 px-6">Details</th>
                    <th className="py-4 px-6 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {currentLogs.map((log) => {
                    const actionMeta = getActionMeta(log.action);
                    const isExpanded = !!expandedRows[log.id];
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-4 px-6 text-slate-400">
                            <span className="font-semibold block">{new Date(log.createdAt).toLocaleDateString()}</span>
                            <span className="text-xxs text-slate-500 block mt-0.5">{new Date(log.createdAt).toLocaleTimeString()}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-white block">{log.user?.name || "Unknown"}</span>
                            <span className="text-xxs text-slate-500 block truncate max-w-[150px]">{log.user?.email || "Unknown"}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-bold tracking-wider uppercase ${actionMeta.badge}`}
                            >
                              {actionMeta.icon}
                              {actionMeta.title}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-300 text-xs leading-relaxed max-w-md">
                            {renderDetails(log.details, log.action)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => toggleRowExpansion(log.id)}
                              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 hover:text-white text-slate-400 transition-all"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-950/60 border-t border-b border-slate-800/60">
                            <td colSpan={5} className="py-4 px-6">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Raw Log JSON Payload
                                  </span>
                                  <button
                                    onClick={() => handleCopyJSON(log.id, JSON.stringify(JSON.parse(log.details), null, 2))}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-md transition-all"
                                  >
                                    {copiedLogId === log.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" /> Copy JSON
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl font-mono text-[10px] text-slate-400 overflow-x-auto select-all max-h-[160px] no-scrollbar">
                                  {JSON.stringify(JSON.parse(log.details), null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 text-xs">
                <span className="text-slate-500">
                  Showing <strong className="text-white">{indexOfFirstLog + 1}</strong> to{" "}
                  <strong className="text-white">{Math.min(indexOfLastLog, filteredLogs.length)}</strong> of{" "}
                  <strong className="text-white">{filteredLogs.length}</strong> results
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-lg border transition-all ${
                          currentPage === page
                            ? "bg-violet-600 border-violet-500 text-white font-semibold"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
