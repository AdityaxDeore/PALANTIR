# PALANTIR — UI & Flight-Path Framework Reference
> Use this document to replicate the Palantir flight-tracker UI, design system,
> and the deck.gl + MapLibre plane-path / trail framework on any other map project.

---

## 1. Tech Stack

| Layer | Library / Version |
|---|---|
| Framework | Next.js 14+ (App Router, `"use client"`) |
| Map engine | MapLibre GL JS + `@deck.gl/mapbox` overlay |
| 3D rendering | deck.gl — `ScenegraphLayer`, `IconLayer`, `PathLayer` |
| Animation | `motion/react` (Framer Motion v11+) |
| Fonts | Inter (Google Fonts, `next/font/google`) |
| Styling | Tailwind CSS v4 (utility-first) |
| Icons | `lucide-react` |
| Toasts | `sonner` |

---

## 2. Design System

### 2.1 Color Philosophy
- **Background**: `bg-black` — the whole app sits on a near-black canvas.
- **Glass panels**: `bg-black/60 backdrop-blur-2xl border border-white/8`  
  — semi-transparent frosted glass, white outline at 8 % opacity.
- **Text hierarchy** (on dark glass):
  - Primary: `text-white`
  - Secondary: `text-white/50` or `text-white/40`
  - Tertiary / labels: `text-white/30` or `text-white/25`
  - Micro-labels / uppercase caps: `text-white/35`
- **Dynamic CSS variables** for theme-aware panels (works for both dark & light map styles):

```css
/* Set on the wrapper div via data-map-theme="dark"|"light" */
/* Dark map */
--ui-bg: 0 0 0;        /* rgb(0,0,0)   */
--ui-fg: 255 255 255;  /* rgb(255,255,255) */

/* Light map */
--ui-bg: 255 255 255;
--ui-fg: 0 0 0;

/* Usage in inline style */
backgroundColor: "rgb(var(--ui-bg) / 0.5)"
borderColor:    "rgb(var(--ui-fg) / 0.06)"
color:          "rgb(var(--ui-fg) / 0.55)"
```

### 2.2 Typography
```tsx
// layout.tsx — Google Inter loaded via next/font
import { Inter } from "next/font/google";
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
// Applied: className={`${inter.variable} font-sans antialiased`}
```

Key text size classes used throughout:
| Role | Class |
|---|---|
| Flight callsign title | `text-base font-bold` |
| ICAO hex / meta | `text-[11px] font-medium tracking-widest uppercase` |
| Metric value | `text-sm font-semibold tabular-nums` |
| Metric label | `text-[10px] font-medium tracking-widest uppercase` |
| Status chips / buttons | `text-[11px] font-medium tracking-wide` |
| Tiny annotations | `text-[10px]` or `text-[9px]` |

### 2.3 Spacing & Radius
- Panel border-radius: `rounded-2xl` (16 px)
- Inner card elements: `rounded-xl` (12 px)
- Logo box: `rounded-2xl` outer, `rounded-xl` inner
- Consistent padding: `p-4` or `px-3.5 py-2`
- Gap between HUD items: `gap-1.5` or `gap-2`

### 2.4 Motion Presets
All animated elements use `motion/react` (`AnimatePresence` + `motion.div`):

```tsx
// Panel slide-in from left (FlightCard)
initial={{ opacity: 0, x: -16, scale: 0.96 }}
animate={{ opacity: 1, x: 0, scale: 1 }}
exit={{ opacity: 0, x: -16, scale: 0.96 }}
transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.8 }}

// Status bar fade-up (StatusBar)
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.4 }}

// Rate-limit badge pop-in
initial={{ opacity: 0, y: 8, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 8, scale: 0.95 }}
transition={{ type: "spring", stiffness: 400, damping: 28 }}
```

### 2.5 Altitude → Color Mapping
Aircraft and trail colours map altitude to a blue→cyan→green→yellow→amber spectrum. Low altitude glow cyan, cruising altitude shifts to gold/amber.

```ts
// Implement altitudeToColor(baroAltitude: number | null): [R, G, B, A]
// Altitude in feet:
//   0–5 000 ft  → cyan   [0, 200, 240, 200]
//   5–15 000 ft → teal   [0, 210, 180, 200]
//   15–25 000ft → green  [80, 200, 120, 200]
//   25–35 000ft → yellow [220, 190, 60, 200]
//   35 000 ft+  → amber  [240, 160, 30, 200]
// null or on-ground → default [180, 220, 255, 200]
```

