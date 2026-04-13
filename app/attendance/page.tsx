"use client";

import { useEffect, useState } from "react";
import { AlertCircle, QrCode, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCampusRole } from "@/lib/useCampusRole";

type AttendanceRecord = {
  id: string;
  student_id: string;
  status: string;
  timestamp?: string | null;
};

const ROLE_STORAGE_KEY = "campusos-role";
const STUDENT_NAME_KEY = "campusos-student-name";

export default function AttendancePage() {
  const { role, ready: roleReady } = useCampusRole();

  const [scanState, setScanState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [studentName, setStudentName] = useState(() => {
    if (typeof window === "undefined") {
      return "Shivansh Mishra";
    }
    const stored = window.localStorage.getItem(STUDENT_NAME_KEY);
    return stored || "Shivansh Mishra";
  });

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

  const handleSimulateScan = async () => {
    if (scanState === "loading") return;

    setScanMessage(null);
    setScanState("loading");

    try {
      const nameToUse = studentName.trim() || "Student";

      const { error } = await supabase.from("attendance").insert([
        {
          student_id: nameToUse,
          status: "Present",
        },
      ]);

      if (error) {
        const message =
          (error as { message?: string; details?: string } | null)?.message ||
          (error as { message?: string; details?: string } | null)?.details ||
          "Something went wrong while marking your attendance. Please try again.";

        let friendlyMessage = message;

        if (message.toLowerCase().includes("relation") && message.includes("Attendance")) {
          friendlyMessage =
            "Supabase table \"Attendance\" is missing or misnamed. Create it in Supabase or update the code to use your actual table name.";
        } else if (
          message.toLowerCase().includes("row-level security") ||
          message.toLowerCase().includes("rls")
        ) {
          friendlyMessage =
            "Supabase Row Level Security is blocking this insert. Add an INSERT policy for the anon role on the Attendance table.";
        }

        setScanState("error");
        setScanMessage(friendlyMessage);
        return;
      }

      setScanState("success");
      setScanMessage(`Attendance marked successfully for ${nameToUse}.`);
    } catch {
      setScanState("error");
      setScanMessage(
        "Something went wrong while marking your attendance. Please try again."
      );
    }
  };

  const renderContent = () => {
    if (!roleReady) {
      return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Preparing your attendance experience
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Detecting your role to load the right interface.
            </p>
          </div>
          <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
        </div>
      );
    }

    if (!role) {
      return (
        <div className="rounded-2xl border border-amber-500/50 bg-slate-900/70 p-6 flex gap-3">
          <div className="mt-0.5">
            <AlertCircle className="h-5 w-5 text-amber-300" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-200">
              No role detected in this browser
            </p>
            <p className="text-xs text-slate-400">
              Set
              <span className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                {ROLE_STORAGE_KEY}
              </span>
              in localStorage to
              <span className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                &quot;student&quot;
              </span>
              or
              <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                &quot;admin&quot;
              </span>
              , then refresh this page.
            </p>
          </div>
        </div>
      );
    }

    if (role === "student") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6">
          <div className="relative rounded-2xl border border-cyan-500/40 bg-slate-950/70 p-6 overflow-hidden">
            <div className="pointer-events-none absolute -top-40 -right-32 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-32 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

            <div className="relative flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/40">
                  <QrCode className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 tracking-wide">
                    Quantum Scanner
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simulated QR scan for the CampusOS MVP.
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ready to scan
              </span>
            </div>

            <div className="relative z-10 mb-5 space-y-1">
              <p className="text-xs font-semibold text-slate-200">
                Who is checking in?
              </p>
              <div className="flex flex-col gap-1.5 max-w-xs">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStudentName(value);
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(STUDENT_NAME_KEY, value);
                    }
                  }}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                />
                <p className="text-[11px] text-slate-500">
                  This name is written into the attendance record in Supabase.
                </p>
              </div>
            </div>

            <div className="relative mx-auto flex aspect-square max-w-md items-center justify-center rounded-3xl border border-cyan-500/60 bg-slate-950/80 shadow-[0_0_40px_rgba(34,211,238,0.35)]">
              <div className="pointer-events-none absolute inset-6 rounded-[1.75rem] border border-dashed border-cyan-500/40" />
              <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent animate-pulse" />

              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={scanState === "loading"}
                className="relative flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full bg-cyan-500 text-slate-950 shadow-[0_0_45px_rgba(34,211,238,0.75)] transition-transform hover:scale-105 hover:bg-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-80"
              >
                <div className="absolute inset-1 rounded-full border border-white/30" />
                <QrCode className="relative h-10 w-10" />
                <span className="relative text-xs font-semibold tracking-wide uppercase">
                  {scanState === "loading" ? "Simulating..." : "Simulate QR Scan"}
                </span>
              </button>
            </div>

            {scanMessage && (
              <div
                className={`relative mt-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-medium ${
                  scanState === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-100"
                }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p>{scanMessage}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">
              How Smart Attendance works
            </h3>
            <p className="text-xs text-slate-400">
              For the hackathon MVP, CampusOS simulates QR scanning while
              writing real records into your Supabase Attendance table. In
              production, you can swap the simulated button for a live camera
              stream.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                We write your chosen
                <span className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-100">
                  student_id
                </span>
                and a
                <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                  status: &quot;Present&quot;
                </span>
                into Supabase.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                You can extend this later with real QR payloads and auth.
              </li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Attendance ledger
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Live view of all attendance events written by CampusOS.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/70 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Admin
          </span>
        </div>

        {recordsError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{recordsError}</span>
          </div>
        )}

        {!recordsLoading && records.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
            {(() => {
              const { total, present, absent } = getTodayStats(records);
              return (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold">Today</span>
                    <span className="text-slate-500">•</span>
                    <span className="tabular-nums text-emerald-300">
                      {present} present
                    </span>
                    <span className="text-slate-500">/</span>
                    <span className="tabular-nums text-slate-200">
                      {total} events
                    </span>
                  </span>
                  {total > present && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 border border-rose-500/40 text-rose-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      <span className="tabular-nums">{absent} marked absent/other</span>
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60">
          <table className="min-w-full divide-y divide-slate-800/90 text-sm">
            <thead className="bg-slate-950/80">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/80 bg-slate-950/60">
              {recordsLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-xs text-slate-500"
                  >
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-xs text-slate-500"
                  >
                    No attendance events recorded yet.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-900/70">
                    <td className="px-4 py-3 text-xs text-slate-100">
                      {record.student_id}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          record.status === "Present"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-200 border border-rose-500/30"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatTimestamp(record.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Smart Attendance
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Futuristic QR-based attendance, simulated for the CampusOS MVP.
        </p>
      </div>

      {renderContent()}
    </div>
  );
}

function formatTimestamp(value?: string | null) {
  if (!value) return "";

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

  const absent = Math.max(total - present, 0);
  return { total, present, absent };
}
