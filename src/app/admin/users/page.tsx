"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "../../../components/Header";
import { getUsers, updateUserRole } from "../../actions/users";
import { Users, Search, ShieldAlert, UserCheck, UserMinus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  section: string | null;
  createdAt: string | Date;
}

export default function ManageUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res.success && res.users) {
        setUsers(res.users as any);
      } else {
        setError(res.error || "Failed to load users.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const targetRole = currentRole === "ADMIN" ? "CONSUMER" : "ADMIN";
    const confirmMsg = `Are you sure you want to change this user's role to ${targetRole.toLowerCase()}?`;
    
    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(userId);
    setError("");
    setSuccess("");

    try {
      const res = await updateUserRole(userId, targetRole);
      if (res.success) {
        setSuccess(res.message || "User role updated successfully!");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
        );
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.error || "Failed to update role.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.section || "").toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Manage Users & Permissions" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5 animate-pulse">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Search Bar Panel */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-slate-300 font-semibold text-sm">
            <Users className="w-5 h-5 text-violet-400" />
            <span>User Accounts Console</span>
            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-bold rounded-full">
              {users.length} Total
            </span>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role or section..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-all text-sm"
            />
          </form>
        </div>

        {/* User Table Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Retrieving registered users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500 text-sm">No users match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-md">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">User Details</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Section / Club</th>
                  <th className="py-4 px-6">Security Role</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {filteredUsers.map((u) => {
                  const isSelf = session?.user?.id === u.id;
                  const isAdmin = u.role === "ADMIN";
                  return (
                    <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                      {/* Name Details */}
                      <td className="py-4 px-6">
                        <span className="font-bold text-white block">
                          {u.name || "Anonymous User"}
                          {isSelf && (
                            <span className="ml-2 text-[10px] bg-violet-600/20 border border-violet-500/30 text-violet-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Registered: {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Email Address */}
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {u.email}
                      </td>

                      {/* Section */}
                      <td className="py-4 px-6">
                        {u.section ? (
                          <span className="text-xs font-medium text-slate-300">
                            {u.section}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-600">
                            Not Onboarded
                          </span>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                              : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <ShieldAlert className="w-3 h-3" /> Admin
                            </>
                          ) : (
                            "Member"
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {isSelf ? (
                          <span className="text-xs text-slate-600 select-none italic">
                            Cannot demote self
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingId !== null}
                            onClick={() => handleRoleChange(u.id, u.role)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                              isAdmin
                                ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white"
                                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                            }`}
                          >
                            {updatingId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isAdmin ? (
                              <>
                                <UserMinus className="w-3.5 h-3.5" /> Make Member
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" /> Make Admin
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