---

## 3. UI Layout — Absolute-Positioned HUD

The entire UI is a **full-viewport map** with HUD elements positioned absolutely on top.

```
┌────────────────────────────────────────────────┐
│ [BRAND logo]      top-left           [CTRL]    │
│ [FlightCard]      mid-left                      │
│                                                 │
│              MAP  (z-0)                         │
│                                                 │
│ [StatusBar]       bottom-left  [Camera][Legend] │
│ [ATC bar]         bottom-center (desktop only)  │
└────────────────────────────────────────────────┘
```

Root element:
```tsx
<main className="relative h-dvh w-screen overflow-hidden bg-black">
  <MapView ...>
    {/* deck.gl layers */}
  </MapView>

  {/* HUD overlay */}
  <div
    data-map-theme={mapStyle.dark ? "dark" : "light"}
    className="pointer-events-none absolute inset-0 z-10"
  >
    {/* Brand — top-left */}
    <div className="pointer-events-auto absolute left-3 top-3 sm:left-4 sm:top-4">
      <Brand />
    </div>

    {/* FlightCard — middle-left below brand */}
    <div className="pointer-events-auto absolute left-3 top-14 sm:left-4 sm:top-16">
      <FlightCard flight={selectedFlight} ... />
    </div>

    {/* ControlPanel — top-right */}
    <div className="pointer-events-auto absolute right-3 top-3 sm:right-4 sm:top-4">
      <ControlPanel ... />
    </div>

    {/* StatusBar — bottom-left */}
    <div className="pointer-events-auto absolute bottom-[env(safe-area-inset-bottom,0px)] left-3 mb-3 sm:bottom-4 sm:left-4">
      <StatusBar ... />
    </div>

    {/* ATC player — top-center mobile / bottom-center desktop */}
    <div className="pointer-events-auto absolute left-1/2 top-14 -translate-x-1/2 sm:top-auto sm:bottom-18">
      <AtcPlayerBar ... />
    </div>

    {/* Camera controls + Altitude legend — bottom-right */}
    <div className="pointer-events-none absolute bottom-[env(safe-area-inset-bottom,0px)] right-3 mb-3 flex flex-col items-end gap-2 sm:bottom-4 sm:right-4">
      <CameraControls />
      <AltitudeLegend />
      <MapAttribution />
    </div>
  </div>

  {/* FPV HUD — rendered over everything */}
  <AnimatePresence>
    {fpvIcao24 && <FpvHud flight={fpvFlight} onExit={handleExitFpv} />}
  </AnimatePresence>
</main>
```

---

## 4. FlightCard Component Pattern

A glassmorphism side-panel that shows details of the selected aircraft.

```tsx
// Key structural snippet — use this pattern for any "detail card" sidebar
<AnimatePresence mode="wait">
  {flight && (
    <motion.div
      key={flight.icao24}
      initial={{ opacity: 0, x: -16, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -16, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.8 }}
      className="w-72 sm:w-80"
    >
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/60 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        {/* Hero photo slot */}
        <HeroBanner photo={heroPhoto} loading={photosLoading} />

        <div className="p-4">
          {/* Logo + callsign row */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/14 bg-white/10 shadow-lg shadow-black/25">
              {/* Airline logo image inside white rounded box */}
              <span className="relative flex h-18 w-18 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-white/95 p-3.5 shadow-sm">
                <Image src={logoUrl} width={68} height={68} className="h-13 w-13 object-contain" />
              </span>
            </div>
            <div>
              <p className="text-base font-bold leading-tight text-white">{callsign}</p>
              <p className="mt-0.5 text-[11px] font-medium tracking-widest text-white/35 uppercase">
                {icao24} · #{flightNumber}
              </p>
            </div>
          </div>

          {/* Soft divider */}
          <div className="mt-3 h-px bg-linear-to-r from-transparent via-white/6 to-transparent" />

          {/* 2-column metrics grid */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric icon={<ArrowUp />} label="Altitude" value={altFt} />
            <Metric icon={<Gauge />}   label="Speed"    value={speedKt} />
            <Metric icon={<Compass />} label="Heading"  value={`${deg}° ${cardinal}`} />
            <Metric icon={<ArrowDown />} label="V/S"   value={`${vs} m/s`} />
          </div>

          {/* Emergency squawk badge */}
          {isEmergencySquawk(squawk) && (
            <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-red-400 uppercase">
              Emergency
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

// Reusable Metric sub-component
function Metric({ icon, label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-white/25">
        {icon}
        <span className="text-[10px] font-medium tracking-widest uppercase">{label}</span>
      </div>
      <p className="text-sm font-semibold tabular-nums text-white/90">{value}</p>
    </div>
  );
}
```

