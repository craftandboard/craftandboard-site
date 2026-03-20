import Link from "next/link";
import { storefrontConfig } from "../../lib/storefront/config";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-[#dccdbc] bg-[#f1e6d8]">
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_auto_auto]">
        <div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#241811]">
            {storefrontConfig.brandName}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#5c4a3d]">{storefrontConfig.brandTagline}</p>
        </div>
        <nav className="grid gap-3 text-sm text-[#4f3f33]">
          {storefrontConfig.navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#8c6c53]">Custom Orders</p>
          <Link
            href={storefrontConfig.primaryCtaHref}
            className="mt-4 inline-flex rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]"
          >
            {storefrontConfig.primaryCtaLabel}
          </Link>
        </div>
      </Container>
    </footer>
  );
}
