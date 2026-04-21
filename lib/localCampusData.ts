export type AttendanceLedgerRecord = {
  id: string;
  student_id: string;
  status: string;
  timestamp: string | null;
};

export type ComplaintLedgerRecord = {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string | null;
};

export const LOCAL_ATTENDANCE_KEY = "campusos-local-attendance-ledger";
export const LOCAL_COMPLAINTS_KEY = "campusos-local-complaints-ledger";

let attendanceSeedCache: AttendanceLedgerRecord[] | null = null;
let complaintSeedCache: ComplaintLedgerRecord[] | null = null;

function readRecords<T>(storageKey: string, fallback: () => T[]): T[] {
  if (typeof window === "undefined") {
    return fallback();
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback();

    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback();
  } catch {
    return fallback();
  }
}

function writeRecords<T>(storageKey: string, records: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(records));
}

function createAttendanceSeed() {
  if (attendanceSeedCache) return attendanceSeedCache;

  const now = Date.now();
  attendanceSeedCache = [
    {
      id: "seed-att-1",
      student_id: "Aarav",
      status: "Present",
      timestamp: new Date(now - 35 * 60 * 1000).toISOString(),
    },
    {
      id: "seed-att-2",
      student_id: "Siya",
      status: "Present",
      timestamp: new Date(now - 75 * 60 * 1000).toISOString(),
    },
    {
      id: "seed-att-3",
      student_id: "Ishaan",
      status: "Absent",
      timestamp: new Date(now - 130 * 60 * 1000).toISOString(),
    },
    {
      id: "seed-att-4",
      student_id: "Anaya",
      status: "Present",
      timestamp: new Date(now - 220 * 60 * 1000).toISOString(),
    },
  ];

  return attendanceSeedCache;
}

function createComplaintSeed() {
  if (complaintSeedCache) return complaintSeedCache;

  const now = Date.now();
  complaintSeedCache = [
    {
      id: "seed-com-1",
      category: "Electrical",
      description: "[HIGH] Library floor 2 lights flickering after 7 PM.",
      status: "Open",
      created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "seed-com-2",
      category: "WiFi",
      description: "[MEDIUM] Intermittent packet loss in CS block B.",
      status: "Resolved",
      created_at: new Date(now - 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "seed-com-3",
      category: "Hostel",
      description: "[LOW] Water pressure low in tower C during morning slots.",
      status: "Open",
      created_at: new Date(now - 22 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return complaintSeedCache;
}

export function readAttendanceLedger() {
  return readRecords(LOCAL_ATTENDANCE_KEY, createAttendanceSeed);
}

export function writeAttendanceLedger(records: AttendanceLedgerRecord[]) {
  writeRecords(LOCAL_ATTENDANCE_KEY, records);
}

export function appendAttendanceRecord(record: AttendanceLedgerRecord) {
  const next = [record, ...readAttendanceLedger().filter((item) => item.id !== record.id)];
  writeAttendanceLedger(next);
  return next;
}

export function readComplaintLedger() {
  return readRecords(LOCAL_COMPLAINTS_KEY, createComplaintSeed);
}

export function writeComplaintLedger(records: ComplaintLedgerRecord[]) {
  writeRecords(LOCAL_COMPLAINTS_KEY, records);
}

export function appendComplaintRecord(record: ComplaintLedgerRecord) {
  const next = [record, ...readComplaintLedger().filter((item) => item.id !== record.id)];
  writeComplaintLedger(next);
  return next;
}

export function updateComplaintStatuses(
  ids: Array<string | number>,
  status: string
) {
  const idSet = new Set(ids.map(String));
  const next = readComplaintLedger().map((item) =>
    idSet.has(String(item.id)) ? { ...item, status } : item
  );

  writeComplaintLedger(next);
  return next;
}