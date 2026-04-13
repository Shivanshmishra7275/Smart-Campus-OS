import Link from "next/link";
import { GraduationCap, ShieldCheck, Cpu } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 overflow-hidden px-4">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-10 flex flex-col items-center gap-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/15 ring-2 ring-cyan-500/40">
            <Cpu size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Campus<span className="text-cyan-400">OS</span>
          </h1>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Smart Campus Operating System — attendance, complaints, navigation
            and more, unified in one platform.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-slate-700/60" />

        {/* Login buttons */}
        <div className="w-full flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 font-bold text-lg transition-all duration-150 shadow-lg shadow-cyan-500/25"
          >
            <GraduationCap size={22} />
            Login as Student
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold text-lg border border-slate-600/60 transition-all duration-150"
          >
            <ShieldCheck size={22} className="text-cyan-400" />
            Login as Admin
          </Link>
        </div>

        {/* Hint */}
        <p className="text-xs text-slate-500">
          Secure SSO · Powered by Supabase Auth
        </p>
      </div>
    </div>
  );
}
