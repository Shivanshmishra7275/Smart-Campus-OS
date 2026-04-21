"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Compass,
  Locate,
  Navigation,
  Route,
  Search,
  Timer,
  TrafficCone,
  Wifi,
} from "lucide-react";
import type { CampusLocationWithCoords, UserLocation } from "@/components/CampusMap";

type LocationType = "Academic" | "Dining" | "Health" | "Sports" | "Admin" | "Residence";

type Location = {
  id: number;
  name: string;
  type: LocationType;
  floor: string;
  occupancy: number;
  status: "Calm" | "Busy" | "Peak";
  lat: number;
  lng: number;
};

type TravelMode = "walk" | "shuttle";

const LOCATIONS: Location[] = [
  {
    id: 1,
    name: "Main Library",
    type: "Academic",
    floor: "Ground + 2",
    occupancy: 72,
    status: "Busy",
    lat: 12.9718,
    lng: 77.5933,
  },
  {
    id: 2,
    name: "Computer Science Block",
    type: "Academic",
    floor: "Floor 1-3",
    occupancy: 64,
    status: "Busy",
    lat: 12.9721,
    lng: 77.594,
  },
  {
    id: 3,
    name: "Central Cafeteria",
    type: "Dining",
    floor: "Ground",
    occupancy: 89,
    status: "Peak",
    lat: 12.9715,
    lng: 77.5925,
  },
  {
    id: 4,
    name: "Medical Center",
    type: "Health",
    floor: "Ground",
    occupancy: 28,
    status: "Calm",
    lat: 12.9724,
    lng: 77.5928,
  },
  {
    id: 5,
    name: "Innovation Arena",
    type: "Sports",
    floor: "Ground",
    occupancy: 52,
    status: "Busy",
    lat: 12.972,
    lng: 77.5938,
  },
  {
    id: 6,
    name: "Administrative Tower",
    type: "Admin",
    floor: "Floor 2-6",
    occupancy: 41,
    status: "Calm",
    lat: 12.9719,
    lng: 77.5945,
  },
  {
    id: 7,
    name: "Hostel Cluster A",
    type: "Residence",
    floor: "Block A-C",
    occupancy: 61,
    status: "Busy",
    lat: 12.9712,
    lng: 77.5939,
  },
];

const TYPE_FILTERS: ({ label: string; value: "all" } | { label: string; value: LocationType })[] = [
  { label: "All", value: "all" },
  { label: "Academic", value: "Academic" },
  { label: "Dining", value: "Dining" },
  { label: "Health", value: "Health" },
  { label: "Sports", value: "Sports" },
  { label: "Admin", value: "Admin" },
  { label: "Residence", value: "Residence" },
];

const CATEGORY_COLORS: Record<LocationType, string> = {
  Academic: "bg-cyan-500/10 text-cyan-200",
  Dining: "bg-amber-500/10 text-amber-200",
  Health: "bg-rose-500/10 text-rose-200",
  Sports: "bg-emerald-500/10 text-emerald-200",
  Admin: "bg-violet-500/10 text-violet-200",
  Residence: "bg-indigo-500/10 text-indigo-200",
};

const STATUS_COLORS: Record<Location["status"], string> = {
  Calm: "bg-emerald-500/10 text-emerald-100",
  Busy: "bg-amber-500/10 text-amber-100",
  Peak: "bg-rose-500/10 text-rose-100",
};

const DynamicCampusMap = dynamic(() => import("@/components/CampusMap"), {
  ssr: false,
});

function toPoint(location: Location): CampusLocationWithCoords {
  return {
    id: location.id,
    name: location.name,
    lat: location.lat,
    lng: location.lng,
  };
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const inner =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * R * Math.atan2(Math.sqrt(inner), Math.sqrt(1 - inner));
}

function createRoutePath(start: CampusLocationWithCoords, end: CampusLocationWithCoords) {
  const bendLat = (start.lat + end.lat) / 2 + 0.0002;
  const bendLng = (start.lng + end.lng) / 2 - 0.0001;

  return [
    start,
    {
      id: 9991,
      name: "midpoint",
      lat: bendLat,
      lng: bendLng,
    },
    end,
  ];
}

