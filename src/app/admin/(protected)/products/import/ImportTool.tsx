"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AdminLink as Link } from "@/components/admin/AdminLink";
import { StoreBadge } from "@/components/admin/StoreBadge";
import { SubmitButton } from "@/components/admin/form/SubmitButton";
import type { Department } from "@/lib/inventory";
import {
  createImportedProductAction,
  deleteImportSourceAction,
  saveImportSourceAction,
  type SourceFormState,
} from "./actions";

type Source = { id: string; owner: string; label: string; department: Department; hasPassword: boolean };
type CategoryOption = { id: string; label: string; department: Department; children: { id: string; label: string }[] };
type AlbumCard = {
  id: string;
  title: string;
  name: string;
  cover: string | null;
  photoCount: number;
  productId: string | null;
};
type Listing = {
  albums: AlbumCard[];
  categories: { id: string; name: string }[];
  totalPages: number;
  page: number;
};
type Options = {
  department: Department;
  categoryIds: string[];
  maxPhotos: number;
  translate: boolean;
  description: boolean;
  sizes: boolean;
  quality: string;
  availability: "PREORDER" | "IN_STOCK";
  price: string;
  publish: boolean;
  again: boolean;
};
type Job = {
  album: AlbumCard;
  status: "queued" | "reading" | "photos" | "saving" | "done" | "skipped" | "error";
  done: number;
  total: number;
  failedPhotos?: number;
  productId?: string;
  hidden?: boolean;
  error?: string;
};

const QUALITY_TIERS = ["Auth", "Best Quality", "Like Auth", "Rep 11"];
const OPTIONS_KEY = "yupoo-import-options";
const PHOTO_CONCURRENCY = 4;

const inputClass = "border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest";
const labelClass = "font-mono text-xs uppercase tracking-wide text-graphite";
const buttonClass =
  "cursor-pointer bg-ink px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50";
const ghostButtonClass =
  "cursor-pointer border border-kraft-dark bg-paper px-3 py-2 font-mono text-xs text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40";

function defaultOptions(department: Department): Options {
  return {
    department,
    categoryIds: [],
    maxPhotos: 15,
    translate: true,
    description: false,
    sizes: true,
    quality: "Auth",
    availability: "PREORDER",
    price: "",
    publish: false,
    again: false,
  };
}

// This person's last choices (store, photos, quality…), remembered between
// visits — a convenience only; the page works the same without it. Read
// through useSyncExternalStore so the server render (no storage) and the
// first client render agree.
const noSubscribe = () => () => {};
function readSavedOptions() {
  try {
    return localStorage.getItem(OPTIONS_KEY);
  } catch {
    return null;
  }
}
function parseSavedOptions(saved: string | null): Partial<Options> {
  try {
    const parsed = JSON.parse(saved ?? "null") as Partial<Options> | null;
    if (!parsed || typeof parsed !== "object") return {};
    // One-off choices start fresh every visit.
    delete parsed.price;
    delete parsed.again;
    return parsed;
  } catch {
    return {};
  }
}

