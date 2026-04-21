"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Megaphone,
  Plus,
  Search,
  Shield,
  Siren,
  Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ROLE_STORAGE_KEY, useCampusRole } from "@/lib/useCampusRole";

type ComplaintStatus = "Open" | "Resolved";
type Severity = "Low" | "Medium" | "High";

type Complaint = {
  id: number | string;
  category: string;
  description: string;
  status: ComplaintStatus;
  created_at?: string | null;
};

type EnrichedComplaint = Complaint & {
  severity: Severity;
  cleanDescription: string;
  slaHours: number;
};

const CATEGORIES = ["Electrical", "WiFi", "Hostel", "Maintenance", "Transport"] as const;

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

function parseSeverity(description: string): { severity: Severity; cleanDescription: string } {
  const match = description.match(/^\[(LOW|MEDIUM|HIGH)\]\s*/i);

  if (!match) {
    return {
      severity: "Medium",
      cleanDescription: description,
    };
  }

  const token = match[1].toUpperCase();
  const severity = token.charAt(0) + token.slice(1).toLowerCase();

  return {
    severity: severity as Severity,
    cleanDescription: description.replace(/^\[(LOW|MEDIUM|HIGH)\]\s*/i, ""),
  };
}

function getSlaHours(createdAt?: string | null) {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return 0;

  const diffMs = Date.now() - created;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

export default function ComplaintsPage() {
  const { role, ready: roleReady } = useCampusRole();

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Electrical");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | string | null>(null);
  const [batchResolving, setBatchResolving] = useState(false);

  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "All">("All");
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!roleReady || !role) return;

    let cancelled = false;

    const fetchComplaints = async () => {
      setComplaintsLoading(true);
      setComplaintsError(null);

      const { data, error } = await supabase
        .from("complaints")
        .select("id, category, description, status, created_at")
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

  const enrichedComplaints = useMemo<EnrichedComplaint[]>(() => {
    return complaints.map((complaint) => {
      const parsed = parseSeverity(complaint.description);
      return {
        ...complaint,
        severity: parsed.severity,
        cleanDescription: parsed.cleanDescription,
        slaHours: getSlaHours(complaint.created_at),
      };
    });
  }, [complaints]);

  const visibleComplaints = useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();

    return enrichedComplaints.filter((complaint) => {
      const matchesStatus = statusFilter === "All" ? true : complaint.status === statusFilter;
      const matchesSeverity =
        severityFilter === "All" ? true : complaint.severity === severityFilter;
      const matchesSearch =
        lower.length === 0
          ? true
          : complaint.category.toLowerCase().includes(lower) ||
            complaint.cleanDescription.toLowerCase().includes(lower);

      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }, [enrichedComplaints, searchQuery, severityFilter, statusFilter]);

  const analytics = useMemo(() => {
    const open = enrichedComplaints.filter((item) => item.status === "Open");
    const resolved = enrichedComplaints.filter((item) => item.status === "Resolved");
    const high = open.filter((item) => item.severity === "High");
    const slaRisk = open.filter((item) => item.slaHours >= 18);

    return {
      total: enrichedComplaints.length,
      open: open.length,
      resolved: resolved.length,
      high: high.length,
      slaRisk: slaRisk.length,
    };
  }, [enrichedComplaints]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    const packedDescription = `[${severity.toUpperCase()}] ${description.trim()}`;

    try {
      const { error } = await supabase.from("complaints").insert([
        {
          category,
          description: packedDescription,
          status: "Open" satisfies ComplaintStatus,
        },
      ]);

      if (error) {
        setSubmitError("Could not submit complaint. Please retry.");
      } else {
        setSubmitMessage("Complaint submitted. Campus response workflow is active.");
        setDescription("");
        setSeverity("Medium");
      }
    } catch {
      setSubmitError("Could not submit complaint. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: number | string) => {
    if (resolvingId) return;

    setResolvingId(id);

    try {
      const { error } = await supabase
        .from("complaints")
        .update({ status: "Resolved" satisfies ComplaintStatus })
        .eq("id", id);

      if (!error) {
        setComplaints((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "Resolved" } : item))
        );
      }
    } finally {
      setResolvingId(null);
    }
  };

  const handleResolveRisky = async () => {
    if (batchResolving) return;

    const riskyOpenIds = enrichedComplaints
      .filter((item) => item.status === "Open" && item.slaHours >= 18)
      .map((item) => item.id);

    if (riskyOpenIds.length === 0) return;

    setBatchResolving(true);

    try {
      const { error } = await supabase
        .from("complaints")
        .update({ status: "Resolved" satisfies ComplaintStatus })
        .in("id", riskyOpenIds);

      if (!error) {
        setComplaints((prev) =>
          prev.map((item) =>
            riskyOpenIds.includes(item.id) ? { ...item, status: "Resolved" } : item
          )
        );
      }
    } finally {
      setBatchResolving(false);
    }
  };

  return (
    <div className="space-y-6 p-5 md:p-8">
      <section className="glass-panel section-reveal rounded-3xl border border-slate-700/70 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title text-2xl font-bold text-white md:text-3xl">Incident Resolution Hub</h2>
            <p className="mt-1 text-sm text-slate-400">
              Structured complaint intake, severity-aware triage, and admin action loop.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <Megaphone className="h-4 w-4 text-cyan-300" />
            Role: <span className="font-semibold capitalize">{role ?? "pending"}</span>
          </div>
        </div>
      </section>

      {!roleReady && (
        <div className="glass-panel rounded-2xl border border-slate-700/70 px-4 py-5 text-sm text-slate-300">
          Preparing complaints workspace...
        </div>
      )}

      {roleReady && !role && (
        <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5 text-sm text-amber-100">
          No role detected. Set {ROLE_STORAGE_KEY} in localStorage to &quot;student&quot; or &quot;admin&quot; and refresh.
        </div>
      )}

      {roleReady && role === "student" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="glass-panel section-reveal rounded-2xl border border-cyan-500/35 p-5">
            <h3 className="section-title text-xl font-bold text-white">Submit Complaint</h3>
            <p className="mt-1 text-xs text-slate-400">
              Severity-tagged complaints improve response prioritization for campus teams.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Category</label>
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as (typeof CATEGORIES)[number])
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
                    required
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Severity</label>
                  <select
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value as Severity)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
                    required
                  >
                    {(["Low", "Medium", "High"] as Severity[]).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Issue description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  rows={5}
                  placeholder="Describe what happened, where, and how urgent this is."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.45)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {submitting ? "Submitting..." : "Submit complaint"}
              </button>

              {(submitError || submitMessage) && (
                <div
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    submitError
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  {submitError ?? submitMessage}
                </div>
              )}
            </form>
          </section>

          <section className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
            <h3 className="section-title text-lg font-semibold text-slate-100">Campus response pulse</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-500">Open incidents</p>
                <p className="mt-1 text-2xl font-bold text-amber-100">{analytics.open}</p>
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-500">Resolved incidents</p>
                <p className="mt-1 text-2xl font-bold text-emerald-100">{analytics.resolved}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Recent campus incidents
              </p>
              <div className="mt-2 space-y-2">
                {complaintsLoading ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                    Loading incident stream...
                  </div>
                ) : enrichedComplaints.length === 0 ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                    No incidents reported yet.
                  </div>
                ) : (
                  enrichedComplaints.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100">{item.category}</span>
                        <span className="status-chip text-cyan-100">{item.severity}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">{item.cleanDescription}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {roleReady && role === "admin" && (
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total</p>
              <p className="mt-2 text-2xl font-bold text-white">{analytics.total}</p>
            </article>
            <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open</p>
              <p className="mt-2 text-2xl font-bold text-amber-100">{analytics.open}</p>
            </article>
            <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Resolved</p>
              <p className="mt-2 text-2xl font-bold text-emerald-100">{analytics.resolved}</p>
            </article>
            <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">High Severity</p>
              <p className="mt-2 text-2xl font-bold text-rose-100">{analytics.high}</p>
            </article>
            <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">SLA Risk</p>
              <p className="mt-2 text-2xl font-bold text-orange-100">{analytics.slaRisk}</p>
            </article>
          </section>

          <section className="glass-panel rounded-2xl border border-slate-700/70 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search category or description"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-400">
                  <Filter className="h-3.5 w-3.5" /> Filters
                </div>

                {(["All", "Open", "Resolved"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatusFilter(option)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      statusFilter === option
                        ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-100"
                        : "border-slate-700 bg-slate-900/70 text-slate-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}

                {(["All", "Low", "Medium", "High"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSeverityFilter(option)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      severityFilter === option
                        ? "border-violet-500/60 bg-violet-500/10 text-violet-100"
                        : "border-slate-700 bg-slate-900/70 text-slate-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResolveRisky}
                disabled={batchResolving}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/55 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {batchResolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                Resolve SLA-risk items
              </button>
              <span className="text-xs text-slate-500">Targets open incidents older than 18 hours.</span>
            </div>

            {complaintsError && (
              <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {complaintsError}
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {complaintsLoading ? (
                <div className="col-span-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-6 text-center text-xs text-slate-400">
                  <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin text-cyan-300" />
                  Loading complaints...
                </div>
              ) : visibleComplaints.length === 0 ? (
                <div className="col-span-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-6 text-center text-xs text-slate-400">
                  No complaints match active filters.
                </div>
              ) : (
                visibleComplaints.map((complaint) => {
                  const isOpen = complaint.status === "Open";
                  const severityTone: Record<Severity, string> = {
                    Low: "text-emerald-100",
                    Medium: "text-amber-100",
                    High: "text-rose-100",
                  };

                  return (
                    <article
                      key={complaint.id}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/75 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100">{complaint.category}</span>
                        <span className={`status-chip ${severityTone[complaint.severity]}`}>
                          <Siren className="h-3.5 w-3.5" />
                          {complaint.severity}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-slate-200">
                        {complaint.cleanDescription}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {complaint.slaHours}h open
                        </span>
                        <span>{formatTimestamp(complaint.created_at)}</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span
                          className={`status-chip ${
                            isOpen ? "text-amber-100" : "text-emerald-100"
                          }`}
                        >
                          {isOpen ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          {complaint.status}
                        </span>

                        {isOpen ? (
                          <button
                            type="button"
                            onClick={() => handleResolve(complaint.id)}
                            disabled={resolvingId === complaint.id}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-slate-950 shadow-[0_0_22px_rgba(16,185,129,0.5)] disabled:cursor-not-allowed disabled:opacity-80"
                          >
                            {resolvingId === complaint.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Wrench className="h-3.5 w-3.5" />
                            )}
                            Resolve
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-200">Completed</span>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
