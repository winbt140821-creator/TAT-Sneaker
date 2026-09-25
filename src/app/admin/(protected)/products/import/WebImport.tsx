"use client";

import { useEffect, useRef, useState } from "react";
import { AdminLink as Link } from "@/components/admin/AdminLink";
import type { Department } from "@/lib/inventory";
import { hasChinese, isJunkImageUrl, stripSiteName, upgradeImageUrl } from "@/lib/image-source-url";
import { parseSizes, translateTitle } from "@/lib/yupoo-translate";

// Importing from shops other than Yupoo: a product read from a pasted link
// (or sent by the "Gửi về TAT" bookmark), where staff pick which photos to
// keep, and a list page where they pick which products to bring in.

export type WebProductData = {
  url: string;
  title: string;
  name: string;
  description: string;
  images: string[];
  extraImages: string[];
  sizes: Record<Department, string[]>;
  productId: string | null;
  // Photos ticked to begin with (default: the shop's own product photos).
  preselected?: string[];
};

export type WebListItem = { url: string; title: string; name: string; image: string | null; productId: string | null };
export type WebListData = { url: string; title: string; items: WebListItem[]; next: string | null };

export type ReadyProduct = {
  url: string;
  title: string;
  name: string;
  description: string;
  photos: string[];
  sizes: Record<Department, string[]>;
};

const buttonClass =
  "cursor-pointer bg-ink px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50";
const ghostButtonClass =
  "cursor-pointer border border-kraft-dark bg-paper px-3 py-2 font-mono text-xs text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40";

/** Preview of another site's photo, fetched and shrunk by our server. */
export function webPreview(url: string, referer: string) {
  return `/api/admin/import/image?url=${encodeURIComponent(url)}&ref=${encodeURIComponent(referer)}`;
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ── The "Gửi về TAT" bookmark ─────────────────────────────────────────

type BookmarkData = {
  url: string;
  title: string;
  description: string;
  images: [string, number][];
  text: string;
};

let lastHash = "";
let lastParsed: WebProductData | null = null;

/** What the bookmark put in the page address (#tat=…), as a product to
 *  review. Null when there's nothing, or it isn't ours. */
export function productFromBookmarkHash(hash: string): WebProductData | null {
  if (hash === lastHash) return lastParsed;
  lastHash = hash;
  lastParsed = null;
  const m = hash.match(/^#tat=([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  let data: BookmarkData;
  try {
    const bin = atob(m[1].replace(/-/g, "+").replace(/_/g, "/"));
    data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
  if (typeof data?.url !== "string" || !/^https?:\/\//.test(data.url) || !Array.isArray(data.images)) return null;

  // A thumbnail the upgrade recognised is a product photo even if it was
  // shown small (Taobao/1688 galleries show 50px thumbnails).
  const width = new Map<string, number>();
  for (const entry of data.images.slice(0, 120)) {
    if (!Array.isArray(entry) || typeof entry[0] !== "string") continue;
    const upgraded = upgradeImageUrl(entry[0]);
    if (isJunkImageUrl(upgraded)) continue;
    const w = (Number(entry[1]) || 0) + (upgraded !== entry[0] ? 1000 : 0);
    width.set(upgraded, Math.max(width.get(upgraded) ?? 0, w));
  }
  // Photos shown large (the product's own) first, the rest after.
  const big = [...width.keys()].filter((u) => (width.get(u) ?? 0) >= 300);
  const all = [...big, ...[...width.keys()].filter((u) => !big.includes(u))];
  let pageUrl: URL;
  try {
    pageUrl = new URL(data.url);
  } catch {
    return null;
  }
  const title = stripSiteName(String(data.title ?? "").slice(0, 300), pageUrl);
  const text = `${title}\n${String(data.text ?? "")}`;
  lastParsed = {
    url: data.url,
    title,
    name: hasChinese(title) ? translateTitle(title) : title,
    description: String(data.description ?? "").slice(0, 3000),
    images: [],
    extraImages: all,
    sizes: { SHOES: parseSizes(text, "SHOES"), CLOTHING: parseSizes(text, "CLOTHING") },
    productId: null,
    preselected: big,
  };
  return lastParsed;
}

/** The bookmark's code: gathers the page's title and photos (with how
 *  wide each was shown) plus any lines that mention sizes, and opens this
 *  admin's import page with them in the address. Runs on the other site. */
function bookmarkletCode(origin: string) {
  const code = `(function(){try{
var O=${JSON.stringify(origin)},seen={},list=[];
function add(u,w){if(!u||u.indexOf("data:")===0)return;try{u=new URL(u,location.href).href}catch(e){return}
if(!/^https?:/.test(u)||/\\.svg(\\?|$)/i.test(u))return;
if(seen[u]!==undefined){if(w>list[seen[u]][1])list[seen[u]][1]=w;return}seen[u]=list.length;list.push([u,w])}
document.querySelectorAll('meta[property="og:image"]').forEach(function(m){add(m.content,900)});
document.querySelectorAll("img").forEach(function(i){var w=Math.max(i.naturalWidth||0,i.width||0),h=Math.max(i.naturalHeight||0,i.height||0);
var z=i.getAttribute("data-zoom-image")||i.getAttribute("data-large_image")||i.getAttribute("data-original")||i.getAttribute("data-origin-src")||i.getAttribute("data-src")||i.getAttribute("data-ks-lazyload")||i.getAttribute("data-lazy-src");
if(z)add(z,w);if(w>=40&&h>=40)add(i.currentSrc||i.src,w)});
function q(s){var e=document.querySelector(s);return e?String(e.content||e.innerText||"").trim():""}
var t=q('meta[property="og:title"]')||q("h1")||document.title;
var lines=String(document.body.innerText||"").split("\\n").filter(function(l){return /size|尺码|码数|kích|cỡ/i.test(l)}).join("\\n").slice(0,1500);
var d={url:location.href,title:t.slice(0,300),description:(q('meta[property="og:description"]')||q('meta[name="description"]')).slice(0,1500),images:list.slice(0,100),text:lines};
var b=new TextEncoder().encode(JSON.stringify(d)),s="";for(var k=0;k<b.length;k++)s+=String.fromCharCode(b[k]);
var url=O+"/admin/products/import#tat="+btoa(s).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");
if(!window.open(url,"_blank"))location.href=url;
}catch(e){alert("Không lấy được dữ liệu trang này: "+e.message)}})()`;
  return `javascript:${encodeURIComponent(code.replace(/\n/g, ""))}`;
}

/** The link staff drag to their bookmarks bar. Its href is set after
 *  mount — React refuses javascript: links in markup, and the code needs
 *  this site's own address. */
export function BookmarkletLink() {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ref.current?.setAttribute("href", bookmarkletCode(window.location.origin));
  }, []);
  return (
    <a
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        alert("Kéo nút này lên thanh dấu trang (bookmark) của trình duyệt, đừng bấm ở đây.");
      }}
      className="inline-flex min-h-11 cursor-grab items-center border-2 border-dashed border-ink bg-paper px-4 font-mono text-xs font-semibold uppercase tracking-wider text-ink"
    >
      Gửi về TAT
    </a>
  );
}

