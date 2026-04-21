"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Clock3, Menu, Search, Sparkles } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useCampusRole } from "@/lib/useCampusRole";

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Command Center",
    subtitle: "Unified live intelligence for your smart campus.",
  },
  "/attendance": {
    title: "Attendance Intelligence",
    subtitle: "Fast check-ins, audit visibility, and presence analytics.",
  },
  "/complaints": {
    title: "Resolution Hub",
    subtitle: "Track and resolve service incidents with tighter SLAs.",
  },
  "/map": {
    title: "Spatial Operations",
    subtitle: "Navigation, load balancing, and mobility routing.",
  },
  "/services": {
    title: "Service Desk",
    subtitle: "One place for maintenance, IT, and admin requests.",
  },
  "/events": {
    title: "Campus Experience",
    subtitle: "Events, programs, and high-impact activity planning.",
  },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role } = useCampusRole();
  const isLoginPage = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clock, setClock] = useState("");

  const currentMeta = useMemo(() => {
    const key = Object.keys(routeMeta).find((route) =>
      pathname.startsWith(route)
    );

    return (
      (key ? routeMeta[key] : undefined) ?? {
        title: "CampusOS",
        subtitle: "Operational workspace",
      }
    );
  }, [pathname]);

  useEffect(() => {
    const updateTime = () => {
      setClock(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateTime();
    const id = setInterval(updateTime, 30_000);

    return () => clearInterval(id);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="mesh-overlay" />
      <div className="pointer-events-none absolute left-[22%] top-[-180px] z-0 h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-3xl ambient-float" />
      <div className="pointer-events-none absolute right-[-140px] top-[42%] z-0 h-[360px] w-[360px] rounded-full bg-indigo-400/10 blur-3xl ambient-float-delayed" />

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="relative z-10 flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 md:px-7 md:py-4">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-slate-200 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/75">
                Smart Campus Operating Layer
              </p>
              <h1 className="section-title truncate text-xl font-bold text-slate-100 md:text-2xl">
                {currentMeta.title}
              </h1>
              <p className="truncate text-xs text-slate-400">{currentMeta.subtitle}</p>
            </div>

            <div className="hidden min-w-[240px] max-w-[320px] flex-1 lg:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search modules, routes, actions"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                />
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 sm:flex">
              <Clock3 className="h-4 w-4 text-emerald-300" />
              <span className="font-mono">{clock || "--:--"} IST</span>
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 xl:flex">
              <Sparkles className="h-4 w-4" />
              <span className="capitalize">{role ?? "guest"}</span>
            </div>
          </div>
        </header>

        <main className="custom-scroll relative z-10 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
