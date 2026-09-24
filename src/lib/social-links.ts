import { prisma } from "./db";

// Products that social posts link to — a /san-pham/<id> link in the post
// text, or a post composed from that product. Those posts (and the ads run
// on them) stay up on Facebook/Instagram indefinitely, so such a product is
// hidden rather than deleted: a hidden product's page still opens, says the
// item is no longer sold and suggests similar ones (see san-pham/[id]).
const PRODUCT_LINK = /\/san-pham\/([a-z0-9]{10,})/gi;

/** Product id → how many social posts link to it. */
export async function getSocialLinkedProducts(): Promise<Map<string, number>> {
  const posts = await prisma.socialPost.findMany({ select: { productId: true, message: true } });
  const counts = new Map<string, number>();
  for (const post of posts) {
    const ids = new Set<string>();
    if (post.productId) ids.add(post.productId);
    for (const match of post.message?.matchAll(PRODUCT_LINK) ?? []) ids.add(match[1]);
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
