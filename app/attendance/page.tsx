"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  QrCode,
  Search,
  ShieldCheck,
  TrendingUp,
  Users2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ROLE_STORAGE_KEY, useCampusRole } from "@/lib/useCampusRole";

type AttendanceRecord = {
  id: string;
  student_id: string;
  status: string;
  timestamp?: string | null;
};

type SessionBlock = {
  id: string;
  title: string;
  slot: string;
  room: string;
  owner: string;
};

const STUDENT_NAME_KEY = "campusos-student-name";
const STREAK_KEY = "campusos-attendance-streak";

const SESSION_BLOCKS: SessionBlock[] = [
  {
    id: "s1",
    title: "Applied ML",
    slot: "09:30 - 10:30",
    room: "CS-402",
    owner: "Dr. Neha Rao",
  },
  {
    id: "s2",
    title: "Distributed Systems",
    slot: "11:00 - 12:00",
    room: "CS-204",
    owner: "Prof. V. Menon",
  },
  {
    id: "s3",
    title: "Design Studio",
    slot: "14:00 - 15:15",
    room: "Innovation Lab",
    owner: "Ar. R. Shah",
  },
];

function formatTimestamp(value?: string | null) {
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

function getTodayStats(records: AttendanceRecord[]) {
  const today = new Date().toDateString();
  let total = 0;
  let present = 0;

  for (const record of records) {
    if (!record.timestamp) continue;

    const recordDate = new Date(record.timestamp);
    if (recordDate.toDateString() !== today) continue;

    total += 1;
    if (record.status === "Present") {
      present += 1;
    }
  }

  return {
    total,
    present,
    absent: Math.max(total - present, 0),
  };
}

export default function AttendancePage() {
  const { role, ready: roleReady } = useCampusRole();

  const [scanState, setScanState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>(SESSION_BLOCKS[0].id);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState(() => {
    if (typeof window === "undefined") return "Shivansh Mishra";
    return window.localStorage.getItem(STUDENT_NAME_KEY) || "Shivansh Mishra";
  });
  const [streak, setStreak] = useState(() => {
    if (typeof window === "undefined") return 4;
    const stored = Number(window.localStorage.getItem(STREAK_KEY) || "4");
    return Number.isFinite(stored) && stored > 0 ? stored : 4;
  });

  const [statusFilter, setStatusFilter] = useState<"All" | "Present" | "Absent">("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STUDENT_NAME_KEY, studentName);
  }, [studentName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STREAK_KEY, String(streak));
  }, [streak]);

  useEffect(() => {
    if (!roleReady || role !== "admin") return;

    let cancelled = false;

    const fetchRecords = async () => {
      setRecordsLoading(true);
      setRecordsError(null);

      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, status, timestamp")
        .order("timestamp", { ascending: false });

      if (cancelled) return;

      if (error) {
        setRecordsError("Unable to load attendance records right now.");
        setRecords([]);
      } else {
        setRecords((data as AttendanceRecord[]) ?? []);
      }

      setRecordsLoading(false);
    };

    fetchRecords();

    return () => {
      cancelled = true;
    };
  }, [roleReady, role]);

  useEffect(() => {
    if (!roleReady || role !== "student") return;

    let cancelled = false;

    const fetchHistory = async () => {
      setHistoryError(null);

      const name = studentName.trim();
      if (!name) {
        setStudentHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, status, timestamp")
        .eq("student_id", name)
        .order("timestamp", { ascending: false })
        .limit(6);

      if (cancelled) return;

      if (error) {
        setHistoryError("Could not sync your personal attendance history.");
        setStudentHistory([]);
      } else {
        setStudentHistory((data as AttendanceRecord[]) ?? []);
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [roleReady, role, studentName, scanState]);

  const handleSimulateScan = async () => {
    if (scanState === "loading") return;

    setScanState("loading");
    setScanMessage(null);

    try {
      const nameToUse = studentName.trim() || "Student";

      const { error } = await supabase.from("attendance").insert([
        {
          student_id: nameToUse,
          status: "Present",
        },
      ]);

      if (error) {
        let friendlyMessage =
          error.message ||
          "Something went wrong while marking attendance. Please try again.";

        if (friendlyMessage.toLowerCase().includes("row-level security")) {
          friendlyMessage =
            "Row-level security is blocking attendance writes. Add an INSERT policy for your role.";
        }

        setScanState("error");
        setScanMessage(friendlyMessage);
        return;
      }

      setScanState("success");
      setScanMessage(`Attendance marked for ${nameToUse}.`);
      setStreak((prev) => prev + 1);
    } catch {
      setScanState("error");
      setScanMessage("Unexpected issue while marking attendance. Please retry.");
    }
  };

  const adminView = useMemo(() => {
    const stats = getTodayStats(records);
    const filtered = records.filter((record) => {
      const matchesStatus = statusFilter === "All" ? true : record.status === statusFilter;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : record.student_id.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });

    const topStudents = Object.entries(
      filtered.reduce<Record<string, number>>((acc, record) => {
        acc[record.student_id] = (acc[record.student_id] ?? 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      stats,
      filtered,
      topStudents,
    };
  }, [records, query, statusFilter]);

  const selectedSessionData =
    SESSION_BLOCKS.find((session) => session.id === selectedSession) ?? SESSION_BLOCKS[0];

  const studentTodayPresent = studentHistory.filter((entry) => {
    if (!entry.timestamp) return false;
    return new Date(entry.timestamp).toDateString() === new Date().toDateString();
  }).length;

  const attendanceTarget = 4;
  const progress = Math.min((studentTodayPresent / attendanceTarget) * 100, 100);

  return (
    <div className="space-y-6 p-5 md:p-8">
      <section className="glass-panel section-reveal rounded-3xl border border-slate-700/70 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title text-2xl font-bold text-white md:text-3xl">
              Attendance Intelligence
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Session-aware check-ins with role-specific visibility and analytics.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            Role: <span className="font-semibold capitalize">{role ?? "pending"}</span>
          </div>
        </div>
      </section>

      {!roleReady && (
        <div className="glass-panel rounded-2xl border border-slate-700/70 px-4 py-5 text-sm text-slate-300">
          Preparing your attendance workspace...
        </div>
      )}

      {roleReady && !role && (
        <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5 text-sm text-amber-100">
          No role is detected. Set {ROLE_STORAGE_KEY} in localStorage to &quot;student&quot; or &quot;admin&quot; and refresh.
        </div>
      )}

      {roleReady && role === "student" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="glass-panel section-reveal rounded-2xl border border-cyan-500/35 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Smart Scanner</p>
                <h3 className="section-title text-xl font-bold text-white">Frictionless Check-In</h3>
              </div>
              <span className="status-chip text-cyan-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Scanner ready
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Student identity</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Current session</label>
                <select
                  value={selectedSession}
                  onChange={(event) => setSelectedSession(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
                >
                  {SESSION_BLOCKS.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title} • {session.slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-cyan-500/45 bg-slate-950/80 p-6">
              <div className="mx-auto flex aspect-square max-w-[290px] items-center justify-center rounded-[2.2rem] border border-dashed border-cyan-500/45">
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={scanState === "loading"}
                  className="pulse-ring inline-flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full bg-cyan-500 text-slate-950 shadow-[0_0_55px_rgba(34,211,238,0.55)] transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {scanState === "loading" ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <QrCode className="h-9 w-9" />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {scanState === "loading" ? "Processing" : "Mark Present"}
                  </span>
                </button>
              </div>
            </div>

            {scanMessage && (
              <div
                className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
                  scanState === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-100"
                }`}
              >
                {scanMessage}
              </div>
            )}
          </section>

          <section className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
            <h3 className="section-title text-lg font-semibold text-slate-100">Session context</h3>

            <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
              <p className="text-sm font-semibold text-white">{selectedSessionData.title}</p>
              <div className="mt-1 space-y-1 text-xs text-slate-400">
                <p className="flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
                  {selectedSessionData.slot}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 text-cyan-300" />
                  {selectedSessionData.room} • {selectedSessionData.owner}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Daily attendance target
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                {studentTodayPresent} / {attendanceTarget} check-ins
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-500">Current streak</p>
                <p className="mt-1 text-2xl font-bold text-cyan-100">{streak}</p>
                <p className="text-xs text-slate-400">consecutive successful check-ins</p>
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-500">Health score</p>
                <p className="mt-1 text-2xl font-bold text-emerald-100">
                  {Math.min(98, 70 + Math.floor(streak / 2))}%
                </p>
                <p className="text-xs text-slate-400">based on consistency and punctuality</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Your recent history
              </p>
              {historyError ? (
                <div className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {historyError}
                </div>
              ) : studentHistory.length === 0 ? (
                <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                  No personal attendance entries yet.
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {studentHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{entry.status}</span>
                        <span className="text-slate-400">{formatTimestamp(entry.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {roleReady && role === "admin" && (
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Today events</p>
              <p className="mt-2 text-3xl font-bold text-white">{adminView.stats.total}</p>
              <p className="text-xs text-slate-400">All attendance writes for the day</p>
            </article>
            <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Present ratio</p>
              <p className="mt-2 text-3xl font-bold text-emerald-100">
                {adminView.stats.total > 0
                  ? ((adminView.stats.present / adminView.stats.total) * 100).toFixed(1)
                  : "0.0"}
                %
              </p>
              <p className="text-xs text-slate-400">Attendance quality signal</p>
            </article>
            <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Absent / Other</p>
              <p className="mt-2 text-3xl font-bold text-amber-100">{adminView.stats.absent}</p>
              <p className="text-xs text-slate-400">Need coordinator follow-up</p>
            </article>
          </section>

          <section className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by student name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(["All", "Present", "Absent"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatusFilter(option)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      statusFilter === option
                        ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-100"
                        : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {recordsError && (
              <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {recordsError}
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-700/80">
              <table className="min-w-full divide-y divide-slate-800 bg-slate-950/55">
                <thead className="bg-slate-900/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">Student</th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {recordsLoading ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-7 text-center text-xs text-slate-400">
                        Loading attendance ledger...
                      </td>
                    </tr>
                  ) : adminView.filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-7 text-center text-xs text-slate-400">
                        No records match current filters.
                      </td>
                    </tr>
                  ) : (
                    adminView.filtered.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-900/80">
                        <td className="px-4 py-3 text-xs text-slate-100">{record.student_id}</td>
                        <td className="px-4 py-3 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              record.status === "Present"
                                ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                                : "border border-amber-500/40 bg-amber-500/10 text-amber-100"
                            }`}
                          >
                            {record.status === "Present" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{formatTimestamp(record.timestamp)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
              <p className="text-sm font-semibold text-slate-100">Top active students</p>
              <div className="mt-3 space-y-2">
                {adminView.topStudents.length === 0 ? (
                  <p className="text-xs text-slate-400">Not enough data to rank students yet.</p>
                ) : (
                  adminView.topStudents.map(([student, count]) => (
                    <div
                      key={student}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-slate-100">{student}</span>
                        <span className="text-cyan-200">{count} marks</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
              <p className="text-sm font-semibold text-slate-100">Operations hints</p>
              <div className="mt-3 space-y-2 text-xs text-slate-300">
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
                  <p className="flex items-center gap-2 text-emerald-200">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Attendance quality increased from last cycle.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
                  <p className="flex items-center gap-2 text-cyan-200">
                    <Users2 className="h-3.5 w-3.5" />
                    Recommend mentoring outreach for repeated absentees.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
                  <p className="flex items-center gap-2 text-amber-200">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Sync timetable for auto session detection.
                  </p>
                </div>
              </div>
            </article>
          </section>
        </div>
      )}
    </div>
  );
}
