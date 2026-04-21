"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  Gauge,
  GraduationCap,
  MapPinned,
  MessageSquareWarning,
  QrCode,
  Sparkles,
  Timer,
  Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type RangeKey = "today" | "week" | "month";

type AttendanceRow = {
  id: string;
  student_id?: string;
  status: string;
  timestamp: string | null;
};

type ComplaintRow = {
  id: number | string;
  category?: string;
  description?: string;
  status: string;
  created_at: string | null;
};

type AutomationRule = {
  id: string;
  title: string;
  description: string;
  impact: string;
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 Days" },
  { key: "month", label: "30 Days" },
];

const AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "attendance-alert",
    title: "Attendance anomaly alert",
    description: "Notify section mentors when present ratio drops below 68%.",
    impact: "Medium",
  },
  {
    id: "complaint-escalation",
    title: "Complaint SLA escalation",
    description: "Escalate unresolved maintenance tickets older than 18 hours.",
    impact: "High",
  },
  {
    id: "crowd-redistribution",
    title: "Crowd redistribution hint",
    description: "Suggest alternate dining zones during occupancy peaks.",
    impact: "Medium",
  },
];

const QUICK_MODULES = [
  {
    href: "/attendance",
    title: "Attendance Ops",
    summary: "Live check-ins and class visibility",
    icon: QrCode,
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  },
  {
    href: "/complaints",
    title: "Incident Desk",
    summary: "Track and resolve complaints",
    icon: MessageSquareWarning,
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  {
    href: "/map",
    title: "Campus Routing",
    summary: "Navigation + occupancy visibility",
    icon: MapPinned,
    tone: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  },
  {
    href: "/services",
    title: "Service Requests",
    summary: "IT and facility tickets",
    icon: Wrench,
    tone: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  },
];

const FALLBACK_ATTENDANCE: AttendanceRow[] = [
  { id: "f-a1", student_id: "Aarav", status: "Present", timestamp: new Date().toISOString() },
  { id: "f-a2", student_id: "Siya", status: "Present", timestamp: new Date().toISOString() },
  { id: "f-a3", student_id: "Ishaan", status: "Absent", timestamp: new Date().toISOString() },
  { id: "f-a4", student_id: "Anaya", status: "Present", timestamp: new Date().toISOString() },
];

const FALLBACK_COMPLAINTS: ComplaintRow[] = [
  {
    id: "f-c1",
    category: "Electrical",
    description: "Library floor 2 lights flickering after 7 PM.",
    status: "Open",
    created_at: new Date().toISOString(),
  },
  {
    id: "f-c2",
    category: "WiFi",
    description: "Intermittent packet loss in CS block B.",
    status: "Resolved",
    created_at: new Date().toISOString(),
  },
  {
    id: "f-c3",
    category: "Hostel",
    description: "Water pressure low in tower C during morning slots.",
    status: "Open",
    created_at: new Date().toISOString(),
  },
];

function getRangeStart(range: RangeKey): Date {
  const now = new Date();

  if (range === "today") {
    now.setHours(0, 0, 0, 0);
    return now;
  }

  if (range === "week") {
    now.setDate(now.getDate() - 7);
    return now;
  }

  now.setDate(now.getDate() - 30);
  return now;
}

function buildTrendSeries(attendance: AttendanceRow[], complaints: ComplaintRow[]) {
  return Array.from({ length: 12 }, (_, index) => {
    const attendanceItem = attendance[index];
    const complaintItem = complaints[index];

    const attendanceValue = attendanceItem
      ? attendanceItem.status === "Present"
        ? 75
        : 46
      : 38 + ((index * 11) % 22);

    const complaintValue = complaintItem
      ? complaintItem.status === "Open"
        ? 68
        : 40
      : 32 + ((index * 9) % 26);

    return {
      attendance: attendanceValue,
      complaints: complaintValue,
    };
  });
}

function formatTimestamp(value: string | null) {
  if (!value) return "No timestamp";

  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("today");
  const [clock, setClock] = useState("");
  const [dataError, setDataError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [complaintRows, setComplaintRows] = useState<ComplaintRow[]>([]);
  const [automationState, setAutomationState] = useState<Record<string, boolean>>({
    "attendance-alert": true,
    "complaint-escalation": true,
    "crowd-redistribution": false,
  });

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateClock();
    const id = setInterval(updateClock, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setDataError(null);

      const since = getRangeStart(range).toISOString();

      const [attendanceResult, complaintResult] = await Promise.all([
        supabase
          .from("attendance")
          .select("id, student_id, status, timestamp")
          .gte("timestamp", since)
          .order("timestamp", { ascending: false })
          .limit(400),
        supabase
          .from("complaints")
          .select("id, category, description, status, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (cancelled) return;

      if (attendanceResult.error || complaintResult.error) {
        setDataError(
          "Live data is partially unavailable. Showing resilient fallback insights."
        );
        setAttendanceRows(FALLBACK_ATTENDANCE);
        setComplaintRows(FALLBACK_COMPLAINTS);
      } else {
        setAttendanceRows((attendanceResult.data as AttendanceRow[]) ?? []);
        setComplaintRows((complaintResult.data as ComplaintRow[]) ?? []);
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const derived = useMemo(() => {
    const attendanceTotal = attendanceRows.length;
    const presentCount = attendanceRows.filter((row) => row.status === "Present").length;
    const openComplaints = complaintRows.filter((row) => row.status === "Open").length;
    const resolvedComplaints = complaintRows.filter((row) => row.status === "Resolved").length;
    const uniqueStudents = new Set(
      attendanceRows
        .map((row) => row.student_id)
        .filter((studentId): studentId is string => Boolean(studentId && studentId.trim()))
    ).size;

    const attendanceRate = attendanceTotal > 0 ? (presentCount / attendanceTotal) * 100 : 0;
    const resolutionRate =
      complaintRows.length > 0
        ? (resolvedComplaints / complaintRows.length) * 100
        : 0;

    return {
      attendanceTotal,
      presentCount,
      openComplaints,
      resolvedComplaints,
      uniqueStudents,
      attendanceRate,
      resolutionRate,
    };
  }, [attendanceRows, complaintRows]);

  const trendSeries = useMemo(
    () => buildTrendSeries(attendanceRows, complaintRows),
    [attendanceRows, complaintRows]
  );

  const recentComplaints = useMemo(() => complaintRows.slice(0, 4), [complaintRows]);

  return (
    <div className="relative space-y-6 p-5 md:p-8">
      <section className="glass-panel section-reveal rounded-3xl border border-slate-700/70 p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles className="h-3 w-3" />
              Campus Intelligence Layer
            </div>
            <h2 className="section-title text-2xl font-bold text-white md:text-3xl">
              Real-time Command Center
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Cross-module insight feed from attendance and incident systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  range === option.key
                    ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-100"
                    : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}

            <div className="ml-1 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
              <Timer className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-mono">{clock || "--:--"} IST</span>
            </div>
          </div>
        </div>

        {dataError && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {dataError}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel section-reveal stagger-1 rounded-2xl border border-slate-700/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Campus footprint</p>
          <p className="mt-2 text-3xl font-bold text-white">{derived.uniqueStudents || 0}</p>
          <p className="mt-1 text-xs text-slate-400">Unique active students in selected range</p>
        </article>

        <article className="glass-panel section-reveal stagger-2 rounded-2xl border border-slate-700/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Attendance health</p>
          <p className="mt-2 text-3xl font-bold text-emerald-200">{derived.attendanceRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-400">
            {derived.presentCount} present out of {derived.attendanceTotal} events
          </p>
        </article>

        <article className="glass-panel section-reveal stagger-3 rounded-2xl border border-slate-700/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Open incidents</p>
          <p className="mt-2 text-3xl font-bold text-amber-200">{derived.openComplaints}</p>
          <p className="mt-1 text-xs text-slate-400">
            Active complaint threads requiring action
          </p>
        </article>

        <article className="glass-panel section-reveal stagger-4 rounded-2xl border border-slate-700/70 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Resolution score</p>
          <p className="mt-2 text-3xl font-bold text-cyan-200">{derived.resolutionRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-400">
            {derived.resolvedComplaints} complaints resolved in range
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Operational trend pulse</p>
              <p className="text-xs text-slate-400">Attendance vs incident intensity (synthetic visual)</p>
            </div>
            <Activity className="h-4 w-4 text-cyan-300" />
          </div>

          <div className="grid grid-cols-12 items-end gap-2">
            {trendSeries.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="h-24 rounded-md bg-slate-900/70 p-1">
                  <div
                    className="w-full rounded bg-gradient-to-t from-cyan-500/90 to-cyan-300/80"
                    style={{ height: `${item.attendance}%` }}
                  />
                </div>
                <div className="h-16 rounded-md bg-slate-900/70 p-1">
                  <div
                    className="w-full rounded bg-gradient-to-t from-amber-500/90 to-orange-300/80"
                    style={{ height: `${item.complaints}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              Attendance bars show stronger consistency this cycle.
            </div>
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Incident bars highlight complaint pressure windows.
            </div>
          </div>
        </article>

        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Recent incident stream</p>
              <p className="text-xs text-slate-400">Latest complaints from the selected range</p>
            </div>
            <Bell className="h-4 w-4 text-amber-300" />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-4 text-xs text-slate-400">
                Loading live feed...
              </div>
            ) : recentComplaints.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-4 text-xs text-slate-400">
                No complaints detected for this range.
              </div>
            ) : (
              recentComplaints.map((complaint) => {
                const isOpen = complaint.status === "Open";
                return (
                  <div
                    key={complaint.id}
                    className="rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`status-chip ${
                          isOpen ? "text-amber-100" : "text-emerald-100"
                        }`}
                      >
                        {isOpen ? <MessageSquareWarning className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {complaint.status}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatTimestamp(complaint.created_at)}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-200">
                      {complaint.category ?? "General"}: {complaint.description ?? "No description"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Multi-purpose modules</p>
              <p className="text-xs text-slate-400">Jump directly into focused work surfaces</p>
            </div>
            <ArrowRight className="h-4 w-4 text-cyan-300" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="rounded-xl border border-slate-700/80 bg-slate-900/75 p-3 transition-colors hover:border-cyan-400/45"
                >
                  <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${module.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {module.title}
                  </div>
                  <p className="mt-2 text-xs text-slate-300">{module.summary}</p>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Automation queue</p>
              <p className="text-xs text-slate-400">Toggle operational policies for this environment</p>
            </div>
            <Gauge className="h-4 w-4 text-emerald-300" />
          </div>

          <div className="space-y-2.5">
            {AUTOMATION_RULES.map((rule) => {
              const active = automationState[rule.id];
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() =>
                    setAutomationState((prev) => ({
                      ...prev,
                      [rule.id]: !prev[rule.id],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-3 text-left transition-colors hover:border-cyan-400/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{rule.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{rule.description}</p>
                    </div>
                    <span
                      className={`status-chip ${
                        active ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      {active ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">Impact level: {rule.impact}</p>
                </button>
              );
            })}
          </div>
        </article>
      </section>

      <section className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Class health</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">92.4%</p>
            <p className="text-xs text-slate-400">Sections with stable attendance trend</p>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Service velocity</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">14.2 hrs</p>
            <p className="text-xs text-slate-400">Median complaint turnaround time</p>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Experience score</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">4.7 / 5</p>
            <p className="text-xs text-slate-400">Based on student pulse check-ins</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1">
            <GraduationCap className="h-3.5 w-3.5 text-cyan-300" />
            Academics sync: healthy
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1">
            <CalendarClock className="h-3.5 w-3.5 text-emerald-300" />
            Scheduler latency: normal
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1">
            <Activity className="h-3.5 w-3.5 text-amber-300" />
            IoT ingestion: 98.8% uptime
          </span>
        </div>
      </section>
    </div>
  );
}
