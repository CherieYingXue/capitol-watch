import * as cheerio from "cheerio";
import type { Category, Item } from "../types";
import { enrich, fetchText, mapLimit, truncate } from "./util";

const BASE = "https://docs.house.gov/Committee/Calendar/";
export const HOUSE_CALENDAR_URL = `${BASE}ByWeek.aspx`;

function easternParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { y: get("year"), m: get("month"), d: get("day") };
}

function toIsoEastern(y: string, m: string, d: string, time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let h = 9;
  let min = 0;
  if (match) {
    h = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
    min = Number(match[2]);
  }
  const month = Number(m);
  const offset = month >= 4 && month <= 10 ? "-04:00" : "-05:00";
  return new Date(`${y}-${m}-${d}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00${offset}`).toISOString();
}

function categorize(title: string): Category {
  if (/^:|markup|\bH\.\s?R\.\s?\d+.*•|•.*\bH\.\s?R\./i.test(title)) return "markup";
  if (/business meeting|organizational meeting|member day/i.test(title)) return "meeting";
  return "hearing";
}

function houseCommitteeName(raw: string): string {
  const strip = (s: string) => s.replace(/^(?:the )?Committee on (?:the )?/i, "").trim();
  const sub = raw.match(/^(.*?)\s*\((.*Committee.*)\)$/i);
  if (sub) return `House ${strip(sub[2])} – ${sub[1].replace(/^Subcommittee on /i, "")} Subcommittee`;
  return `House ${strip(raw)}`;
}

function cleanTitle(raw: string): { title: string; summary?: string } {
  const t = raw.replace(/\s+/g, " ").trim();
  if (t.includes("•")) {
    const parts = t
      .split("•")
      .map((p) => p.replace(/^[:\s]+/, "").trim())
      .filter(Boolean);
    const head = parts.slice(0, 2).join("; ");
    const more = parts.length > 2 ? ` (+${parts.length - 2} more)` : "";
    return { title: truncate(`Markup: ${head}`, 200) + more, summary: truncate(parts.join(" • "), 600) };
  }
  return { title: t.replace(/^[:\s]+/, "").replace(/^[“"]|[”"]$/g, "") };
}

async function fetchDay(date: Date): Promise<Item[]> {
  const { y, m, d } = easternParts(date);
  const url = `${BASE}ByDay.aspx?DayID=${m}${d}${y}`;
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const items: Item[] = [];
  $("#MainContent_GridViewMeetings tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 3) return;
    const a = $(tds[0]).find("a").first();
    const href = a.attr("href") ?? "";
    const eventId = href.match(/EventID=(\d+)/i)?.[1];
    if (!eventId) return;
    const rawTitle = a.attr("title") || a.text();
    const committee = $(tds[0]).find("span.text-tiny").text().replace(/\s+/g, " ").trim();
    const time = $(tds[1]).text().replace(/\s+/g, " ").trim();
    const location = $(tds[2]).text().replace(/\s+/g, " ").trim();
    const { title, summary } = cleanTitle(rawTitle);
    const eventDate = toIsoEastern(y, m, d, time);
    const postponed = /postponed|cancel/i.test(`${rawTitle} ${time}`);
    items.push(
      enrich({
        id: `house-evt-${eventId}`,
        title,
        url: `${BASE}ByEvent.aspx?EventID=${eventId}`,
        summary: summary ?? (postponed ? "Postponed or cancelled" : undefined),
        date: eventDate,
        eventDate,
        time,
        location,
        chamber: "House",
        category: categorize(rawTitle),
        committee: committee ? houseCommitteeName(committee) : undefined,
        source: "House committee calendar (docs.house.gov)",
        sourceKind: "official",
      }),
    );
  });
  return items;
}

export async function fetchHouseSchedule(now: Date, pastDays = 5, futureDays = 14): Promise<Item[]> {
  const days: Date[] = [];
  for (let i = -pastDays; i <= futureDays; i++) days.push(new Date(now.getTime() + i * 86400000));
  const results = await mapLimit(days, 5, async (day) => {
    try {
      return await fetchDay(day);
    } catch {
      return [] as Item[];
    }
  });
  const flat = results.flat();
  if (flat.length === 0) {
    await fetchText(HOUSE_CALENDAR_URL);
  }
  return flat;
}
