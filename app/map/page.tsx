import { MapPin, Navigation, Search } from "lucide-react";

const locations = [
  { id: 1, name: "Main Library", type: "Academic", floor: "Ground Floor" },
  { id: 2, name: "Computer Science Block", type: "Academic", floor: "Floor 1–3" },
  { id: 3, name: "Cafeteria", type: "Dining", floor: "Ground Floor" },
  { id: 4, name: "Medical Centre", type: "Health", floor: "Ground Floor" },
  { id: 5, name: "Gymnasium", type: "Sports", floor: "Ground Floor" },
  { id: 6, name: "Administrative Office", type: "Admin", floor: "Floor 2" },
];

const categoryColors: Record<string, string> = {
  Academic: "bg-cyan-500/10 text-cyan-400",
  Dining: "bg-amber-500/10 text-amber-400",
  Health: "bg-rose-500/10 text-rose-400",
  Sports: "bg-emerald-500/10 text-emerald-400",
  Admin: "bg-violet-500/10 text-violet-400",
};

export default function MapPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Campus Map
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Explore and navigate campus buildings and facilities.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search locations…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Canvas Placeholder */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-700/60 bg-slate-900 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/60">
            <Navigation size={16} className="text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">
              Interactive Map
            </span>
          </div>
          <div className="flex-1 min-h-72 flex flex-col items-center justify-center gap-3 text-slate-600 border-dashed border-slate-700 m-4 rounded-xl border">
            <MapPin size={40} />
            <p className="text-sm">Indoor map will render here</p>
            <p className="text-xs text-slate-700">
              Integrate Mapbox / Leaflet / custom SVG floor plan
            </p>
          </div>
        </div>

        {/* Locations List */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-700/60">
            <h3 className="text-sm font-semibold text-slate-200">Locations</h3>
          </div>
          <div className="flex-1 divide-y divide-slate-700/40 overflow-y-auto">
            {locations.map((loc) => (
              <button
                key={loc.id}
                className="w-full text-left px-5 py-3.5 hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {loc.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{loc.floor}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    categoryColors[loc.type] ?? "bg-slate-700 text-slate-300"
                  }`}
                >
                  {loc.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
