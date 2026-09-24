// Smoke test: opens every kind of customer-facing page on both storefronts
// and fails if any of them errors. Exists because the two worst outages so
// far (every product page, then every policy page, returning 500 — Sept
// 2026) only ever happened on a production build: `next dev` rendered both
// fine. So this runs against a real `next build` + `next start` before each
// push (scripts/verify.mjs), and against the live site after each deploy
// (.github/workflows/smoke.yml).
//
// Usage: node scripts/smoke.mjs https://tatsneaker.vn
// No dependencies — plain Node 18+ fetch, so CI doesn't need `npm ci`.

const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

// "200": must render normally. "ok": anything below 400 (redirects are
// fine, e.g. a login-gated page). "no5xx": may 404 (content the owner
// hasn't created yet) but must never crash.
const checks = [
  { path: "/", expect: "200", label: "Trang giới thiệu" },
  { path: "/giay", expect: "200", label: "Trang chủ giày", discover: "SHOES" },
  { path: "/quan-ao", expect: "200", label: "Trang chủ quần áo", discover: "CLOTHING" },
  { path: "/en/giay", expect: "200", label: "Trang chủ giày (EN)" },
  { path: "/en/quan-ao", expect: "200", label: "Trang chủ quần áo (EN)" },
  { path: "/gio-hang", expect: "200", label: "Giỏ hàng" },
  { path: "/quan-ao/gio-hang", expect: "200", label: "Giỏ hàng (quần áo)" },
  { path: "/yeu-thich", expect: "200", label: "Yêu thích" },
  { path: "/thanh-toan", expect: "ok", label: "Thanh toán" },
  { path: "/tra-cuu-don-hang", expect: "200", label: "Tra cứu đơn" },
  { path: "/dang-nhap", expect: "200", label: "Đăng nhập" },
  { path: "/tai-khoan", expect: "ok", label: "Tài khoản" },
  { path: "/trang/chinh-sach-quyen-rieng-tu", expect: "no5xx", label: "Trang chính sách" },
  { path: "/quan-ao/trang/chinh-sach-quyen-rieng-tu", expect: "no5xx", label: "Trang chính sách (quần áo)" },
  { path: "/admin/login", expect: "200", label: "Admin đăng nhập" },
  { path: "/sitemap.xml", expect: "200", label: "Sitemap" },
  { path: "/robots.txt", expect: "200", label: "robots.txt" },
  // Old shoe-homepage URLs (ads, Google) must keep landing somewhere.
  // Shoe listings keep their original address — no redirect.
  { path: "/?category=nike", expect: "no5xx", label: "Link danh mục giày dạng cũ" },
  { path: "/?sort=newest", expect: "200", label: "Danh sách giày dạng cũ" },
];

async function hit(path, redirect = "manual", userAgent = "tat-smoke-test") {
  const started = Date.now();
  try {
    const res = await fetch(base + path, {
      redirect,
      headers: { "user-agent": userAgent, cookie: "NEXT_LOCALE=vi" },
      signal: AbortSignal.timeout(30_000),
    });
    const body = res.status < 400 ? await res.text() : "";
    return { status: res.status, body, ms: Date.now() - started, location: res.headers.get("location") };
  } catch (err) {
    return { status: 0, body: "", ms: Date.now() - started, error: err.message };
  }
}

function passes(expect, status) {
  if (status === 0) return false;
  if (expect === "200") return status === 200;
  if (expect === "ok") return status < 400;
  return status < 500;
}

const failures = [];
const discovered = {};

for (const check of checks) {
  const r = await hit(check.path);
  const ok = passes(check.expect, r.status);
  console.log(`${ok ? "OK  " : "FAIL"} ${String(r.status).padEnd(3)} ${String(r.ms).padStart(5)}ms  ${check.path}  (${check.label})${r.error ? ` — ${r.error}` : ""}`);
  if (!ok) failures.push(check.path);

  // Pull a real product and category link off each storefront's homepage
  // so product/category pages get tested without hardcoding IDs.
  if (check.discover && r.body) {
    const product = r.body.match(/href="((?:\/quan-ao)?\/san-pham\/[a-z0-9]+)"/);
    const category = r.body.match(/href="((?:\/quan-ao|\/giay)?\/?\?category=[^"&]+)"/);
    discovered[check.discover] = { product: product?.[1], category: category?.[1]?.replace(/&amp;/g, "&") };
  }
}

for (const [dept, found] of Object.entries(discovered)) {
  for (const path of [found.product, found.category].filter(Boolean)) {
    const r = await hit(path);
    const ok = r.status === 200;
    console.log(`${ok ? "OK  " : "FAIL"} ${String(r.status).padEnd(3)} ${String(r.ms).padStart(5)}ms  ${path}  (${dept})`);
    if (!ok) failures.push(path);
  }
  if (!found.product) console.log(`WARN không tìm thấy link sản phẩm nào trên trang chủ ${dept}`);
}

// What Facebook's link-preview crawler gets for product links. Product pages
// stream (loading.tsx), so a wrong-store link redirects inside the page and a
// missing product is a noindex "not found" page — both with status 200 (see
// resolveMissingProduct in san-pham/[id]). A real 3xx/404 is fine too.
const FB_BOT = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const shoeProduct = discovered.SHOES?.product;
if (shoeProduct) {
  const botChecks = [
    {
      path: `/quan-ao${shoeProduct}?fbclid=smoke`,
      label: "Link sai cửa hàng → chuyển về đúng cửa hàng, giữ fbclid (bot Facebook)",
      ok: (r) =>
        r.status >= 300 && r.status < 400
          ? (r.location || "").endsWith(`${shoeProduct}?fbclid=smoke`)
          : r.status === 200 && r.body.includes(`NEXT_REDIRECT;replace;${shoeProduct}?fbclid=smoke;`),
    },
    {
      path: "/san-pham/khongtontaismoketest",
      label: "Sản phẩm không tồn tại → trang không tìm thấy, noindex (bot Facebook)",
      ok: (r) => r.status === 404 || (r.status === 200 && r.body.includes("noindex") && r.body.includes("NEXT_HTTP_ERROR_FALLBACK;404")),
    },
    { path: shoeProduct, label: "Sản phẩm giày có ảnh xem trước (bot Facebook)", ok: (r) => r.status === 200 && r.body.includes('property="og:title"') },
  ];
  for (const check of botChecks) {
    const r = await hit(check.path, "manual", FB_BOT);
    const ok = check.ok(r);
    console.log(`${ok ? "OK  " : "FAIL"} ${String(r.status).padEnd(3)} ${String(r.ms).padStart(5)}ms  ${check.path}  (${check.label})`);
    if (!ok) failures.push(check.path);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} trang lỗi: ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`\nTất cả trang đều ổn (${base}).`);
