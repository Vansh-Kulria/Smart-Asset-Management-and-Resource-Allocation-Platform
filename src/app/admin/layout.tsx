import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ActivityTicker from "../../components/ActivityTicker";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-screen overflow-hidden relative" style={{ background: "var(--bg-base)" }}>
      <Sidebar user={session.user as any} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Live Activity Ticker */}
        <ActivityTicker />
        {/* Main content scrollable area */}
        <div className="flex-1 overflow-y-auto" style={{ color: "var(--text-primary)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
