import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Next 16 locks .next/dev to a single "next dev" process per project
// directory (see docs/01-app/02-guides/upgrading/version-16.md, "Concurrent
// dev and build"). That blocks running a second dev server (e.g. from
// another chat session) against this same folder. When PORT is set to
// something other than the default 3000, give that instance its own
// distDir so its lockfile doesn't collide with the primary server's.
const port = process.env.PORT;

// CSP only in production — dev needs 'unsafe-eval' and websocket connections
// for Turbopack HMR/React Refresh that would otherwise have to be
// enumerated exactly, and any mismatch just breaks the dev server for no
// security benefit (dev is never internet-facing).
const CSP_PROD = [
  "default-src 'self'",
  // Next.js ships inline hydration scripts — 'unsafe-inline' is a pragmatic
  // middle ground short of wiring up nonces through the proxy chain.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://lh3.googleusercontent.com https://platform-lookaside.fbsbx.com https://graph.facebook.com https://img.vietqr.io",
  "font-src 'self' data:",
  "connect-src 'self'",
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
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
