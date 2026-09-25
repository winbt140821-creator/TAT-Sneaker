// Reads a supplier's Yupoo shop (<owner>.x.yupoo.com) for Sản phẩm → Nhập
// từ Yupoo. Yupoo has no public API, so this parses the same server-rendered
// pages a browser gets. Server-only: the pages and photos refuse requests
// that don't come "from" Yupoo (a photo without a yupoo.com Referer answers
// 567), which a browser on our admin can't fake.
//
// A password-locked shop ("主页已加密") is opened the way Yupoo's own lock
// screen does it — the password travels in the `indexlockcode` cookie.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const TIMEOUT_MS = 15_000;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export class YupooError extends Error {
  // "locked": the shop needs a password (or a different one).
  constructor(message: string, readonly kind: "locked" | "other" = "other") {
    super(message);
  }
}

/** "https://cpdk8888.x.yupoo.com/albums?tab=gallery", "cpdk8888.x.yupoo.com"
 *  or just "cpdk8888" → "cpdk8888". Null when it isn't a Yupoo shop. */
export function parseShopOwner(input: string): string | null {
  const text = input.trim().toLowerCase();
  const fromUrl = text.match(/^(?:https?:\/\/)?([a-z0-9][a-z0-9_-]*)\.x\.yupoo\.com(?:[/?#]|$)/);
  if (fromUrl) return fromUrl[1];
  return /^[a-z0-9][a-z0-9_-]{1,40}$/.test(text) ? text : null;
}

export function shopOrigin(owner: string) {
  return `https://${owner}.x.yupoo.com`;
}

/** Every album link in pasted text ("https://cpdk8888.x.yupoo.com/albums/
 *  256250530?uid=1", one per line or run together), without repeats. */
export function parseAlbumLinks(text: string): { owner: string; albumId: string }[] {
  const links: { owner: string; albumId: string }[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/(?:https?:\/\/)?([a-z0-9][a-z0-9_-]*)\.x\.yupoo\.com\/albums\/(\d+)/gi)) {
    const owner = m[1].toLowerCase();
    const key = `${owner}/${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ owner, albumId: m[2] });
  }
  return links;
}

/** A link to a shop's listing rather than one album — the shop itself
 *  ("…x.yupoo.com/albums"), one of its categories ("/categories/123") or a
 *  search ("/search/album?q=…"). Null when there's no Yupoo link at all. */
export function parseShopLink(text: string): { owner: string; categoryId?: string; q?: string } | null {
  const m = text.match(/(?:https?:\/\/)?([a-z0-9][a-z0-9_-]*)\.x\.yupoo\.com(\/[^\s]*)?/i);
  if (!m) return null;
  const rest = m[2] ?? "";
  let q: string | undefined;
  if (/^\/search\//.test(rest)) {
    try {
      q = new URL(`https://x${rest}`).searchParams.get("q")?.trim() || undefined;
    } catch {}
  }
  return { owner: m[1].toLowerCase(), categoryId: rest.match(/^\/categories\/(\d+)/)?.[1], q };
}

/** The canonical link stored on an imported product (Product.sourceUrl). */
export function albumUrl(owner: string, albumId: string) {
  return `${shopOrigin(owner)}/albums/${albumId}`;
}

function headers(owner: string, password?: string | null): HeadersInit {
  return {
    "User-Agent": UA,
    "Accept-Language": "zh-CN,zh;q=0.9",
    Referer: `${shopOrigin(owner)}/`,
    ...(password ? { Cookie: `indexlockcode=${encodeURIComponent(password)}` } : {}),
  };
}

async function fetchPage(owner: string, path: string, password?: string | null): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${shopOrigin(owner)}${path}`, {
      headers: headers(owner, password),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new YupooError("Không kết nối được tới Yupoo. Thử lại sau ít phút.");
  }
  if (res.status === 404) throw new YupooError("Không tìm thấy shop hoặc album này trên Yupoo.");
  if (!res.ok) throw new YupooError(`Yupoo trả lỗi ${res.status}. Thử lại sau ít phút.`);
  const html = await res.text();
  if (html.includes("indexlock__main") && !html.includes("album__main") && !html.includes("image__imagewrap")) {
    throw new YupooError(
      password
        ? "Mật khẩu shop không đúng (có thể nhà cung cấp vừa đổi). Sửa mật khẩu ở nguồn này rồi thử lại."
        : "Shop này có khoá mật khẩu. Nhập mật khẩu nhà cung cấp đưa cho bạn.",
      "locked"
    );
  }
  return html;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

function stripTags(html: string) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function attr(tag: string, name: string) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decodeEntities(m[1]) : undefined;
}

function absolutePhoto(src: string) {
  return src.startsWith("//") ? `https:${src}` : src;
}

export type YupooAlbumCard = { id: string; title: string; cover: string | null; photoCount: number };
export type YupooCategory = { id: string; name: string };

/** One page of a shop's albums — the whole shop, one of its categories, or
 *  a search. Yupoo lists newest first. */
export async function listAlbums(
  owner: string,
  password: string | null,
  { categoryId, q, page = 1 }: { categoryId?: string; q?: string; page?: number }
): Promise<{ albums: YupooAlbumCard[]; categories: YupooCategory[]; totalPages: number }> {
  const params = new URLSearchParams({ page: String(page) });
  let path: string;
  if (q) {
    params.set("uid", "1");
    params.set("q", q);
    path = `/search/album?${params}`;
  } else if (categoryId && /^\d+$/.test(categoryId)) {
    path = `/categories/${categoryId}?${params}`;
  } else {
    params.set("tab", "gallery");
    path = `/albums?${params}`;
  }
  const html = await fetchPage(owner, path, password);

  const albums: YupooAlbumCard[] = [];
  const seen = new Set<string>();
  for (const block of html.split(/(?=<a[^>]*class="album__main")/).slice(1)) {
    const open = block.match(/^<a[^>]*>/)?.[0] ?? "";
    const id = attr(open, "href")?.match(/\/albums\/(\d+)/)?.[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const img = block.match(/<img[^>]*class="[^"]*album__img[^"]*"[^>]*>/)?.[0] ?? "";
    const src = attr(img, "data-src") ?? attr(img, "src");
    const count = block.match(/album__photonumber">\s*(\d+)/)?.[1];
    albums.push({
      id,
      title: attr(open, "title") ?? "",
      cover: src && /photo\.yupoo\.com/.test(src) ? absolutePhoto(src) : null,
      photoCount: count ? Number(count) : 0,
    });
  }

  const categories: YupooCategory[] = [];
  const seenCategories = new Set<string>();
  for (const m of html.matchAll(/<a href="\/categories\/(\d+)[^"]*"[^>]*>\s*<li[^>]*>([^<]*)<\/li>/g)) {
    if (seenCategories.has(m[1])) continue;
    seenCategories.add(m[1]);
    categories.push({ id: m[1], name: decodeEntities(m[2]).trim() });
  }

  const max = html.match(/name="page"[^>]*max="(\d+)"/)?.[1];
  return { albums, categories, totalPages: max ? Math.max(1, Number(max)) : 1 };
}

export type YupooAlbum = { id: string; title: string; description: string; photos: string[]; cover: string | null };

/** An album's title, the supplier's note under it, and every photo at the
 *  size the supplier uploaded (falling back to Yupoo's large copy). */
export async function getAlbum(owner: string, password: string | null, albumId: string): Promise<YupooAlbum> {
  if (!/^\d+$/.test(albumId)) throw new YupooError("Mã album không hợp lệ.");
  const photos: string[] = [];
  let cover: string | null = null;
  let title = "";
  let description = "";
  // Big albums spread their photos over several pages.
  for (let page = 1; page <= 5; page++) {
    const html = await fetchPage(owner, `/albums/${albumId}?uid=1${page > 1 ? `&page=${page}` : ""}`, password);
    if (page === 1) {
      title = decodeEntities(html.match(/class="showalbumheader__gallerytitle"[^>]*>([^<]*)</)?.[1] ?? "").trim();
      // The note can hold its own <div>/<p> lines, so read up to the buttons
      // that follow it rather than to the first </div>.
      const sub =
        html.match(/class="showalbumheader__gallerysubtitle[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="showalbumheader__tabgroup"/)?.[1] ??
        html.match(/class="showalbumheader__gallerysubtitle[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1] ??
        "";
      description = stripTags(sub);
    }
    const before = photos.length;
    for (const img of html.match(/<img[^>]*data-origin-src="[^"]*"[^>]*>/g) ?? []) {
      const src = attr(img, "data-origin-src") || attr(img, "data-src");
      // Yupoo's small copy of the first photo, for the progress list.
      const big = attr(img, "data-src");
      if (!cover && big && /\/big\.(jpe?g|png|webp)$/i.test(big)) cover = absolutePhoto(big.replace(/\/big\./i, "/medium."));
      if (src && /photo\.yupoo\.com/.test(src)) {
        const url = absolutePhoto(src);
        if (!photos.includes(url)) photos.push(url);
      }
    }
    const max = Number(html.match(/name="page"[^>]*max="(\d+)"/)?.[1] ?? 1);
    if (photos.length === before || page >= max) break;
  }
  return { id: albumId, title, description, photos, cover };
}

/** Checks a shop exists and, when it's locked, that the password opens it.
 *  Returns the shop's display name and whether it's locked. */
export async function checkShop(owner: string, password: string | null): Promise<{ nickname: string; locked: boolean }> {
  let res: Response;
  try {
    res = await fetch(`${shopOrigin(owner)}/api/web/users/${owner}?password=${encodeURIComponent(password ?? "")}`, {
      headers: headers(owner),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new YupooError("Không kết nối được tới Yupoo. Thử lại sau ít phút.");
  }
  const body = (await res.json().catch(() => null)) as {
    data?: { nickname?: string; needPassWord?: boolean; passwordValid?: boolean };
  } | null;
  if (!res.ok || !body?.data) throw new YupooError("Không tìm thấy shop này trên Yupoo. Kiểm tra lại link.");
  if (body.data.needPassWord && !body.data.passwordValid) {
    throw new YupooError(
      password ? "Mật khẩu shop không đúng." : "Shop này có khoá mật khẩu. Nhập mật khẩu nhà cung cấp đưa cho bạn.",
      "locked"
    );
  }
  return { nickname: body.data.nickname?.trim() || owner, locked: !!body.data.needPassWord };
}

/** Downloads one photo of `owner`'s shop. Only photo.yupoo.com URLs under
 *  that shop's own folder are fetched — the URL comes from the browser, so
 *  this is what stops the endpoint being used to fetch anything else. */
export async function fetchPhoto(owner: string, url: string): Promise<{ bytes: Buffer; contentType: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new YupooError("Link ảnh không hợp lệ.");
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "photo.yupoo.com" || !parsed.pathname.startsWith(`/${owner}/`)) {
    throw new YupooError("Link ảnh không thuộc shop này.");
  }
  let res: Response;
  try {
    res = await fetch(parsed, { headers: headers(owner), signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  } catch {
    throw new YupooError("Tải ảnh từ Yupoo bị quá thời gian.");
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.startsWith("image/")) throw new YupooError(`Yupoo không trả ảnh (mã ${res.status}).`);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_PHOTO_BYTES) throw new YupooError("Ảnh quá lớn.");
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_PHOTO_BYTES) throw new YupooError("Ảnh quá lớn.");
  return { bytes, contentType };
}