---

## 5. StatusBar Component Pattern

Frosted-glass pill at the bottom-left, housing flight count, city, ATC trigger, and map controls.

```tsx
// Glass pill wrapper — reuse this for any HUD chip
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.4 }}
  className="flex items-center gap-3 rounded-xl border px-3.5 py-2 backdrop-blur-2xl"
  style={{
    borderColor: "rgb(var(--ui-fg) / 0.06)",
    backgroundColor: "rgb(var(--ui-bg) / 0.5)",
  }}
>
  {/* Divider between items */}
  <div className="h-3 w-px" style={{ backgroundColor: "rgb(var(--ui-fg) / 0.08)" }} />
  
  {/* Flight count */}
  <div className="flex items-center gap-1.5">
    <Plane className="h-3 w-3" style={{ color: "rgb(var(--ui-fg) / 0.3)" }} />
    <span className="text-[11px] font-semibold tracking-wide" style={{ color: "rgb(var(--ui-fg) / 0.6)" }}>
      {flightCount}
    </span>
  </div>
</motion.div>
```

---

## 6. Flight-Path / Trail Framework

### 6.1 Data Flow Architecture

```
ADS-B API (airplanes.live / adsb.lol / OpenSky)
    │
    ▼
useFlights(city, fpvIcao24, ...)   ← polls every ~5–30 s
    │  FlightState[]
    ▼
useTrailHistory(flights)           ← accumulates GPS history per aircraft
    │  TrailEntry[]                ← {icao24, path: [lng,lat][], altitudes[], timestamps[]}
    ▼
useMergedTrails(...)               ← merges live trail + historical API track
    │  TrailEntry[]
    ▼
FlightLayers                       ← deck.gl overlay, rAF animation loop
    ├─ IconLayer "flight-shadows"  ← ground shadow (billboard:false)
    ├─ PathLayer "flight-trails"   ← coloured 3D trail ribbons
    ├─ IconLayer "sel-halo"        ← animated glow halo around selected plane
    ├─ IconLayer "sel-ring-0/1/2"  ← expanding sonar rings
    └─ ScenegraphLayer × N         ← 3D GLTF plane models (one per model type)
         or
       IconLayer "flight-aircraft-2d"  ← 2D sprite atlas (low zoom LOD)
```

### 6.2 FlightState Type (OpenSky-compatible)

```ts
interface FlightState {
  icao24: string;          // 6-char hex ICAO address
  callsign: string | null;
  originCountry: string;
  timePosition: number | null;
  lastContact: number;
  longitude: number | null;
  latitude: number | null;
  baroAltitude: number | null; // metres
  onGround: boolean;
  velocity: number | null;     // m/s
  trueTrack: number | null;    // degrees 0–360
  verticalRate: number | null; // m/s (positive = climbing)
  sensors: number[] | null;
  geoAltitude: number | null;
  squawk: string | null;
  spi: boolean;
  positionSource: number;      // 0=ADS-B, 1=MLAT, 2=FLARM
  category?: string;           // ADS-B emitter category A0–D7
  registration?: string;
}
```

### 6.3 Trail History Hook — useTrailHistory

Keeps a rolling FIFO of GPS positions per aircraft (up to 55 points). Handles:
- **Jump detection**: discards trail if aircraft teleports > 0.3° in one poll
- **Altitude filtering**: EMA + median-absolute-deviation outlier rejection
- **Bootstrap synthesis**: generates fake "prior" positions for new aircraft by back-projecting along heading so the trail appears immediately
- **Tab-resume awareness**: dynamic jump threshold based on elapsed time × speed

```ts
// Core types
type TrailEntry = {
  icao24: string;
  path: [lng: number, lat: number][];
  altitudes: Array<number | null>;
  timestamps: number[];
  baroAltitude: number | null;
  fullHistory?: boolean; // true if merged with historical API track
};

// Usage
const trails: TrailEntry[] = useTrailHistory(flights);
```

