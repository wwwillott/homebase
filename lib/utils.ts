import crypto from "node:crypto";
import dayjs from "dayjs";

export function stableHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function normalizeTitle(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

export function dueDateDistanceHours(a: Date, b: Date): number {
  return Math.abs(dayjs(a).diff(dayjs(b), "hour", true));
}

export function startAndEndForView(
  view: "daily" | "weekly" | "monthly" | "list" | "calendar",
  baseDate = dayjs()
): { start: Date; end: Date } {
  if (view === "daily") {
    return { start: baseDate.startOf("day").toDate(), end: baseDate.endOf("day").toDate() };
  }
  if (view === "weekly") {
    return { start: baseDate.startOf("week").toDate(), end: baseDate.endOf("week").toDate() };
  }
  if (view === "monthly") {
    return { start: baseDate.startOf("month").toDate(), end: baseDate.endOf("month").toDate() };
  }
  if (view === "calendar") {
    return { start: baseDate.startOf("week").toDate(), end: baseDate.endOf("week").toDate() };
  }
  return { start: new Date(0), end: new Date("2999-12-31T00:00:00.000Z") };
}
