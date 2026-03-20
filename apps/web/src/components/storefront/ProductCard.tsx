import Link from "next/link";
import Image from "next/image";
import type { StorefrontProduct } from "../../content/products";
import { getCloudinaryImageUrl } from "../../lib/media/cloudinary";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const isLive = product.liveStatus === "LIVE";

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#dbcab9] bg-[#fffbf7] shadow-[0_18px_50px_rgba(59,39,26,0.08)]">
      <div className="relative aspect-[16/11] bg-[#eadaca]">
        <Image
          src={getCloudinaryImageUrl(product.imagePublicId, { width: 1100, height: 756 })}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="space-y-5 p-6">
        <div>
          <h3 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#281a13]">{product.name}</h3>
          <p className="mt-3 text-sm leading-6 text-[#5b4c40]">{product.shortDescription}</p>
          <p className="mt-3 text-sm leading-6 text-[#7a6555]">{product.storytelling}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizeCallouts.map((size) => (
            <span
              key={size}
              className="rounded-full border border-[#d8c6b4] bg-[#f7efe6] px-3 py-1 text-xs tracking-[0.2em] text-[#6f5644]"
            >
              {size}
            </span>
          ))}
        </div>
        <ul className="space-y-2 text-sm text-[#4d3d31]">
          {product.featureBullets.map((bullet) => (
            <li key={bullet}>• {bullet}</li>
          ))}
        </ul>
        <Link
          href={product.href}
          aria-disabled={!isLive}
          className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${
            isLive
              ? "bg-[#2b1d16] text-[#f7f0e7] hover:bg-[#4a3529]"
              : "border border-[#d3c0ad] text-[#8b796a]"
          }`}
        >
          {isLive ? "View Product" : "Launching Soon"}
        </Link>
      </div>
    </article>
  );
}
