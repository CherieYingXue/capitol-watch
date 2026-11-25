export type Chamber = "House" | "Senate" | "Joint" | "Congress";

export type Category =
  | "hearing"
  | "markup"
  | "meeting"
  | "bill"
  | "resolution"
  | "report"
  | "nomination"
  | "appointment"
  | "investigation"
  | "statement"
  | "news";

export type ChinaLevel = "high" | "medium" | "low";

export interface ChinaMatch {
  score: number;
  level: ChinaLevel | null;
  terms: string[];
}

export interface ItemDocument {
  label: string;
  url?: string;
}

export interface Item {
  id: string;
  title: string;
  url: string;
  summary?: string;
  /** When the item was published or last updated (ISO). */
  date: string;
  /** For scheduled events: when the hearing / meeting takes place (ISO). */
  eventDate?: string;
  time?: string;
  location?: string;
  chamber: Chamber;
  category: Category;
  committee?: string;
  source: string;
  sourceKind: "official" | "media";
  /** Bill stage such as "Introduced" or "Reported by committee". */
  stage?: string;
  topics: string[];
  china: ChinaMatch;
  documents?: ItemDocument[];
}

export interface SourceStatus {
  id: string;
  name: string;
  url: string;
  kind: "official" | "media";
  ok: boolean;
  count: number;
  error?: string;
}

export interface TopicStat {
  id: string;
  label: string;
  count: number;
  officialCount: number;
  chinaRelated: boolean;
  sample: { title: string; url: string }[];
}

export interface TrendingBill {
  label: string;
  title: string;
  url: string;
  congress: string;
}

export interface Digest {
  generatedAt: string;
  items: Item[];
  trendingBills: TrendingBill[];
  topics: TopicStat[];
  sources: SourceStatus[];
}
