import { Users, BookOpen, AlertCircle } from "lucide-react";

const metrics = [
  {
    label: "Total Students",
    value: "2,847",
    change: "+12%",
    positive: true,
    icon: Users,
    description: "Enrolled this semester",
  },
  {
    label: "Attendance Rate",
    value: "87.4%",
    change: "+3.2%",
    positive: true,
    icon: BookOpen,
    description: "Campus-wide average",
  },
  {
    label: "Open Complaints",
    value: "14",
    change: "-5",
    positive: true,
    icon: AlertCircle,
    description: "Pending resolution",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Dashboard
        </h2>
        <p className="text-slate-400 mt-1 text-sm">
          Overview of campus activity for today.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {metrics.map(({ label, value, change, positive, icon: Icon, description }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-700/60 bg-slate-900 p-6 flex flex-col gap-4 hover:border-cyan-500/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">{label}</span>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/10">
                <Icon size={18} className="text-cyan-400" />
              </div>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            </div>

            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                positive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              }`}
            >
              {change} from last month
            </span>
          </div>
        ))}
      </div>

      {/* Placeholder chart area */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Weekly Attendance Trend
        </h3>
        <div className="h-48 flex items-center justify-center text-slate-600 text-sm border border-dashed border-slate-700 rounded-xl">
          Chart coming soon — connect your Supabase API
        </div>
      </div>
    </div>
  );
}
