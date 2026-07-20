"use client";

import { useSyncExternalStore } from "react";

import { OPENING_HOURS } from "@/lib/site";

/**
 * Opening-hours list that highlights the current day.
 *
 * The day is resolved in the browser, fixed to UK time (Europe/London), so
 * every visitor sees the shop's current day regardless of their own timezone.
 * useSyncExternalStore returns null on the server / first paint (no highlight)
 * then the real day after hydration, keeping it hydration-safe with no flash of
 * the wrong day.
 */
const emptySubscribe = () => () => {};

// DST-aware UK weekday ("Monday" … "Sunday"), matching OPENING_HOURS order.
const UK_WEEKDAY = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "long",
});
const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const getTodayIndex = () => DAY_ORDER.indexOf(UK_WEEKDAY.format(new Date()));

export function OpeningHours() {
  const todayIndex = useSyncExternalStore(
    emptySubscribe,
    getTodayIndex,
    () => null
  );

  return (
    <ul className="divide-y divide-border/70 text-sm">
      {OPENING_HOURS.map((row, i) => {
        const isToday = i === todayIndex;
        return (
          <li
            key={row.day}
            className={
              "flex items-center justify-between py-2 " +
              (isToday ? "font-semibold text-maroon" : "text-muted-foreground")
            }
          >
            <span>
              {row.day}
              {isToday && (
                <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold-deep">
                  Today
                </span>
              )}
            </span>
            <span>{row.hours}</span>
          </li>
        );
      })}
    </ul>
  );
}
