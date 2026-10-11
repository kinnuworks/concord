// A small in-memory limiter. It resets when the server restarts, which is enough to
// stop one visitor from running up the bill on a demo site.
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;

export function allow(request: Request, bucket: string, perHour: number) {
  if (process.env.NODE_ENV !== "production") return { ok: true as const };
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true as const };
  }
  if (entry.count >= perHour) {
    return { ok: false as const, message: "This demo is rate limited. Try again in an hour." };
  }
  entry.count += 1;
  return { ok: true as const };
}
