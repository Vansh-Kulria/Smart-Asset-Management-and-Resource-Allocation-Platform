"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  History,
  Boxes,
  ClipboardCheck,
  QrCode,
  FileText,
  LogOut,
  Menu,
  X,
  Box,
  User,
  Activity,
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    section?: string | null;
    image?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = user.role === "ADMIN";

  const consumerLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Browse Assets", href: "/dashboard/browse", icon: Search },
    { name: "Borrow History", href: "/dashboard/history", icon: History },
    { name: "My Profile", href: "/dashboard/profile", icon: User },
  ];

  const adminLinks = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Manage Inventory", href: "/admin/inventory", icon: Boxes },
    { name: "Booking Requests", href: "/admin/requests", icon: ClipboardCheck },
    { name: "Issue & Return", href: "/admin/operations", icon: QrCode },
    { name: "System Logs", href: "/admin/audit", icon: FileText },
    { name: "My Profile", href: "/admin/profile", icon: User },
  ];

  const links = isAdmin ? adminLinks : consumerLinks;

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="lg:hidden w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center gap-4.5 z-30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-white">SmartAsset</span>
        </div>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-md flex flex-col justify-between z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:flex`}
      >
        <div className="flex flex-col flex-1 py-8 px-6 overflow-y-auto">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between lg:justify-start gap-2.5 mb-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/10">
                <Box className="w-5.5 h-5.5 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                SmartAsset <span className="text-violet-500">IITR</span>
              </span>
            </div>
            {/* Mobile close button inside drawer */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            <span className="block text-xxs font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">
              {isAdmin ? "Admin Console" : "Section Console"}
            </span>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-violet-600/15 border border-violet-600/20 text-violet-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4">
            {user.image ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg">
                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-600/25 flex items-center justify-center text-violet-400 font-semibold text-base shadow-inner">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{user.name || "User"}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user.section || "Council Member"}</p>
            </div>
            <div className="p-1 px-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-bold uppercase tracking-wider scale-90">
              {user.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40 transition-opacity"
        />
      )}
    </>
  );
}
