"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { updateProfile } from "../app/actions/profile";
import { User, Shield, Image, Loader2, AlertCircle, CheckCircle2, Upload, Box } from "lucide-react";

const SECTIONS = ["CineSec", "MusicSec", "Choreography", "Drama", "Cultural Council"];

// Predefined avatar selections
const PRESETS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jack",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Toby",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Buster",
];

export default function ProfileForm() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSetup = searchParams?.get("setup") === "true";

  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setSection(session.user.section || "");
      setImage(session.user.image || PRESETS[0]);
    }
  }, [session]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !section) {
      setError("Name and Section/Club are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await updateProfile({ name, section, image });

      if (!res.success) {
        setError(res.error || "Failed to update profile.");
        setLoading(false);
      } else {
        setSuccess("Profile updated successfully!");
        
        // Dynamic next-auth session refresh on client side
        await update({
          name,
          section,
          image,
        });

        router.refresh();
        
        setLoading(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto backdrop-blur-md space-y-8">
      {isSetup && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-2.5 animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>Please complete your profile details (Display Name and Council Section/Club) to activate your account.</span>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8 items-center border-b border-slate-800/60 pb-8">
        {/* Profile Picture Display */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-lg shadow-violet-500/5">
            {image ? (
              <img src={image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-slate-500" />
            )}
          </div>
          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center rounded-2xl text-[10px] text-white font-bold uppercase tracking-wider transition-all cursor-pointer">
            <Upload className="w-4 h-4 mb-1" /> Custom File
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Info detail */}
        <div className="text-center md:text-left flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white leading-tight">Profile Details</h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose a preset avatar below or upload a custom photo. Select your council section/club.
          </p>
          
          {/* Avatar presets */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setImage(preset)}
                className={`w-10 h-10 rounded-xl bg-slate-950 border overflow-hidden p-1 transition-all hover:scale-105 cursor-pointer ${
                  image === preset ? "border-violet-500 scale-105" : "border-slate-800/80"
                }`}
              >
                <img src={preset} alt={`preset ${idx}`} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5 animate-pulse">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Display Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Registered Email</label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-600" />
              <input
                type="email"
                disabled
                value={session?.user?.email || ""}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-900 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Council Section / Club</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-600 transition-all cursor-pointer"
            >
              <option value="" disabled>Select Section/Club</option>
              {SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <span className="text-[10px] text-slate-500 leading-normal">
              Section/Club assignment determines resource allocation priorities. If you require admin access, please contact the council lead.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/60">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-600/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