/** Runs `work` over `items` with at most `limit` at once, keeping order. */
async function mapLimit<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await work(items[index]);
      }
    })
  );
  return results;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Lỗi ${res.status}`);
  return body as T;
}

export function ImportTool({
  sources,
  categories,
  preferredDepartment,
}: {
  sources: Source[];
  categories: CategoryOption[];
  preferredDepartment: Department | null;
}) {
  const [sourceId, setSourceId] = useState<string | null>(sources[0]?.id ?? null);
  const [editing, setEditing] = useState<Source | "new" | null>(sources.length === 0 ? "new" : null);
  const source = sources.find((s) => s.id === sourceId) ?? null;

  const saved = useSyncExternalStore(noSubscribe, readSavedOptions, () => null);
  const baseOptions: Options = {
    ...defaultOptions(preferredDepartment ?? sources[0]?.department ?? "CLOTHING"),
    ...parseSavedOptions(saved),
  };
  const [changes, setChanges] = useState<Partial<Options>>({});
  const options: Options = { ...baseOptions, ...changes };
  const setOptions = (update: (o: Options) => Options) => setChanges((prev) => update({ ...baseOptions, ...prev }));
  const [selected, setSelected] = useState<Map<string, AlbumCard>>(new Map());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);
  const [listingVersion, setListingVersion] = useState(0);

  const optionsToKeep = JSON.stringify({ ...options, price: undefined, again: undefined });
  useEffect(() => {
    try {
      localStorage.setItem(OPTIONS_KEY, optionsToKeep);
    } catch {}
  }, [optionsToKeep]);

  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  function pickSource(id: string) {
    setSourceId(id);
    setSelected(new Map());
    const picked = sources.find((s) => s.id === id);
    if (picked && !preferredDepartment) setOptions((o) => ({ ...o, department: picked.department, categoryIds: [] }));
  }

  function updateJob(index: number, patch: Partial<Job>) {
    setJobs((all) => all.map((job, i) => (i === index ? { ...job, ...patch } : job)));
  }

  async function importAlbums(albums: AlbumCard[]) {
    if (!source || albums.length === 0) return;
    const run = { ...options };
    const price = Math.round(Number(run.price.replace(/\D/g, "")) || 0);
    stopRef.current = false;
    setRunning(true);
    setJobs(albums.map((album) => ({ album, status: "queued", done: 0, total: 0 })));

    for (const [index, album] of albums.entries()) {
      if (stopRef.current) break;
      if (album.productId && !run.again) {
        updateJob(index, { status: "skipped", productId: album.productId });
        continue;
      }
      try {
        updateJob(index, { status: "reading" });
        const data = await getJson<{
          title: string;
          name: string;
          description: string;
          photos: string[];
          sizes: Record<Department, string[]>;
        }>(`/api/admin/yupoo/album?source=${source.id}&id=${album.id}`);

        const photos = data.photos.slice(0, Math.max(1, run.maxPhotos));
        if (photos.length === 0) throw new Error("Album không có ảnh.");
        updateJob(index, { status: "photos", total: photos.length });
        let done = 0;
        const copied = await mapLimit(photos, PHOTO_CONCURRENCY, async (url) => {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const { url: stored } = await getJson<{ url: string }>("/api/admin/yupoo/photo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source: source.id, url }),
              });
              updateJob(index, { done: ++done });
              return stored;
            } catch {}
          }
          updateJob(index, { done: ++done });
          return null;
        });
        const images = copied.filter((u): u is string => !!u);
        if (images.length === 0) throw new Error("Không tải được ảnh nào từ album này.");

        updateJob(index, { status: "saving" });
        const result = await createImportedProductAction({
          sourceId: source.id,
          albumId: album.id,
          department: run.department,
          name: run.translate ? data.name : data.title,
          description: run.description ? data.description : null,
          images,
          sizes: run.sizes ? data.sizes[run.department] : [],
          categoryIds: run.categoryIds,
          price,
          quality: run.quality,
          availability: run.availability,
          publish: run.publish,
          again: run.again,
        });
        if (result.error) throw new Error(result.error);
        updateJob(index, {
          status: result.skipped ? "skipped" : "done",
          productId: result.id,
          hidden: result.hidden,
          failedPhotos: photos.length - images.length,
        });
      } catch (err) {
        updateJob(index, { status: "error", error: err instanceof Error ? err.message : "Lỗi không rõ." });
      }
    }

    setRunning(false);
    setSelected(new Map());
    setListingVersion((v) => v + 1);
  }

  const failed = jobs.filter((j) => j.status === "error").map((j) => j.album);
  const imported = jobs.filter((j) => j.status === "done").length;

  return (
    <div className="mt-6 flex flex-col gap-6">
      <SourceBar
        sources={sources}
        source={source}
        onPick={pickSource}
        editing={editing}
        setEditing={setEditing}
        disabled={running}
      />

      {source && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <AlbumBrowser
            key={`${source.id}-${listingVersion}`}
            source={source}
            selected={selected}
            setSelected={setSelected}
            disabled={running}
          />
          <OptionsPanel
            options={options}
            setOptions={setOptions}
            categories={categories}
            selectedCount={selected.size}
            running={running}
            onStart={() => importAlbums([...selected.values()])}
            onStop={() => (stopRef.current = true)}
          />
        </div>
      )}

      {jobs.length > 0 && (
        <section aria-labelledby="import-progress" className="die-cut bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="import-progress" className="font-display text-lg text-ink">
              {running ? "Đang nhập…" : `Đã nhập ${imported} sản phẩm`}
            </h2>
            {!running && (
              <div className="flex flex-wrap gap-2">
                {failed.length > 0 && (
                  <button type="button" className={ghostButtonClass} onClick={() => importAlbums(failed)}>
                    Thử lại {failed.length} album lỗi
                  </button>
                )}
                {imported > 0 && (
                  <Link href="/admin/products?imported=1&noPrice=1" className={buttonClass}>
                    Điền giá cho hàng mới nhập →
                  </Link>
                )}
              </div>
            )}
          </div>
          {running && (
            <p className="mt-1 font-mono text-xs text-graphite">Giữ trang này mở cho tới khi xong.</p>
          )}
          <ul className="mt-4 flex flex-col divide-y divide-kraft-dark">
            {jobs.map((job) => (
              <JobRow key={job.album.id} job={job} sourceId={source?.id ?? ""} />
            ))}
          </ul>
        </section>
      )}

      {source && selected.size > 0 && !running && (
        // Phones: the options panel sits below a long grid, so the start
        // button also rides along at the bottom of the screen.
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-kraft-dark bg-paper px-4 py-3 lg:hidden">
          <span className="font-mono text-xs text-ink">Đã chọn {selected.size} album</span>
          <button type="button" className={buttonClass} onClick={() => importAlbums([...selected.values()])}>
            Nhập {selected.size} album
          </button>
        </div>
      )}
    </div>
  );
}

function SourceBar({
  sources,
  source,
  onPick,
  editing,
  setEditing,
  disabled,
}: {
  sources: Source[];
  source: Source | null;
  onPick: (id: string) => void;
  editing: Source | "new" | null;
  setEditing: (value: Source | "new" | null) => void;
  disabled: boolean;
}) {
  return (
    <section aria-labelledby="import-sources" className="die-cut bg-paper p-4">
      <h2 id="import-sources" className={labelClass}>
        Shop nhà cung cấp
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {sources.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            aria-pressed={s.id === source?.id}
            onClick={() => onPick(s.id)}
            className={
              "flex min-h-11 cursor-pointer items-center gap-2 border px-3 py-2 text-left font-body text-sm transition-colors disabled:cursor-not-allowed " +
              (s.id === source?.id ? "border-ink bg-ink text-paper" : "border-kraft-dark bg-paper text-ink hover:border-ink")
            }
          >
            <span className="font-medium">{s.label}</span>
            <span className="font-mono text-[10px] opacity-70">{s.owner}</span>
          </button>
        ))}
        <button type="button" disabled={disabled} className={ghostButtonClass} onClick={() => setEditing("new")}>
          + Thêm shop
        </button>
      </div>

      {source && editing === null && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-graphite">
          <a
            href={`https://${source.owner}.x.yupoo.com/albums`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink hover:underline"
          >
            {source.owner}.x.yupoo.com ↗
          </a>
          <span>{source.hasPassword ? "Có mật khẩu" : "Không khoá"}</span>
          <span className="flex items-center gap-1">
            Mặc định nhập vào <StoreBadge department={source.department} />
          </span>
          <button
            type="button"
            disabled={disabled}
            className="cursor-pointer text-ink hover:underline disabled:opacity-40"
            onClick={() => setEditing(source)}
          >
            Sửa mật khẩu / web
          </button>
          <form
            action={deleteImportSourceAction.bind(null, source.id)}
            onSubmit={(e) => {
              if (!confirm(`Bỏ shop "${source.label}" khỏi danh sách? Sản phẩm đã nhập vẫn giữ nguyên.`)) e.preventDefault();
            }}
          >
            <button type="submit" disabled={disabled} className="cursor-pointer text-stamp hover:underline disabled:opacity-40">
              Bỏ shop này
            </button>
          </form>
        </div>
      )}

      {editing !== null && (
        <SourceForm
          key={editing === "new" ? "new" : editing.id}
          source={editing === "new" ? null : editing}
          canCancel={sources.length > 0}
          onDone={(id) => {
            setEditing(null);
            if (id) onPick(id);
          }}
        />
      )}
    </section>
  );
}

