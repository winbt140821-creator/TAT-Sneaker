import Image from "next/image";
import { GarmentArt, garmentSilhouetteFor } from "@/components/GarmentArt";

// Product photography laid out the way COS and Zara do it: on desktop every
// photo is shown at once in a two-up grid of tall frames running down the
// left of the page (the buyer scrolls the pictures, the purchase column
// stays put); on phones they become a swipeable full-width strip. No
// thumbnails, no arrows, no zoom lens.
export function ClothingGallery({ images, name }: { images: string[]; name: string }) {
  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[3/4] items-center justify-center bg-kraft p-16 lg:aspect-auto lg:min-h-[calc(100svh-60px)]">
        <GarmentArt silhouette={garmentSilhouetteFor(0)} accent="#b5b5b5" className="h-full max-h-[420px] w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {images.map((src, i) => (
          <div
            key={src}
            className="relative aspect-[3/4] w-full shrink-0 snap-center bg-kraft"
            style={i === 0 ? { viewTransitionName: "product-photo" } : undefined}
          >
            <Image
              src={src}
              alt={i === 0 ? name : ""}
              fill
              priority={i === 0}
              sizes="100vw"
              quality={90}
              className="object-cover"
            />
            {images.length > 1 && (
              <span className="absolute bottom-3 right-3 text-[11px] text-ink/70">
                {i + 1}/{images.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* One or two photos: stacked full-width so the column is as long as
          the pinned purchase column beside it. Three or more: the lead photo
          spans the full width, the rest pair up underneath. */}
      <div className={"hidden gap-0.5 lg:grid " + (images.length > 2 ? "lg:grid-cols-2" : "lg:grid-cols-1")}>
        {images.map((src, i) => {
          const full = images.length <= 2 || i === 0;
          return (
            <div
              key={src}
              className={"relative aspect-[3/4] bg-kraft " + (images.length > 2 && i === 0 ? "lg:col-span-2" : "")}
              style={i === 0 ? { viewTransitionName: "product-photo" } : undefined}
            >
              <Image
                src={src}
                alt={i === 0 ? name : ""}
                fill
                priority={i === 0}
                sizes={full ? "65vw" : "33vw"}
                quality={95}
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
