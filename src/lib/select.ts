import { CHINA_LEVEL_RANK } from "./china";
import type { Digest, Item } from "./types";

const DAY = 86400000;

export function chinaItems(items: Item[]): Item[] {
  return items
    .filter((i) => i.china.level)
    .sort((a, b) => {
      const rank = CHINA_LEVEL_RANK[b.china.level!] - CHINA_LEVEL_RANK[a.china.level!];
      if (rank !== 0) return rank;
      const official = Number(b.sourceKind === "official") - Number(a.sourceKind === "official");
      if (official !== 0) return official;
      return Date.parse(b.date) - Date.parse(a.date);
    });
}

export function activeChinaAlerts(d: Digest, hours = 72): Item[] {
  const now = Date.parse(d.generatedAt);
  return chinaItems(d.items).filter((i) => {
    if (i.china.level === "low") return false;
    const recent = now - Date.parse(i.date) <= hours * 3600000;
    const scheduledAhead = i.eventDate != null && Date.parse(i.eventDate) >= now - 6 * 3600000;
    return recent || scheduledAhead;
  });
}

export function schedule(items: Item[]): Item[] {
  return items
    .filter((i) => i.eventDate && (i.category === "hearing" || i.category === "markup" || i.category === "meeting"))
    .sort((a, b) => Date.parse(a.eventDate!) - Date.parse(b.eventDate!));
}

export function upcoming(d: Digest, days = 14): Item[] {
  const now = Date.parse(d.generatedAt) - 6 * 3600000;
  return schedule(d.items).filter((i) => {
    const t = Date.parse(i.eventDate!);
    return t >= now && t <= now + days * DAY;
  });
}

export const STAGE_WEIGHT: Record<string, number> = {
  "Passed Congress (enrolled)": 5,
  "Signed into law": 5,
  "Sent to the President": 5,
  "Passed House": 4,
  "Passed Senate": 4,
  "Passed a chamber": 4,
  "Agreed to by House": 4,
  "Agreed to by Senate": 4,
  "Considered and passed House": 4,
  "Considered and passed Senate": 4,
  "House amendment passed": 4,
  "Senate amendment passed": 4,
  "Reported by House committee": 3,
  "Reported by Senate committee": 3,
  "Committee action": 3,
  "Placed on House calendar": 3,
  "Placed on Senate calendar": 3,
  "Committee hearing held": 3,
  "Referred to House committee": 2,
  "Referred to Senate committee": 2,
};

export function legislation(items: Item[]): Item[] {
  return items.filter((i) => i.category === "bill" || i.category === "resolution" || i.category === "report");
}

export function movingLegislation(items: Item[]): Item[] {
  return legislation(items)
    .filter((i) => i.sourceKind === "official" && (STAGE_WEIGHT[i.stage ?? ""] ?? 1) >= 3)
    .sort((a, b) => (STAGE_WEIGHT[b.stage ?? ""] ?? 1) - (STAGE_WEIGHT[a.stage ?? ""] ?? 1) || Date.parse(b.date) - Date.parse(a.date));
}

export function appointments(items: Item[]): Item[] {
  return items
    .filter((i) => i.category === "nomination" || i.category === "appointment")
    .sort((a, b) => Date.parse(b.eventDate ?? b.date) - Date.parse(a.eventDate ?? a.date));
}

export function investigations(items: Item[]): Item[] {
  return items.filter((i) => i.category === "investigation");
}

export function media(items: Item[]): Item[] {
  return items.filter((i) => i.sourceKind === "media");
}

export function statements(items: Item[]): Item[] {
  return items.filter((i) => i.sourceKind === "official" && (i.category === "statement" || i.category === "investigation" || i.source.includes("Committee") || i.source.includes("Speaker")) && !i.eventDate && i.category !== "bill" && i.category !== "resolution" && i.category !== "report");
}