Key constants:
```ts
const MAX_POINTS = 55;                  // keep last 55 GPS fixes
const JUMP_THRESHOLD_DEG = 0.3;        // ~33 km at equator
const HISTORICAL_BOOTSTRAP_POLLS = 3;  // synthetic prior points count
const HISTORICAL_BOOTSTRAP_STEP_SEC = 12; // spacing between them
```

### 6.4 PathLayer — Trail Rendering

```ts
new PathLayer<TrailEntry>({
  id: "flight-trails",
  pickable: false,
  data: trailData,

  // Each trail is a 3D polyline: [[lng, lat, elevMeters], ...]
  getPath: (d) => {
    return d.path.map((pt, i) => [
      pt[0],                                        // longitude
      pt[1],                                        // latitude
      Math.max(0, altitudeToElevation(d.altitudes[i]) * elevScale),
    ]);
  },

  // Colour fades from transparent (tail) to opaque (head)
  // and maps altitude → colour when altColors is true
  getColor: (d) => {
    const len = d.path.length;
    return d.path.map((_, i) => {
      const t = len > 1 ? i / (len - 1) : 1;
      const fade = 0.15 + 0.85 * Math.pow(t, 1.4);  // ease-in fade
      const base = altColors ? altitudeToColor(d.altitudes[i]) : DEFAULT_COLOR;
      const alpha = Math.round(60 + fade * 160);
      return [base[0], base[1], base[2], alpha];
    });
  },

  getWidth: trailThickness,           // pixels, typically 2–4
  widthUnits: "pixels",
  widthMinPixels: 1,
  widthMaxPixels: 8,
  wrapLongitude: true,                // handles antimeridian crossings
  billboard: true,                    // trail faces camera, not world-aligned
  capRounded: true,
  jointRounded: true,
})
```

**Elevation helper:**
```ts
// Converts barometric altitude (metres) to deck.gl map elevation (metres)
// Uses an exaggeration curve so high-altitude aircraft are visually distinct
function altitudeToElevation(baroAltitude: number | null): number {
  if (baroAltitude == null || baroAltitude <= 0) return 0;
  // Example: 1:1 exaggeration with minimum floor
  return Math.max(0, baroAltitude);
  // Or with a zoom-dependent elevScale (0.15–1.0):
  // return baroAltitude * elevScale;
}
```

### 6.5 ScenegraphLayer — 3D Aircraft Models

One `ScenegraphLayer` per aircraft type (A320, B738, etc.). Aircraft are bucketed by ICAO type code before rendering.

```ts
new ScenegraphLayer<FlightState>({
  id: `flight-aircraft-${modelKey}`,
  data: flightBucket,          // stable reference — only rebucketed on new poll
  scenegraph: "/models/a320.glb",  // GLTF model URL

  // Position updated every animation frame via updateTriggers
  getPosition: (d) => {
    const interp = interpolatedMap.get(d.icao24); // interpolated position
    return [
      interp?.longitude ?? d.longitude ?? 0,
      interp?.latitude  ?? d.latitude  ?? 0,
      altitudeToElevation(interp?.baroAltitude) * elevScale,
    ];
  },

  // pitch=climb/descent, yaw=heading, bank=roll
  getOrientation: (d) => {
    const interp = interpolatedMap.get(d.icao24);
    const pitch = pitchByIcao.get(d.icao24) ?? 0;
    const bank  = bankByIcao.get(d.icao24)  ?? 0;
    const yaw   = yawOffset - (interp?.trueTrack ?? 0);
    return [pitch, yaw, 90 + bank];
  },

  getColor: (d) => altitudeToColor(d.baroAltitude),
  getScale: (d) => { const s = categorySizeMultiplier(d.category) * normScale; return [s,s,s]; },

  sizeScale: 22,            // base display size in pixels
  sizeMinPixels: 0.8,
  sizeMaxPixels: 18,
  _lighting: "pbr",         // physically-based lighting
  pickable: true,
  autoHighlight: true,
  highlightColor: [255, 255, 255, 80],

  // Selective recompute: position/orientation every rAF, color/scale only on new data
  updateTriggers: {
    getPosition:    [frameCounter, elevScale],
    getOrientation: frameCounter,
    getColor:       [dataVersion, altColors],
    getScale:       dataVersion,
  },
})
```

