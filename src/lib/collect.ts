import { fetchCongressBills, fetchCongressNominations } from "./sources/congressApi";
import { FEEDS, fetchFeed } from "./sources/feeds";
import { fetchGovInfoBills, fetchGovInfoHearings, fetchMostViewedBills, GOVINFO_BILLS_URL, GOVINFO_HEARINGS_URL, MOST_VIEWED_URL } from "./sources/govinfo";
import { fetchHouseSchedule, HOUSE_CALENDAR_URL } from "./sources/house";
import { fetchSenateSchedule, SENATE_SCHEDULE_URL } from "./sources/senate";
import { computeTopicStats } from "./topics";
import type { Digest, Item, SourceStatus, TrendingBill } from "./types";

interface Job {
  id: string;
  name: string;
  url: string;
  kind: "official" | "media";
  run: () => Promise<Item[]>;
}

function normalizeTitle(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 90);
}

export async function collectDigest(now = new Date()): Promise<Digest> {
  const congressKey = process.env.CONGRESS_API_KEY?.trim();

  const jobs: Job[] = [
    { id: "senate-schedule", name: "Senate committee schedule", url: SENATE_SCHEDULE_URL, kind: "official", run: fetchSenateSchedule },
    { id: "house-schedule", name: "House committee calendar", url: HOUSE_CALENDAR_URL, kind: "official", run: () => fetchHouseSchedule(now) },
    { id: "govinfo-bills", name: "GovInfo – new bill & resolution texts", url: GOVINFO_BILLS_URL, kind: "official", run: fetchGovInfoBills },
    { id: "govinfo-hearings", name: "GovInfo – published hearing records", url: GOVINFO_HEARINGS_URL, kind: "official", run: () => fetchGovInfoHearings(now) },
    ...FEEDS.map((f) => ({ id: f.id, name: f.name, url: f.url, kind: f.kind, run: () => fetchFeed(f, now) })),
  ];
  if (congressKey) {
    jobs.push(
      { id: "congressgov-bills", name: "Congress.gov – latest bill actions", url: "https://api.congress.gov/", kind: "official", run: () => fetchCongressBills(congressKey) },
      { id: "congressgov-noms", name: "Congress.gov – nominations", url: "https://api.congress.gov/", kind: "official", run: () => fetchCongressNominations(congressKey) },
    );
  }

  const [results, trending] = await Promise.all([
    Promise.allSettled(jobs.map((j) => j.run())),
    fetchMostViewedBills().catch(() => [] as TrendingBill[]),
  ]);

  const sources: SourceStatus[] = jobs.map((j, i) => {
    const r = results[i];
    return {
      id: j.id,
      name: j.name,
      url: j.url.includes("news.google.com") ? "https://news.google.com/" : j.url,
      kind: j.kind,
      ok: r.status === "fulfilled",
      count: r.status === "fulfilled" ? r.value.length : 0,
      error: r.status === "rejected" ? String((r.reason as Error)?.message ?? r.reason).slice(0, 160) : undefined,
    };
  });
  sources.push({ id: "most-viewed", name: "Congress.gov – most-viewed bills", url: MOST_VIEWED_URL, kind: "official", ok: trending.length > 0, count: trending.length });

  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const events = new Map<string, Item>();
  const items: Item[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value) {
      const key = normalizeTitle(item.title);
      if (seenIds.has(item.id)) continue;
      if (item.sourceKind === "media" && seenTitles.has(key)) continue;
      if (item.eventDate && (item.category === "hearing" || item.category === "markup")) {
        const eventKey = `${item.chamber}|${key}|${item.eventDate}`;
        const existing = events.get(eventKey);
        if (existing) {
          if (item.committee && existing.committee && !existing.committee.includes(item.committee)) {
            existing.committee = `${existing.committee} (joint with ${item.committee.replace(/^(House|Senate) /, "")})`;
          }
          continue;
        }
        events.set(eventKey, item);
      }
      seenIds.add(item.id);
      seenTitles.add(key);
      items.push(item);
    }
  }
  items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return {
    generatedAt: now.toISOString(),
    items,
    trendingBills: trending,
    topics: computeTopicStats(items, now.getTime()),
    sources,
  };
}
