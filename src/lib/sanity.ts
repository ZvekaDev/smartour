import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

const projectId = import.meta.env.SANITY_PROJECT_ID ?? "yrilioxt";
const dataset = import.meta.env.SANITY_DATASET ?? "production";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  // The "production" dataset is public, so reads don't need a token — keeps
  // the site build free of any secret dependency.
  //
  // useCdn is false on purpose: this site fetches Sanity data once per build
  // (not per visitor request), so there's no request-volume reason to use the
  // CDN, and the CDN's eventual-consistency lag was intermittently causing
  // webhook-triggered builds (which can start within ~10s of a publish) to
  // bake in stale content. The primary API is always strongly consistent.
  useCdn: false,
});

const builder = imageUrlBuilder(sanityClient);

export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
