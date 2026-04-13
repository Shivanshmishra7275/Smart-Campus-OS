"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  MessageSquareWarning,
  Map,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/attendance", icon: QrCode },
  { label: "Complaints", href: "/complaints", icon: MessageSquareWarning },
  { label: "Map", href: "/map", icon: Map },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-700/60 shadow-xl">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/60">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/20 ring-1 ring-cyan-500/50">
          <span className="text-cyan-400 font-extrabold text-lg leading-none">C</span>
        </div>
        <span className="text-white font-bold text-xl tracking-wide">
          Campus<span className="text-cyan-400">OS</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 ${
                  isActive
                    ? "text-cyan-400"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700/60">
        <p className="text-xs text-slate-500">© 2025 CampusOS</p>
      </div>
    </aside>
  );
}
