<div align="center">

# 🎓 CampusOS

**The unified digital layer for a modern university.**  
*Built for CodeRush 2.0 Hackathon | Track 2: Smart Campus Solution*

</div>

CampusOS is a unified smart campus platform that streamlines **attendance**, **complaints**, **navigation**, and **student services** into one seamless digital experience.

---

## 🛑 The Problem: Campus Life is Disconnected

University ecosystems are often extremely fragmented:

- Manual, paper-based roll calls waste class time and are error‑prone.
- Maintenance, IT, and hostel issues get lost across calls, chats, and forms.
- Admins lack a real‑time picture of campus health, facility load, and student experience.

## 💡 The Solution: One Platform. Total Visibility.

CampusOS acts as a **campus operating system**:

- Single interface for students, faculty, and administrators.
- Role‑based access, powered by a shared Supabase backend.
- Live, actionable dashboard instead of disconnected tools and spreadsheets.

---

## 🧭 High‑Level Overview

CampusOS turns a physical campus into a **single digital dashboard**:

- **Smart Attendance** – QR-style simulated scanner that writes real events into Supabase.
- **Smart Complaints** – ticketing system for students and admins backed by Supabase tables.
- **Command Center Dashboard** – glassmorphism UI showing live metrics, incidents, buses, and dining snapshot.
- **Campus Map** – structured view of key locations with an interactive-ready map shell.

The goal for CodeRush: **ship a fully working, cloud-backed campus OS MVP** that a college can deploy with minimal setup.

---

## ✨ Core Features (MVP)

### 1. 1‑Click Smart Attendance

- **For students:** Frictionless check‑ins using a simulated, hyper‑fast QR interface.
- **For admin/faculty:** Instant rosters and live occupancy views; no manual data entry.

### 2. Real‑Time Issue Ticketing

- **For students:** Mobile‑friendly portal to submit maintenance, IT, and hostel issues.
- **For admin/faculty:** A Kanban‑style complaints board (implemented as cards) to move items from **Open** → **Resolved**.

### 3. Interactive Navigation & Dashboard

- Interactive‑ready campus map plus a command‑center style dashboard showing attendance, complaints, buses, and dining at a glance.

---

## 🏗️ Tech Stack & Architecture

Built for scale, speed, and low‑latency delivery using a modern React + edge stack:

**Frontend / App Framework**

- **Next.js 16 (App Router)** – `/app` directory, statically prerendered routes:
	- `/` – Login / role selection.
	- `/dashboard` – Command Center overview.
	- `/attendance` – Smart Attendance (student + admin views).
	- `/complaints` – Smart Complaints (student + admin views).
	- `/map` – Campus map.
- **React 19 + TypeScript** – typed components, hooks, and custom utilities.
- **Tailwind CSS** – modern dark theme with glassmorphism effects.
- **lucide-react** – crisp, consistent icon system.

**Backend / Data**

- **Supabase** – Postgres + auth + APIs.
	- Tables used:
		- `attendance (id uuid, student_id text, status text, timestamp timestamptz)`
		- `complaints (id uuid, category text, description text, status text, created_at timestamptz)`
	- RLS kept simple for hackathon (unrestricted or basic policies).
- **Supabase JS + SSR helpers**
	- `utils/supabase/client.ts` – browser client via `createBrowserClient`.
	- `utils/supabase/server.ts` – server client via `createServerClient` using cookies.
	- `utils/supabase/middleware.ts` – helper for edge/middleware use (keeps cookies in sync).
	- `lib/supabase.ts` – central place to import the Supabase client from React components.

**State & Role Management**

- **Roles**: `student` and `admin`.
- Stored in `localStorage` under key `campusos-role` when user clicks login.
- **Custom hook**: `lib/useCampusRole.ts`
	- Uses `useSyncExternalStore` to read role in a React-safe way.
	- Listens to `storage` events so role changes in one tab update others.
	- Avoids infinite render loops by **caching the snapshot** internally.

---

## 🌟 Core Features

### 1. Smart Attendance

**Student view**

- Landing section called **“Quantum Scanner”** with a circular CTA button.
- Click **“Simulate QR Scan”**:
	- Inserts a row into Supabase `attendance`:
		- `student_id = "Shivansh Mishra"`
		- `status = "Present"`
		- `timestamp = now()` (handled by database default).
	- Shows success / failure feedback in a glowing status pill.

**Admin view**

- Role detected as `admin` → shows **Attendance ledger** table.
- Reads from Supabase:

	```ts
	const { data } = await supabase
		.from("attendance")
		.select("id, student_id, status, timestamp")
		.order("timestamp", { ascending: false });
	```

- Displays `student_id`, `status` (with colored chips), and formatted time.
- Graceful UX:
	- Loading state while querying.
	- “No attendance events recorded yet.” when table is empty.
	- Friendly error message if Supabase is unreachable.

### 2. Smart Complaints

**Student view**

- Form with:
	- Category select (`Electrical`, `WiFi`, `Hostel`, `Maintenance`).
	- Multi-line description.
- On submit:
	- Inserts into `complaints` table with `status = "Open"`.
	- Shows inline success or error alert cards.

**Admin view**

- Grid of complaint cards powered by Supabase select:
	- Category pill, description, and created_at.
	- Status as `Open` (actionable) or `Resolved` (green badge).
- Admin can **“Mark as resolved”**:
	- Executes `update ... set status = 'Resolved' where id = :id`.
	- Optimistically updates UI without reloading the page.

