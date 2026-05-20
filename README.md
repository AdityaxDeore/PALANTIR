# PALANTIR

![Vessels on the sea body](/ships.png)

![Aeroplane path 1](/p1.png) ![Aeroplane path 2](/p2.png) ![Aeroplane path 3](/p3.png)

The first image shows ships and vessels moving over a sea body, while the three following images highlight aeroplane paths rendered in a proper 3D view.

A futuristic airspace command center built for pilots, analysts and aviation teams.

PALANTIR is not just a flight tracker — it is a live, immersive map that turns raw ADS-B telemetry into instant situational awareness. Every aircraft is rendered with altitude-aware motion, crisp 3D models, and adaptive performance tuned for modern browsers.

## What makes PALANTIR better

- Real-time air traffic in 3D across the world’s busiest airspaces
- Altitude-based color and elevation mapping for instant threat and traffic separation
- Smooth animated trails, frictionless camera transitions, and intuitive city targeting
- Built to scale with a 3-tier fallback data pipeline: airplanes.live → adsb.lol → OpenSky
- Minimal setup, no private API keys required, and a polished dark-mode interface

## Why use PALANTIR

- Flight ops teams get pro-grade visibility without the clutter
- Developers get a modern Next.js stack with a ready-to-customize architecture
- Designers get a refined experience built for motion, contrast, and responsiveness
- Explorers get instant airspace context for every flight, airport, and route

## Quick Start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Core architecture

- `src/app/` — application shell, routes, metadata, and API proxy logic
- `src/components/flight-tracker.tsx` — state orchestration, camera control, and layer composition
- `src/components/map/` — MapLibre and Deck.gl integration for models, trails, airspace, and overlays
- `src/components/ui/` — polished panels, search, controls, and navigation
- `src/hooks/` — custom hooks for live flight state, settings persistence, keyboard shortcuts, and trail smoothing
- `src/lib/` — reusable flight APIs, geometry helpers, airline/airport lookup, and ADS-B normalization

## Features

- 3D aircraft models with altitude-aware position and motion
- Animated trails with spline smoothing and history stitching
- Dark-first UI designed for desktop and mobile
- Adaptive polling to preserve API credits and maintain freshness
- Deep-linking by airport/city with instant camera focus
- Local storage persistence for settings and theme preferences

## License

Copyright © 2026 Aditya Deore

AGPL-3.0


Aeris renders 14 distinct aircraft silhouettes based on ADS-B emitter category and ICAO type code:

| Model Key       | Represents                      | Assignment                                     |
| --------------- | ------------------------------- | ---------------------------------------------- |
| `narrowbody`    | A320, B737 family               | Category 3 (Small), 4 (Large), 5 (High vortex) |
| `widebody-2eng` | A330, A350, B777, B787          | Category 6 (Heavy)                             |
| `widebody-4eng` | A380, B747, A340                | —                                              |
| `a380`          | Airbus A380                     | Type codes A38x                                |
| `b737`          | Boeing 737 family               | Type codes B73x, B3xM                          |
| `regional-jet`  | CRJ, E-Jets, Fokker             | —                                              |
| `light-prop`    | Cessna, Piper, Cirrus           | Category 2 (Light), 12 (Ultralight)            |
| `turboprop`     | ATR, Dash-8, Saab               | —                                              |
| `helicopter`    | All rotorcraft                  | Category 8 (Rotorcraft)                        |
| `bizjet`        | Gulfstream, Citation, Learjet   | —                                              |
| `glider`        | Sailplanes                      | Category 9 (Glider)                            |
| `fighter`       | Military fast-movers            | Category 7 (High-perf)                         |
| `drone`         | UAVs                            | Category 14 (UAV)                              |
| `generic`       | Fallback for unknown categories | Category 0, 1, default                         |

Models are optimised GLB files (no Draco compression — avoids external WASM decoder dependency) served from Cloudinary CDN (local backups in `public/models/aircraft/`). A second-tier mapping from ICAO type codes (A320, B738, etc.) refines the assignment when type data is available via the readsb feed.

- **Smooth animation**: Catmull-Rom spline trails, per-frame interpolation between polls
- **Glassmorphism**: `backdrop-blur-2xl`, `bg-black/60`, `border-white/[0.08]`
- **Spring physics**: All UI transitions use spring easing
- **Responsive**: Desktop sidebar dialog, mobile bottom-sheet with thumb-zone tab bar
- **API efficiency**: Adaptive polling (30 s → 5 min) based on remaining credits, Page Visibility pause, grid-snapped cache
- **Persistence**: Settings + map style in localStorage, `?city=IATA` URL deep links

## Environment Variables

| Variable            | Required | Description                     |
| ------------------- | -------- | ------------------------------- |
| `NEXT_PUBLIC_GA_ID` | No       | Google Analytics measurement ID |

No API keys are needed. Flight data comes from public ADS-B APIs with a built-in 3-tier fallback chain (airplanes.live → adsb.lol → OpenSky).

## License

Copyright © 2026 Aditya Deore

AGPL-3.0
