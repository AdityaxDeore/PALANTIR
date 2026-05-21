import type { FetchResult, FlightState, OpenSkyResponse } from "./opensky-types";
import {
  FETCH_TIMEOUT_MS,
  OPENSKY_API,
} from "./opensky-types";
import {
  parseRateLimitInfo,
  parseStates,
} from "./opensky-parsing";

/**
 * Fetch ALL flights globally from OpenSky Network API.
 * 
 * This function makes an unbounded request to /states/all without any
 * lamin/lamax/lomin/lomax parameters, returning the maximum possible
 * flight coverage that OpenSky provides.
 * 
 * AUTHENTICATION:
 * If OPENSKY_USERNAME and OPENSKY_PASSWORD environment variables are set,
 * this will use HTTP Basic Auth to increase API credits (20/min vs 4/min).
 * 
 * @param signal - Optional abort signal for cancellation
 * @returns Promise containing all global flights, rate limit info
 * 
 * @see https://openskynetwork.github.io/opensky-api/rest.html#all-states
 */
export async function fetchGlobalFlights(
  signal?: AbortSignal,
): Promise<FetchResult> {
  const url = `${OPENSKY_API}/states/all?extended=1`;

  // Build headers with optional authentication
  const headers: Record<string, string> = {};
  
  // Check for credentials in environment variables
  const username = process.env.NEXT_PUBLIC_OPENSKY_USERNAME;
  const password = process.env.NEXT_PUBLIC_OPENSKY_PASSWORD;
  
  if (username && password) {
    // HTTP Basic Authentication - increases rate limit from 4 to 20 credits/min
    const credentials = btoa(`${username}:${password}`);
    headers["Authorization"] = `Basic ${credentials}`;
    
    console.log(
      "[OpenSky] Using authenticated request - 5x more API credits available",
    );
  } else {
    console.log(
      "[OpenSky] No credentials found - using anonymous access (4 credits/min). " +
      "Add OPENSKY_USERNAME/PASSWORD to .env.local for 5x more data.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers,
    });
    
    const rateLimitInfo = parseRateLimitInfo(res);

    if (res.status === 429) {
      console.warn(
        "[OpenSky] Rate limited - retry after",
        rateLimitInfo.retryAfterSeconds,
        "seconds",
      );
      return {
        flights: [],
        rateLimited: true,
        creditsRemaining: rateLimitInfo.creditsRemaining,
        retryAfterSeconds: rateLimitInfo.retryAfterSeconds,
      };
    }

    if (!res.ok) {
      console.error(
        "[OpenSky] API error - status:",
        res.status,
        "credits remaining:",
        rateLimitInfo.creditsRemaining,
      );
      return {
        flights: [],
        rateLimited: false,
        creditsRemaining: rateLimitInfo.creditsRemaining,
        retryAfterSeconds: null,
      };
    }

    // Reject non-JSON responses (CloudFlare challenge pages)
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("text/html") || ct.includes("text/xml")) {
      throw new Error("OpenSky returned non-JSON response");
    }

    const payload = (await res.json()) as unknown;
    const data =
      typeof payload === "object" && payload !== null
        ? (payload as OpenSkyResponse)
        : { time: 0, states: null };

    // Parse and validate flights
    const flights = parseStates(data);
    
    // Log total flights received from API
    console.log(
      `[OpenSky] ✓ Received ${flights.length.toLocaleString()} global flights`,
      `(credits remaining: ${rateLimitInfo.creditsRemaining ?? "unknown"})`,
    );

    return {
      flights,
      rateLimited: false,
      creditsRemaining: rateLimitInfo.creditsRemaining,
      retryAfterSeconds: null,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      if (signal?.aborted) throw err;
      throw new Error("OpenSky request timed out");
    }
    console.error("[OpenSky] Request failed:", err instanceof Error ? err.message : err);
    throw err;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Validate and filter flight data with minimal constraints.
 * Only removes entries with invalid coordinates.
 * 
 * @param flights - Array of flight states to validate
 * @returns Filtered array with only valid coordinate flights
 */
export function validateGlobalFlights(flights: FlightState[]): FlightState[] {
  const beforeCount = flights.length;
  
  const validated = flights.filter((flight) => {
    // Only filter out flights with null/invalid coordinates
    const hasValidLat =
      flight.latitude != null &&
      Number.isFinite(flight.latitude) &&
      flight.latitude >= -90 &&
      flight.latitude <= 90;
    
    const hasValidLon =
      flight.longitude != null &&
      Number.isFinite(flight.longitude) &&
      flight.longitude >= -180 &&
      flight.longitude <= 180;
    
    return hasValidLat && hasValidLon;
  });
  
  const removedCount = beforeCount - validated.length;
  
  if (removedCount > 0) {
    console.log(
      `[OpenSky] Removed ${removedCount} flights with invalid coordinates`,
      `(${beforeCount} → ${validated.length})`,
    );
  }
  
  return validated;
}
