import { ItemList, PageHeader, Section } from "@/components/blocks";
import { ItemExplorer } from "@/components/item-explorer";
import { getDigest } from "@/lib/digest";
import { media, statements } from "@/lib/select";

export const metadata = { title: "Media & statements – Capitol Watch" };

export default async function NewsPage() {
  const d = await getDigest();
  return (
    <>
      <PageHeader
        title="Media reports & committee statements"
        description="Congressional coverage from Politico, The Hill, Roll Call and Google News, alongside press releases from committees and the Speaker's office."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Media reports">
            <ItemExplorer items={media(d.items)} emptyText="News feeds are unavailable right now." />
          </Section>
        </div>
        <Section title="Official statements">
          <ItemList items={statements(d.items).slice(0, 15)} compact empty="No recent committee press releases." />
        </Section>
      </div>
    </>
  );
}
