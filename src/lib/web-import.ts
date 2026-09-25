import { parse, type HTMLElement } from "node-html-parser";
import { safeFetch, SafeFetchError } from "./safe-fetch";
import { cleanPageUrl, hasChinese, isJunkImageUrl, stripSiteName, upgradeImageUrl } from "./image-source-url";

// Reads a product — or a list of products — from any shop's page, for
// Sản phẩm → Nhập (Yupoo has its own reader, src/lib/yupoo.ts). In order:
//   1. Shopify / Haravan: the shop's own product JSON (every photo, sizes).
//   2. WooCommerce: its Store API (every photo, sizes).
//   3. The product data shops publish for Google/Facebook (JSON-LD, Open
//      Graph) — most shop platforms do.
//   4. The page's own large photos, and links that look like products.
// Sites that block servers or need a login (Taobao, 1688, Instagram…) are
// what the "Gửi về TAT" bookmark is for. Server-only.

const MAX_PAGE_BYTES = 6 * 1024 * 1024;
const MAX_IMAGES = 60;

export class WebImportError extends Error {}

export type WebProduct = {
  url: string;
  title: string;
  description: string;
  // From the shop's own product data: meant to be this product's photos.
  images: string[];
  // Other large photos on the page — probably the product, maybe not.
  extraImages: string[];
  // Written sizes ("S M L", "39 40 41") for the size reader; may be empty.
  sizeText: string;
};

export type WebListItem = { url: string; title: string; image: string | null };

export type WebPage =
  | { kind: "product"; product: WebProduct }
  | { kind: "list"; url: string; title: string; items: WebListItem[]; next: string | null };

type Json = Record<string, unknown>;

async function fetchText(url: string, accept: string, referer?: string) {
  const res = await safeFetch(url, { accept, referer, maxBytes: MAX_PAGE_BYTES });
  const type = String(res.headers["content-type"] ?? "");
  const charset =
    type.match(/charset=([\w-]+)/i)?.[1] ??
    res.body.subarray(0, 4096).toString("latin1").match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ??
    "utf-8";
  let text: string;
  try {
    text = new TextDecoder(charset.toLowerCase()).decode(res.body);
  } catch {
    text = res.body.toString("utf8");
  }
  return { status: res.status, type, text, url: res.url };
}

async function fetchJson(url: string, referer: string): Promise<unknown | null> {
  try {
    const res = await fetchText(url, "application/json", referer);
    if (res.status !== 200) return null;
    return JSON.parse(res.text);
  } catch {
    return null;
  }
}

function abs(href: string | undefined | null, base: string): string | null {
  if (!href) return null;
  try {
    return new URL(href.trim(), base).href;
  } catch {
    return null;
  }
}

function textOf(html: string): string {
  return parse(`<div>${html}</div>`)
    .structuredText.split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 5000);
}

