import type { Category, Chamber } from "./types";

const TZ = "America/New_York";

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
}

export function formatDayLong(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))} ET`;
}

export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export const CATEGORY_LABEL: Record<Category, string> = {
  hearing: "Hearing",
  markup: "Markup / vote",
  meeting: "Meeting",
  bill: "Bill",
  resolution: "Resolution",
  report: "Hearing record",
  nomination: "Nomination",
  appointment: "Committee post",
  investigation: "Investigation",
  statement: "Committee statement",
  news: "News",
};

export const CHAMBER_STYLE: Record<Chamber, string> = {
  House: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Senate: "bg-indigo-50 text-indigo-800 border-indigo-200",
  Joint: "bg-violet-50 text-violet-800 border-violet-200",
  Congress: "bg-slate-100 text-slate-700 border-slate-200",
};

export const CHINA_STYLE = {
  high: "bg-red-600 text-white border-red-600",
  medium: "bg-amber-100 text-amber-900 border-amber-300",
  low: "bg-yellow-50 text-yellow-800 border-yellow-200",
} as const;
