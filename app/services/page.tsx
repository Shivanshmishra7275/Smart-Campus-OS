"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Clock3,
  Loader2,
  Plus,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ROLE_STORAGE_KEY, useCampusRole } from "@/lib/useCampusRole";

type ServicePriority = "Low" | "Medium" | "High";
type ServiceStatus = "Open" | "In Progress" | "Resolved";

type ServiceRequest = {
  id: string | number;
  title: string;
  category: string;
  description: string;
  priority: ServicePriority;
  status: ServiceStatus;
  requester: string;
  created_at?: string | null;
};

const LOCAL_SERVICE_KEY = "campusos-local-service-requests";
const STUDENT_NAME_KEY = "campusos-student-name";

const CATEGORIES = ["IT", "Electrical", "Maintenance", "Housekeeping", "Admin"] as const;

const fallbackSeed: ServiceRequest[] = [
  {
    id: "seed-1",
    title: "Projector calibration",
    category: "IT",
    description: "Seminar hall projector has severe keystone distortion.",
    priority: "Medium",
    status: "In Progress",
    requester: "Faculty Support",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-2",
    title: "Hostel water leak",
    category: "Maintenance",
    description: "Persistent leak near B-block staircase floor 2.",
    priority: "High",
    status: "Open",
    requester: "Resident Council",
    created_at: new Date().toISOString(),
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

function readLocalRequests() {
  if (typeof window === "undefined") return fallbackSeed;

  try {
    const raw = window.localStorage.getItem(LOCAL_SERVICE_KEY);
    if (!raw) return fallbackSeed;

    const parsed = JSON.parse(raw) as ServiceRequest[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackSeed;
  } catch {
    return fallbackSeed;
  }
}

function writeLocalRequests(requests: ServiceRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_SERVICE_KEY, JSON.stringify(requests));
}

export default function ServicesPage() {
  const { role, ready: roleReady } = useCampusRole();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("IT");
  const [priority, setPriority] = useState<ServicePriority>("Medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [requests, setRequests] = useState<ServiceRequest[]>(() => readLocalRequests());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [backendMode, setBackendMode] = useState<"connected" | "fallback">("connected");
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const requesterName = useMemo(() => {
    if (typeof window === "undefined") return "Campus User";
    return window.localStorage.getItem(STUDENT_NAME_KEY) || "Campus User";
  }, []);

  useEffect(() => {
    if (!roleReady || !role) return;

    let cancelled = false;

    const fetchRequests = async () => {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("service_requests")
        .select("id, title, category, description, priority, status, requester, created_at")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setBackendMode("fallback");
        setLoadError("Service table unavailable. Running in resilient local mode.");
        const localData = readLocalRequests();
        setRequests(localData);
      } else {
        setBackendMode("connected");
        setRequests((data as ServiceRequest[]) ?? []);
      }

      setLoading(false);
    };

    fetchRequests();

    return () => {
      cancelled = true;
    };
  }, [roleReady, role]);

  const grouped = useMemo(() => {
    const open = requests.filter((item) => item.status === "Open");
    const progress = requests.filter((item) => item.status === "In Progress");
    const resolved = requests.filter((item) => item.status === "Resolved");

    return {
      open,
      progress,
      resolved,
    };
  }, [requests]);

  const myRequests = useMemo(() => {
    const normalized = requesterName.trim().toLowerCase();

    return requests.filter((request) => request.requester.toLowerCase() === normalized);
  }, [requests, requesterName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    const payload = {
      title: trimmedTitle,
      category,
      priority,
      description: trimmedDescription,
      status: "Open" as const,
      requester: requesterName,
    };

    if (backendMode === "connected") {
      const { data, error } = await supabase
        .from("service_requests")
        .insert([payload])
        .select("id, title, category, description, priority, status, requester, created_at")
        .single();

      if (!error && data) {
        setRequests((prev) => [data as ServiceRequest, ...prev]);
        setSubmitMessage("Request logged to live service queue.");
        setTitle("");
        setDescription("");
        setSubmitting(false);
        return;
      }

      setBackendMode("fallback");
      setLoadError("Live backend write failed. Switching to local queue mode.");
    }

    const localRequest: ServiceRequest = {
      id: `local-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
    };

    setRequests((prev) => {
      const next = [localRequest, ...prev];
      writeLocalRequests(next);
      return next;
    });

    setSubmitMessage("Request saved in local resilient queue mode.");
    setTitle("");
    setDescription("");
    setSubmitting(false);
  };

  const updateStatus = async (id: string | number, status: ServiceStatus) => {
    if (updatingId) return;
    setUpdatingId(id);

    if (backendMode === "connected") {
      const { error } = await supabase
        .from("service_requests")
        .update({ status })
        .eq("id", id);

      if (!error) {
        setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
        setUpdatingId(null);
        return;
      }

      setBackendMode("fallback");
      setLoadError("Live status update failed. Local queue mode enabled.");
    }

    setRequests((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, status } : item));
      writeLocalRequests(next);
      return next;
    });

    setUpdatingId(null);
  };

  return (
    <div className="space-y-6 p-5 md:p-8">
      <section className="glass-panel section-reveal rounded-3xl border border-slate-700/70 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title text-2xl font-bold text-white md:text-3xl">Service Desk Orchestrator</h2>
            <p className="mt-1 text-sm text-slate-400">
              Multi-purpose request management for IT, maintenance, admin, and facilities.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            {backendMode === "connected" ? "Live backend mode" : "Fallback local mode"}
          </div>
        </div>
      </section>

      {!roleReady && (
        <div className="glass-panel rounded-2xl border border-slate-700/70 px-4 py-5 text-sm text-slate-300">
          Preparing service desk...
        </div>
      )}

      {roleReady && !role && (
        <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5 text-sm text-amber-100">
          No role detected. Set {ROLE_STORAGE_KEY} in localStorage to &quot;student&quot; or &quot;admin&quot;.
        </div>
      )}

      {loadError && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
          {loadError}
        </div>
      )}

      {roleReady && role === "student" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="glass-panel section-reveal rounded-2xl border border-cyan-500/35 p-5">
            <h3 className="section-title text-xl font-bold text-white">Create Service Request</h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Request title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  placeholder="Short summary of the issue"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Category</label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Priority</label>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as ServicePriority)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
                  >
                    {(["Low", "Medium", "High"] as ServicePriority[]).map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  required
                  placeholder="Include location, symptoms, and urgency details"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.45)] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {submitting ? "Submitting..." : "Submit request"}
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
            <h3 className="section-title text-lg font-semibold text-slate-100">My requests</h3>
            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-xs text-slate-400">
                  Loading requests...
                </div>
              ) : myRequests.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-xs text-slate-400">
                  No requests created by your profile yet.
                </div>
              ) : (
                myRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-slate-700/80 bg-slate-900/75 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-100">{request.title}</p>
                      <span className="status-chip text-cyan-100">{request.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{request.description}</p>
                    <p className="mt-2 text-[11px] text-slate-500">{formatTimestamp(request.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {roleReady && role === "admin" && (
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Open Queue</p>
              <p className="mt-2 text-3xl font-bold text-amber-100">{grouped.open.length}</p>
            </article>
            <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">In Progress</p>
              <p className="mt-2 text-3xl font-bold text-cyan-100">{grouped.progress.length}</p>
            </article>
            <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Resolved</p>
              <p className="mt-2 text-3xl font-bold text-emerald-100">{grouped.resolved.length}</p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            {([
              { key: "Open", title: "Open" },
              { key: "In Progress", title: "In Progress" },
              { key: "Resolved", title: "Resolved" },
            ] as { key: ServiceStatus; title: string }[]).map((column) => {
              const items = requests.filter((request) => request.status === column.key);

              return (
                <article
                  key={column.key}
                  className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="section-title text-base font-semibold text-slate-100">{column.title}</h4>
                    <span className="status-chip text-slate-200">{items.length}</span>
                  </div>

                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-xs text-slate-500">
                        No items
                      </div>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-700/80 bg-slate-900/75 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                            <span className="status-chip text-cyan-100">{item.priority}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                          <p className="mt-2 text-[11px] text-slate-500">{item.requester}</p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.status !== "Open" && (
                              <button
                                type="button"
                                onClick={() => updateStatus(item.id, "Open")}
                                disabled={updatingId === item.id}
                                className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300"
                              >
                                Reopen
                              </button>
                            )}
                            {item.status !== "In Progress" && (
                              <button
                                type="button"
                                onClick={() => updateStatus(item.id, "In Progress")}
                                disabled={updatingId === item.id}
                                className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-100"
                              >
                                Start
                              </button>
                            )}
                            {item.status !== "Resolved" && (
                              <button
                                type="button"
                                onClick={() => updateStatus(item.id, "Resolved")}
                                disabled={updatingId === item.id}
                                className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-100"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}

      <section className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1">
            <ClipboardList className="h-3.5 w-3.5 text-cyan-300" />
            Unified queue
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1">
            <Clock3 className="h-3.5 w-3.5 text-amber-300" />
            SLA ready
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1">
            <Wrench className="h-3.5 w-3.5 text-emerald-300" />
            Multi-team dispatch
          </span>
        </div>
      </section>
    </div>
  );
}
