"use client";

import { useEffect, useState } from "react";

const FEED_ITEMS = [
  { type: "checkout", club: "Drama Club", item: "Audio Mixer 2", time: "just now", dot: "🔴" },
  { type: "vacant",   club: "Main Auditorium", item: "is now vacant", time: "2 min ago", dot: "🟢" },
  { type: "checkout", club: "Music Society", item: "Guitar Amp Set (×3)", time: "5 min ago", dot: "🔴" },
  { type: "approved", club: "Dance Club", item: "Spotlight Rig 4 — booking approved", time: "8 min ago", dot: "🟡" },
  { type: "return",   club: "Photography Club", item: "returned Camera Tripod Set", time: "11 min ago", dot: "🟢" },
  { type: "checkout", club: "Film Society", item: "4K Projector B", time: "14 min ago", dot: "🔴" },
  { type: "alert",    club: "⚡ 2 assets", item: "approaching return deadline", time: "16 min ago", dot: "🟡" },
  { type: "return",   club: "Robotics Club", item: "returned Soldering Station Set", time: "19 min ago", dot: "🟢" },
  { type: "checkout", club: "Choreo Society", item: "PA Speaker Stack B", time: "22 min ago", dot: "🔴" },
  { type: "approved", club: "Fine Arts",    item: "Display Panels — booking approved", time: "25 min ago", dot: "🟡" },
  { type: "vacant",   club: "Seminar Hall B", item: "is now vacant", time: "28 min ago", dot: "🟢" },
  { type: "checkout", club: "Quiz Club", item: "Wireless Buzzer Set", time: "31 min ago", dot: "🔴" },
];

function buildLabel(item: (typeof FEED_ITEMS)[0]) {
  if (item.type === "checkout") return `${item.club} checked out ${item.item}`;
  if (item.type === "return") return `${item.club} ${item.item}`;
  if (item.type === "vacant") return `${item.club} ${item.item}`;
  if (item.type === "approved") return `${item.club} — ${item.item}`;
  return `${item.club} ${item.item}`;
}

export default function ActivityTicker() {
  const [ticking, setTicking] = useState(true);

  const items = [...FEED_ITEMS, ...FEED_ITEMS]; // duplicate for seamless loop

  return (
    <div
      className="activity-ticker relative w-full overflow-hidden border-b"
      style={{ height: "34px" }}
      onMouseEnter={() => setTicking(false)}
      onMouseLeave={() => setTicking(true)}
    >
      {/* Neon left label */}
      <div className="ticker-label absolute left-0 top-0 h-full z-10 flex items-center px-3 gap-1.5 text-[10px] font-bold uppercase tracking-widest select-none">
        <span className="live-dot" />
        <span>LIVE</span>
      </div>

      {/* Scrolling track */}
      <div className={`ticker-track flex items-center h-full whitespace-nowrap ${ticking ? "running" : "paused"}`}>
        {items.map((item, i) => (
          <span key={i} className="ticker-item inline-flex items-center gap-1.5 mx-6 text-[11px]">
            <span>{item.dot}</span>
            <span className="ticker-text">{buildLabel(item)}</span>
            <span className="ticker-time">{item.time}</span>
          </span>
        ))}
      </div>

      {/* Fade edges */}
      <div className="ticker-fade-left  absolute left-[72px] top-0 h-full w-12 pointer-events-none" />
      <div className="ticker-fade-right absolute right-0    top-0 h-full w-12 pointer-events-none" />
    </div>
  );
}