function uniqueImages(urls: (string | null | undefined)[], base: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const full = abs(raw, base);
    if (!full) continue;
    const url = upgradeImageUrl(full);
    if (isJunkImageUrl(url) || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out.slice(0, MAX_IMAGES);
}

/** Sizes in a "Size: S M L" line the size reader understands. */
function sizeLine(values: string[]) {
  return values.length ? `Size: ${values.join(" ")}` : "";
}

// ── Shopify / Haravan ────────────────────────────────────────────────

type ShopifyProduct = {
  title?: string;
  handle?: string;
  description?: string;
  body_html?: string;
  images?: (string | { src?: string })[];
  options?: ({ name?: string; values?: string[] } | string)[];
};

function fromShopify(p: ShopifyProduct, url: string): WebProduct | null {
  if (!p?.title || !Array.isArray(p.images)) return null;
  const images = uniqueImages(
    p.images.map((i) => (typeof i === "string" ? i : i?.src)),
    url
  );
  const sizes = (p.options ?? [])
    .filter((o): o is { name?: string; values?: string[] } => typeof o === "object")
    .filter((o) => /size|kích|cỡ|size|尺码|码/i.test(o.name ?? ""))
    .flatMap((o) => o.values ?? []);
  return {
    url,
    title: p.title,
    description: textOf(p.description ?? p.body_html ?? ""),
    images,
    extraImages: [],
    sizeText: sizeLine(sizes),
  };
}

async function readShopify(url: URL): Promise<WebPage | null> {
  const product = url.pathname.match(/\/products\/([^/?#]+)/);
  if (product) {
    const data = (await fetchJson(`${url.origin}/products/${product[1]}.js`, url.href)) as ShopifyProduct | null;
    const read = data && fromShopify(data, cleanPageUrl(url.href));
    return read ? { kind: "product", product: read } : null;
  }
  const collection = url.pathname.match(/\/collections\/([^/?#]+)\/?$/);
  const isRoot = url.pathname === "/" || url.pathname === "";
  if (!collection && !isRoot) return null;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const endpoint = collection
    ? `${url.origin}/collections/${collection[1]}/products.json?limit=60&page=${page}`
    : `${url.origin}/products.json?limit=60&page=${page}`;
  const data = (await fetchJson(endpoint, url.href)) as { products?: ShopifyProduct[] } | null;
  if (!Array.isArray(data?.products)) return null;
  // Past the last page: an empty list, not a guess from the page's HTML.
  if (data.products.length === 0 && page === 1) return null;
  const next = new URL(url.href);
  next.searchParams.set("page", String(page + 1));
  return {
    kind: "list",
    url: url.href,
    title: collection ? collection[1] : url.hostname,
    items: data.products
      .filter((p) => p.handle && p.title)
      .map((p) => {
        const first = p.images?.[0];
        return {
          url: `${url.origin}/products/${p.handle}`,
          title: p.title!,
          image: uniqueImages([typeof first === "string" ? first : first?.src], url.href)[0] ?? null,
        };
      }),
    // Shopify gives up to 60 here, Haravan caps at 50 — a full page means
    // there may be more.
    next: data.products.length >= 50 ? next.href : null,
  };
}

// ── WooCommerce ──────────────────────────────────────────────────────

type WooProduct = {
  name?: string;
  description?: string;
  short_description?: string;
  permalink?: string;
  images?: { src?: string }[];
  attributes?: { name?: string; terms?: { name?: string }[] }[];
};

async function readWoo(url: URL): Promise<WebProduct | null> {
  const slug = url.pathname.split("/").filter(Boolean).pop();
  if (!slug) return null;
  const data = (await fetchJson(
    `${url.origin}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(decodeURIComponent(slug))}`,
    url.href
  )) as WooProduct[] | null;
  const p = Array.isArray(data) ? data[0] : null;
  if (!p?.name) return null;
  const sizes = (p.attributes ?? [])
    .filter((a) => /size|kích|cỡ|尺码/i.test(a.name ?? ""))
    .flatMap((a) => (a.terms ?? []).map((t) => t.name ?? ""));
  return {
    url: cleanPageUrl(url.href),
    title: textOf(p.name),
    description: textOf(p.description || p.short_description || ""),
    images: uniqueImages((p.images ?? []).map((i) => i.src), url.href),
    extraImages: [],
    sizeText: sizeLine(sizes),
  };
}

// ── JSON-LD / Open Graph / the page itself ───────────────────────────

function jsonLdNodes(root: HTMLElement): Json[] {
  const nodes: Json[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") {
      const obj = value as Json;
      nodes.push(obj);
      if (obj["@graph"]) visit(obj["@graph"]);
    }
  };
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      visit(JSON.parse(script.rawText.trim()));
    } catch {}
  }
  return nodes;
}

function hasType(node: Json, type: string) {
  const t = node["@type"];
  return Array.isArray(t) ? t.includes(type) : t === type;
}

function ldImages(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(ldImages);
  if (typeof value === "object") {
    const obj = value as Json;
    return ldImages(obj.contentUrl ?? obj.url);
  }
  return [];
}

function meta(root: HTMLElement, key: string): string | undefined {
  const el = root.querySelector(`meta[property="${key}"]`) ?? root.querySelector(`meta[name="${key}"]`);
  return el?.getAttribute("content")?.trim() || undefined;
}

/** The best link to an <img>'s photo: zoom/full-size attributes first, then
 *  the widest srcset entry, then src. */
function imgUrl(img: HTMLElement): string | null {
  for (const attr of [
    "data-zoom-image",
    "data-large_image",
    "data-large-image",
    "data-full",
    "data-original",
    "data-origin-src",
    "data-src",
    "data-lazy-src",
    "data-ks-lazyload",
  ]) {
    const v = img.getAttribute(attr);
    if (v && !v.startsWith("data:")) return v;
  }
  const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset");
  if (srcset) {
    const best = srcset
      .split(",")
      .map((part) => part.trim().split(/\s+/))
      .map(([u, w]) => ({ u, w: parseFloat(w) || 0 }))
      .sort((a, b) => b.w - a.w)[0];
    if (best?.u && !best.u.startsWith("data:")) return best.u;
  }
  const src = img.getAttribute("src");
  return src && !src.startsWith("data:") ? src : null;
}

function isSmallImg(img: HTMLElement) {
  const w = Number(img.getAttribute("width"));
  const h = Number(img.getAttribute("height"));
  return (w > 0 && w < 150) || (h > 0 && h < 150);
}

function pageImages(root: HTMLElement, base: string): string[] {
  const main = root.querySelector("main") ?? root.querySelector("#main") ?? root;
  return uniqueImages(
    main
      .querySelectorAll("img")
      .filter((img) => !isSmallImg(img) && !img.closest("header, footer, nav"))
      .map(imgUrl),
    base
  );
}

/** Product links on a list page: links that wrap a photo and share the
 *  most common link shape ("/products/*", "/san-pham/*"…). */
function listItems(root: HTMLElement, base: string): WebListItem[] {
  const baseUrl = new URL(base);
  const groups = new Map<string, Map<string, WebListItem>>();
  for (const a of root.querySelectorAll("a[href]")) {
    if (a.closest("header, footer, nav")) continue;
    const img = a.querySelector("img");
    if (!img) continue;
    const href = abs(a.getAttribute("href"), base);
    if (!href) continue;
    const link = new URL(href);
    if (link.hostname.replace(/^www\./, "") !== baseUrl.hostname.replace(/^www\./, "")) continue;
    if (link.pathname === baseUrl.pathname || /cart|gio-hang|login|account|tai-khoan|checkout|wishlist/i.test(link.pathname)) {
      continue;
    }
    const segments = link.pathname.split("/").filter(Boolean);
    if (segments.length === 0) continue;
    const shape = segments.length === 1 ? "/*" : `/${segments.slice(0, -1).map((s) => s.replace(/\d+/g, "#")).join("/")}/*`;
    const url = cleanPageUrl(link.href);
    const group = groups.get(shape) ?? new Map<string, WebListItem>();
    if (!group.has(url)) {
      const title = (a.getAttribute("title") || img.getAttribute("alt") || a.text).replace(/\s+/g, " ").trim();
      group.set(url, { url, title: title.slice(0, 200), image: uniqueImages([imgUrl(img)], base)[0] ?? null });
    }
    groups.set(shape, group);
  }
  const best = [...groups.values()].sort((a, b) => b.size - a.size)[0];
  return best && best.size >= 4 ? [...best.values()].slice(0, 120) : [];
}

const LOGIN_WALL = /login\.|passport\.|\/login|\/signin|captcha|verify|punish|登录|验证/i;

/** Reads `input` as a product page or a list of products. */
export async function readWebPage(input: string): Promise<WebPage> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new WebImportError("Link không hợp lệ.");
  }

  try {
    // Shopify/Haravan product links read straight from the shop's JSON.
    if (/\/products\/[^/?#]+/.test(url.pathname)) {
      const shopify = await readShopify(url);
      if (shopify) return shopify;
    }

    const page = await fetchText(url.href, "text/html,application/xhtml+xml");
    if (page.status >= 400) {
      throw new WebImportError(
        `Trang trả lỗi ${page.status} — có thể web này chặn máy chủ. Dùng nút “Gửi về TAT” khi đang xem trang đó.`
      );
    }
    const finalUrl = new URL(page.url);
    const root = parse(page.text);
    const pageTitle = root.querySelector("title")?.text.trim() ?? "";
    if (finalUrl.hostname !== url.hostname && LOGIN_WALL.test(finalUrl.href + pageTitle)) {
      throw new WebImportError("Web này bắt đăng nhập nên máy chủ không đọc được. Dùng nút “Gửi về TAT” khi đang xem trang đó.");
    }

    const isShopify = /cdn\.shopify\.com|Shopify\.theme|hstatic\.net|haravan/i.test(page.text);
    if (isShopify && (finalUrl.href !== url.href || !/\/products\//.test(url.pathname))) {
      const shopify = await readShopify(finalUrl);
      if (shopify) return shopify;
    }
    if (/woocommerce/i.test(page.text)) {
      const woo = await readWoo(finalUrl);
      if (woo) return { kind: "product", product: woo };
    }

    const nodes = jsonLdNodes(root);
    const ldProduct = nodes.find((n) => hasType(n, "Product") || hasType(n, "ProductGroup"));
    const ogImages = root
      .querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"]')
      .map((m) => m.getAttribute("content"));
    const cleanUrl = cleanPageUrl(finalUrl.href);

    if (ldProduct) {
      const images = uniqueImages([...ldImages(ldProduct.image), ...ogImages], cleanUrl);
      return {
        kind: "product",
        product: {
          url: cleanUrl,
          title: stripSiteName(String(ldProduct.name ?? meta(root, "og:title") ?? pageTitle), finalUrl, meta(root, "og:site_name")),
          description: textOf(String(ldProduct.description ?? meta(root, "og:description") ?? "")),
          images,
          extraImages: pageImages(root, cleanUrl).filter((u) => !images.includes(u)),
          sizeText: "",
        },
      };
    }

    const ogType = meta(root, "og:type") ?? "";
    const itemList = nodes.find((n) => hasType(n, "ItemList"));
    const listFromLd: WebListItem[] = Array.isArray(itemList?.itemListElement)
      ? (itemList.itemListElement as Json[])
          .map((e): WebListItem | null => {
            const item = (e.item && typeof e.item === "object" ? e.item : e) as Json;
            const link = abs(String(item.url ?? e.url ?? ""), cleanUrl);
            return link
              ? { url: cleanPageUrl(link), title: String(item.name ?? e.name ?? ""), image: uniqueImages(ldImages(item.image), cleanUrl)[0] ?? null }
              : null;
          })
          .filter((i): i is WebListItem => !!i)
      : [];
    const items = listFromLd.length >= 2 ? listFromLd : /product/i.test(ogType) ? [] : listItems(root, cleanUrl);
    if (items.length > 0) {
      const next = abs(root.querySelector('link[rel="next"], a[rel="next"]')?.getAttribute("href"), cleanUrl);
      return { kind: "list", url: cleanUrl, title: meta(root, "og:title") ?? pageTitle, items, next };
    }

    const images = uniqueImages(ogImages, cleanUrl);
    const extra = pageImages(root, cleanUrl).filter((u) => !images.includes(u));
    if (images.length === 0 && extra.length === 0) {
      throw new WebImportError(
        "Không tìm thấy ảnh sản phẩm trên trang này (web có thể chặn máy chủ hoặc tải ảnh bằng JavaScript). Dùng nút “Gửi về TAT” khi đang xem trang đó."
      );
    }
    return {
      kind: "product",
      product: {
        url: cleanUrl,
        title: stripSiteName(meta(root, "og:title") ?? root.querySelector("h1")?.text ?? pageTitle, finalUrl, meta(root, "og:site_name")),
        description: textOf(meta(root, "og:description") ?? meta(root, "description") ?? ""),
        images,
        extraImages: extra,
        sizeText: "",
      },
    };
  } catch (err) {
    if (err instanceof WebImportError) throw err;
    if (err instanceof SafeFetchError) throw new WebImportError(err.message);
    throw new WebImportError("Không đọc được trang này.");
  }
}

export { hasChinese };
