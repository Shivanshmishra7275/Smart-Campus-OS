"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { ROLE_STORAGE_KEY, useCampusRole } from "@/lib/useCampusRole";

type EventType = "Academic" | "Community" | "Sports" | "Career" | "Culture";

type CampusEvent = {
  id: string;
  title: string;
  type: EventType;
  venue: string;
  startAt: string;
  capacity: number;
  registered: number;
  description: string;
};

const RSVP_KEY = "campusos-rsvp-events";
const CUSTOM_EVENTS_KEY = "campusos-custom-events";
const REFERENCE_NOW = new Date("2026-04-21T00:00:00").getTime();

const BASE_EVENTS: CampusEvent[] = [
  {
    id: "evt-1",
    title: "AI Research Poster Expo",
    type: "Academic",
    venue: "Innovation Hall",
    startAt: "2026-04-23T10:00:00",
    capacity: 180,
    registered: 124,
    description: "Student and faculty research showcase with judging and grants briefing.",
  },
  {
    id: "evt-2",
    title: "Night Run for Wellness",
    type: "Sports",
    venue: "Campus Track",
    startAt: "2026-04-24T19:30:00",
    capacity: 220,
    registered: 146,
    description: "Community 5K run with hydration stations and health check booths.",
  },
  {
    id: "evt-3",
    title: "Founder AMA: Build to Scale",
    type: "Career",
    venue: "Auditorium A",
    startAt: "2026-04-26T16:00:00",
    capacity: 300,
    registered: 201,
    description: "Startup leaders share practical hiring, growth, and product lessons.",
  },
  {
    id: "evt-4",
    title: "Open Mic and Culture Night",
    type: "Culture",
    venue: "Amphitheatre",
    startAt: "2026-04-27T18:30:00",
    capacity: 260,
    registered: 178,
    description: "Music, poetry, and campus culture performances from every department.",
  },
];

