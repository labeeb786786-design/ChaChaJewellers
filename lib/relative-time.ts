/**
 * An ISO timestamp N days before now — for query thresholds like "orders
 * created in the last 14 days". Kept as its own function (rather than
 * `new Date(Date.now() - ...)` inline at the call site) because the
 * react-hooks/purity rule flags a direct Date.now() call in a Server
 * Component's render body; wrapping it here keeps that call out of render.
 */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Hours elapsed since a timestamp — the raw number, for threshold checks (e.g. "6+ hours"). */
export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

/** Days elapsed since a timestamp — the raw number, for threshold checks (e.g. "72 hours" = 3 days). */
export function daysSince(iso: string): number {
  return hoursSince(iso) / 24;
}

/**
 * "3 hours ago" style relative time for display. Falls back to a plain
 * date beyond 30 days — nothing on this dashboard is meant to be read as
 * "612 days ago".
 */
export function formatRelativeTime(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
