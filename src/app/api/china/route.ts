import { getDigest } from "@/lib/digest";
import { activeChinaAlerts } from "@/lib/select";

export async function GET() {
  const digest = await getDigest();
  const alerts = activeChinaAlerts(digest).map((i) => ({
    id: i.id,
    title: i.title,
    url: i.url,
    level: i.china.level,
    terms: i.china.terms,
    chamber: i.chamber,
    category: i.category,
    committee: i.committee,
    source: i.source,
    date: i.date,
    eventDate: i.eventDate,
  }));
  return Response.json({ generatedAt: digest.generatedAt, count: alerts.length, alerts });
}
