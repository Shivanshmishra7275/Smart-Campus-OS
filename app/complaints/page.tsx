"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Megaphone,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Role = "student" | "admin";

type ComplaintStatus = "Open" | "Resolved";

type Complaint = {
  id: number;
  category: string;
  description: string;
  status: ComplaintStatus;
  created_at?: string | null;
};

const ROLE_STORAGE_KEY = "campusos-role";

const categories = ["Electrical", "WiFi", "Hostel", "Maintenance"] as const;

export default function ComplaintsPage() {
  const [role, setRole] = useState<Role | null>(null);
  const [roleReady, setRoleReady] = useState(false);

  const [category, setCategory] = useState<(typeof categories)[number]>(
    "Electrical"
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "All">(
    "All"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);
    if (storedRole === "student" || storedRole === "admin") {
      setRole(storedRole);
    }

    setRoleReady(true);
  }, []);

  useEffect(() => {
    if (!roleReady || role !== "admin") return;

    let cancelled = false;

    const fetchComplaints = async () => {
      setComplaintsLoading(true);
      setComplaintsError(null);

      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setComplaintsError("Unable to load complaints right now.");
        setComplaints([]);
      } else {
        setComplaints((data as Complaint[]) ?? []);
      }

      setComplaintsLoading(false);
    };

    fetchComplaints();

    return () => {
      cancelled = true;
    };
  }, [roleReady, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    try {
      const { error } = await supabase.from("complaints").insert([
        {
          category,
          description,
          status: "Open" satisfies ComplaintStatus,
        },
      ]);

      if (error) {
        setSubmitError(
          "Something went wrong while submitting your complaint. Please try again."
        );
      } else {
        setSubmitMessage("Complaint submitted successfully.");
        setDescription("");
        setCategory("Electrical");
      }
    } catch {
      setSubmitError(
        "Something went wrong while submitting your complaint. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: number) => {
    if (resolvingId) return;

    setResolvingId(id);

    try {
      const { error } = await supabase
        .from("complaints")
        .update({ status: "Resolved" satisfies ComplaintStatus })
        .eq("id", id);

      if (!error) {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: "Resolved",
                }
              : c
          )
        );
      }
    } catch {
      // We intentionally avoid noisy console errors for end-users.
    } finally {
      setResolvingId(null);
    }
  };

  const renderRoleGate = () => {
    if (!roleReady) {
      return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Preparing your complaints workspace
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Detecting your role to load the correct experience.
            </p>
          </div>
          <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin" />
        </div>
      );
    }

    if (!role) {
      return (
        <div className="rounded-2xl border border-amber-500/50 bg-slate-900/80 p-6 flex gap-3">
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

    return null;
  };

  const gate = renderRoleGate();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Smart Complaints
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            A unified, Supabase-backed complaints system for CampusOS.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-300">
          <Megaphone className="h-3.5 w-3.5 text-cyan-400" />
          <span className="capitalize">{role ?? "role pending"}</span>
        </div>
      </div>

      {gate}

      {roleReady && role === "student" && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-6">
          <div className="relative rounded-2xl border border-cyan-500/40 bg-slate-950/80 p-6 overflow-hidden">
            <div className="pointer-events-none absolute -top-40 -right-32 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/40">
                  <AlertCircle className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 tracking-wide">
                    File a smart complaint
                  </h3>
                  <p className="text-xs text-slate-500">
                    Categorised tickets that route directly into CampusOS.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative space-y-4 text-sm text-slate-100"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as (typeof categories)[number])
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  required
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  placeholder="Describe the issue with enough detail for the campus team to act."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-transform hover:scale-[1.02] hover:bg-cyan-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>
                    {submitting ? "Submitting complaint..." : "Submit complaint"}
                  </span>
                </button>
              </div>

              {(submitMessage || submitError) && (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                    submitError
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  {submitError ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  <span>{submitError ?? submitMessage}</span>
                </div>
              )}
            </form>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">
              How complaints flow
            </h3>
            <p className="text-xs text-slate-400">
              Each complaint is written into your Supabase Complaints table
              with an initial
              <span className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-rose-300">
                status: &quot;Open&quot;
              </span>
              . Admins see a live grid of these tickets and can resolve them
              with a single click.
            </p>
          </div>
        </div>
      )}

      {roleReady && role === "admin" && (
        <div className="space-y-4">
          {complaintsError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{complaintsError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300">
            <span className="text-slate-400">
              {complaints.length} total complaints
            </span>
            <div className="flex flex-wrap gap-2">
              {["All", "Open", "Resolved"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      label === "All" ? "All" : (label as ComplaintStatus)
                    )
                  }
                  className={`px-3 py-1.5 rounded-full border text-[11px] font-medium transition-colors ${
                    statusFilter === label
                      ? "border-cyan-500/80 bg-cyan-500/10 text-cyan-200"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {complaintsLoading ? (
              <div className="col-span-full flex items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 px-6 py-10 text-xs text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-400" />
                Loading complaints...
              </div>
            ) : complaints.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-700/60 bg-slate-900/80 px-6 py-8 text-center text-xs text-slate-500">
                No complaints have been filed yet.
              </div>
            ) : (
              complaints
                .filter((complaint) =>
                  statusFilter === "All"
                    ? true
                    : complaint.status === statusFilter
                )
                .map((complaint) => {
                const isOpen = complaint.status === "Open";

                return (
                  <div
                    key={complaint.id}
                    className="relative flex h-full flex-col gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/80 p-5 shadow-[0_0_25px_rgba(15,23,42,0.7)] hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-700">
                          {isOpen ? (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </span>
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                          {complaint.category}
                        </span>
                      </div>

                      {isOpen ? (
                        <button
                          type="button"
                          onClick={() => handleResolve(complaint.id)}
                          disabled={resolvingId === complaint.id}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-80"
                        >
                          {resolvingId === complaint.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          <span>Mark as resolved</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                          <CheckCircle className="h-3 w-3" />
                          Resolved
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-100 leading-relaxed">
                      {complaint.description}
                    </p>

                    <p className="mt-auto text-[11px] text-slate-500">
                      {formatTimestamp(complaint.created_at)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
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
