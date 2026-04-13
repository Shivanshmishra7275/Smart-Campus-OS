"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  AlertTriangle,
  QrCode,
  MessageSquareWarning,
  Map,
  Activity,
  Bus,
  Utensils,
  MapPin,
  Zap,
  ShieldCheck,
} from "lucide-react";

type MetricDirection = "up" | "down";

type MetricCard = {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: MetricDirection;
  icon: React.ElementType;
  accent: string;
  description: string;
};

type AlertLevel = "critical" | "warning" | "info";

type AlertItem = {
  id: string;
  level: AlertLevel;
  title: string;
  context: string;
  location: string;
  time: string;
};

type BusStatus = "on-time" | "delayed" | "cancelled";

type BusCard = {
  id: string;
  label: string;
  destination: string;
  eta: string;
  occupancy: number;
  status: BusStatus;
};

type CampusZone = {
  id: string;
  label: string;
  occupancy: number;
  tone: string;
};

const METRICS: MetricCard[] = [
  {
    id: "students",
    label: "Active students on campus",
    value: "2,847",
    change: "+12%",
    direction: "up",
    icon: Users,
    accent: "from-cyan-500 to-sky-500",
    description: "Turnstile + Wi‑Fi presence in the last hour.",
  },
  {
    id: "attendance",
    label: "Today's attendance rate",
    value: "87.4%",
    change: "+3.2%",
    direction: "up",
    icon: BookOpen,
    accent: "from-emerald-500 to-teal-500",
    description: "Across all sections connected to Smart Attendance.",
  },
  {
    id: "complaints",
    label: "Open complaints",
    value: "14",
    change: "–5",
    direction: "down",
    icon: MessageSquareWarning,
    accent: "from-amber-400 to-orange-500",
    description: "Tickets still waiting for an admin resolution.",
  },
];

const ALERTS: AlertItem[] = [
  {
    id: "1",
    level: "critical",
    title: "Multiple attendance failures in a row",
    context: "Supabase writes are failing for one lab cluster.",
    location: "Smart Attendance · CS Block",
    time: "2 min ago",
  },
  {
    id: "2",
    level: "warning",
    title: "Complaints queue above usual",
    context: "Hostel facilities complaints are trending higher today.",
    location: "Smart Complaints",
    time: "8 min ago",
  },
  {
    id: "3",
    level: "info",
    title: "Map sensors synced",
    context: "Latest locations pulled from IoT devices.",
    location: "Campus Map",
    time: "18 min ago",
  },
];

const BUSES: BusCard[] = [
  {
    id: "b1",
    label: "Route 1",
    destination: "Hostels ↔ Main Gate",
    eta: "4 min",
    occupancy: 72,
    status: "on-time",
  },
  {
    id: "b2",
    label: "Route 7",
    destination: "Tech Park ↔ North Gate",
    eta: "11 min",
    occupancy: 83,
    status: "delayed",
  },
  {
    id: "b3",
    label: "Route 4",
    destination: "Medical Center ↔ West Gate",
    eta: "—",
    occupancy: 0,
    status: "cancelled",
  },
];

const ZONES: CampusZone[] = [
  {
    id: "library",
    label: "Library cluster",
    occupancy: 76,
    tone: "bg-violet-400",
  },
  {
    id: "labs",
    label: "Labs + CS block",
    occupancy: 64,
    tone: "bg-cyan-400",
  },
  {
    id: "hostels",
    label: "Hostel towers",
    occupancy: 48,
    tone: "bg-emerald-400",
  },
  {
    id: "sports",
    label: "Sports + grounds",
    occupancy: 31,
    tone: "bg-pink-400",
  },
];

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/60 shadow-[0_22px_60px_rgba(15,23,42,0.9)] backdrop-blur-2xl ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5/5 to-transparent opacity-[0.03]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function MetricPill({ direction, change }: { direction: MetricDirection; change: string }) {
  const positive = direction === "up";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        positive
          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
          : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {change}
    </span>
  );
}