const EVENT_COLORS: Record<EventType, string> = {
  Academic: "bg-cyan-500/10 text-cyan-200",
  Community: "bg-emerald-500/10 text-emerald-200",
  Sports: "bg-amber-500/10 text-amber-200",
  Career: "bg-violet-500/10 text-violet-200",
  Culture: "bg-pink-500/10 text-pink-200",
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function hoursUntil(value: string, nowEpochMs: number) {
  const target = new Date(value).getTime();
  const diff = target - nowEpochMs;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
}

export default function EventsPage() {
  const { role, ready: roleReady } = useCampusRole();

  const [events, setEvents] = useState<CampusEvent[]>(() => {
    if (typeof window === "undefined") return BASE_EVENTS;

    try {
      const storedCustom = JSON.parse(
        window.localStorage.getItem(CUSTOM_EVENTS_KEY) || "[]"
      ) as CampusEvent[];

      if (Array.isArray(storedCustom) && storedCustom.length > 0) {
        return [...BASE_EVENTS, ...storedCustom];
      }
    } catch {
      // Ignore local storage parse issues.
    }

    return BASE_EVENTS;
  });

  const [rsvpIds, setRsvpIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = JSON.parse(window.localStorage.getItem(RSVP_KEY) || "[]") as string[];
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventType | "All">("All");

  const [newTitle, setNewTitle] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newType, setNewType] = useState<EventType>("Community");
  const [newStart, setNewStart] = useState("2026-04-29T17:00");
  const [newCapacity, setNewCapacity] = useState(120);
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(RSVP_KEY, JSON.stringify(rsvpIds));
  }, [rsvpIds]);

  const visibleEvents = useMemo(() => {
    const lower = query.trim().toLowerCase();

    return events
      .filter((event) => {
        const matchesType = typeFilter === "All" ? true : event.type === typeFilter;
        const matchesQuery =
          lower.length === 0
            ? true
            : event.title.toLowerCase().includes(lower) ||
              event.description.toLowerCase().includes(lower) ||
              event.venue.toLowerCase().includes(lower);

        return matchesType && matchesQuery;
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [events, query, typeFilter]);

  const stats = useMemo(() => {
    const upcoming = events.filter((event) => new Date(event.startAt).getTime() > REFERENCE_NOW).length;
    const utilization =
      events.length === 0
        ? 0
        : Math.round(
            (events.reduce((sum, event) => sum + event.registered, 0) /
              events.reduce((sum, event) => sum + event.capacity, 0)) *
              100
          );

    return {
      upcoming,
      myRsvps: rsvpIds.length,
      utilization,
    };
  }, [events, rsvpIds]);

  const nextEvent = useMemo(() => {
    return [...events]
      .filter((event) => new Date(event.startAt).getTime() > REFERENCE_NOW)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [events]);

  const toggleRsvp = (eventId: string) => {
    const targetEvent = events.find((event) => event.id === eventId);
    if (!targetEvent) return;

    const isRegistered = rsvpIds.includes(eventId);
    const isFull = targetEvent.registered >= targetEvent.capacity;

    if (!isRegistered && isFull) {
      return;
    }

    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;

        if (isRegistered) {
          return { ...event, registered: Math.max(0, event.registered - 1) };
        }

        return { ...event, registered: event.registered + 1 };
      })
    );

    setRsvpIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const publishEvent = (event: React.FormEvent) => {
    event.preventDefault();

    const title = newTitle.trim();
    const venue = newVenue.trim();
    const description = newDescription.trim();

    if (!title || !venue || !description) return;

    const created: CampusEvent = {
      id: `evt-custom-${Date.now()}`,
      title,
      venue,
      description,
      type: newType,
      startAt: newStart,
      capacity: newCapacity,
      registered: 0,
    };

    setEvents((prev) => {
      const next = [...prev, created];
      if (typeof window !== "undefined") {
        const customOnly = next.filter((item) => !BASE_EVENTS.some((base) => base.id === item.id));
        window.localStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(customOnly));
      }
      return next;
    });

    setNewTitle("");
    setNewVenue("");
    setNewDescription("");
    setNewType("Community");
    setNewStart("2026-04-29T17:00");
    setNewCapacity(120);
  };

  return (
    <div className="space-y-6 p-5 md:p-8">
      <section className="glass-panel section-reveal rounded-3xl border border-slate-700/70 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title text-2xl font-bold text-white md:text-3xl">Campus Experience Hub</h2>
            <p className="mt-1 text-sm text-slate-400">
              Unified events, programs, registrations, and community engagement workflows.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Role: <span className="font-semibold capitalize">{role ?? "pending"}</span>
          </div>
        </div>
      </section>

      {!roleReady && (
        <div className="glass-panel rounded-2xl border border-slate-700/70 px-4 py-5 text-sm text-slate-300">
          Preparing events workspace...
        </div>
      )}

      {roleReady && !role && (
        <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5 text-sm text-amber-100">
          No role detected. Set {ROLE_STORAGE_KEY} in localStorage to &quot;student&quot; or &quot;admin&quot;.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Upcoming events</p>
          <p className="mt-2 text-3xl font-bold text-cyan-100">{stats.upcoming}</p>
        </article>
        <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">My RSVPs</p>
          <p className="mt-2 text-3xl font-bold text-emerald-100">{stats.myRsvps}</p>
        </article>
        <article className="glass-panel rounded-2xl border border-slate-700/70 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Seat utilization</p>
          <p className="mt-2 text-3xl font-bold text-amber-100">{stats.utilization}%</p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events by title, venue, or purpose"
              className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
            />

            <div className="flex flex-wrap gap-2">
              {(["All", "Academic", "Community", "Sports", "Career", "Culture"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type as EventType | "All")}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    typeFilter === type
                      ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-100"
                      : "border-slate-700 bg-slate-900/70 text-slate-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {visibleEvents.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-xs text-slate-400">
                No events match current search filters.
              </div>
            ) : (
              visibleEvents.map((event) => {
                const isRsvped = rsvpIds.includes(event.id);
                const seatsLeft = Math.max(0, event.capacity - event.registered);

                return (
                  <div key={event.id} className="rounded-xl border border-slate-700/80 bg-slate-900/75 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{event.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <span className={`rounded-full px-2 py-0.5 ${EVENT_COLORS[event.type]}`}>{event.type}</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-cyan-300" />
                            {event.venue}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRsvp(event.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          isRsvped
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
                            : "border-slate-700 bg-slate-900 text-slate-300"
                        }`}
                      >
                        {isRsvped ? "RSVP Confirmed" : seatsLeft > 0 ? "RSVP" : "Waitlist"}
                      </button>
                    </div>

                    <p className="mt-2 text-sm text-slate-300">{event.description}</p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
                        {formatDate(event.startAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-cyan-300" />
                        {event.registered}/{event.capacity} registered
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="space-y-5">
          <section className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
            <h3 className="section-title text-lg font-semibold text-slate-100">Next highlighted event</h3>
            {nextEvent ? (
              <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-900/75 p-3">
                <p className="text-sm font-semibold text-slate-100">{nextEvent.title}</p>
                <p className="mt-1 text-xs text-slate-400">{nextEvent.venue}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/50 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100">
                  <Ticket className="h-3.5 w-3.5" />
                  Starts in ~{hoursUntil(nextEvent.startAt, REFERENCE_NOW)} hours
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-xs text-slate-400">
                No upcoming events yet.
              </div>
            )}
          </section>

          {role === "admin" && (
            <section className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
              <h3 className="section-title text-lg font-semibold text-slate-100">Publish new event</h3>

              <form onSubmit={publishEvent} className="mt-3 space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Event title"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  value={newVenue}
                  onChange={(event) => setNewVenue(event.target.value)}
                  placeholder="Venue"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                  required
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={newType}
                    onChange={(event) => setNewType(event.target.value as EventType)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
                  >
                    {(["Academic", "Community", "Sports", "Career", "Culture"] as EventType[]).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={20}
                    value={newCapacity}
                    onChange={(event) => setNewCapacity(Number(event.target.value) || 20)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
                  />
                </div>

                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(event) => setNewStart(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
                  required
                />

                <textarea
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  rows={3}
                  placeholder="Event overview"
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                  required
                />

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.45)]"
                >
                  <Plus className="h-4 w-4" />
                  Publish event
                </button>
              </form>
            </section>
          )}

          {role === "student" && (
            <section className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-5">
              <h3 className="section-title text-lg font-semibold text-slate-100">My event agenda</h3>
              <div className="mt-3 space-y-2">
                {events.filter((event) => rsvpIds.includes(event.id)).length === 0 ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-xs text-slate-400">
                    RSVP to events to build your personalized agenda.
                  </div>
                ) : (
                  events
                    .filter((event) => rsvpIds.includes(event.id))
                    .map((event) => (
                      <div key={event.id} className="rounded-xl border border-slate-700/80 bg-slate-900/75 p-3">
                        <p className="text-sm font-semibold text-slate-100">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-400 inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-cyan-300" />
                          {formatDate(event.startAt)}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </section>
          )}
        </article>
      </section>
    </div>
  );
}
