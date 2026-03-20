import { absoluteMarketingUrl } from "./metadata";

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Craft & Board",
    url: absoluteMarketingUrl("/"),
    logo: absoluteMarketingUrl("/logo.png"),
    sameAs: [
      "https://www.instagram.com/craftandboard",
      "https://www.pinterest.com/craftandboard"
    ]
  };
}