### 6.6 Interpolation System (smooth motion between polls)

The animation loop runs at 60 fps; ADS-B data arrives every ~5–30 s.
Aircraft positions are linearly interpolated between the previous and current snapshots.

```ts
// Snapshot stored on each new data poll
type Snapshot = { lng: number; lat: number; alt: number; track: number };

// Per-frame interpolation (simplified)
function interpolatePosition(prev: Snapshot, curr: Snapshot, t: number) {
  // Linear for position (teleport guard: skip if > 0.3° jump)
  const dx = curr.lng - prev.lng;
  const dy = curr.lat - prev.lat;
  if (dx*dx + dy*dy > 0.09) return curr; // teleport → snap

  return {
    lng:   prev.lng + dx * t,
    lat:   prev.lat + dy * t,
    alt:   prev.alt + (curr.alt - prev.alt) * t,
    track: lerpAngle(prev.track, curr.track, smoothStep(t)),
  };
}

// Angle lerp (handles 359°→1° wrap)
function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

// Triple-smoothstep for buttery heading interpolation
function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}
```

### 6.7 Selection Pulse (halo + sonar rings)

When an aircraft is selected, an animated glow halo + 3 staggered expanding rings appear.

```ts
// Halo — soft breathing glow
const breathT = (elapsed % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
const breath  = Math.sin(breathT * Math.PI * 2);
const haloSize  = 90 + 10 * breath;                // 80–100 px
const haloColor = [70, 160, 240, 32];              // blue, semi-transparent

new IconLayer({
  id: "sel-halo",
  iconAtlas: "/halo.png",
  getSize: haloSize,
  getColor: haloColor,
  billboard: true,
})

// Three sonar rings staggered by RING_PERIOD_MS/3
[0, RING_PERIOD_MS/3, (RING_PERIOD_MS*2)/3].forEach((offset, i) => {
  const t = ((elapsed + offset) % RING_PERIOD_MS) / RING_PERIOD_MS;
  const eased    = 1 - (1 - t) ** 5;
  const ringSize = 35 + 70 * eased;              // 35 → 105 px
  const alpha    = Math.round(80 * (1-t)**4);    // fast fade

  new IconLayer({ id: `sel-ring-${i}`, getSize: ringSize, getColor: [..., alpha] })
})
```

### 6.8 LOD (Level of Detail) — 3D vs 2D Switch

```ts
const LOD_3D_ZOOM_IN  = 6.0;   // zoom in past this → show 3D models
const LOD_3D_ZOOM_OUT = 5.0;   // zoom out past this → switch to 2D icons
// Hysteresis band prevents rapid flickering at the boundary

if (use3D && currentZoom < LOD_3D_ZOOM_OUT) use3D = false;
else if (!use3D && currentZoom >= LOD_3D_ZOOM_IN) use3D = true;
```

### 6.9 Circuit Breaker — API Fallback Chain

Provider priority: **adsb.lol** → **OpenSky**

```ts
// Three consecutive fails → open circuit for 30s (doubles each time, cap 120s)
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_BASE_COOLDOWN_MS  = 30_000;
const CIRCUIT_MAX_COOLDOWN_MS   = 120_000;

// Tier selection
const tiers = [
  { id: "adsb",    fn: () => fetchViaProxy(path, signal) },
  { id: "opensky", fn: () => fetchFromOpenSky(lat, lon, signal) },
];
```

---

## 7. API Integration

### 7.1 Proxy Route (Next.js)
```ts
// src/app/api/flights/route.ts
// Proxies requests to adsb.lol to avoid CORS
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path");
  const res = await fetch(`https://api.adsb.lol/v2${path}`);
  return Response.json(await res.json());
}
```

### 7.2 Fetch Endpoints
| Endpoint | Description |
|---|---|
| `/point/{lat}/{lon}/{radiusNm}` | Aircraft within radius (250 NM max) |
| `/hex/{icao24}` | Single aircraft by ICAO hex |
| `/callsign/{callsign}` | Aircraft by callsign |
| `/all` | All tracked aircraft globally |

### 7.3 RawAircraft → FlightState Mapping (key fields)
```ts
// ADS-B field → FlightState field
hex          → icao24
flight       → callsign (trimmed)
lat / lon    → latitude / longitude
alt_baro     → baroAltitude (feet → metres: * 0.3048)
gs           → velocity (knots → m/s: * 0.51444)
track        → trueTrack (degrees)
baro_rate    → verticalRate (ft/min → m/s: * 0.00508)
t            → (aircraft type code, used for 3D model lookup)
r            → registration
category     → category
squawk       → squawk
```

---

## 8. Quick-Copy: Minimal Trail Implementation

Use this if you only want the trail system without the full deck.gl stack:

```ts
// --- types ---
type TrailEntry = {
  icao24: string;
  path: [number, number][];      // [lng, lat] pairs
  altitudes: (number | null)[];
};

