import type { Item, TopicStat } from "./types";

export interface TopicDef {
  id: string;
  label: string;
  pattern: RegExp;
}

const rx = (source: string) => new RegExp(`\\b(?:${source})`, "i");

export const TOPICS: TopicDef[] = [
  { id: "china", label: "China & CCP", pattern: rx("china|chinese|ccp|beijing|taiwan|hong kong|uyghur|tiktok|huawei|prc\\b") },
  { id: "defense", label: "Defense & NDAA", pattern: rx("ndaa|defense|military|pentagon|armed services|army|navy|air force|missile|golden dome") },
  { id: "budget", label: "Budget & Appropriations", pattern: rx("appropriation|spending|budget|shutdown|continuing resolution|debt limit|deficit|rescission|reconciliation") },
  { id: "trade", label: "Trade & Tariffs", pattern: rx("tariff|trade|export|import|usmca|customs") },
  { id: "tech", label: "AI, Tech & Cyber", pattern: rx("artificial intelligence|\\bai\\b|cyber|privacy|social media|broadband|semiconductor|chips\\b|crypto|digital asset|stablecoin|big tech|nvidia|data center") },
  { id: "health", label: "Health Care", pattern: rx("health|medicare|medicaid|drug|fda|affordable care|aca\\b|obamacare|opioid|fentanyl|hospital|insurance premium") },
  { id: "immigration", label: "Immigration & Border", pattern: rx("immigra|border|\\bice\\b|asylum|visa|deport|migrant|cbp\\b") },
  { id: "energy", label: "Energy & Environment", pattern: rx("energy|oil\\b|natural gas|climate|nuclear|\\bepa\\b|electric|permitting|pipeline|emission|wildfire") },
  { id: "oversight", label: "Investigations & Oversight", pattern: rx("investigat|oversight|subpoena|inspector general|whistleblower|probe\\b|contempt|inquiry|impeach") },
  { id: "judiciary", label: "Courts & Justice", pattern: rx("court|judge|judicial|justice department|\\bdoj\\b|\\bfbi\\b|attorney general|crime|police") },
  { id: "foreign", label: "Foreign Affairs", pattern: rx("ukraine|russia|israel|iran|gaza|nato|sanction|venezuela|foreign affairs|foreign relations|state department|ambassador") },
  { id: "economy", label: "Taxes, Economy & Finance", pattern: rx("\\btax|\\birs\\b|bank|federal reserve|\\bfed\\b|housing|inflation|affordab|jobs|economy|small business|wall street") },
  { id: "veterans", label: "Veterans", pattern: rx("veteran|\\bva\\b") },
  { id: "elections", label: "Elections & Campaigns", pattern: rx("election|campaign|voting|voter|midterm|ballot|primary") },
  { id: "leadership", label: "Leadership & Committee Posts", pattern: rx("speaker|majority leader|minority leader|whip|caucus|ranking member|chairman|chairwoman|committee chair|gavel|committee assignment|leadership race") },
  { id: "nominations", label: "Nominations & Confirmations", pattern: rx("nominat|confirm|nominee|to be (?:an? |the )?(?:assistant |under |deputy )?(?:secretary|ambassador|judge|director|member|commissioner)") },
];

export function classifyTopics(text: string): string[] {
  return TOPICS.filter((t) => t.pattern.test(text)).map((t) => t.id);
}

export function topicLabel(id: string): string {
  return TOPICS.find((t) => t.id === id)?.label ?? id;
}

export function computeTopicStats(items: Item[], now: number): TopicStat[] {
  const horizon = now - 10 * 24 * 3600 * 1000;
  const recent = items.filter((i) => Date.parse(i.eventDate ?? i.date) >= horizon || Date.parse(i.date) >= horizon);
  return TOPICS.map((t) => {
    const matched = recent.filter((i) => i.topics.includes(t.id));
    return {
      id: t.id,
      label: t.label,
      count: matched.length,
      officialCount: matched.filter((i) => i.sourceKind === "official").length,
      chinaRelated: t.id === "china",
      sample: matched.slice(0, 3).map((i) => ({ title: i.title, url: i.url })),
    };
  })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.officialCount * 2 + b.count - (a.officialCount * 2 + a.count));
}
