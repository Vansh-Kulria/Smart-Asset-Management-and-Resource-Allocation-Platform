"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Calendar, CheckCircle2, AlertTriangle, Info, Clock, Circle } from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications";

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

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications as any);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Set up polling interval to fetch notifications every 30 seconds for live updates
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
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
      if (res.success) {
        loadNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        loadNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />;
      case "DANGER":
        return <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />;
      case "WARNING":
        return <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />;
      default:
        return <Info className="w-4.5 h-4.5 text-blue-400" />;
    }
  };

  const getNotifColor = (type: string, isRead: boolean) => {
    if (isRead) return "bg-slate-900/40 border-slate-800/40";
    switch (type) {
      case "SUCCESS":
        return "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10";
      case "DANGER":
        return "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10";
      case "WARNING":
        return "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10";
      default:
        return "bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10";
    }
  };

  return (
    <header className="w-full h-16 border-b border-slate-800/80 bg-slate-950 px-8 flex justify-between items-center relative z-20">
      <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl relative transition-all cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center border border-slate-950 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900/95 border border-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-5 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-l-2 transition-all flex gap-3 ${
                        notif.isRead ? "border-l-transparent" : "border-l-violet-600"
                      } ${getNotifColor(notif.type, notif.isRead)}`}
                    >
                      <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <p className="font-semibold text-xs text-white truncate">{notif.title}</p>
                          <span className="text-[9px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                        
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 cursor-pointer"
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
