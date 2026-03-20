import type { MetadataRoute } from "next";
import { MARKETING_URL } from "../lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/order",
          "/order/status",
          "/order/payment",
          "/proposal",
          "/deposit"
        ]
      }
    ],
    sitemap: `${MARKETING_URL}/sitemap.xml`
  };
}
