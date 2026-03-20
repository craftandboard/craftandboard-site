import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexMetadata } from "../../../lib/seo/metadata";

export const metadata: Metadata = noIndexMetadata({
  title: "Craft & Board Order Flow",
  description: "Private order and payment flow for Craft & Board."
});

export default function StorefrontOrderLayout({ children }: { children: ReactNode }) {
  return children;
}
