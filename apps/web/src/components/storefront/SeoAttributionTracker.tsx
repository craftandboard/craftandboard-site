"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { captureSeoLandingAttribution } from "../../lib/seo/attribution";

export function SeoAttributionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    captureSeoLandingAttribution(pathname, searchParams?.toString() ?? "");
  }, [pathname, searchParams]);

  return null;
}