// --- store ---
const MAX_PTS = 55;
const JUMP_DEG = 0.3;
const trails = new Map<string, { path: [number,number][]; alts: (number|null)[] }>();

function updateTrails(flights: FlightState[]): TrailEntry[] {
  const current = new Set<string>();

  for (const f of flights) {
    if (f.longitude == null || f.latitude == null) continue;
    current.add(f.icao24);
    let t = trails.get(f.icao24);
    if (!t) { t = { path: [], alts: [] }; trails.set(f.icao24, t); }

    const last = t.path[t.path.length - 1];
    if (last) {
      const dx = f.longitude - last[0], dy = f.latitude - last[1];
      if (dx*dx + dy*dy > JUMP_DEG*JUMP_DEG) { t.path = []; t.alts = []; } // jump reset
    }

    t.path.push([f.longitude, f.latitude]);
    t.alts.push(f.baroAltitude);
    if (t.path.length > MAX_PTS) { t.path.shift(); t.alts.shift(); }
  }

  // Remove departed aircraft
  for (const id of trails.keys()) if (!current.has(id)) trails.delete(id);

  return [...current].map(id => {
    const t = trails.get(id)!;
    return { icao24: id, path: [...t.path], altitudes: [...t.alts] };
  }).filter(e => e.path.length >= 2);
}

// --- PathLayer (deck.gl) ---
new PathLayer({
  id: "trails",
  data: trailEntries,
  getPath: d => d.path.map(([lng, lat], i) => [lng, lat, (d.altitudes[i] ?? 0) * 0.3048]),
  getColor: d => d.path.map((_, i) => {
    const t = i / Math.max(d.path.length - 1, 1);
    return [0, 180 + t*75, 240, Math.round(60 + t*180)]; // blue fade
  }),
  getWidth: 2,
  widthUnits: "pixels",
  capRounded: true,
  jointRounded: true,
  billboard: true,
  wrapLongitude: true,
})
```

---

## 9. File Index (quick reference)

| File | Purpose |
|---|---|
| `src/lib/flight-api-types.ts` | RawAircraft + ReadsbApiResponse TypeScript types |
| `src/lib/flight-api-client.ts` | 3-tier fetch with circuit breaker |
| `src/hooks/use-flights.ts` | React hook — polling loop, state management |
| `src/hooks/use-trail-history.ts` | Trail accumulation & altitude filtering |
| `src/hooks/use-merged-trails.ts` | Merges live trail + historical API track |
| `src/hooks/use-flight-track.ts` | Fetches historical track from API |
| `src/components/map/flight-layers.tsx` | Main deck.gl layer orchestrator + rAF loop |
| `src/components/map/flight-layer-builders.ts` | Trail PathLayer + selection pulse builders |
| `src/components/map/aircraft-model-layers.ts` | 3D ScenegraphLayer builder (per model type) |
| `src/components/map/flight-animation-helpers.ts` | Interpolation math, pitch/bank computation |
| `src/components/map/flight-layer-constants.ts` | All tuning constants (animation timings, LOD etc.) |
| `src/components/map/aircraft-appearance.ts` | Colour maps, icon atlases, size multipliers |
| `src/components/map/aircraft-model-mapping.ts` | ICAO type → GLTF model URL mapping |
| `src/components/ui/flight-card.tsx` | Aircraft detail sidebar card |
| `src/components/ui/status-bar.tsx` | Bottom-left status HUD |
| `src/components/ui/fpv-hud.tsx` | First-person-view overlay |
| `src/components/ui/control-panel.tsx` | Top-right search + settings panel |
| `src/components/flight-tracker.tsx` | Root orchestrator component |

---

*Generated from Palantir source — for AI-assisted replication of this UI on other map projects.*
