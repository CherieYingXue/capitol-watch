import { ChinaBanner, ItemList, PageHeader, Section, StatCard, TopicGrid, TrendingBills } from "@/components/blocks";
import { getDigest } from "@/lib/digest";
import { activeChinaAlerts, appointments, investigations, media, movingLegislation, upcoming } from "@/lib/select";

export default async function OverviewPage() {
  const d = await getDigest();
  const alerts = activeChinaAlerts(d);
  const week = upcoming(d, 7);
  const moving = movingLegislation(d.items);
  const posts = appointments(d.items);
  const probes = investigations(d.items);
  const news = media(d.items);
  const now = Date.parse(d.generatedAt);
  const newBills = d.items.filter(
    (i) => (i.category === "bill" || i.category === "resolution") && now - Date.parse(i.date) < 7 * 86400000,
  );

  return (
    <>
      <PageHeader
        title="What's happening on Capitol Hill"
        description="Committee hearings, markups, bills, investigations, nominations and leadership moves across the House and Senate — from official schedules and the congressional press."
      />

      <ChinaBanner alerts={alerts} />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Committee events" value={week.length} hint="Next 7 days" href="/hearings" />
        <StatCard label="New bill texts" value={newBills.length} hint="Past 7 days" href="/legislation" />
        <StatCard label="Nominations & posts" value={posts.length} hint="In committee or in the news" href="/appointments" />
        <StatCard label="Investigations" value={probes.length} hint="Opened, expanded or reported" href="/investigations" />
        <StatCard label="China-related" value={alerts.length} hint="Active alerts (72 h)" href="/china" tone="red" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Section title="Hot topics this week">
            <TopicGrid topics={d.topics} />
          </Section>

          <Section title="Coming up in committee" href="/hearings" hrefLabel="Full schedule">
            <ItemList
              items={week.slice(0, 8)}
              compact
              empty="No committee hearings are scheduled for the next 7 days — Congress may be in recess."
            />
          </Section>

          <Section title="Legislation on the move" href="/legislation">
            <ItemList
              items={moving.slice(0, 6)}
              compact
              empty="No bills reported by committee or passed in the latest GovInfo releases."
            />
          </Section>
        </div>

        <div className="space-y-8">
          <Section title="Most-viewed bills" href="https://www.congress.gov/most-viewed-bills" hrefLabel="Congress.gov">
            <TrendingBills bills={d.trendingBills.slice(0, 8)} />
          </Section>

          <Section title="Appointments & nominations" href="/appointments">
            <ItemList items={posts.slice(0, 5)} compact empty="No nominations or committee posts in the feeds right now." />
          </Section>

          <Section title="Investigations" href="/investigations">
            <ItemList items={probes.slice(0, 5)} compact empty="No investigations reported this week." />
          </Section>

          <Section title="Media pulse" href="/news">
            <ItemList items={news.slice(0, 6)} compact empty="News feeds are unavailable right now." />
          </Section>
        </div>
      </div>
    </>
  );
}
