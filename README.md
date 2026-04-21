# CampusOS

CampusOS is a multi-purpose smart campus web app built with Next.js, React, TypeScript, Tailwind, Supabase, and Leaflet. The current build ships with an animated glass UI, role-aware workflows, live/fallback data paths, and two new modules: Service Desk and Events.

## What is in the current build

- `/` login and onboarding with display name and campus token persistence.
- `/dashboard` command center with range filters, cross-module KPIs, alerts, and quick links.
- `/attendance` student and admin attendance workflow.
- `/complaints` severity-aware incident workflow.
- `/map` routing and occupancy-aware campus navigation.
- `/services` service request desk with live Supabase writes or local fallback.
- `/events` event discovery, RSVP, and admin publishing.
- Shared shell and sidebar with responsive navigation and route metadata.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4 with custom global design tokens in `app/globals.css`
- Supabase client helpers in `lib/` and `utils/supabase/`
- Leaflet and react-leaflet for the map experience
- lucide-react icons
- Next font imports for `Space Grotesk`, `Plus Jakarta Sans`, and `IBM Plex Mono`

## Data and Persistence

- Role is stored in localStorage under `campusos-role`.
- Student display name is stored in `campusos-student-name`.
- Campus token is stored in `campusos-campus-id`.
- Event RSVPs are stored in `campusos-rsvp-events`.
- Custom events are stored in `campusos-custom-events`.
- Local fallback service queue is stored in `campusos-local-service-requests`.
- The `services` page prefers Supabase `service_requests` and falls back cleanly if the table is unavailable.

## Supabase Schema

See `supabase/schema.sql` for the current table definitions used by the app:

- `attendance`
- `complaints`
- `service_requests`

For the hackathon build, RLS can stay relaxed or use the permissive policies in that file. For production, harden the policies before exposing the app broadly.

## Project Structure

```text
app/
  page.tsx                # Login and onboarding
  dashboard/page.tsx      # Command center
  attendance/page.tsx     # Attendance workflow
  complaints/page.tsx     # Incident resolution
  map/page.tsx            # Campus routing
  services/page.tsx       # Service desk
  events/page.tsx         # Campus events

components/
  AppShell.tsx            # Responsive app shell
  Sidebar.tsx             # Navigation drawer and desktop sidebar
  CampusMap.tsx           # Shared Leaflet map renderer

lib/
  supabase.ts             # Browser Supabase client
  useCampusRole.ts        # Local role store hook

utils/supabase/
  client.ts               # Browser client helper
  server.ts               # Server-side client helper
  middleware.ts           # Middleware helper

supabase/
  schema.sql              # Table definitions and simple policies
```

## Local Setup

```bash
npm install
```

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Flow

1. Open `/` and choose a role.
2. Visit `/dashboard` to show the command center and quick links.
3. Go to `/attendance` as student, simulate a scan, then switch to admin and refresh to show the new row.
4. Open `/complaints`, submit an incident, then resolve it as admin.
5. Open `/services` to show the live backend path or local fallback queue.
6. Open `/events` to RSVP or publish an event.
7. Use `/map` to demonstrate routing and nearby-location signals.

## Validation

- `npm run lint` passes.
- `npm run build` passes.

## Notes

- The app is intentionally resilient: if a backend table is missing, the Service Desk falls back to local storage so the UI still works.
- The Events module also persists user interaction locally so it remains useful without backend wiring.
- The global visual system lives in `app/globals.css`, including the glass panels, mesh overlay, and motion helpers.

## Future Work

- Add real authentication and role claims.
- Replace the simulated attendance flow with a live QR scanner.
- Harden Supabase RLS for production.
- Connect the map to live indoor routing data.
- Add proper database migrations and seed scripts for deployment.
