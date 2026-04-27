/**
 * Origins allowed for CORS + Socket.IO.
 * Set CLIENT_URL (single) and/or CLIENT_URLS (comma-separated full URLs).
 * Dev origins (localhost) are only included when NODE_ENV !== "production".
 */

function toOrigin(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  try {
    return new URL(t).origin;
  } catch {
    return t.replace(/\/$/, "");
  }
}

export function getAllowedOrigins() {
  const fromClient = toOrigin(process.env.CLIENT_URL);
  const extras = (process.env.CLIENT_URLS || "")
    .split(",")
    .map((s) => toOrigin(s))
    .filter(Boolean);

  const origins = [fromClient, ...extras].filter(Boolean);

  // Only include localhost in non-production environments
  if (process.env.NODE_ENV !== "production") {
    origins.push(
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4173"
    );
  }

  return [...new Set(origins)];
}

export function isOriginAllowed(origin, allowedList) {
  // Allow requests with no origin (server-to-server, curl, mobile apps)
  if (!origin) return true;
  return allowedList.includes(origin);
}
