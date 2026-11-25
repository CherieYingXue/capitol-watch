import { cacheLife, cacheTag } from "next/cache";
import { collectDigest } from "./collect";
import type { Digest } from "./types";

export async function getDigest(): Promise<Digest> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
  cacheTag("digest");
  return collectDigest();
}
