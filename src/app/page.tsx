import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Camera, Lightbulb, Music, Shirt, Drama, Speaker, Box, Shield, ArrowRight } from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  const categories = [
    { name: "DSLR Cameras", icon: Camera, desc: "High-end cinema and photo cameras for event coverage.", color: "from-blue-500 to-indigo-500" },
    { name: "Studio Lighting", icon: Lightbulb, desc: "Professional studio strobe lights, softboxes, and spotlights.", color: "from-amber-500 to-orange-500" },
    { name: "Audio Systems", icon: Music, desc: "Wireless microphones, multichannel field recorders, and monitors.", color: "from-emerald-500 to-teal-500" },
    { name: "Costumes", icon: Shirt, desc: "Choreography, drama costumes, and event-themed clothing sets.", color: "from-rose-500 to-pink-500" },
    { name: "Stage Props", icon: Drama, desc: "Props, blunted weaponry, and background stage materials.", color: "from-violet-500 to-purple-500" },
    { name: "Event Infrastructure", icon: Speaker, desc: "Professional heavy-duty PA speakers, stage monitors, and cabling.", color: "from-cyan-500 to-blue-500" },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Box className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-white">
            SmartAsset <span className="text-violet-500">IITR</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:shadow-violet-600/30"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-6 animate-pulse">
          <Shield className="w-3.5 h-3.5" /> Cultural Council Resource Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl leading-[1.15]">
          Manage shared resources with <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">smart accountability</span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
          The central booking, inventory management, and operational analytics system designed for the Cultural Council of IIT Roorkee. Eliminate scheduling conflicts, track utilization, and audit allocations.
        </p>
        
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all duration-200 flex items-center gap-2 group hover:translate-y-[-2px]"
          >
            Create Your Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition-all duration-200 hover:translate-y-[-2px]"
          >
            Access Dashboard
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="mt-24 w-full">
          <h2 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-8">Managed Inventory Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md hover:border-slate-700/80 hover:bg-slate-900/60 transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.color} p-2.5 text-white flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-white mb-1.5">{cat.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{cat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-600 border-t border-slate-900 z-10">
        &copy; {new Date().getFullYear()} Cultural Council, IIT Roorkee. Designed for seamless asset management & resource allocation.
      </footer>
    </div>
  );
}
