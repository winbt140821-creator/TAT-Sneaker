"use client";

import { useEffect, useRef } from "react";

type FacebookSdk = { XFBML?: { parse: (el?: Element) => void } };

// The Facebook Page box in the shoe store's footer. Facebook's SDK (plus
// the page iframe it builds) is one of the heaviest things on the site, and
// it used to download on every page shortly after load — even for the many
// phone visitors who never scroll down to the footer. Now it's only fetched
// once the footer is about to come on screen.
//
// Graph API versions expire ~2 years after release (v19.0 expired
// 2026-05-21) — the widget fails silently on every device once the pinned
// version lapses, so this needs bumping again well before v23.0's expiry.
const SDK_SRC = "https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v23.0";

export function FacebookPagePlugin({ href, name }: { href: string; name: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const fb = (window as unknown as { FB?: FacebookSdk }).FB;
        if (fb?.XFBML) {
          fb.XFBML.parse(el);
          return;
        }
        if (document.querySelector(`script[src="${SDK_SRC}"]`)) return;
        const script = document.createElement("script");
        script.src = SDK_SRC;
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        document.body.appendChild(script);
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="mt-3 max-w-[340px] overflow-hidden">
      <div id="fb-root" />
      <div
        className="fb-page"
        data-href={href}
        data-tabs=""
        data-width="340"
        data-height=""
        data-small-header="false"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="false"
      >
        <blockquote cite={href} className="fb-xfbml-parameter">
          <a href={href}>{name}</a>
        </blockquote>
      </div>
    </div>
  );
}
