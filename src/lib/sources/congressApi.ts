import type { Item } from "../types";
import { ordinal } from "./govinfo";
import { enrich, fetchText, toIso } from "./util";

const API = "https://api.congress.gov/v3";

const TYPE_PATHS: Record<string, { path: string; label: string; resolution: boolean }> = {
  HR: { path: "house-bill", label: "H.R.", resolution: false },
  S: { path: "senate-bill", label: "S.", resolution: false },
  HRES: { path: "house-resolution", label: "H.Res.", resolution: true },
  SRES: { path: "senate-resolution", label: "S.Res.", resolution: true },
  HJRES: { path: "house-joint-resolution", label: "H.J.Res.", resolution: true },
  SJRES: { path: "senate-joint-resolution", label: "S.J.Res.", resolution: true },
  HCONRES: { path: "house-concurrent-resolution", label: "H.Con.Res.", resolution: true },
  SCONRES: { path: "senate-concurrent-resolution", label: "S.Con.Res.", resolution: true },
};

interface ApiBill {
  congress: number;
  number: string;
  type: string;
  title: string;
  originChamber?: string;
  updateDate?: string;
  latestAction?: { actionDate?: string; text?: string };
}

interface ApiNomination {
  congress: number;
  number: number;
  partNumber?: string;
  citation?: string;
  description?: string;
  organization?: string;
  receivedDate?: string;
  updateDate?: string;
  latestAction?: { actionDate?: string; text?: string };
}

async function get<T>(path: string, key: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  return JSON.parse(await fetchText(`${API}${path}${sep}format=json&api_key=${encodeURIComponent(key)}`)) as T;
}

function stageFromAction(text: string): string {
  if (/became public law|signed by president/i.test(text)) return "Signed into law";
  if (/presented to president/i.test(text)) return "Sent to the President";
  if (/passed|agreed to/i.test(text)) return "Passed a chamber";
  if (/reported|ordered to be reported|markup/i.test(text)) return "Committee action";
  if (/hearings? held/i.test(text)) return "Committee hearing held";
  if (/referred to/i.test(text)) return "Referred to committee";
  if (/introduced/i.test(text)) return "Introduced";
  return "Updated";
}

export async function fetchCongressBills(key: string): Promise<Item[]> {
  const data = await get<{ bills: ApiBill[] }>("/bill?sort=updateDate+desc&limit=100", key);
  return (data.bills ?? []).flatMap((b) => {
    const meta = TYPE_PATHS[b.type?.toUpperCase()];
    if (!meta) return [];
    const action = b.latestAction?.text ?? "";
    return [
      enrich({
        id: `congressgov-bill-${b.congress}-${b.type}-${b.number}`,
        title: `${meta.label} ${b.number} – ${b.title}`,
        url: `https://www.congress.gov/bill/${ordinal(b.congress)}-congress/${meta.path}/${b.number}`,
        summary: action ? `Latest action (${b.latestAction?.actionDate}): ${action}` : undefined,
        date: toIso(b.updateDate) ?? toIso(b.latestAction?.actionDate) ?? new Date().toISOString(),
        chamber: b.originChamber === "Senate" ? "Senate" : "House",
        category: meta.resolution ? "resolution" : "bill",
        source: "Congress.gov API",
        sourceKind: "official",
        stage: stageFromAction(action),
      }),
    ];
  });
}

export async function fetchCongressNominations(key: string): Promise<Item[]> {
  const data = await get<{ nominations: ApiNomination[] }>("/nomination?sort=updateDate+desc&limit=60", key);
  return (data.nominations ?? []).map((n) => {
    const action = n.latestAction?.text ?? "";
    const stage = /confirmed/i.test(action)
      ? "Confirmed"
      : /hearings? held/i.test(action)
        ? "Confirmation hearing held"
        : /reported/i.test(action)
          ? "Reported by committee"
          : /referred/i.test(action)
            ? "Referred to committee"
            : /withdrawn|returned/i.test(action)
              ? "Withdrawn or returned"
              : "Pending";
    return enrich({
      id: `congressgov-pn-${n.congress}-${n.number}-${n.partNumber ?? ""}`,
      title: n.description?.trim() || `${n.citation ?? `PN${n.number}`} – ${n.organization ?? "Nomination"}`,
      url: `https://www.congress.gov/nomination/${ordinal(n.congress)}-congress/${n.number}`,
      summary: `${n.citation ?? `PN${n.number}`}${n.organization ? ` · ${n.organization}` : ""}${action ? ` · Latest: ${action}` : ""}`,
      date: toIso(n.updateDate) ?? toIso(n.latestAction?.actionDate) ?? new Date().toISOString(),
      chamber: "Senate",
      category: "nomination",
      source: "Congress.gov API",
      sourceKind: "official",
      stage,
    });
  });
}
