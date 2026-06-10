"use client";

import React, { useState, useEffect } from "react";
import Header from "../../../components/Header";
import { getAuditLogs } from "../../actions/audit";
import { FileText, Loader2, Calendar } from "lucide-react";

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

  const parseDetails = (detailsStr: string) => {
    try {
      const details = JSON.parse(detailsStr);
      
      // Customize output representation based on format
      if (details.assetName) {
        let actionDesc = `Asset: ${details.assetName}`;
        if (details.quantity) actionDesc += ` (Qty: ${details.quantity})`;
        if (details.borrower) actionDesc += ` &bull; Borrower: ${details.borrower}`;
        if (details.condition) actionDesc += ` &bull; Condition: ${details.condition}`;
        if (details.comments) actionDesc += ` &bull; Comments: "${details.comments}"`;
        return <span dangerouslySetInnerHTML={{ __html: actionDesc }} />;
      }
      
      if (details.previous && details.current) {
        return (
          <span>
            Updated: {details.current.name} (Qty: {details.current.quantity}) &bull; Previously: {details.previous.name} (Qty: {details.previous.quantity})
          </span>
        );
      }
      
      return JSON.stringify(details);
    } catch (err) {
      return detailsStr;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE_ASSET":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "UPDATE_ASSET":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "DELETE_ASSET":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      case "APPROVE_BOOKING":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "REJECT_BOOKING":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      case "ISSUE_ASSET":
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
      case "RETURN_ASSET":
        return "bg-teal-500/10 border-teal-500/20 text-teal-400";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="System Audit Logs" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="flex items-center gap-2 bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl backdrop-blur-md text-slate-300 font-semibold text-sm">
          <FileText className="w-5 h-5 text-violet-400" /> Administrative Action History
        </div>

        {/* Audit Logs list */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500 text-sm">No actions recorded in audit log.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-md">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 text-slate-400">
                      <span className="font-semibold block">{new Date(log.createdAt).toLocaleDateString()}</span>
                      <span className="text-xxs text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-white block">{log.user.name}</span>
                      <span className="text-xxs text-slate-500 block truncate max-w-[150px]">{log.user.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold tracking-wider uppercase ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs leading-relaxed max-w-md">
                      {parseDetails(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
