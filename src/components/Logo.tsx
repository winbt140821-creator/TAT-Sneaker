import Image from "next/image";
import { site } from "@/lib/site-config";
import { BrandLogo } from "./BrandLogo";
import { ClothingWordmark } from "./ClothingWordmark";
import type { Department } from "@/lib/inventory";

// Shown in Header/Footer/admin. Uses the real uploaded file once an admin
// sets one via Cài đặt > Logo — falls back to a drawn mark until then.
// BrandLogo (a sneaker-silhouette sticker badge) is the shoe site's mark;
// department "CLOTHING" gets a plain wordmark instead so the header isn't
// showing a shoe icon on the storefront that's supposed to be free of them.
export function Logo({
  logoUrl,
  imageClassName,
  brandVariant = "dark",
  department = "SHOES",
}: {
  logoUrl?: string | null;
  imageClassName?: string;
  /** Passed to the fallback mark when no uploaded logo exists yet — "light" for dark backgrounds like the footer. */
  brandVariant?: "dark" | "light";
  department?: Department;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={site.name}
        width={160}
        height={48}
        className={imageClassName ?? "h-8 w-auto object-contain"}
      />
    );
  }

  if (department === "CLOTHING") {
    return <ClothingWordmark variant={brandVariant} className={imageClassName ?? "h-8 w-auto"} />;
  }

  return <BrandLogo variant={brandVariant} className={imageClassName ?? "h-8 w-auto"} />;
}