function SourceForm({
  source,
  canCancel,
  onDone,
}: {
  source: Source | null;
  canCancel: boolean;
  onDone: (savedId: string | null) => void;
}) {
  const [state, formAction] = useActionState<SourceFormState, FormData>(async (prev, formData) => {
    const result = await saveImportSourceAction(prev, formData);
    if (result.savedId) onDone(result.savedId);
    return result;
  }, {});

  return (
    <form action={formAction} className="mt-4 grid gap-3 border-t border-kraft-dark pt-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="yupoo-url" className={labelClass}>
          Link shop Yupoo
        </label>
        <input
          id="yupoo-url"
          name="url"
          required
          readOnly={!!source}
          defaultValue={source ? `https://${source.owner}.x.yupoo.com` : ""}
          placeholder="https://tenshop.x.yupoo.com/albums"
          className={`${inputClass} read-only:opacity-60`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="yupoo-password" className={labelClass}>
          Mật khẩu shop (nếu có)
        </label>
        <input
          id="yupoo-password"
          name="password"
          type="password"
          autoComplete="off"
          placeholder={source?.hasPassword ? "Nhập lại mật khẩu" : "Để trống nếu shop không khoá"}
          className={inputClass}
        />
        <p className="font-mono text-[10px] text-graphite">Mật khẩu nhà cung cấp đưa cho bạn. Chỉ lưu trong admin.</p>
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className={labelClass}>Mặc định nhập vào web</legend>
        <div className="mt-1.5 flex gap-4">
          {(["CLOTHING", "SHOES"] as const).map((d) => (
            <label key={d} className="flex min-h-11 cursor-pointer items-center gap-2 font-body text-sm text-ink">
              <input
                type="radio"
                name="department"
                value={d}
                defaultChecked={(source?.department ?? "CLOTHING") === d}
                className="h-4 w-4 accent-ink"
              />
              {d === "CLOTHING" ? "Quần áo" : "Giày"}
            </label>
          ))}
        </div>
      </fieldset>
      {state.error && (
        <p role="alert" className="font-mono text-xs text-stamp sm:col-span-2">
          {state.error}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <SubmitButton pendingLabel="Đang kiểm tra shop…">{source ? "Lưu thay đổi" : "Lưu shop"}</SubmitButton>
        {canCancel && (
          <button type="button" className={ghostButtonClass} onClick={() => onDone(null)}>
            Huỷ
          </button>
        )}
      </div>
    </form>
  );
}

function AlbumBrowser({
  source,
  selected,
  setSelected,
  disabled,
}: {
  source: Source;
  selected: Map<string, AlbumCard>;
  setSelected: (next: Map<string, AlbumCard>) => void;
  disabled: boolean;
}) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Listing["categories"]>([]);
  // What was last loaded, and for which request — "loading" is simply the
  // current request not having an answer yet.
  const [result, setResult] = useState<{ key: string; listing?: Listing; error?: string } | null>(null);
  const params = new URLSearchParams({ source: source.id, page: String(page) });
  if (search) params.set("q", search);
  else if (category) params.set("category", category);
  const requestKey = params.toString();
  const loading = result?.key !== requestKey;
  const error = result?.key === requestKey ? (result.error ?? null) : null;
  const listing = result?.listing ?? null;

  useEffect(() => {
    const controller = new AbortController();
    getJson<Listing>(`/api/admin/yupoo/albums?${requestKey}`, { signal: controller.signal })
      .then((data) => {
        setResult({ key: requestKey, listing: data });
        // The category list only shows on the shop's main pages; keep the
        // last one seen while browsing inside a category or a search.
        if (data.categories.length > 0) setCategories(data.categories);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult((prev) => ({
          key: requestKey,
          listing: prev?.listing,
          error: err instanceof Error ? err.message : "Không tải được album.",
        }));
      });
    return () => controller.abort();
  }, [requestKey]);

  const albums = listing?.albums ?? [];
  const selectable = albums.filter((a) => !a.productId);
  const allPicked = selectable.length > 0 && selectable.every((a) => selected.has(a.id));
  const totalPages = listing?.totalPages ?? 1;

  function toggle(album: AlbumCard) {
    const next = new Map(selected);
    if (next.has(album.id)) next.delete(album.id);
    else next.set(album.id, album);
    setSelected(next);
  }

  function togglePage() {
    const next = new Map(selected);
    for (const a of selectable) {
      if (allPicked) next.delete(a.id);
      else next.set(a.id, a);
    }
    setSelected(next);
  }

  return (
    <section aria-labelledby="import-albums" className="min-w-0">
      <h2 id="import-albums" className="sr-only">
        Album trong shop
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="yupoo-category" className={labelClass}>
            Danh mục trên Yupoo
          </label>
          <select
            id="yupoo-category"
            value={category}
            disabled={disabled || !!search}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className={`${inputClass} min-h-11 max-w-60`}
          >
            <option value="">Tất cả album</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <form
          role="search"
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query.trim());
            setPage(1);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="yupoo-search" className={labelClass}>
              Tìm album
            </label>
            <input
              id="yupoo-search"
              type="search"
              value={query}
              disabled={disabled}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) {
                  setSearch("");
                  setPage(1);
                }
              }}
              placeholder="VD: Burberry, 卫衣"
              className={`${inputClass} min-h-11 w-48`}
            />
          </div>
          <button type="submit" disabled={disabled} className={`${ghostButtonClass} min-h-11`}>
            Tìm
          </button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
        <Pager page={page} totalPages={totalPages} setPage={setPage} disabled={disabled || loading} />
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-stamp/40 bg-stamp/5 p-3 font-body text-sm text-stamp">
          {error}
        </p>
      )}

      <ul
        aria-busy={loading}
        className={`mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-50" : ""}`}
      >
        {albums.map((album) => {
          const picked = selected.has(album.id);
          const done = !!album.productId;
          return (
            <li key={album.id} className="min-w-0">
              <label
                className={
                  "group flex h-full cursor-pointer flex-col border bg-paper transition-colors " +
                  (picked ? "border-ink ring-1 ring-ink" : "border-kraft-dark hover:border-graphite") +
                  (done ? " opacity-60" : "")
                }
              >
                <div className="relative aspect-square overflow-hidden bg-kraft-dark/30">
                  {album.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/admin/yupoo/cover?source=${source.id}&src=${encodeURIComponent(album.cover)}`}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <input
                    type="checkbox"
                    checked={picked}
                    disabled={disabled}
                    onChange={() => toggle(album)}
                    aria-label={`Chọn ${album.name}`}
                    className="absolute left-2 top-2 h-5 w-5 cursor-pointer accent-ink"
                  />
                  <span className="absolute bottom-1 right-1 bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-paper">
                    {album.photoCount} ảnh
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2">
                  <p className="line-clamp-2 font-body text-sm font-medium text-ink">{album.name}</p>
                  <p className="line-clamp-1 font-mono text-[10px] text-graphite" title={album.title}>
                    {album.title}
                  </p>
                  {done && (
                    <Link
                      href={`/admin/products/${album.productId}/edit`}
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

      {!loading && !error && albums.length === 0 && (
        <p className="mt-6 font-mono text-xs text-graphite">Không có album nào ở đây.</p>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pager page={page} totalPages={totalPages} setPage={setPage} disabled={disabled || loading} />
        </div>
      )}
    </section>
  );
}

function Pager({
  page,
  totalPages,
  setPage,
  disabled,
}: {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  disabled: boolean;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Trang album" className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => setPage(page - 1)}
        className={`${ghostButtonClass} min-h-11 min-w-11`}
        aria-label="Trang trước"
      >
        ‹
      </button>
      <span className="font-mono text-xs text-ink">
        Trang {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => setPage(page + 1)}
        className={`${ghostButtonClass} min-h-11 min-w-11`}
        aria-label="Trang sau"
      >
        ›
      </button>
    </nav>
  );
}

function OptionsPanel({
  options,
  setOptions,
  categories,
  selectedCount,
  running,
  onStart,
  onStop,
}: {
  options: Options;
  setOptions: (update: (o: Options) => Options) => void;
  categories: CategoryOption[];
  selectedCount: number;
  running: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  const set = <K extends keyof Options>(key: K, value: Options[K]) => setOptions((o) => ({ ...o, [key]: value }));
  const storeCategories = categories.filter((c) => c.department === options.department);
  const hasPrice = Number(options.price.replace(/\D/g, "")) > 0;

  function toggleCategory(id: string) {
    setOptions((o) => ({
      ...o,
      categoryIds: o.categoryIds.includes(id) ? o.categoryIds.filter((c) => c !== id) : [...o.categoryIds, id],
    }));
  }

  return (
    <section aria-labelledby="import-options" className="die-cut flex flex-col gap-5 bg-paper p-4 lg:sticky lg:top-4">
      <h2 id="import-options" className="font-display text-lg text-ink">
        Tuỳ chọn nhập
      </h2>

      <fieldset disabled={running} className="flex flex-col gap-2">
        <legend className={labelClass}>Nhập vào web</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(["CLOTHING", "SHOES"] as const).map((d) => (
            <label
              key={d}
              className={
                "flex min-h-11 cursor-pointer items-center justify-center border font-body text-sm transition-colors " +
                (options.department === d ? "border-ink bg-ink text-paper" : "border-kraft-dark text-ink hover:border-ink")
              }
            >
              <input
                type="radio"
                name="import-department"
                value={d}
                checked={options.department === d}
                onChange={() => setOptions((o) => ({ ...o, department: d, categoryIds: [] }))}
                className="sr-only"
              />
              {d === "CLOTHING" ? "Quần áo" : "Giày"}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={running} className="flex flex-col gap-2">
        <legend className={labelClass}>Danh mục trên web</legend>
        {storeCategories.length === 0 ? (
          <p className="font-mono text-[11px] text-graphite">Web này chưa có danh mục. Có thể gắn sau.</p>
        ) : (
          <div className="mt-1 flex max-h-48 flex-col gap-0.5 overflow-y-auto">
            {storeCategories.map((c) => (
              <div key={c.id}>
                <CategoryCheck label={c.label} checked={options.categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                {c.children.map((child) => (
                  <div key={child.id} className="pl-5">
                    <CategoryCheck
                      label={child.label}
                      checked={options.categoryIds.includes(child.id)}
                      onChange={() => toggleCategory(child.id)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset disabled={running} className="flex flex-col gap-2">
        <legend className={labelClass}>Lấy những gì từ album</legend>
        <label className="mt-1 flex items-center justify-between gap-3 font-body text-sm text-ink">
          <span>Số ảnh tối đa mỗi sản phẩm</span>
          <input
            type="number"
            min={1}
            max={40}
            value={options.maxPhotos}
            onChange={(e) => set("maxPhotos", Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
            className={`${inputClass} w-20 text-right`}
          />
        </label>
        <Check checked={options.translate} onChange={(v) => set("translate", v)}>
          Dịch tên sang tiếng Việt
          <Hint>Bỏ chọn thì giữ tên gốc tiếng Trung.</Hint>
        </Check>
        <Check checked={options.sizes} onChange={(v) => set("sizes", v)}>
          Size ghi trong album
          <Hint>Không ghi thì dùng size chuẩn của web.</Hint>
        </Check>
        <Check checked={options.description} onChange={(v) => set("description", v)}>
          Ghi chú của nhà cung cấp làm mô tả
          <Hint>Tiếng Trung, đã bỏ giá và WeChat/số điện thoại. Bỏ chọn thì dùng mô tả chung của web.</Hint>
        </Check>
      </fieldset>

      <fieldset disabled={running} className="flex flex-col gap-3">
        <legend className={labelClass}>Thông tin sản phẩm</legend>
        <label className="mt-1 flex flex-col gap-1.5 font-body text-sm text-ink">
          Chất lượng
          <select value={options.quality} onChange={(e) => set("quality", e.target.value)} className={`${inputClass} min-h-11`}>
            {QUALITY_TIERS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-body text-sm text-ink">
          Tình trạng hàng
          <select
            value={options.availability}
            onChange={(e) => set("availability", e.target.value as Options["availability"])}
            className={`${inputClass} min-h-11`}
          >
            <option value="PREORDER">Đặt trước (giao 10–15 ngày)</option>
            <option value="IN_STOCK">Có sẵn (số lượng = 0, bạn nhập sau)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-body text-sm text-ink">
          Giá bán (đ)
          <input
            inputMode="numeric"
            value={options.price}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              set("price", digits ? Number(digits).toLocaleString("vi-VN") : "");
            }}
            placeholder="Để trống, điền sau"
            className={inputClass}
          />
          <Hint>Một giá cho tất cả album đang chọn. Sửa hàng loạt sau ở danh sách sản phẩm.</Hint>
        </label>
      </fieldset>

      <fieldset disabled={running} className="flex flex-col gap-2">
        <legend className={labelClass}>Sau khi nhập</legend>
        <label className="mt-1 flex cursor-pointer items-start gap-2 font-body text-sm text-ink">
          <input
            type="radio"
            name="import-publish"
            checked={!options.publish || !hasPrice}
            onChange={() => set("publish", false)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
          />
          <span>Để ẩn, tôi xem lại rồi mới hiện</span>
        </label>
        <label className={`flex items-start gap-2 font-body text-sm text-ink ${hasPrice ? "cursor-pointer" : "opacity-50"}`}>
          <input
            type="radio"
            name="import-publish"
            checked={options.publish && hasPrice}
            disabled={!hasPrice}
            onChange={() => set("publish", true)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
          />
          <span>
            Hiện ngay trên web
            <Hint>{hasPrice ? "Khách thấy ngay khi nhập xong." : "Cần điền giá bán trước."}</Hint>
          </span>
        </label>
        <Check checked={options.again} onChange={(v) => set("again", v)}>
          Nhập lại cả album đã nhập
          <Hint>Tạo thêm một sản phẩm mới, không sửa sản phẩm cũ.</Hint>
        </Check>
      </fieldset>

      {running ? (
        <button type="button" className={`${ghostButtonClass} min-h-11`} onClick={onStop}>
          Dừng sau album đang nhập
        </button>
      ) : (
        <button type="button" disabled={selectedCount === 0} className={`${buttonClass} min-h-11`} onClick={onStart}>
          {selectedCount === 0 ? "Chọn album để nhập" : `Nhập ${selectedCount} album`}
        </button>
      )}
    </section>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="block font-mono text-[10px] text-graphite">{children}</span>;
}

function Check({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-2 font-body text-sm text-ink ${disabled ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
      />
      <span>{children}</span>
    </label>
  );
}

function CategoryCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-2 font-body text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-ink" />
      {label}
    </label>
  );
}

const STATUS_TEXT: Record<Job["status"], string> = {
  queued: "Chờ",
  reading: "Đang đọc album…",
  photos: "Đang tải ảnh",
  saving: "Đang lưu…",
  done: "Xong",
  skipped: "Đã có, bỏ qua",
  error: "Lỗi",
};

function JobRow({ job, sourceId }: { job: Job; sourceId: string }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden bg-kraft-dark/30">
        {job.album.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/admin/yupoo/cover?source=${sourceId}&src=${encodeURIComponent(job.album.cover)}`}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm text-ink">{job.album.name}</p>
        <p
          className={`font-mono text-[11px] ${job.status === "error" ? "text-stamp" : "text-graphite"}`}
          role={job.status === "error" ? "alert" : undefined}
        >
          {STATUS_TEXT[job.status]}
          {job.status === "photos" && ` ${job.done}/${job.total}`}
          {job.status === "error" && job.error && `: ${job.error}`}
          {job.status === "done" && (job.hidden ? " · đang ẩn" : " · đã hiện trên web")}
          {job.status === "done" && !!job.failedPhotos && ` · thiếu ${job.failedPhotos} ảnh`}
        </p>
      </div>
      {job.productId && (job.status === "done" || job.status === "skipped") && (
        <Link
          href={`/admin/products/${job.productId}/edit`}
          className="shrink-0 font-mono text-xs text-ink hover:underline"
        >
          Sửa
        </Link>
      )}
    </li>
  );
}