// ── One product: pick its photos ──────────────────────────────────────

export function WebProductPanel({
  product,
  disabled,
  onImport,
  onClose,
}: {
  product: WebProductData;
  disabled: boolean;
  onImport: (ready: ReadyProduct) => void;
  onClose: () => void;
}) {
  const all = [...product.images, ...product.extraImages];
  const initial = product.preselected ?? (product.images.length ? product.images : product.extraImages.slice(0, 12));
  const [picked, setPicked] = useState<Set<string>>(() => new Set(initial));
  const [name, setName] = useState(product.name);
  const chosen = all.filter((u) => picked.has(u));

  function toggle(url: string) {
    const next = new Set(picked);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setPicked(next);
  }

  return (
    <section aria-labelledby="web-product" className="die-cut flex flex-col gap-4 bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="web-product" className="font-display text-lg text-ink">
            Sản phẩm từ {hostOf(product.url)}
          </h2>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-mono text-[11px] text-graphite hover:text-ink hover:underline"
          >
            {product.url} ↗
          </a>
        </div>
        <button type="button" onClick={onClose} className={ghostButtonClass}>
          Đóng
        </button>
      </div>

      {product.productId && (
        <p className="border border-kraft-dark bg-kraft/40 p-2 font-body text-sm text-ink">
          Sản phẩm này đã được nhập trước đây.{" "}
          <Link href={`/admin/products/${product.productId}/edit`} className="underline">
            Mở sản phẩm đã nhập
          </Link>
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-graphite">Tên sản phẩm</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
        />
        {name !== product.title && product.title && (
          <span className="font-mono text-[10px] text-graphite">Tên gốc: {product.title}</span>
        )}
      </label>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-wide text-graphite">
            Ảnh — đã chọn {chosen.length}/{all.length}
          </p>
          <div className="flex gap-2">
            <button type="button" className={ghostButtonClass} onClick={() => setPicked(new Set(all))}>
              Chọn tất cả
            </button>
            <button type="button" className={ghostButtonClass} onClick={() => setPicked(new Set())}>
              Bỏ chọn
            </button>
          </div>
        </div>
        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
          {all.map((url) => {
            const on = picked.has(url);
            return (
              <li key={url}>
                <label
                  className={
                    "relative block aspect-square cursor-pointer overflow-hidden border bg-kraft-dark/30 " +
                    (on ? "border-ink ring-1 ring-ink" : "border-kraft-dark opacity-60 hover:opacity-100")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={webPreview(url, product.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(url)}
                    aria-label="Chọn ảnh này"
                    className="absolute left-1.5 top-1.5 h-5 w-5 cursor-pointer accent-ink"
                  />
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        disabled={disabled || chosen.length === 0 || !name.trim()}
        onClick={() =>
          onImport({
            url: product.url,
            title: product.title,
            name: name.trim(),
            description: product.description,
            photos: chosen,
            sizes: product.sizes,
          })
        }
        className={`${buttonClass} min-h-11 w-fit`}
      >
        Nhập sản phẩm ({chosen.length} ảnh)
      </button>
    </section>
  );
}

// ── A list page: pick products ────────────────────────────────────────

export function WebListPanel({
  list,
  loading,
  error,
  disabled,
  selected,
  setSelected,
  onNext,
  onImport,
  onClose,
}: {
  list: WebListData;
  loading: boolean;
  error: string | null;
  disabled: boolean;
  selected: Map<string, WebListItem>;
  setSelected: (next: Map<string, WebListItem>) => void;
  onNext: () => void;
  onImport: () => void;
  onClose: () => void;
}) {
  const selectable = list.items.filter((i) => !i.productId);
  const allPicked = selectable.length > 0 && selectable.every((i) => selected.has(i.url));

  function toggle(item: WebListItem) {
    const next = new Map(selected);
    if (next.has(item.url)) next.delete(item.url);
    else next.set(item.url, item);
    setSelected(next);
  }

  function togglePage() {
    const next = new Map(selected);
    for (const item of selectable) {
      if (allPicked) next.delete(item.url);
      else next.set(item.url, item);
    }
    setSelected(next);
  }

  const importButton = (
    <button type="button" disabled={disabled || selected.size === 0} onClick={onImport} className={`${buttonClass} min-h-11`}>
      {selected.size === 0 ? "Chọn sản phẩm để nhập" : `Nhập ${selected.size} sản phẩm`}
    </button>
  );

  return (
    <section aria-labelledby="web-list" className="die-cut flex flex-col gap-4 bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="web-list" className="font-display text-lg text-ink">
            {list.items.length} sản phẩm trên {hostOf(list.url)}
          </h2>
          <a
            href={list.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-mono text-[11px] text-graphite hover:text-ink hover:underline"
          >
            {list.url} ↗
          </a>
        </div>
        <button type="button" onClick={onClose} className={ghostButtonClass}>
          Đóng
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled || selectable.length === 0}
            onClick={togglePage}
            className={`${ghostButtonClass} min-h-11`}
          >
            {allPicked ? "Bỏ chọn trang này" : "Chọn cả trang"}
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setSelected(new Map())}
              className="min-h-11 cursor-pointer px-2 font-mono text-xs text-graphite hover:text-ink hover:underline"
            >
              Bỏ chọn tất cả ({selected.size})
            </button>
          )}
        </div>
        {importButton}
      </div>

      {error && (
        <p role="alert" className="border border-stamp/40 bg-stamp/5 p-3 font-body text-sm text-stamp">
          {error}
        </p>
      )}

      <ul aria-busy={loading} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
        {list.items.map((item) => {
          const on = selected.has(item.url);
          return (
            <li key={item.url} className="min-w-0">
              <label
                className={
                  "flex h-full cursor-pointer flex-col border bg-paper transition-colors " +
                  (on ? "border-ink ring-1 ring-ink" : "border-kraft-dark hover:border-graphite") +
                  (item.productId ? " opacity-60" : "")
                }
              >
                <div className="relative aspect-square overflow-hidden bg-kraft-dark/30">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={webPreview(item.image, list.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    onChange={() => toggle(item)}
                    aria-label={`Chọn ${item.name}`}
                    className="absolute left-2 top-2 h-5 w-5 cursor-pointer accent-ink"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <p className="line-clamp-2 font-body text-sm font-medium text-ink">{item.name || item.url}</p>
                  {item.name !== item.title && (
                    <p className="line-clamp-1 font-mono text-[10px] text-graphite" title={item.title}>
                      {item.title}
                    </p>
                  )}
                  {item.productId && (
                    <Link
                      href={`/admin/products/${item.productId}/edit`}
                      className="mt-auto w-fit bg-ink/10 px-1.5 py-0.5 font-mono text-[10px] text-ink hover:underline"
                    >
                      Đã nhập · xem
                    </Link>
                  )}
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {list.next ? (
          <button type="button" disabled={disabled || loading} onClick={onNext} className={`${ghostButtonClass} min-h-11`}>
            {loading ? "Đang tải…" : "Trang sau ›"}
          </button>
        ) : (
          <span />
        )}
        {importButton}
      </div>
    </section>
  );
}
