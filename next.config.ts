import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Next 16 locks .next/dev to a single "next dev" process per project
// directory (see docs/01-app/02-guides/upgrading/version-16.md, "Concurrent
// dev and build"). That blocks running a second dev server (e.g. from
// another chat session) against this same folder. When PORT is set to
// something other than the default 3000, give that instance its own
// distDir so its lockfile doesn't collide with the primary server's.
const port = process.env.PORT;

// Product photos, hero image, logo, and bank-transfer QR all get uploaded to
// this R2 bucket in production (src/lib/uploads.ts) — parsed once here so
// both next/image's remotePatterns and the CSP img-src can allow it.
const r2Origin = (() => {
  if (!process.env.R2_PUBLIC_URL) return null;
  try {
    return new URL(process.env.R2_PUBLIC_URL).origin;
  } catch {
    return null;
  }
})();

// CSP only in production — dev needs 'unsafe-eval' and websocket connections
// for Turbopack HMR/React Refresh that would otherwise have to be
// enumerated exactly, and any mismatch just breaks the dev server for no
// security benefit (dev is never internet-facing).
const CSP_PROD = [
  "default-src 'self'",
  // Next.js ships inline hydration scripts — 'unsafe-inline' is a pragmatic
  // middle ground short of wiring up nonces through the proxy chain.
  // Meta Pixel (src/components/MetaPixel.tsx) loads fbevents.js from
  // connect.facebook.net and reports events by pinging facebook.com — only
  // active pages/routes actually render the pixel (admin never does), but
  // the CSP is site-wide so both hosts need to be allowed here regardless.
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https://lh3.googleusercontent.com https://platform-lookaside.fbsbx.com https://graph.facebook.com https://img.vietqr.io https://www.facebook.com${r2Origin ? ` ${r2Origin}` : ""}`,
  "font-src 'self' data:",
  "connect-src 'self' https://www.facebook.com",
  // Product videos (ProductDetail videoUrl) embed via youtube.com/embed.
  "frame-src https://www.youtube.com",
  // Sign-in redirects to Google/Facebook's own hosted auth pages.
  "form-action 'self' https://accounts.google.com https://www.facebook.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(process.env.NODE_ENV === "production"
    ? [
        { key: "Content-Security-Policy", value: CSP_PROD },
        // Only meaningful over HTTPS; browsers ignore it on plain HTTP.
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ]
    : []),
];

const nextConfig: NextConfig = {
  ...(port && port !== "3000" ? { distDir: `.next/preview-${port}` } : {}),
  // Image uploads (hero image, product photos, QR codes) go through Server
  // Actions as multipart form data — saveUploadedImages() in src/lib/uploads.ts
  // already caps individual files at 8MB, so the transport limit just needs
  // enough headroom above that for multipart encoding overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      // Google account avatar (Đăng nhập bằng Google)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Facebook account avatar (Đăng nhập bằng Facebook)
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
      // Dynamically generated bank-transfer QR (VietQR quick-link image API)
      { protocol: "https", hostname: "img.vietqr.io" },
      // Cloudflare R2 (product photos, hero image, logo — see src/lib/uploads.ts)
      ...(r2Origin ? [{ protocol: "https" as const, hostname: new URL(r2Origin).hostname }] : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
