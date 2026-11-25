import { getDigest } from "@/lib/digest";

export async function GET() {
  const digest = await getDigest();
  return Response.json(digest);
}
