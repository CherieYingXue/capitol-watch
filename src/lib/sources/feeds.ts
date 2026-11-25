import type { Chamber, Item } from "../types";
import { detectMediaCategory, enrich, fetchText, parseRss, safeUrl, stripHtml, truncate } from "./util";

export interface FeedDef {
  id: string;
  name: string;
  url: string;
  kind: "official" | "media";
  chamber?: Chamber;
  committee?: string;
  limit?: number;
  maxAgeDays?: number;
}

const gnews = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:7d`)}&hl=en-US&gl=US&ceid=US:en`;

export const FEEDS: FeedDef[] = [
  { id: "ccp-committee", name: "House Select Committee on China", url: "https://selectcommitteeontheccp.house.gov/rss.xml", kind: "official", chamber: "House", committee: "House Select Committee on China" },
  { id: "house-wm", name: "House Ways and Means Committee", url: "https://waysandmeans.house.gov/feed/", kind: "official", chamber: "House", committee: "House Ways and Means" },
  { id: "house-homeland", name: "House Homeland Security Committee", url: "https://homeland.house.gov/feed/", kind: "official", chamber: "House", committee: "House Homeland Security" },
  { id: "house-approps", name: "House Appropriations Committee", url: "https://appropriations.house.gov/rss.xml", kind: "official", chamber: "House", committee: "House Appropriations", maxAgeDays: 90 },
  { id: "speaker", name: "Office of the Speaker", url: "https://www.speaker.gov/feed/", kind: "official", chamber: "House" },

  { id: "politico", name: "Politico – Congress", url: "https://rss.politico.com/congress.xml", kind: "media" },
  { id: "thehill-house", name: "The Hill – House", url: "https://thehill.com/homenews/house/feed/", kind: "media", chamber: "House" },
  { id: "thehill-senate", name: "The Hill – Senate", url: "https://thehill.com/homenews/senate/feed/", kind: "media", chamber: "Senate" },
  { id: "rollcall", name: "Roll Call", url: "https://rollcall.com/feed/", kind: "media", limit: 40 },
  { id: "gn-china", name: "News search: Congress & China", url: gnews('(congress OR senate OR "house committee") (china OR ccp OR beijing OR taiwan)'), kind: "media", limit: 30 },
  { id: "gn-ccp-committee", name: "News search: Select Committee on China", url: gnews('"select committee" china OR ccp'), kind: "media", limit: 15 },
  { id: "gn-hearings", name: "News search: committee hearings", url: gnews('"committee hearing" (senate OR house)'), kind: "media", limit: 25 },
  { id: "gn-key-committees", name: "News search: key national-security committees", url: gnews('"Oversight Committee" OR "Foreign Relations Committee" OR "Foreign Affairs Committee" OR "Armed Services Committee" OR "Intelligence Committee"'), kind: "media", limit: 25 },
  { id: "gn-investigations", name: "News search: congressional investigations", url: gnews('congressional investigation OR subpoena "committee"'), kind: "media", limit: 20 },
  { id: "gn-appointments", name: "News search: committee chairs & assignments", url: gnews('("ranking member" OR "committee chair" OR "committee assignments" OR gavel) congress'), kind: "media", limit: 20 },
  { id: "gn-nominations", name: "News search: Senate confirmations", url: gnews('senate (confirms OR "confirmation hearing" OR nominee)'), kind: "media", limit: 20 },
];

function cleanGoogleTitle(title: string, source?: string): string {
  if (source && title.endsWith(` - ${source}`)) return title.slice(0, -(source.length + 3));
  return title.replace(/\s+-\s+[^-]{2,60}$/, "");
}

export async function fetchFeed(def: FeedDef, now: Date): Promise<Item[]> {
  const entries = parseRss(await fetchText(def.url));
  const maxAge = (def.maxAgeDays ?? (def.kind === "official" ? 45 : 10)) * 86400000;
  const isGoogle = def.url.includes("news.google.com");

  return entries
    .filter((e) => e.title && e.link)
    .filter((e) => !e.pubDate || now.getTime() - Date.parse(e.pubDate) <= maxAge)
    .slice(0, def.limit ?? 30)
    .map((e) => {
      const title = isGoogle ? cleanGoogleTitle(e.title, e.sourceName) : e.title;
      const summary = isGoogle ? undefined : truncate(stripHtml(e.description), 320) || undefined;
      let category = detectMediaCategory(title, summary);
      if (def.kind === "official" && category === "news") category = "statement";
      return enrich({
        id: `${def.id}-${e.guid || e.link}`,
        title,
        url: safeUrl(e.link),
        summary,
        date: e.pubDate ?? now.toISOString(),
        chamber: def.chamber,
        category,
        committee: def.committee,
        source: isGoogle && e.sourceName ? e.sourceName : def.name,
        sourceKind: def.kind,
      });
    });
}
