import type { Item, TrendingBill } from "../types";
import { enrich, fetchText, parseRss, safeUrl, stripHtml } from "./util";

export const GOVINFO_BILLS_URL = "https://www.govinfo.gov/rss/bills.xml";
export const GOVINFO_HEARINGS_URL = "https://www.govinfo.gov/rss/chrg.xml";
export const MOST_VIEWED_URL = "https://www.congress.gov/rss/most-viewed-bills.xml";

const VERSIONS: Record<string, { stage: string; weight: number }> = {
  ih: { stage: "Introduced in House", weight: 1 },
  is: { stage: "Introduced in Senate", weight: 1 },
  rh: { stage: "Reported by House committee", weight: 3 },
  rs: { stage: "Reported by Senate committee", weight: 3 },
  rfh: { stage: "Referred to House committee", weight: 2 },
  rfs: { stage: "Referred to Senate committee", weight: 2 },
  rch: { stage: "Committee referral changed", weight: 1 },
  rcs: { stage: "Committee referral changed", weight: 1 },
  pch: { stage: "Placed on House calendar", weight: 3 },
  pcs: { stage: "Placed on Senate calendar", weight: 3 },
  eh: { stage: "Passed House", weight: 4 },
  es: { stage: "Passed Senate", weight: 4 },
  eah: { stage: "House amendment passed", weight: 4 },
  eas: { stage: "Senate amendment passed", weight: 4 },
  ath: { stage: "Agreed to by House", weight: 4 },
  ats: { stage: "Agreed to by Senate", weight: 4 },
  cph: { stage: "Considered and passed House", weight: 4 },
  cps: { stage: "Considered and passed Senate", weight: 4 },
  enr: { stage: "Passed Congress (enrolled)", weight: 5 },
};

const TYPE_PATHS: Record<string, { path: string; label: string; resolution: boolean }> = {
  hr: { path: "house-bill", label: "H.R.", resolution: false },
  s: { path: "senate-bill", label: "S.", resolution: false },
  hres: { path: "house-resolution", label: "H.Res.", resolution: true },
  sres: { path: "senate-resolution", label: "S.Res.", resolution: true },
  hjres: { path: "house-joint-resolution", label: "H.J.Res.", resolution: true },
  sjres: { path: "senate-joint-resolution", label: "S.J.Res.", resolution: true },
  hconres: { path: "house-concurrent-resolution", label: "H.Con.Res.", resolution: true },
  sconres: { path: "senate-concurrent-resolution", label: "S.Con.Res.", resolution: true },
};

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const m = n % 100;
  return `${n}${s[(m - 20) % 10] || s[m] || s[0]}`;
}

export function currentCongress(now: Date): number {
  const year = now.getUTCFullYear();
  const startedThisYear = year % 2 === 1 && now.getUTCMonth() === 0 && now.getUTCDate() < 3;
  return Math.floor((year - 1789) / 2) + 1 - (startedThisYear ? 1 : 0);
}

export async function fetchGovInfoBills(): Promise<Item[]> {
  const entries = parseRss(await fetchText(GOVINFO_BILLS_URL));
  const items: Item[] = [];
  for (const e of entries) {
    const m = e.guid.match(/^BILLS-(\d+)([a-z]+?)(\d+)([a-z]+)$/);
    if (!m) continue;
    const [, congress, type, number, version] = m;
    const meta = TYPE_PATHS[type];
    if (!meta) continue;
    const v = VERSIONS[version] ?? { stage: `Version ${version.toUpperCase()}`, weight: 1 };
    const shortTitle = e.title.replace(/^.*?\(\w+\)\s*-\s*/, "").trim() || e.title;
    items.push(
      enrich({
        id: `govinfo-${e.guid}`,
        title: `${meta.label} ${number} – ${shortTitle}`,
        url: `https://www.congress.gov/bill/${ordinal(Number(congress))}-congress/${meta.path}/${number}`,
        summary: `${v.stage}. Bill text published on GovInfo.`,
        date: e.pubDate ?? new Date().toISOString(),
        chamber: type.startsWith("h") ? "House" : "Senate",
        category: meta.resolution ? "resolution" : "bill",
        source: "GovInfo (U.S. GPO)",
        sourceKind: "official",
        stage: v.stage,
        documents: [{ label: "Bill text (GovInfo)", url: safeUrl(e.link) }],
      }),
    );
  }
  return items;
}

export async function fetchGovInfoHearings(now: Date): Promise<Item[]> {
  const congress = currentCongress(now);
  const wanted = new RegExp(`\\b(${ordinal(congress)}|${ordinal(congress - 1)}) Congress`, "i");
  const entries = parseRss(await fetchText(GOVINFO_HEARINGS_URL));
  return entries
    .filter((e) => wanted.test(e.title))
    .map((e) => {
      const chamber = /^Senate/i.test(e.title) ? "Senate" : /^House/i.test(e.title) ? "House" : "Joint";
      const desc = e.title.replace(/^.*?Congress\s*-\s*/i, "").trim();
      return enrich({
        id: `govinfo-${e.guid}`,
        title: desc,
        url: safeUrl(e.link),
        summary: "Official hearing record published by the Government Publishing Office.",
        date: e.pubDate ?? now.toISOString(),
        chamber,
        category: "report",
        source: "GovInfo hearing records",
        sourceKind: "official",
        stage: "Hearing record published",
      });
    });
}

export async function fetchMostViewedBills(): Promise<TrendingBill[]> {
  const entries = parseRss(await fetchText(MOST_VIEWED_URL));
  const latest = entries[0];
  if (!latest) return [];
  const out: TrendingBill[] = [];
  const re = /<a href=['"]([^'"]+)['"]>([^<]+)<\/a>\s*\[(\d+)\w*\]\s*-\s*([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(latest.description))) {
    out.push({ url: safeUrl(m[1]), label: m[2].trim(), congress: m[3], title: stripHtml(m[4]).trim() });
  }
  return out;
}
