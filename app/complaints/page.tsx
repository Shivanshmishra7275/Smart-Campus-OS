"use client";

import { useState } from "react";
import { Plus, MessageSquareWarning, Clock, CheckCircle2 } from "lucide-react";

const mockComplaints = [
  {
    id: 1,
    title: "Broken projector in Room 204",
    category: "Infrastructure",
    status: "Open",
    date: "Apr 12, 2025",
  },
  {
    id: 2,
    title: "Wi-Fi outage in Library Block",
    category: "IT",
    status: "In Progress",
    date: "Apr 11, 2025",
  },
  {
    id: 3,
    title: "Water leakage near Cafeteria",
    category: "Maintenance",
    status: "Resolved",
    date: "Apr 10, 2025",
  },
];

const statusStyles: Record<string, string> = {
  Open: "bg-rose-500/10 text-rose-400",
  "In Progress": "bg-amber-500/10 text-amber-400",
  Resolved: "bg-emerald-500/10 text-emerald-400",
};

const statusIcons: Record<string, React.ReactNode> = {
  Open: <MessageSquareWarning size={12} />,
  "In Progress": <Clock size={12} />,
  Resolved: <CheckCircle2 size={12} />,
};

export default function ComplaintsPage() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: connect to Supabase
    setTitle("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Complaints
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            Submit and track campus issues.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          New Complaint
        </button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Submit a Complaint
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              required
              type="text"
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {["Infrastructure", "IT", "Maintenance", "Safety", "Other"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
            <textarea
              placeholder="Describe the issue in detail…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="py-2.5 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints List */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/60">
          <h3 className="text-sm font-semibold text-slate-200">All Complaints</h3>
        </div>
        <div className="divide-y divide-slate-700/40">
          {mockComplaints.map((c) => (
            <div
              key={c.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-slate-100">{c.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {c.category} · {c.date}
                </p>
              </div>
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[c.status]}`}
              >
                {statusIcons[c.status]}
                {c.status}
              </span>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-slate-700/60">
          <p className="text-xs text-slate-600">
            Complaints will load from Supabase — connect your API
          </p>
        </div>
      </div>
    </div>
  );
}
