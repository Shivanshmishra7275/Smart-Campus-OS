"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu,
  Fingerprint,
  GraduationCap,
  Loader2,
  Orbit,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ROLE_STORAGE_KEY } from "@/lib/useCampusRole";

const STUDENT_NAME_KEY = "campusos-student-name";
const CAMPUS_ID_KEY = "campusos-campus-id";

const launches = [
  "Realtime attendance + analytics",
  "Incident workflow with SLA signals",
  "Navigation, occupancy, and routing",
  "Service desk + events operations",
];

export default function LoginPage() {
  const router = useRouter();
  const [authenticatingRole, setAuthenticatingRole] = useState<
    "student" | "admin" | null
  >(null);
  const [studentName, setStudentName] = useState("Shivansh Mishra");
  const [campusId, setCampusId] = useState("SCO-2026-0072");

  const roleHint = useMemo(() => {
    if (authenticatingRole === "student") {
      return "Preparing your student workspace...";
    }

    if (authenticatingRole === "admin") {
      return "Booting admin operations center...";
    }

    return "Select your role to continue";
  }, [authenticatingRole]);

  const handleLogin = (role: "student" | "admin") => {
    if (authenticatingRole) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
      window.localStorage.setItem(STUDENT_NAME_KEY, studentName.trim() || "Student");
      window.localStorage.setItem(CAMPUS_ID_KEY, campusId.trim() || "SCO-2026-0072");
    }

    setAuthenticatingRole(role);

    setTimeout(() => {
      router.push("/dashboard");
    }, 1100);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 md:px-8">
      <div className="mesh-overlay" />
      <div className="pointer-events-none absolute left-[-12%] top-[-22%] h-[520px] w-[520px] rounded-full bg-cyan-400/25 blur-3xl ambient-float" />
      <div className="pointer-events-none absolute right-[-10%] top-[40%] h-[460px] w-[460px] rounded-full bg-indigo-500/20 blur-3xl ambient-float-delayed" />

      <div className="grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel section-reveal stagger-1 rounded-3xl border border-slate-700/70 p-7 md:p-9">
          <div className="flex items-center gap-3 text-cyan-100">
            <div className="pulse-ring flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/50 bg-cyan-500/15">
              <Cpu className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">Launch Sequence</p>
              <h1 className="section-title text-3xl font-bold text-white md:text-4xl">
                CampusOS Nexus
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
            A multi-purpose digital operating system for institutions. Attendance,
            complaint intelligence, navigation, services, and event activation now
            run from one adaptive interface.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {launches.map((item, index) => (
              <div
                key={item}
                className={`section-reveal glass-panel stagger-${(index % 4) + 1} rounded-2xl border border-slate-700/80 p-3`}
              >
                <p className="text-xs font-semibold text-slate-100">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Orbit className="h-4 w-4 text-amber-300" />
                <p className="text-xs font-semibold text-slate-200">Live orchestration signal</p>
              </div>
              <span className="status-chip text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Stable
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              2,847 active users • 93.8% automation accuracy • 41 pending tasks routed.
            </p>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Designed for students, faculty, and operations teams.
          </div>
        </section>

        <section className="glass-panel section-reveal stagger-2 rounded-3xl border border-slate-700/70 p-7 md:p-9">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="section-title text-2xl font-bold text-white">Access Console</h2>
              <p className="mt-1 text-xs text-slate-400">{roleHint}</p>
            </div>
            <Fingerprint className="h-7 w-7 text-cyan-300" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Display name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                className="w-full rounded-xl border border-slate-700/90 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Campus identity token
              </label>
              <input
                type="text"
                value={campusId}
                onChange={(event) => setCampusId(event.target.value)}
                className="w-full rounded-xl border border-slate-700/90 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                placeholder="SCO-2026-0072"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleLogin("student")}
              disabled={!!authenticatingRole}
              className="group inline-flex items-center justify-between rounded-2xl border border-cyan-400/40 bg-cyan-500/90 px-4 py-3 text-left text-slate-950 shadow-[0_16px_40px_rgba(34,211,238,0.36)] transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-80"
            >
              <span className="flex items-center gap-3">
                {authenticatingRole === "student" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <GraduationCap className="h-5 w-5" />
                )}
                <span>
                  <span className="block text-sm font-bold">Enter as Student</span>
                  <span className="block text-xs text-slate-700">Attendance, routes, and requests workspace</span>
                </span>
              </span>
              <Rocket className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => handleLogin("admin")}
              disabled={!!authenticatingRole}
              className="group inline-flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-left text-slate-100 transition-all hover:border-cyan-400/50 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-80"
            >
              <span className="flex items-center gap-3">
                {authenticatingRole === "admin" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-cyan-300" />
                )}
                <span>
                  <span className="block text-sm font-bold">Enter as Admin</span>
                  <span className="block text-xs text-slate-400">Incident command and service orchestration</span>
                </span>
              </span>
              <Rocket className="h-4 w-4 text-cyan-300 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-400">
            Secure SSO is mocked in this build. Role state persists locally to accelerate testing.
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-slate-900/85 px-4 py-1.5 text-[11px] text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-ring" />
          Campus cloud online • regional latency 42ms
        </div>
      </div>
    </div>
  );
}
