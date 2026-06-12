"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Sun, Moon, Clock, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications";
import { useTheme } from "./ThemeProvider";

interface HeaderProps {
  title: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export default function Header({ title }: HeaderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications as NotificationItem[]);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.success) loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "SUCCESS": return <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />;
      case "DANGER":  return <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />;
      case "WARNING": return <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />;
      default:        return <Info className="w-4.5 h-4.5 text-blue-400" />;
    }
  };

  const getNotifColor = (type: string, isRead: boolean) => {
    if (isRead) return isDark
      ? "bg-slate-900/40 border-slate-800/40"
      : "bg-gray-50 border-gray-100";
    switch (type) {
      case "SUCCESS": return "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10";
      case "DANGER":  return "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10";
      case "WARNING": return "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10";
      default:        return "bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10";
    }
  };

  return (
    <header
      className="w-full h-16 px-8 flex justify-between items-center relative z-20 border-b"
      style={{
        background: "var(--bg-header)",
        borderBottomColor: "var(--border-color)",
        backdropFilter: "blur(12px)",
        /* Neon bottom line in dark mode */
        boxShadow: isDark
          ? "0 1px 0 rgba(0, 210, 255, 0.12), 0 4px 24px rgba(0,0,0,0.4)"
          : "0 1px 0 rgba(124, 58, 237, 0.08), 0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      {/* Page title */}
      <h1
        className="text-xl font-bold tracking-tight"
        style={{
          color: "var(--text-primary)",
          textShadow: isDark ? "0 0 18px rgba(176,64,255,0.4)" : "none",
        }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-3">

        {/* ── Theme Toggle ── */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Gallery Mode" : "Switch to Cyberpunk Mode"}
          className="relative p-2 rounded-xl border cursor-pointer transition-all group"
          style={{
            background: isDark ? "rgba(0, 210, 255, 0.06)" : "rgba(124, 58, 237, 0.06)",
            borderColor: isDark ? "rgba(0, 210, 255, 0.2)" : "rgba(124, 58, 237, 0.2)",
            color: isDark ? "#00d2ff" : "#7c3aed",
            boxShadow: isDark
              ? "0 0 12px rgba(0, 210, 255, 0.15), inset 0 0 8px rgba(0, 210, 255, 0.05)"
              : "none",
          }}
        >
          {isDark ? (
            <Sun className="w-4.5 h-4.5" />
          ) : (
            <Moon className="w-4.5 h-4.5" />
          )}

          {/* Tooltip */}
          <span
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: isDark ? "#0d1b2a" : "#f0f4ff",
              color: isDark ? "#00d2ff" : "#7c3aed",
              border: isDark ? "1px solid rgba(0,210,255,0.2)" : "1px solid rgba(124,58,237,0.2)",
            }}
          >
            {isDark ? "Gallery Mode" : "Cyberpunk Mode"}
          </span>
        </button>

        {/* ── Notifications Bell ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-xl border relative transition-all cursor-pointer"
            style={{
              background: isDark ? "rgba(13, 27, 42, 0.8)" : "rgba(248, 250, 255, 0.9)",
              borderColor: isDark ? "rgba(0, 210, 255, 0.12)" : "rgba(124, 58, 237, 0.15)",
              color: isDark ? "#94a3b8" : "#64748b",
            }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-bounce"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, #b040ff, #ff2d78)"
                    : "#7c3aed",
                  boxShadow: isDark ? "0 0 10px rgba(176,64,255,0.6)" : "none",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 border"
              style={{
                background: isDark ? "rgba(10, 16, 26, 0.97)" : "rgba(255,255,255,0.98)",
                borderColor: isDark ? "rgba(0,210,255,0.12)" : "rgba(124,58,237,0.12)",
                backdropFilter: "blur(20px)",
                boxShadow: isDark
                  ? "0 0 0 1px rgba(0,210,255,0.08), 0 24px 48px rgba(0,0,0,0.7)"
                  : "0 24px 48px rgba(0,0,0,0.12)",
              }}
            >
              <div
                className="px-5 py-4 border-b flex justify-between items-center"
                style={{ borderColor: isDark ? "rgba(0,210,255,0.08)" : "rgba(124,58,237,0.08)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        background: isDark ? "rgba(176,64,255,0.1)" : "rgba(124,58,237,0.08)",
                        borderColor: isDark ? "rgba(176,64,255,0.25)" : "rgba(124,58,237,0.2)",
                        color: isDark ? "#d488ff" : "#7c3aed",
                      }}
                    >
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ color: isDark ? "#d488ff" : "#7c3aed" }}
                  >
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: "var(--border-color)" }}>
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-l-2 transition-all flex gap-3 ${getNotifColor(notif.type, notif.isRead)}`}
                      style={{
                        borderLeftColor: notif.isRead
                          ? "transparent"
                          : isDark ? "#b040ff" : "#7c3aed",
                      }}
                    >
                      <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--text-primary)" }}>
                            {notif.title}
                          </p>
                          <span className="text-[9px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {notif.message}
                        </p>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="mt-2 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            style={{ color: isDark ? "#d488ff" : "#7c3aed" }}
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
