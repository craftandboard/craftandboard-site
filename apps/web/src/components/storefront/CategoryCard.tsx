import Link from "next/link";
import Image from "next/image";
import type { StorefrontCategory } from "../../content/categories";
import { getCloudinaryImageUrl } from "../../lib/media/cloudinary";

export function CategoryCard({ category }: { category: StorefrontCategory }) {
  const active = category.status === "active";

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] shadow-[0_18px_50px_rgba(59,39,26,0.08)]">
      <div className="relative aspect-[4/3] bg-[#eadaca]">
        <Image
          src={getCloudinaryImageUrl(category.imagePublicId, { width: 900, height: 675 })}
          alt={category.title}
          fill
          className="object-cover"
        />
        <div className="absolute left-5 top-5 rounded-full bg-[#fff6ed]/90 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[#745540]">
          {active ? "Available now" : "Coming soon"}
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div>
          <h3 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{category.title}</h3>
          <p className="mt-3 text-sm leading-6 text-[#5b4c40]">{category.description}</p>
          {category.supportingCopy ? <p className="mt-3 text-sm leading-6 text-[#7a6555]">{category.supportingCopy}</p> : null}
        </div>
        <Link
          href={category.href}
          aria-disabled={!active}
          className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${
            active
              ? "bg-[#2b1d16] text-[#f7f0e7] hover:bg-[#4a3529]"
              : "border border-[#d3c0ad] text-[#8b796a]"
          }`}
        >
          {active ? "Browse Category" : "Launching Soon"}
        </Link>
      </div>
    </article>
  );
}
