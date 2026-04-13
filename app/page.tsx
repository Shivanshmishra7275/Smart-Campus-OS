"use client";

import Link from "next/link";
import { GraduationCap, ShieldCheck, Cpu } from "lucide-react";

export default function LoginPage() {
  const handleLogin = (role: "student" | "admin") => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("campusos-role", role);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 overflow-hidden px-4">
      "use client";

      import { useState } from "react";
      import { useRouter } from "next/navigation";
      import { GraduationCap, ShieldCheck, Cpu, Loader2 } from "lucide-react";

      export default function LoginPage() {
        const router = useRouter();
        const [authenticatingRole, setAuthenticatingRole] = useState<
          "student" | "admin" | null
        >(null);

        const handleLogin = (role: "student" | "admin") => {
          if (authenticatingRole) return;

          if (typeof window !== "undefined") {
            window.localStorage.setItem("campusos-role", role);
          }

          setAuthenticatingRole(role);

          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        };

        return (
          <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 overflow-hidden px-4">
            {/* Living background blobs */}
            <div className="pointer-events-none absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-purple-700/30 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -bottom-44 -right-32 w-[650px] h-[650px] rounded-full bg-cyan-500/30 blur-3xl animate-pulse" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-10 flex flex-col items-center gap-8">
              {/* Brand */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/15 ring-2 ring-cyan-500/40">
                  <Cpu size={32} className="text-cyan-400" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">
                  Campus<span className="text-cyan-400">OS</span>
                </h1>
                <p className="text-slate-400 text-lg mt-2">
                  The unified digital layer for a modern university.
                </p>
                <p className="text-slate-400 text-sm max-w-xs">
                  Smart Campus Operating System — attendance, complaints, navigation
                  and more, unified in one platform.
                </p>
              </div>

              {/* Divider */}
              <div className="w-full border-t border-slate-700/60" />

              {/* Login buttons */}
              <div className="w-full flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => handleLogin("student")}
                  disabled={!!authenticatingRole}
                  className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 font-bold text-lg transition-all duration-150 shadow-lg shadow-cyan-500/25 disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {authenticatingRole === "student" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <GraduationCap size={22} />
                  )}
                  {authenticatingRole === "student" ? "Authenticating..." : "Login as Student"}
                </button>

                <button
                  type="button"
                  onClick={() => handleLogin("admin")}
                  disabled={!!authenticatingRole}
                  className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold text-lg border border-slate-600/60 transition-all duration-150 disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {authenticatingRole === "admin" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                  ) : (
                    <ShieldCheck size={22} className="text-cyan-400" />
                  )}
                  {authenticatingRole === "admin" ? "Authenticating..." : "Login as Admin"}
                </button>
              </div>

              {/* Hint */}
              <p className="text-xs text-slate-500">Secure SSO · Simulated for the MVP</p>
            </div>

            {/* System status footer */}
            <div className="absolute bottom-5 inset-x-0 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-900/80 px-4 py-2 text-[11px] text-slate-200 shadow-lg shadow-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-200">System Status:</span>
                <span className="text-slate-100">Optimal</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">2,847 Active Users</span>
              </div>
            </div>
          </div>
        );
      }
