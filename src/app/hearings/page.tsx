import { ItemList, PageHeader, Section } from "@/components/blocks";
import { ItemExplorer } from "@/components/item-explorer";
import { getDigest } from "@/lib/digest";
import { schedule, upcoming } from "@/lib/select";

export const metadata = { title: "Committee hearings – Capitol Watch" };

export default async function HearingsPage() {
  const d = await getDigest();
  const ahead = upcoming(d, 21);
  const now = Date.parse(d.generatedAt) - 6 * 3600000;
  const recent = schedule(d.items)
    .filter((i) => Date.parse(i.eventDate!) < now)
    .reverse();
  const records = d.items.filter((i) => i.category === "report");

  return (
    <>
      <PageHeader
        title="Committee hearings & markups"
        description="The official House and Senate committee calendars: hearings, markups, business meetings and nomination votes, with rooms, times (Eastern) and the measures under consideration."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Upcoming">
            <ItemExplorer
              items={ahead}
              groupByDay
              pageSize={60}
              emptyText="No committee events are on the official calendars for the next 3 weeks. Congress may be in recess."
            />
          </Section>
        </div>
        <div className="space-y-8">
          <Section title="Recently held">
            <ItemList items={recent.slice(0, 12)} compact empty="No committee events in the past few days." />
          </Section>
          <Section title="Newly published hearing records">
            <ItemList items={records.slice(0, 8)} compact empty="No new hearing transcripts from GovInfo this week." />
          </Section>
        </div>
      </div>
    </>
  );
}
