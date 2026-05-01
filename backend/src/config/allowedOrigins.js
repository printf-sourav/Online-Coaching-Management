export function getAllowedOrigins() {
  const defaults = [
    "https://www.meritnook.com",
    "https://meritnook.com",
    "https://api.meritnook.com",
    "https://online-coaching-management.vercel.app",
    "http://localhost:5173"
  ];

  const fromEnv = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...fromEnv]));
}

export function isOriginAllowed(origin, allowedList) {
  if (!origin) return true;
  if (allowedList.includes(origin)) return true;

  // Allow Vercel preview/prod domains (needed for deployments per-branch)
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }

  return false;
}

