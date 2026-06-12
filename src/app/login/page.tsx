"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Mail, Loader2, AlertCircle } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const res = await signIn("credentials", { redirect: false, email, password });
      if (res?.error) { setError("Invalid email or password. Please try again."); setLoading(false); }
      else { router.refresh(); router.push("/"); }
    } catch { setError("An unexpected error occurred."); setLoading(false); }
  };

  const handleOAuthSignIn = async (provider: string) => {
    try { await signIn(provider, { callbackUrl: "/" }); }
    catch { setError(`Failed to sign in with ${provider}.`); }
  };

  return (
    <div
      className="flex-1 flex flex-col justify-center items-center min-h-screen px-4 py-12 relative overflow-x-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: isDark ? "rgba(176,64,255,0.07)" : "rgba(124,58,237,0.05)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: isDark ? "rgba(0,210,255,0.06)" : "rgba(96,165,250,0.06)" }}
        />
        {isDark && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[160px]"
            style={{ background: "rgba(176,64,255,0.03)" }} />
        )}
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl z-10 border"
        style={{
          background: "var(--bg-card)",
          borderColor: isDark ? "rgba(0,210,255,0.1)" : "rgba(124,58,237,0.1)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(0,210,255,0.06), 0 24px 64px rgba(0,0,0,0.7)"
            : "0 24px 64px rgba(124,58,237,0.08), 0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        {/* Logo block */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="relative mb-4"
            style={{ filter: isDark ? "drop-shadow(0 0 14px rgba(176,64,255,0.55))" : "none" }}
          >
            <img src="/logo.png" alt="AssetFlow Logo" className="h-16 w-16 object-contain rounded-2xl" />
          </div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{
              color: "var(--text-primary)",
              textShadow: isDark ? "0 0 20px rgba(176,64,255,0.35)" : "none",
            }}
          >
            Welcome Back
          </h2>
          <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
            Sign in to manage your council assets
          </p>
          {isDark && (
            <div
              className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
              style={{
                color: "#00d2ff",
                borderColor: "rgba(0,210,255,0.2)",
                background: "rgba(0,210,255,0.06)",
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            >
              🌐 Cyberpunk Mode Active
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5" style={{ color: "var(--text-muted)" }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your IITR email"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all outline-none border"
                style={{
                  background: isDark ? "rgba(0,0,0,0.4)" : "rgba(248,250,255,0.8)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "#00d2ff" : "#7c3aed";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 0 0 1px rgba(0,210,255,0.25), 0 0 12px rgba(0,210,255,0.1)"
                    : "0 0 0 3px rgba(124,58,237,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 w-5 h-5" style={{ color: "var(--text-muted)" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all outline-none border"
                style={{
                  background: isDark ? "rgba(0,0,0,0.4)" : "rgba(248,250,255,0.8)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isDark ? "#00d2ff" : "#7c3aed";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 0 0 1px rgba(0,210,255,0.25), 0 0 12px rgba(0,210,255,0.1)"
                    : "0 0 0 3px rgba(124,58,237,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 cursor-pointer text-sm text-white"
            style={{
              background: isDark
                ? "linear-gradient(135deg, #8b20e8, #b040ff)"
                : "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: isDark
                ? "0 0 20px rgba(176,64,255,0.4), 0 4px 12px rgba(0,0,0,0.3)"
                : "0 4px 14px rgba(124,58,237,0.3)",
            }}
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing In...</> : "Sign In"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <span className="flex-1 border-t" style={{ borderColor: "var(--border-color)" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>or</span>
          <span className="flex-1 border-t" style={{ borderColor: "var(--border-color)" }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            {
              provider: "github", label: "GitHub",
              icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg>,
            },
            {
              provider: "google", label: "Google",
              icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.233 1 0 6.233 0 13s5.233 12 12.24 12c7.31 0 12.164-5.114 12.164-12.384 0-.83-.09-1.464-.2-2.094H12.24z" /></svg>,
            },
          ].map(({ provider, label, icon }) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleOAuthSignIn(provider)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all text-sm cursor-pointer border"
              style={{
                background: "var(--bg-base)",
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = isDark
                  ? "rgba(0,210,255,0.25)"
                  : "rgba(124,58,237,0.25)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium hover:underline"
            style={{ color: isDark ? "#b040ff" : "#7c3aed" }}
          >
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
