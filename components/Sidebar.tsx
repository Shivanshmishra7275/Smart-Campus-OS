"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleGauge,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  QrCode,
  MessageSquareWarning,
  Map,
  Sparkles,
  Wrench,
} from "lucide-react";
import { ROLE_STORAGE_KEY, useCampusRole } from "@/lib/useCampusRole";

const SESSION_KEYS_TO_CLEAR = [
  ROLE_STORAGE_KEY,
  "campusos-student-name",
  "campusos-campus-id",
  "campusos-attendance-streak",
  "campusos-rsvp-events",
];

const primaryNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/attendance", icon: QrCode },
  { label: "Complaints", href: "/complaints", icon: MessageSquareWarning },
  { label: "Map", href: "/map", icon: Map },
  { label: "Services", href: "/services", icon: Wrench },
  { label: "Events", href: "/events", icon: CalendarDays },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useCampusRole();

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      for (const key of SESSION_KEYS_TO_CLEAR) {
        window.localStorage.removeItem(key);
      }
    }

    onClose?.();
    router.push("/");
  };

  const sidebarClass = [
    "glass-panel custom-scroll fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col overflow-y-auto border-r border-slate-700/70 bg-slate-950/92 transition-transform duration-300 lg:static lg:translate-x-0",
    mobileOpen ? "translate-x-0" : "-translate-x-full",
  ].join(" ");

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={sidebarClass}>
        <div className="relative border-b border-slate-700/70 px-5 py-5">
          <div className="absolute -left-8 top-[-24px] h-28 w-28 rounded-full bg-cyan-400/15 blur-2xl" />
          <div className="absolute -right-10 bottom-[-30px] h-24 w-24 rounded-full bg-indigo-400/15 blur-2xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 ring-1 ring-cyan-400/40">
                <CircleGauge className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="section-title text-lg font-semibold text-white">
                  CampusOS
                </p>
                <p className="text-[11px] text-slate-400">Smart Ops Workspace</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 lg:hidden"
              aria-label="Close navigation"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span className="text-[11px] font-medium text-slate-200">Active Role</span>
            </div>
            <span className="status-chip capitalize text-cyan-100">
              {role ?? "guest"}
            </span>
          </div>
        </div>

        <div className="px-3 py-4">
          <p className="px-3 text-[10px] uppercase tracking-[0.24em] text-slate-500">
            Modules
          </p>
          <nav className="mt-2 space-y-1">
            {primaryNav.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`group flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/14 text-cyan-200 ring-1 ring-cyan-400/35"
                      : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      size={17}
                      className={
                        isActive
                          ? "text-cyan-300"
                          : "text-slate-500 transition-colors group-hover:text-slate-300"
                      }
                    />
                    {label}
                  </span>
                  {isActive && <PanelLeftOpen className="h-4 w-4 text-cyan-300" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-700/70 px-4 py-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <p className="mt-3 text-center text-[10px] text-slate-500">CampusOS v2.6 • 2026</p>
        </div>
      </aside>
    </>
  );
}
