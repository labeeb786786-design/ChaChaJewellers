import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { daysSince, formatRelativeTime, hoursSince } from "./relative-time";

const NOW = new Date("2026-08-21T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("hoursSince", () => {
  it("returns the exact fractional hours elapsed", () => {
    expect(hoursSince(new Date(NOW.getTime() - 6 * 60 * 60 * 1000).toISOString())).toBeCloseTo(6);
  });
});

describe("daysSince", () => {
  it("returns the exact fractional days elapsed", () => {
    expect(daysSince(new Date(NOW.getTime() - 72 * 60 * 60 * 1000).toISOString())).toBeCloseTo(3);
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for under a minute", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 30 * 1000).toISOString())).toBe("just now");
  });

  it("pluralises minutes correctly", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 1 * 60 * 1000).toISOString())).toBe("1 minute ago");
    expect(formatRelativeTime(new Date(NOW.getTime() - 5 * 60 * 1000).toISOString())).toBe("5 minutes ago");
  });

  it("pluralises hours correctly", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 1 * 60 * 60 * 1000).toISOString())).toBe("1 hour ago");
    expect(formatRelativeTime(new Date(NOW.getTime() - 6 * 60 * 60 * 1000).toISOString())).toBe("6 hours ago");
  });

  it("pluralises days correctly", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString())).toBe("1 day ago");
    expect(formatRelativeTime(new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString())).toBe("3 days ago");
  });

  it("falls back to a plain date beyond 30 days", () => {
    const old = new Date(NOW.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(old)).toBe(new Date(old).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }));
  });
});
