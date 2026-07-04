"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

// Standard base pixel snippet (minified fbevents loader), per Meta's docs —
// this is the same code Meta's own "Set up the Pixel" flow gives you.
function baseScript(pixelId: string) {
  return `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
`;
}

// App Router client-side navigation never reloads the page, so the base
// snippet's own PageView (fired once, at script load) only covers the first
// page — every navigation after that needs its own explicit PageView.
function PixelPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.fbq?.("track", "PageView");
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  // Admin traffic isn't a customer signal Meta should learn from — skip
  // loading the pixel there entirely.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {baseScript(pixelId)}
      </Script>
      <Suspense fallback={null}>
        <PixelPageviewTracker />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
