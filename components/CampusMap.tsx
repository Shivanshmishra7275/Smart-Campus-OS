"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

export type CampusLocationWithCoords = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

export type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

type CampusMapProps = {
  selectedLocation: CampusLocationWithCoords;
  allLocations?: CampusLocationWithCoords[];
  userLocation: UserLocation | null;
  onLocateMe: () => void;
  locating: boolean;
};

function RecenterOnChange({ center }: { center: LatLngExpression }) {
  const map = useMap();
  map.setView(center);
  return null;
}

export default function CampusMap({
  selectedLocation,
  allLocations,
  userLocation,
  onLocateMe,
  locating,
}: CampusMapProps) {
  const center: LatLngExpression = useMemo(() => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    return [selectedLocation.lat, selectedLocation.lng];
  }, [userLocation, selectedLocation.lat, selectedLocation.lng]);

  const selectedPosition: LatLngExpression = [
    selectedLocation.lat,
    selectedLocation.lng,
  ];

  const userPosition: LatLngExpression | null = userLocation
    ? [userLocation.lat, userLocation.lng]
    : null;

  return (
    <div className="relative flex-1 min-h-72 m-4 rounded-2xl border border-slate-700 overflow-hidden">
      <MapContainer
        center={center}
        zoom={17}
        scrollWheelZoom
        className="w-full h-full min-h-72 bg-slate-950"
      >
        <RecenterOnChange center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* All campus locations, with the selected one highlighted */}
        {allLocations?.map((loc) => {
          const position: LatLngExpression = [loc.lat, loc.lng];
          return (
            <Marker key={loc.id} position={position}>
              <Popup>{loc.name}</Popup>
            </Marker>
          );
        }) ?? (
          <Marker position={selectedPosition}>
            <Popup>{selectedLocation.name}</Popup>
          </Marker>
        )}

        {/* User location, if available */}
        {userPosition && (
          <>
            <Marker position={userPosition}>
              <Popup>You are here</Popup>
            </Marker>
            <Circle
              center={userPosition}
              radius={userLocation?.accuracy ?? 30}
              pathOptions={{ color: "#22d3ee", fillColor: "#22d3ee", fillOpacity: 0.15 }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating locate button */}
      <button
        type="button"
        onClick={onLocateMe}
        disabled={locating}
        className="absolute right-4 top-4 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-slate-950/90 border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-100 shadow-lg hover:border-cyan-500 hover:text-cyan-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {locating ? "Locating…" : "Use my location"}
      </button>
    </div>
  );
}
