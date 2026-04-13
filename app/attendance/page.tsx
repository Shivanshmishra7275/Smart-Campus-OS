"use client";

import { useState } from "react";
import { QrCode, CheckCircle, AlertCircle } from "lucide-react";

export default function AttendancePage() {
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const handleSimulateScan = () => {
    setScanStatus("success");
    setTimeout(() => setScanStatus("idle"), 3000);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Attendance
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Scan a QR code to mark your attendance for a session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner Panel */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <QrCode size={16} className="text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">QR Scanner</h3>
          </div>

          {/* Camera / QR placeholder */}
          <div className="relative aspect-square w-full max-w-xs mx-auto rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center">
            {/* Scanning animation corners */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-md" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-md" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-md" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-md" />
            </div>

            {scanStatus === "success" ? (
              <div className="flex flex-col items-center gap-2 text-emerald-400">
                <CheckCircle size={48} />
                <span className="text-sm font-semibold">Attendance Marked!</span>
              </div>
            ) : scanStatus === "error" ? (
              <div className="flex flex-col items-center gap-2 text-rose-400">
                <AlertCircle size={48} />
                <span className="text-sm font-semibold">Invalid QR Code</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <QrCode size={48} />
                <span className="text-xs">Camera feed will appear here</span>
                <span className="text-xs text-slate-600">
                  (react-qr-reader integration)
                </span>
              </div>
            )}
          </div>

          {/* Simulate button for demo */}
          <button
            onClick={handleSimulateScan}
            className="mt-2 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all active:scale-[0.98]"
          >
            Simulate QR Scan (Demo)
          </button>
        </div>

        {/* Recent Attendance Log */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-6 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200">Recent Logs</h3>
          <div className="space-y-3">
            {[
              { course: "CS-401 — Machine Learning", time: "09:15 AM", status: "Present" },
              { course: "CS-302 — Operating Systems", time: "11:00 AM", status: "Present" },
              { course: "MA-201 — Linear Algebra", time: "02:00 PM", status: "Absent" },
            ].map(({ course, time, status }) => (
              <div
                key={course}
                className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-800 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-slate-200 font-medium">{course}</p>
                  <p className="text-xs text-slate-500">{time}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    status === "Present"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-auto">
            Data will load from Supabase — connect your API
          </p>
        </div>
      </div>
    </div>
  );
}