export default function MapPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof TYPE_FILTERS)[number]["value"]>("all");
  const [selectedId, setSelectedId] = useState<number>(1);
  const [sourceId, setSourceId] = useState<number>(1);
  const [destinationId, setDestinationId] = useState<number>(3);
  const [travelMode, setTravelMode] = useState<TravelMode>("walk");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const selectedLocation = useMemo(
    () => LOCATIONS.find((loc) => loc.id === selectedId) ?? LOCATIONS[0],
    [selectedId]
  );

  const sourceLocation = useMemo(
    () => LOCATIONS.find((loc) => loc.id === sourceId) ?? LOCATIONS[0],
    [sourceId]
  );

  const destinationLocation = useMemo(
    () => LOCATIONS.find((loc) => loc.id === destinationId) ?? LOCATIONS[2],
    [destinationId]
  );

  const filteredLocations = useMemo(() => {
    const lower = query.trim().toLowerCase();

    const base = LOCATIONS.filter((loc) => {
      const matchesFilter = activeFilter === "all" ? true : loc.type === activeFilter;
      const matchesQuery =
        lower.length === 0
          ? true
          : loc.name.toLowerCase().includes(lower) || loc.type.toLowerCase().includes(lower);

      return matchesFilter && matchesQuery;
    });

    if (!userLocation) return base;

    return [...base].sort((a, b) => {
      const da = haversineMeters(userLocation, a);
      const db = haversineMeters(userLocation, b);
      return da - db;
    });
  }, [activeFilter, query, userLocation]);

  const routePath = useMemo(() => createRoutePath(toPoint(sourceLocation), toPoint(destinationLocation)), [
    sourceLocation,
    destinationLocation,
  ]);

  const routeStats = useMemo(() => {
    const distance = haversineMeters(sourceLocation, destinationLocation);
    const speed = travelMode === "walk" ? 1.35 : 4.8;
    const etaMinutes = Math.max(1, Math.round(distance / speed / 60));

    return {
      distance,
      etaMinutes,
    };
  }, [sourceLocation, destinationLocation, travelMode]);

  const nearestLocation = useMemo(() => {
    if (!userLocation) return null;

    return LOCATIONS
      .map((loc) => ({
        ...loc,
        meters: haversineMeters(userLocation, loc),
      }))
      .sort((a, b) => a.meters - b.meters)[0];
  }, [userLocation]);

  const handleLocateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Location services are not supported in this browser.");
      return;
    }

    setLocationError(null);
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please enable it and retry.");
        } else {
          setLocationError("Unable to fetch your location right now.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 20000,
      }
    );
  }, []);

  return (
    <div className="space-y-6 p-5 md:p-8">
      <section className="glass-panel section-reveal rounded-3xl border border-slate-700/70 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title text-2xl font-bold text-white md:text-3xl">Spatial Intelligence Console</h2>
            <p className="mt-1 text-sm text-slate-400">
              Destination routing, occupancy visibility, and mobility decision support.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <Wifi className="h-4 w-4 text-emerald-300" />
            Map services online
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search buildings, labs, services"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleLocateMe}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400/60"
            >
              <Locate className="h-4 w-4 text-cyan-300" />
              {locating ? "Locating..." : "Use my location"}
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === filter.value
                    ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-100"
                    : "border-slate-700 bg-slate-900/70 text-slate-400"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative h-[460px] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950">
            <DynamicCampusMap
              selectedLocation={toPoint(selectedLocation)}
              allLocations={LOCATIONS.map(toPoint)}
              userLocation={userLocation}
              onLocateMe={handleLocateMe}
              locating={locating}
              routePath={routePath}
            />

            <div className="pointer-events-none absolute bottom-4 left-4 right-4 space-y-2 text-xs">
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 py-2 text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5 text-cyan-300" />
                    Route preview active
                  </span>
                  <span className="status-chip text-cyan-100">{travelMode === "walk" ? "Walking" : "Shuttle"}</span>
                </div>
              </div>

              {locationError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-100">
                  {locationError}
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
          <h3 className="section-title text-lg font-semibold text-slate-100">Route Planner</h3>

          <div className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">From</label>
              <select
                value={sourceId}
                onChange={(event) => setSourceId(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">To</label>
              <select
                value={destinationId}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setDestinationId(next);
                  setSelectedId(next);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500/70 focus:outline-none"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(["walk", "shuttle"] as TravelMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTravelMode(mode)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    travelMode === mode
                      ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-100"
                      : "border-slate-700 bg-slate-900/70 text-slate-400"
                  }`}
                >
                  {mode === "walk" ? "Walk" : "Shuttle"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3 text-sm text-slate-200">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Navigation className="h-3.5 w-3.5 text-cyan-300" />
                Estimated distance
              </span>
              <span className="font-semibold">{(routeStats.distance / 1000).toFixed(2)} km</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Timer className="h-3.5 w-3.5 text-emerald-300" />
                Estimated time
              </span>
              <span className="font-semibold">{routeStats.etaMinutes} min</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nearby to you</p>
            {nearestLocation ? (
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                {nearestLocation.name} is {Math.round(nearestLocation.meters)}m away.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
                Enable location to compute nearest building.
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Selected destination</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{selectedLocation.name}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 ${CATEGORY_COLORS[selectedLocation.type]}`}>
                {selectedLocation.type}
              </span>
              <span className={`rounded-full px-2 py-0.5 ${STATUS_COLORS[selectedLocation.status]}`}>
                {selectedLocation.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{selectedLocation.floor}</p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
          <h3 className="section-title text-lg font-semibold text-slate-100">Campus Locations</h3>
          <div className="custom-scroll mt-3 max-h-[340px] space-y-2 overflow-auto pr-1">
            {filteredLocations.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3 text-xs text-slate-400">
                No locations match your search.
              </div>
            ) : (
              filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedId(loc.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    selectedId === loc.id
                      ? "border-cyan-500/60 bg-cyan-500/10"
                      : "border-slate-700/80 bg-slate-900/70 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-100">{loc.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_COLORS[loc.status]}`}>
                      {loc.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span>{loc.floor}</span>
                    <span>{loc.occupancy}% occupancy</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="glass-panel section-reveal rounded-2xl border border-slate-700/70 p-4">
          <h3 className="section-title text-lg font-semibold text-slate-100">Mobility Signals</h3>
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
              <p className="inline-flex items-center gap-2 text-cyan-100">
                <Activity className="h-3.5 w-3.5" />
                Academic corridor occupancy trending +7%.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
              <p className="inline-flex items-center gap-2 text-amber-100">
                <TrafficCone className="h-3.5 w-3.5" />
                Dining zone congestion expected during 12:30-13:45.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2">
              <p className="inline-flex items-center gap-2 text-emerald-100">
                <Compass className="h-3.5 w-3.5" />
                Route optimizer recommends west walkway detour.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