function AlertBadge({ level }: { level: AlertLevel }) {
  const map: Record<AlertLevel, { label: string; tone: string }> = {
    critical: {
      label: "Critical",
      tone: "bg-rose-500/10 text-rose-300 border-rose-500/40",
    },
    warning: {
      label: "Warning",
      tone: "bg-amber-500/10 text-amber-300 border-amber-500/40",
    },
    info: {
      label: "Info",
      tone: "bg-sky-500/10 text-sky-300 border-sky-500/40",
    },
  };

  const { label, tone } = map[level];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}
    >
      <AlertTriangle className="h-3 w-3" />
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: BusStatus }) {
  const tone: Record<BusStatus, string> = {
    "on-time": "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    delayed: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    cancelled: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  };

  const label: Record<BusStatus, string> = {
    "on-time": "On time",
    delayed: "Delayed",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone[status]}`}
    >
      {label[status]}
    </span>
  );
}

function OccupancyBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 85
      ? "from-rose-500 to-orange-500"
      : pct >= 65
      ? "from-amber-400 to-orange-500"
      : "from-cyan-400 to-sky-500";

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-[10px] tabular-nums text-slate-400">
        {pct}%
      </span>
    </div>
  );
}

function CampusMiniMap() {
  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/40">
              <Map className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-200">
                Campus heatmap
              </p>
              <p className="text-[10px] text-slate-500">
                Live occupancy across key zones.
              </p>
            </div>
          </div>
          <Zap className="h-3.5 w-3.5 text-amber-400" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {ZONES.map((zone) => (
            <div
              key={zone.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${zone.tone}`}
                  />
                  <p className="truncate text-[11px] font-medium text-slate-100">
                    {zone.label}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500">{zone.occupancy}%</span>
              </div>
              <OccupancyBar value={zone.occupancy} />
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[9px] text-slate-600">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Smart Campus map is simulated.
          </span>
          <span className="font-mono text-slate-700">Lucknow · IST</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative space-y-6 p-6 md:p-8">
      {/* Ambient grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 0% 0%, rgba(56,189,248,0.12), transparent 55%), radial-gradient(circle at 100% 100%, rgba(129,140,248,0.12), transparent 55%)",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/80">
            <LayoutDashboard className="h-3 w-3" />
            <span>CampusOS Command Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Live overview
          </h1>
          <p className="mt-1 text-xs text-slate-400 md:text-sm">
            Today&apos;s snapshot of attendance, complaints, buses, and campus
            load.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-300">
          <LiveDot />
          <span className="font-medium">Smart Campus online</span>
          <span className="hidden text-slate-500 sm:inline">•</span>
          <span className="hidden font-mono text-slate-400 sm:inline">
            {clock || "--:--"} · IST
          </span>
        </div>
      </div>

      {/* Top row: metrics + quick links */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <GlassCard key={metric.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {metric.label}
                    </p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-slate-50">
                        {metric.value}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${metric.accent}`}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="max-w-[11rem] text-[10px] text-slate-500">
                    {metric.description}
                  </p>
                  <MetricPill
                    direction={metric.direction}
                    change={metric.change}
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>

        <GlassCard className="flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/40">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-100">
                  Quick modules
                </p>
                <p className="text-[10px] text-slate-500">
                  Jump into the key CampusOS surfaces.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
            <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/40">
                  <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Attendance</p>
                  <p className="text-[10px] text-slate-500">Simulated QR</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/40">
                  <MessageSquareWarning className="h-3.5 w-3.5 text-amber-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Complaints</p>
                  <p className="text-[10px] text-slate-500">Supabase tickets</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/40">
                  <Map className="h-3.5 w-3.5 text-sky-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Map</p>
                  <p className="text-[10px] text-slate-500">Indoor routes</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Middle row: map + alerts */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]">
        <GlassCard className="p-4">
          <CampusMiniMap />
        </GlassCard>

        <GlassCard className="flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 border border-rose-500/40">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-100">
                  Live incidents
                </p>
                <p className="text-[10px] text-slate-500">
                  Derived from activity across CampusOS modules.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Activity className="h-3 w-3 text-emerald-400" />
              Auto‑refreshed
            </div>
          </div>

          <div className="space-y-2">
            {ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <AlertBadge level={alert.level} />
                    <p className="text-[11px] font-medium text-slate-100">
                      {alert.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {alert.context}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px] text-slate-600">
                    <span>{alert.time}</span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {alert.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row: transport + dining snapshot */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/40">
                <Bus className="h-3.5 w-3.5 text-amber-300" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-100">
                  Campus buses
                </p>
                <p className="text-[10px] text-slate-500">
                  Synthetic data to show how live routes would look.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {BUSES.map((bus) => (
              <div
                key={bus.id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3"
              >
                <span className="inline-flex h-8 w-12 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold text-amber-200">
                  {bus.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-slate-100">
                    {bus.destination}
                  </p>
                  <OccupancyBar value={bus.occupancy} />
                </div>
                <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-100">
                    {bus.eta}
                  </span>
                  <StatusPill status={bus.status} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/40">
                <Utensils className="h-3.5 w-3.5 text-fuchsia-300" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-100">
                  Dining snapshot
                </p>
                <p className="text-[10px] text-slate-500">
                  Lightweight view of what&apos;s popular right now.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 text-[11px] sm:grid-cols-2">
            {["Dal makhani + roti", "Veg biryani", "Paneer bowl", "Masala dosa"].map(
              (item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/15">
                    <Utensils className="h-3.5 w-3.5 text-fuchsia-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-100">
                      {item}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Approx. {380 + index * 40} kcal • rating {4.5 + index * 0.1}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
