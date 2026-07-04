import Image from "next/image";
import { site } from "@/lib/site-config";
import { BrandLogo } from "./BrandLogo";

// Shown in Header/Footer/admin. Uses the real uploaded file once an admin
// sets one via Cài đặt > Logo — falls back to the drawn BrandLogo until then.
export function Logo({
  logoUrl,
  imageClassName,
  brandVariant = "dark",
}: {
  logoUrl?: string | null;
  imageClassName?: string;
  /** Passed to BrandLogo when no uploaded logo exists yet — "light" for dark backgrounds like the footer. */
  brandVariant?: "dark" | "light";
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

  return <BrandLogo variant={brandVariant} className={imageClassName ?? "h-8 w-auto"} />;
}
