import type { ChinaLevel, ChinaMatch } from "./types";

interface Term {
  label: string;
  pattern: RegExp;
  weight: number;
}

const term = (label: string, source: string, weight: number): Term => ({
  label,
  pattern: new RegExp(`\\b(?:${source})\\b`, "i"),
  weight,
});

/**
 * Weight 3 terms are unambiguous China references; weight 2 terms are policy
 * areas that on Capitol Hill are almost always about China; weight 1 terms only
 * strengthen a match and never trigger one on their own.
 */
const TERMS: Term[] = [
  term("China", "china|chinese", 3),
  term("CCP", "ccp|chinese communist party|communist china", 3),
  term("PRC", "prc|people'?s republic of china", 3),
  term("Beijing", "beijing", 3),
  term("Xi Jinping", "xi jinping|president xi", 3),
  term("Taiwan", "taiwan|taiwanese|taipei", 3),
  term("Hong Kong", "hong kong", 3),
  term("Xinjiang / Uyghurs", "xinjiang|uyghurs?|uighurs?", 3),
  term("Tibet", "tibet|tibetan|dalai lama", 3),
  term("South China Sea", "south china sea|east china sea|taiwan strait", 3),
  term("Huawei / ZTE", "huawei|zte", 3),
  term("TikTok / ByteDance", "tiktok|bytedance", 3),
  term("DeepSeek", "deepseek", 3),
  term("Chinese firms", "smic|catl|byd|dji|alibaba|tencent|temu|shein|hikvision|unitree|wuxi|bgi", 3),
  term("Confucius Institutes", "confucius institutes?", 3),
  term("United Front", "united front", 3),
  term("Select Committee on China", "select committee on (?:the )?(?:ccp|china|strategic competition)", 3),
  term("Foreign adversary", "foreign adversar(?:y|ies)|countries of concern|country of concern", 2),
  term("Rare earths / critical minerals", "rare earths?|critical minerals?", 2),
  term("Outbound investment", "outbound investments?|reverse cfius|cfius", 2),
  term("BIOSECURE", "biosecure", 2),
  term("Export controls", "export controls?|entity list|chip exports?|bis export", 2),
  term("Indo-Pacific", "indo-pacific|pacific deterrence|aukus", 2),
  term("Transnational repression", "transnational repression|police stations?", 2),
  term("Forced labor", "forced labor|uflpa", 2),
  term("Fentanyl precursors", "fentanyl precursors?", 2),
  term("Semiconductors", "semiconductors?|chips act|nvidia|advanced chips?", 1),
  term("Tariffs / trade", "tariffs?|de minimis|section 301|trade deal", 1),
  term("Supply chains", "supply chains?", 1),
];

export const CHINA_TERM_LABELS = TERMS.map((t) => t.label);

export function detectChina(text: string, official: boolean): ChinaMatch {
  const terms: string[] = [];
  let score = 0;
  let strongest = 0;
  for (const t of TERMS) {
    if (t.pattern.test(text)) {
      terms.push(t.label);
      score += t.weight;
      strongest = Math.max(strongest, t.weight);
    }
  }

  let level: ChinaLevel | null = null;
  if (strongest >= 2) {
    if (score >= 6 || (strongest === 3 && official)) level = "high";
    else if (strongest === 3 || score >= 4) level = "medium";
    else level = "low";
  }
  return { score, level, terms: level ? terms : [] };
}

export const CHINA_LEVEL_RANK: Record<ChinaLevel, number> = { high: 3, medium: 2, low: 1 };
