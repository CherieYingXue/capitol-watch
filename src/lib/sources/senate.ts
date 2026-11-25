import type { Category, Item } from "../types";
import { asArray, enrich, fetchText, safeUrl, stripHtml, text, toIso, truncate, xml } from "./util";

export const SENATE_SCHEDULE_URL = "https://www.senate.gov/general/committee_schedules/hearings.xml";
const SENATE_HEARINGS_PAGE = "https://www.senate.gov/committees/hearings_meetings.htm";

type Raw = Record<string, unknown>;

function ordinal(n: string): string {
  const v = Number(n);
  const s = ["th", "st", "nd", "rd"];
  const m = v % 100;
  return `${v}${s[(m - 20) % 10] || s[m] || s[0]}`;
}

function senateCategory(type: string, matter: string): Category {
  if (/hearing/i.test(type)) return "hearing";
  if (/business meeting|executive session|markup/i.test(type) || /\bto consider\b|markup/i.test(matter)) return "markup";
  return "meeting";
}

export async function fetchSenateSchedule(): Promise<Item[]> {
  const body = await fetchText(SENATE_SCHEDULE_URL);
  const doc = xml.parse(body);
  const meetings = asArray(doc?.css_meetings_scheduled?.meeting) as Raw[];
  const items: Item[] = [];

  for (const m of meetings) {
    const id = text(m.identifier);
    const committee = text(m.committee);
    if (!id || !committee) continue;
    const type = text(m.type);
    const matter = stripHtml(text(m.matter));
    const dateIso = text(m.date_iso_8601);
    const timeIso = text(m.time_iso_8601) || "09:00:00";
    const eventDate = toIso(`${dateIso}T${timeIso}-05:00`) ?? toIso(dateIso) ?? new Date().toISOString();
    const updated = toIso(text(m.last_update_iso_8601).replace(/Z(?=[+-]\d\d:\d\d$)/, "")) ?? eventDate;
    const video = safeUrl(text(m.video_url));
    const docs = asArray((m.Documents as Raw | undefined)?.AssociatedDocument as Raw | Raw[]);

    const documents = docs.map((d) => {
      const prefix = String(d["@_document_prefix"] ?? "");
      const num = String(d["@_document_num"] ?? "");
      const congress = String(d["@_congress"] ?? "");
      const desc = String(d["@_document_description"] ?? "").trim();
      let url: string | undefined;
      if (prefix === "PN" && congress && num) url = `https://www.congress.gov/nomination/${ordinal(congress)}-congress/${num}`;
      else if (/^(S|H\.?R|S\.? ?Res|H\.? ?Res)/i.test(prefix) && congress && num) {
        const kind = prefix.replace(/[.\s]/g, "").toLowerCase();
        const path = { s: "senate-bill", hr: "house-bill", sres: "senate-resolution", hres: "house-resolution", sjres: "senate-joint-resolution", hjres: "house-joint-resolution", sconres: "senate-concurrent-resolution", hconres: "house-concurrent-resolution" }[kind];
        if (path) url = `https://www.congress.gov/bill/${ordinal(congress)}-congress/${path}/${num}`;
      }
      return { prefix, num, congress, desc, url };
    });

    items.push(
      enrich({
        id: `senate-mtg-${id}`,
        title: matter || `${committee} ${type}`,
        url: video || SENATE_HEARINGS_PAGE,
        summary: `${type}${text(m.room) ? ` · Room ${text(m.room)}` : ""}`,
        date: updated,
        eventDate,
        time: text(m.time),
        location: text(m.room) || undefined,
        chamber: "Senate",
        category: senateCategory(type, matter),
        committee: `Senate ${committee}`,
        source: "Senate.gov committee schedule",
        sourceKind: "official",
        documents: documents.map((d) => ({
          label: d.prefix && d.num ? `${d.prefix} ${d.num}${d.desc ? ` – ${truncate(d.desc, 140)}` : ""}` : d.desc,
          url: d.url,
        })),
      }),
    );

    for (const d of documents) {
      if (d.prefix !== "PN" || !d.desc) continue;
      items.push(
        enrich({
          id: `senate-pn-${d.congress}-${d.num}-${id}`,
          title: truncate(d.desc.replace(/,? vice .*$/i, "").replace(/\.$/, ""), 220),
          url: d.url ?? SENATE_HEARINGS_PAGE,
          summary: `Before the Senate ${committee} on ${dateIso} (${type}). PN ${d.num}.`,
          date: updated,
          eventDate,
          chamber: "Senate",
          category: "nomination",
          committee: `Senate ${committee}`,
          source: "Senate.gov committee schedule",
          sourceKind: "official",
          stage: /hearing/i.test(type) ? "Confirmation hearing" : "Committee vote",
        }),
      );
    }
  }
  return items;
}
