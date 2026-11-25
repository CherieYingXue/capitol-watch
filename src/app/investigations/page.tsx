import { PageHeader } from "@/components/blocks";
import { ItemExplorer } from "@/components/item-explorer";
import { getDigest } from "@/lib/digest";
import { investigations } from "@/lib/select";

export const metadata = { title: "Investigations – Capitol Watch" };

export default async function InvestigationsPage() {
  const d = await getDigest();
  return (
    <>
      <PageHeader
        title="Congressional investigations"
        description="Probes, subpoenas, oversight letters, ethics inquiries and investigative reports from committees and the congressional press corps."
      />
      <ItemExplorer items={investigations(d.items)} emptyText="No investigations surfaced in the past week." />
    </>
  );
}
