// Photo links found on other shops' pages, cleaned up for importing.
// Isomorphic: the server reads pages with it, and the import screen uses it
// on what the "Gửi về TAT" bookmark sends.

/** Many shops show a small copy and name the full photo predictably —
 *  turn the thumbnail link into the full one. Unknown links pass through. */
export function upgradeImageUrl(url: string): string {
  let u = url.trim();
  if (u.startsWith("//")) u = `https:${u}`;
  // Taobao / Tmall / 1688 (alicdn): "x.jpg_220x220q90.jpg_.webp" → "x.jpg"
  if (/alicdn\.com|tbcdn\.cn|taobaocdn\.com/i.test(u)) {
    u = u.replace(/(\.(?:jpe?g|png|webp))_[^/]*$/i, "$1");
  }
  // Shopify: "x_400x.jpg?v=1", "x_400x400_crop_center.jpg" → "x.jpg?v=1"
  if (/cdn\.shopify\.com|\/cdn\/shop\//i.test(u)) {
    u = u.replace(
      /_(?:\d+x\d*|x\d+|pico|icon|thumb|small|compact|medium|large|grande|master)(?:_crop_[a-z]+)?(?:@\dx)?(?=\.[a-z]+(?:\?|$))/i,
      ""
    );
    u = dropParams(u, ["width", "height", "crop"]);
  }
  // Haravan (hstatic): "x_medium.jpg", "x_1024x1024.jpg" → "x.jpg"
  if (/hstatic\.net/i.test(u)) {
    u = u.replace(/_(?:small|medium|large|grande|compact|thumb|icon|master|\d+x\d+)(?=\.[a-z]+(?:\?|$))/i, "");
  }
  // Sapo / Bizweb: ".../thumb/large/100/..." → ".../100/..."
  u = u.replace(/(bizweb\.dktcdn\.net)\/thumb\/[a-z0-9_]+\//i, "$1/");
  // Yupoo: small/medium/square → big
  u = u.replace(/(photo\.yupoo\.com\/.+\/)(?:small|medium|square|thumb)\.(jpe?g|png|webp)$/i, "$1big.$2");
  // Weidian / Weishang (geilicdn, wsxcme): "?w=200&h=200" size params
  if (/geilicdn\.com|wsxcme\.com|szwego\.com/i.test(u)) u = dropParams(u, ["w", "h", "imageView2", "cp"]);
  return u;
}

function dropParams(url: string, names: string[]): string {
  try {
    const parsed = new URL(url);
    for (const n of names) parsed.searchParams.delete(n);
    return parsed.href;
  } catch {
    return url;
  }
}

/** Links that are almost never a product photo: logos, icons, payment
 *  badges, loading spinners, tracking pixels, vector art. */
export function isJunkImageUrl(url: string): boolean {
  return (
    !/^https?:\/\//i.test(url) ||
    /\.(svg|ico)(\?|$)/i.test(url) ||
    /(^|[/_.-])(logo|icon|icons|sprite|favicon|avatar|payment|placeholder|loading|loader|blank|spacer|pixel|badge|flag|emoji|qrcode|qr-code|banner-?ad)([/_.-]|$)/i.test(
      url
    ) ||
    /facebook\.com\/tr|google-analytics|doubleclick|googletagmanager/i.test(url)
  );
}

/** Tracking parameters dropped from a product link before it's stored. */
export function cleanPageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|gad_|ttclid|mc_|spm|scm|pvid|_ga|ref$|from$|share)/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hash = "";
    return parsed.href;
  } catch {
    return url;
  }
}

export function hasChinese(text: string): boolean {
  return /[㐀-鿿]/.test(text);
}

/** "Áo Thun Dáng Rộng | UNIQLO VN" → "Áo Thun Dáng Rộng": drops a trailing
 *  " | Shop" / " - Shop" part that names the site. */
export function stripSiteName(title: string, url: URL, siteName?: string): string {
  const brand = url.hostname.replace(/^www\./, "").split(".")[0].toLowerCase();
  const parts = title.split(/\s+[|–—-]\s+/);
  while (parts.length > 1) {
    const last = parts[parts.length - 1].toLowerCase();
    if (last.includes(brand) || (siteName && last === siteName.toLowerCase())) parts.pop();
    else break;
  }
  return parts.join(" | ").replace(/\s+/g, " ").trim();
}
