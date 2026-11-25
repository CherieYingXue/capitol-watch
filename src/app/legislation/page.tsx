import { ItemList, PageHeader, Section, TrendingBills } from "@/components/blocks";
import { ItemExplorer } from "@/components/item-explorer";
import { getDigest } from "@/lib/digest";
import { movingLegislation } from "@/lib/select";

export const metadata = { title: "Bills & resolutions – Capitol Watch" };

export default async function LegislationPage() {
  const d = await getDigest();
  const all = d.items.filter((i) => i.category === "bill" || i.category === "resolution");
  const moving = movingLegislation(d.items).filter((i) => i.category !== "report");
  const mediaCoverage = all.filter((i) => i.sourceKind === "media");
  const official = all.filter((i) => i.sourceKind === "official");

  return (
    <>
      <PageHeader
        title="Bills & resolutions"
        description="New bill and resolution texts as the Government Publishing Office releases them, tagged by stage — introduced, reported by committee, passed a chamber, or sent to the President."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Latest legislative texts">
            <ItemExplorer items={official} emptyText="GovInfo has not published new bill texts recently." />
          </Section>
        </div>
        <div className="space-y-8">
          <Section title="Advancing" >
            <ItemList items={moving.slice(0, 10)} compact empty="No bills reported or passed in the latest releases." />
          </Section>
          <Section title="Most-viewed on Congress.gov">
            <TrendingBills bills={d.trendingBills} />
          </Section>
          <Section title="In the news">
            <ItemList items={mediaCoverage.slice(0, 6)} compact empty="No legislation headlines right now." />
          </Section>
        </div>
      </div>
    </>
  );
}