### 3. Command Center Dashboard

- Hero header: **“CampusOS Command Center – Live overview”**.
- Metric cards:
	- Active students on campus.
	- Today’s attendance rate.
	- Open complaints.
- Glass cards for:
	- **Campus heatmap** – zones (library, labs, hostels, sports) with occupancy bars.
	- **Live incidents** – synthetic alerts for attendance failures, complaint surges, map sync.
	- **Campus buses** – routes with ETA + occupancy + status chips.
	- **Dining snapshot** – popular menu items with calories and rating.

> These sections use **simulated data** for the hackathon, but are wired in a
> way that can be easily swapped to real Supabase or IoT feeds later.

### 4. Campus Map

- Split layout:
	- Left: “Interactive Map” placeholder (ready for Mapbox/Leaflet/custom SVG).
	- Right: Scrollable list of locations (Library, CS Block, Cafeteria, etc.)
		with type tags and floors.

---

## 🔍 Project Structure (Simplified)

```text
app/
	page.tsx              # Login (role selection)
	attendance/page.tsx   # Smart Attendance (student + admin views)
	complaints/page.tsx   # Smart Complaints
	dashboard/page.tsx    # Command Center UI
	map/page.tsx          # Campus map shell

components/
	AppShell.tsx          # Layout wrapper with sidebar
	Sidebar.tsx           # Left navigation for main routes

lib/
	supabase.ts           # Central browser Supabase client
	useCampusRole.ts      # Role store built on useSyncExternalStore

utils/supabase/
	client.ts             # createBrowserClient helper
	server.ts             # createServerClient helper (SSR)
	middleware.ts         # Supabase client for middleware/edge
```

---

## 🧪 Approach & Design Decisions

### 1. Hackathon‑Friendly Architecture

- **Static first**: All pages are statically prerendered (`next build` → all
	routes are SSG) so deployment to Vercel is trivial.
- **Client‑side data fetching** where needed (Attendance, Complaints) to keep
	Supabase usage simple and visible.
- **SSR hooks ready**: We still created SSR helpers so the project can grow
	into authenticated dashboards later without refactoring from scratch.

### 2. Clear Separation of Concerns

- **Presentation**: AppShell, Sidebar, Dashboard components.
- **Domain logic**: Attendance & Complaints pages encapsulate their own
	Supabase calls and UI states.
- **Infrastructure**: Dedicated Supabase helper files so swapping keys or
	environments is low‑risk.

### 3. DX & Reliability

- **ESLint + TypeScript clean**: `npm run lint` and `npm run build` both pass.
- Custom hook `useCampusRole` avoids anti‑patterns like calling
	`setState` directly inside effects that read from `localStorage`.
- Graceful error handling everywhere — users see friendly messages instead of
	raw stack traces.

---

## 🚀 Running Locally

### 1. Clone and install

```bash
git clone https://github.com/Shivanshmishra7275/Smart-Campus-OS.git
cd Smart-Campus-OS
npm install
```

### 2. Environment variables

Create a `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

These are the **public** keys from your Supabase project settings.

### 3. Supabase tables

In Supabase SQL editor, ensure you have tables like:

```sql
create table if not exists public.attendance (
	id uuid primary key default gen_random_uuid(),
	student_id text not null,
	status text not null,
	timestamp timestamptz not null default now()
);

create table if not exists public.complaints (
	id uuid primary key default gen_random_uuid(),
	category text not null,
	description text not null,
	status text not null default 'Open',
	created_at timestamptz not null default now()
);
```

For the hackathon we can keep RLS relaxed (or add simple anon policies).

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## 🚀 Demo Flow (for Judges)

1. **Login**
	 - Open `/`.
	 - Click **“Login as Student”** → routes to `/dashboard` and sets role.
2. **Dashboard tour**
	 - Show metrics, campus map snapshot, buses, and dining.
3. **Smart Attendance**
	 - Go to `/attendance` as **Student**.
	 - Hit **“Simulate QR Scan”** → explain Supabase write.
	 - Switch to **Admin** and refresh `/attendance` to show new row.
4. **Smart Complaints**
	 - As Student, go to `/complaints`, submit an issue.
	 - As Admin, open `/complaints` and mark it resolved.
5. **Map**
	 - Show `/map` as the future hook for indoor navigation.

This sequence demonstrates **full‑stack behavior**: UI → Supabase write → admin
views → resolution.

---

## 📦 Deployment

- Push to GitHub (already configured).
- On **Vercel**:
	- Import the repository.
	- Add the same `NEXT_PUBLIC_SUPABASE_*` env vars.
	- Deploy — Next.js app is static‑first so it just works.

---
## 🔮 Future Work

- Integrate a real QR scanner using the device camera.
- Add role-based authentication using Supabase Auth/SSO.
- Replace the map shell with live indoor maps (Mapbox/Leaflet/custom SVG).
- Ingest IoT and sensor data for real-time occupancy and energy insights.
- Build richer analytics dashboards for admins with trends and heatmaps.

---

## 👥 Team & Credits

- Built for **CodeRush Hackathon** as an end‑to‑end demonstration of how a
	campus can centralize attendance, complaints, and navigation in a single
	modern web app.

If you want help extending CampusOS (auth, real QR scanning, IoT feeds,
analytics dashboards), this codebase is intentionally structured so new
features can be added without major refactors.

