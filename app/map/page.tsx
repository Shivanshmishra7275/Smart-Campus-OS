"use client";

import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Navigation, Search, Wifi, Activity, Locate } from "lucide-react";
import type { CampusLocationWithCoords, UserLocation } from "@/components/CampusMap";

type LocationType = "Academic" | "Dining" | "Health" | "Sports" | "Admin";

type Location = {
  id: number;
  name: string;
  type: LocationType;
  floor: string;
  occupancy: number; // 0-100
  status: "Calm" | "Busy" | "Peak";
  lat: number;
  lng: number;
};

const locations: Location[] = [
  {
    id: 1,
    name: "Main Library",
    type: "Academic",
    floor: "Ground Floor",
    occupancy: 78,
    status: "Busy",
    lat: 12.9718,
    lng: 77.5933,
  },
  {
    id: 2,
    name: "Computer Science Block",
    type: "Academic",
    floor: "Floor 1–3",
    occupancy: 64,
    status: "Busy",
    lat: 12.9721,
    lng: 77.594,
  },
  {
    id: 3,
    name: "Cafeteria",
    type: "Dining",
    floor: "Ground Floor",
    occupancy: 91,
    status: "Peak",
    lat: 12.9715,
    lng: 77.5925,
  },
  {
    id: 4,
    name: "Medical Centre",
    type: "Health",
    floor: "Ground Floor",
    occupancy: 34,
    status: "Calm",
    lat: 12.9724,
    lng: 77.5928,
  },
  {
    id: 5,
    name: "Gymnasium",
    type: "Sports",
    floor: "Ground Floor",
    occupancy: 57,
    status: "Busy",
    lat: 12.972,
    lng: 77.5938,
  },
  {
    id: 6,
    name: "Administrative Office",
    type: "Admin",
    floor: "Floor 2",
    occupancy: 42,
    status: "Calm",
    lat: 12.9719,
    lng: 77.5945,
  },
];

const categoryColors: Record<LocationType, string> = {
  Academic: "bg-cyan-500/10 text-cyan-400",
  Dining: "bg-amber-500/10 text-amber-400",
  Health: "bg-rose-500/10 text-rose-400",
  Sports: "bg-emerald-500/10 text-emerald-400",
  Admin: "bg-violet-500/10 text-violet-400",
};

const statusColors: Record<Location["status"], string> = {
  Calm: "bg-emerald-500/10 text-emerald-300",
  Busy: "bg-amber-500/10 text-amber-300",
  Peak: "bg-rose-500/10 text-rose-300",
};

const filters: ({ label: string; value: "all" } | { label: string; value: LocationType })[] = [
  { label: "All", value: "all" },
  { label: "Academic", value: "Academic" },
  { label: "Dining", value: "Dining" },
  { label: "Health", value: "Health" },
  { label: "Sports", value: "Sports" },
  { label: "Admin", value: "Admin" },
];

const DynamicCampusMap = dynamic(() => import("@/components/CampusMap"), {
  ssr: false,
});

function toCampusLocationWithCoords(location: Location): CampusLocationWithCoords {
  return {
    id: location.id,
    name: location.name,
    lat: location.lat,
    lng: location.lng,
  };
}

function haversineDistanceMeters(a: UserLocation, b: { lat: number; lng: number }): number {
  const R = 6371000; // metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const c =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  return R * d;
}

export default function MapPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [selectedId, setSelectedId] = useState<number>(1);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleLocateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Location services are not supported in this browser.");
      return;
    }

    setLocationError(null);
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please allow access and try again.");
        } else {
          setLocationError("Unable to fetch your location right now.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  const filteredLocations = useMemo(() => {
    const lower = query.toLowerCase();
    const base = locations.filter((loc) => {
      const matchesFilter =
        activeFilter === "all" ? true : loc.type === activeFilter;
      const matchesQuery =
        !lower ||
        loc.name.toLowerCase().includes(lower) ||
        loc.type.toLowerCase().includes(lower);
      return matchesFilter && matchesQuery;
    });
    if (!userLocation) return base;

    return [...base].sort((a, b) => {
      const da = haversineDistanceMeters(userLocation, a);
      const db = haversineDistanceMeters(userLocation, b);
      return da - db;
    });
  }, [query, activeFilter, userLocation]);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedId) ?? locations[0],
    [selectedId]
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Campus Navigation
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Live-like overview of key campus zones, ready to plug into real maps.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md w-full">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search buildings, labs, cafés…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === filter.value
                  ? "border-cyan-500/80 bg-cyan-500/10 text-cyan-200"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-700/60 bg-slate-900 overflow-hidden flex flex-col relative">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-cyan-400" />
              <span className="text-sm font-semibold text-slate-200">
                Interactive Map Shell
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span>Live location enabled</span>
              </div>
              <button
                type="button"
                onClick={handleLocateMe}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-cyan-500 hover:text-cyan-200"
              >
                <Locate className="h-3.5 w-3.5" />
                <span>{locating ? "Locating…" : "Locate me"}</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 bg-slate-950">
            <DynamicCampusMap
              selectedLocation={toCampusLocationWithCoords(selectedLocation)}
              allLocations={locations.map(toCampusLocationWithCoords)}
              userLocation={userLocation}
              onLocateMe={handleLocateMe}
              locating={locating}
            />

            {/* Status strip */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 text-[11px] text-slate-300 pointer-events-none">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/80 border border-slate-700/80 px-4 py-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="font-medium">Live crowd estimate</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold ${
                    statusColors[selectedLocation.status]
                  }`}
                >
                  {selectedLocation.status}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-950/60 border border-slate-800/80 px-4 py-2">
                <span className="text-slate-400">Occupancy</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all"
                    style={{ width: `${selectedLocation.occupancy}%` }}
                  />
                </div>
                <span className="tabular-nums text-slate-200">
                  {selectedLocation.occupancy}%
                </span>
              </div>
              {userLocation && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/80 border border-slate-800/80 px-4 py-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Your position is active</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                  </span>
                </div>
              )}
              {locationError && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/40 px-4 py-2 text-[11px] text-rose-200">
                  {locationError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Locations List */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Locations</h3>
            <span className="text-[11px] text-slate-500">
              Tap to focus on a zone
            </span>
          </div>
          <div className="flex-1 divide-y divide-slate-700/40 overflow-y-auto">
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedId(loc.id)}
                className={`w-full text-left px-5 py-3.5 transition-colors flex items-center justify-between gap-3 ${
                  loc.id === selectedId
                    ? "bg-slate-800/80"
                    : "hover:bg-slate-800/60"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-slate-100">
                    {loc.name}
                  </p>
                  <p className="text-xs text-slate-500">{loc.floor}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        categoryColors[loc.type]
                      }`}
                    >
                      {loc.type}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        statusColors[loc.status]
                      }`}
                    >
                      {loc.status}
                    </span>
                  </div>
                  {userLocation && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="inline-block h-1 w-1 rounded-full bg-emerald-400" />
                      <span>
                        {(() => {
                          const meters = haversineDistanceMeters(userLocation, loc);
                          if (meters < 50) return "You are here";
                          if (meters < 1000) return `${Math.round(meters)} m from you`;
                          return `${(meters / 1000).toFixed(2)} km from you`;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-slate-300 tabular-nums">
                    {loc.occupancy}% full
                  </span>
                  <div className="h-1 w-16 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                      style={{ width: `${loc.occupancy}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}

            {filteredLocations.length === 0 && (
              <div className="px-5 py-6 text-xs text-slate-500">
                No locations match your search yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
