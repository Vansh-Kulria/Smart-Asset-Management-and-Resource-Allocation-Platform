"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Search, History, Boxes, ClipboardCheck,
  QrCode, FileText, LogOut, Menu, X, User, Users,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

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
  const { isDark } = useTheme();
  const isAdmin = user.role === "ADMIN";

  const consumerLinks = [
    { name: "Overview",       href: "/dashboard",         icon: LayoutDashboard },
    { name: "Browse Assets",  href: "/dashboard/browse",  icon: Search },
    { name: "Borrow History", href: "/dashboard/history", icon: History },
    { name: "My Profile",     href: "/dashboard/profile", icon: User },
  ];

  const adminLinks = [
    { name: "Overview",          href: "/admin",             icon: LayoutDashboard },
    { name: "Manage Inventory",  href: "/admin/inventory",   icon: Boxes },
    { name: "Booking Requests",  href: "/admin/requests",    icon: ClipboardCheck },
    { name: "Issue & Return",    href: "/admin/operations",  icon: QrCode },
    { name: "Manage Users",      href: "/admin/users",       icon: Users },
    { name: "System Logs",       href: "/admin/audit",       icon: FileText },
    { name: "My Profile",        href: "/admin/profile",     icon: User },
  ];

  const links = isAdmin ? adminLinks : consumerLinks;

  const handleLogout = () => signOut({ callbackUrl: "/" });

  const sidebarStyle: React.CSSProperties = {
    background: "var(--bg-sidebar)",
    borderRightColor: "var(--border-color)",
    backdropFilter: "blur(16px)",
  };

  const activeLinkStyle: React.CSSProperties = {
    background: "var(--sidebar-active-bg)",
    borderColor: "var(--sidebar-active-border)",
    color: "var(--sidebar-active-text)",
    boxShadow: isDark ? "0 0 12px rgba(176,64,255,0.2)" : "none",
  };

  const inactiveLinkStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
    borderColor: "transparent",
  };

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div
        className="lg:hidden w-full px-6 py-4 flex items-center gap-4.5 z-30 border-b"
        style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-color)" }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg border cursor-pointer transition-all"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="AssetFlow Logo" className="h-8 w-8 object-contain rounded-lg shadow-md" />
          <span className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
            AssetFlow
          </span>
        </div>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 border-r flex flex-col justify-between z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:flex`}
        style={sidebarStyle}
      >
        <div className="flex flex-col flex-1 py-8 px-6 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between lg:justify-start gap-2.5 mb-10">
            <div className="flex items-center gap-2.5">
              <div
                className="relative"
                style={{
                  filter: isDark
                    ? "drop-shadow(0 0 8px rgba(176,64,255,0.5))"
                    : "none",
                }}
              >
                <img
                  src="/logo.png"
                  alt="AssetFlow Logo"
                  className="h-9 w-9 object-contain rounded-xl shadow-md"
                />
              </div>
              <span
                className="font-bold text-lg tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                AssetFlow{" "}
                <span
                  style={{
                    color: isDark ? "#b040ff" : "#7c3aed",
                    textShadow: isDark ? "0 0 10px rgba(176,64,255,0.5)" : "none",
                  }}
                >
                  IITR
                </span>
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-lg border cursor-pointer"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 flex-1">
            <span
              className="block text-[10px] font-bold uppercase tracking-widest mb-3 px-3"
              style={{ color: "var(--text-muted)" }}
            >
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
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all border"
                  style={isActive ? activeLinkStyle : inactiveLinkStyle}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(124,58,237,0.04)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div
          className="p-6 border-t"
          style={{
            borderColor: "var(--border-color)",
            background: isDark ? "rgba(13, 17, 23, 0.4)" : "rgba(248, 250, 255, 0.6)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            {user.image ? (
              <div
                className="w-10 h-10 rounded-xl overflow-hidden border flex items-center justify-center shadow-lg"
                style={{ borderColor: "var(--border-color)" }}
              >
                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl border flex items-center justify-center font-semibold text-base shadow-inner"
                style={{
                  background: isDark ? "rgba(176,64,255,0.1)" : "rgba(124,58,237,0.08)",
                  borderColor: isDark ? "rgba(176,64,255,0.25)" : "rgba(124,58,237,0.2)",
                  color: isDark ? "#d488ff" : "#7c3aed",
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
                {user.name || "User"}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                {user.section || "Council Member"}
              </p>
            </div>
            <div
              className="p-1 px-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider scale-90 border"
              style={{
                background: isDark ? "rgba(176,64,255,0.1)" : "rgba(124,58,237,0.08)",
                borderColor: isDark ? "rgba(176,64,255,0.25)" : "rgba(124,58,237,0.2)",
                color: isDark ? "#d488ff" : "#7c3aed",
              }}
            >
              {user.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer border"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = isDark
                ? "rgba(255,50,50,0.08)"
                : "rgba(239,68,68,0.06)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.25)";
              (e.currentTarget as HTMLElement).style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--bg-card)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 backdrop-blur-sm lg:hidden z-40 transition-opacity"
          style={{ background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" }}
        />
      )}
    </>
  );
}
