import Image from "next/image";
import type { GalleryItem } from "../../content/gallery";
import { getCloudinaryImageUrl } from "../../lib/media/cloudinary";

export function GalleryGrid({
  items,
  columns = "two"
}: {
  items: GalleryItem[];
  columns?: "two" | "three";
}) {
  return (
    <div className={`grid gap-6 ${columns === "three" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2"}`}>
      {items.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4]">
          <div className="relative aspect-[4/3] bg-[#eadaca]">
            <Image
              src={getCloudinaryImageUrl(item.imagePublicId, { width: 1200, height: 900 })}
              alt={item.alt}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-3 p-6">
            <div className="inline-flex rounded-full border border-[#d8c6b4] bg-[#f7efe6] px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[#715947]">
              {item.tag}
            </div>
            <h3 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{item.title}</h3>
            <p className="text-sm leading-6 text-[#5c4a3d]">{item.caption}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
