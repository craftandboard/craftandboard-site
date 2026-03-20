export const storefrontConfig = {
  brandName: "Craft & Board",
  brandTagline: "Replacement cabinet shelves made to fit with a calmer, easier measuring process.",
  primaryCtaHref: "/shop/cabinet-shelves",
  primaryCtaLabel: "Shop Cabinet Shelves",
  placeholderImage:
    "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'%3e%3crect width='1200' height='900' fill='%23e9ddcf'/%3e%3crect x='72' y='72' width='1056' height='756' rx='32' fill='%23d8c2aa'/%3e%3ctext x='50%25' y='48%25' text-anchor='middle' font-size='56' font-family='Georgia, serif' fill='%23524034'%3eCraft %26 Board%3c/text%3e%3ctext x='50%25' y='56%25' text-anchor='middle' font-size='28' font-family='Arial, sans-serif' fill='%23655347'%3ePremium made-to-order shelving%3c/text%3e%3c/svg%3e",
  navigation: [
    { href: "/shop/cabinet-shelves", label: "Shop" },
    { href: "/guides/how-to-measure-cabinet-shelves", label: "Measurement Guide" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" }
  ]
} as const;

export function storefrontTitle(title: string) {
  return `${storefrontConfig.brandName} | ${title}`;
}
