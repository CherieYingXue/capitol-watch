import { ItemList, PageHeader, Section } from "@/components/blocks";
import { ItemExplorer } from "@/components/item-explorer";
import { getDigest } from "@/lib/digest";
import { appointments } from "@/lib/select";

export const metadata = { title: "Appointments & nominations – Capitol Watch" };

export default async function AppointmentsPage() {
  const d = await getDigest();
  const all = appointments(d.items);
  const nominations = all.filter((i) => i.category === "nomination" && i.sourceKind === "official");
  const posts = all.filter((i) => i.category === "appointment");
  const confirmations = all.filter((i) => i.category === "nomination" && i.sourceKind === "media");

  return (
    <>
      <PageHeader
        title="Appointments & nominations"
        description="Presidential nominations before Senate committees, confirmation votes, and moves for committee chairs, ranking members and party leadership posts."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Nominations before Senate committees">
            <ItemExplorer
              items={nominations}
              hideChinaToggle
              emptyText="No nominations are on upcoming Senate committee agendas. Add a free Congress.gov API key to track every pending nomination."
            />
          </Section>
        </div>
        <div className="space-y-8">
          <Section title="Committee chairs & leadership posts">
            <ItemList items={posts.slice(0, 10)} compact empty="No committee leadership news this week." />
          </Section>
          <Section title="Confirmations in the news">
            <ItemList items={confirmations.slice(0, 10)} compact empty="No confirmation news this week." />
          </Section>
        </div>
      </div>
    </>
  );
}
