import { XMLParser } from "fast-xml-parser";
import { detectChina } from "../china";
import { classifyTopics } from "../topics";
import type { Category, Chamber, Item } from "../types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; CapitolWatch/1.0; +https://github.com/) AppleWebKit/537.36 (KHTML, like Gecko)";

export async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml, text/html, */*" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  processEntities: true,
  htmlEntities: true,
  trimValues: true,
});

export function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) {
    return text((v as Record<string, unknown>)["#text"]);
  }
  return "";
}

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#?\w+);/g, (m, e: string) => {
      if (ENTITY[e]) return ENTITY[e];
      if (e.startsWith("#x")) return String.fromCodePoint(parseInt(e.slice(2), 16));
      if (e.startsWith("#")) return String.fromCodePoint(parseInt(e.slice(1), 10));
      return m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.slice(0, cut.lastIndexOf(" ") > n * 0.6 ? cut.lastIndexOf(" ") : n) + "…";
}

export function toIso(v: string | undefined | null): string | null {
  if (!v) return null;
  const t = Date.parse(v);
  if (!Number.isNaN(t)) return new Date(t).toISOString();
  const cleaned = v.replace(/\s+(EST|EDT)$/i, (_, z: string) => (z.toUpperCase() === "EDT" ? " -0400" : " -0500"));
  const t2 = Date.parse(cleaned);
  return Number.isNaN(t2) ? null : new Date(t2).toISOString();
}

export function safeUrl(u: string | undefined, base?: string): string {
  if (!u) return base ?? "";
  try {
    const url = new URL(u.trim(), base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return base ?? "";
    return url.toString();
  } catch {
    return base ?? "";
  }
}

const COMMITTEES: [RegExp, string][] = [
  [/select committee on (?:the )?(?:ccp|china|strategic competition)|china select committee|china committee/i, "Select Committee on China"],
  [/armed services/i, "Armed Services"],
  [/foreign relations/i, "Foreign Relations"],
  [/foreign affairs/i, "Foreign Affairs"],
  [/appropriations/i, "Appropriations"],
  [/ways and means/i, "Ways and Means"],
  [/energy and commerce|energy & commerce/i, "Energy and Commerce"],
  [/oversight and (?:government )?(?:reform|accountability)|house oversight|oversight committee/i, "Oversight and Government Reform"],
  [/homeland security and governmental affairs|hsgac/i, "Homeland Security and Governmental Affairs"],
  [/homeland security/i, "Homeland Security"],
  [/judiciary/i, "Judiciary"],
  [/intelligence committee|committee on intelligence|select committee on intelligence/i, "Intelligence"],
  [/financial services/i, "Financial Services"],
  [/banking/i, "Banking, Housing, and Urban Affairs"],
  [/finance committee|senate finance|committee on finance/i, "Finance"],
  [/commerce, science|commerce committee|senate commerce/i, "Commerce, Science, and Transportation"],
  [/health, education, labor|\bhelp committee/i, "Health, Education, Labor, and Pensions"],
  [/education and (?:the )?workforce/i, "Education and Workforce"],
  [/agriculture/i, "Agriculture"],
  [/budget committee|committee on (?:the )?budget/i, "Budget"],
  [/rules committee|committee on rules/i, "Rules"],
  [/energy and natural resources/i, "Energy and Natural Resources"],
  [/natural resources/i, "Natural Resources"],
  [/environment and public works/i, "Environment and Public Works"],
  [/science, space/i, "Science, Space, and Technology"],
  [/small business/i, "Small Business"],
  [/transportation and infrastructure/i, "Transportation and Infrastructure"],
  [/veterans'? affairs/i, "Veterans' Affairs"],
  [/ethics committee|committee on ethics/i, "Ethics"],
  [/house administration/i, "House Administration"],
  [/indian affairs/i, "Indian Affairs"],
  [/committee on aging|aging committee/i, "Aging"],
];

export function detectCommittee(s: string): string | undefined {
  for (const [re, name] of COMMITTEES) if (re.test(s)) return name;
  return undefined;
}

export function detectChamber(s: string): Chamber {
  const senate = /\bsenate\b|\bsenators?\b|\bsen\.\s/i.test(s);
  const house = /\bhouse\b(?! of cards)|\brep\.\s|\brepresentatives?\b|\bspeaker\b/i.test(s);
  if (senate && !house) return "Senate";
  if (house && !senate) return "House";
  return "Congress";
}

const POST = String.raw`(?:ranking members?|chair(?:man|woman|manship|s)?|chairmen|gavels?|vice chair|whip|leader(?:ship)?(?: post| team| race| election)?|committee (?:seat|post|assignments?))`;
const MOVE = String.raw`(?:named|names|tapped|taps|picked|picks|elected|elects|selected|appointed|appoints|chosen|wins?|won|secures?|bid|race|vie[sd]?|vying|campaign(?:s|ing)? for|run(?:s|ning)? for|incoming|presumptive|(?:to|should|will|would) (?:lead|chair|helm)|steps? down as|replace[sd]?|succeed[sd]?)`;
const APPOINTMENT = new RegExp(
  `\\b${MOVE}\\b[^.]{0,50}\\b${POST}\\b|\\b${POST}\\b[^.]{0,50}\\b${MOVE}\\b|committee assignments?|steering committee|leadership elections?|who (?:should|will) lead`,
  "i",
);

export function detectMediaCategory(title: string, summary = ""): Category {
  if (APPOINTMENT.test(title)) return "appointment";
  const s = `${title} ${summary}`;
  if (/investigat|probe\b|subpoena|inquiry|whistleblower|contempt of congress/i.test(s)) return "investigation";
  if (/nominee|nominat|confirm(?:ed|ation|s)?\b/i.test(s)) return "nomination";
  if (/hearing|testif/i.test(s)) return "hearing";
  if (/markup|advances? (?:bill|measure)/i.test(s)) return "markup";
  if (/resolution\b/i.test(s)) return "resolution";
  if (/\bbill\b|\bact\b|legislation/i.test(s)) return "bill";
  return "news";
}

export function enrich(
  base: Omit<Item, "topics" | "china" | "committee" | "chamber"> & Partial<Pick<Item, "committee" | "chamber">>,
): Item {
  const haystack = `${base.title} ${base.summary ?? ""} ${base.committee ?? ""} ${(base.documents ?? []).map((d) => d.label).join(" ")}`;
  const titleSpace = `${base.title} ${base.committee ?? ""}`;
  return {
    ...base,
    chamber: base.chamber ?? detectChamber(haystack),
    committee: base.committee ?? detectCommittee(titleSpace) ?? detectCommittee(haystack),
    topics: classifyTopics(haystack),
    china: detectChina(haystack, base.sourceKind === "official"),
  };
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export interface RssEntry {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  guid: string;
  sourceName?: string;
}

export function parseRss(body: string): RssEntry[] {
  const doc = xml.parse(body);
  const channel = doc?.rss?.channel;
  if (channel) {
    return asArray(channel.item).map((it: Record<string, unknown>) => ({
      title: stripHtml(text(it.title)),
      link: text(it.link),
      description: text(it.description) || text(it["content:encoded"]),
      pubDate: toIso(text(it.pubDate) || text(it["dc:date"])),
      guid: text(it.guid) || text(it.link),
      sourceName: text(it.source) || undefined,
    }));
  }
  const feed = doc?.feed;
  if (feed) {
    return asArray(feed.entry).map((it: Record<string, unknown>) => {
      const links = asArray(it.link as Record<string, string> | Record<string, string>[]);
      const href = links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate")?.["@_href"] ?? "";
      return {
        title: stripHtml(text(it.title)),
        link: href,
        description: text(it.summary) || text(it.content),
        pubDate: toIso(text(it.updated) || text(it.published)),
        guid: text(it.id) || href,
      };
    });
  }
  return [];
}
