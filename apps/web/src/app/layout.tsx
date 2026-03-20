import type { Metadata } from "next";
import { CurrentContextChip } from "../components/current-context-chip";
import { Nav } from "../components/nav";
import { SeoAttributionTracker } from "../components/storefront/SeoAttributionTracker";
import { StructuredDataScript } from "../components/storefront/StructuredDataScript";
import { getViewerContext } from "../lib/api";
import { generatePageSEO } from "../lib/seo/metadata";
import { getOrganizationSchema } from "../lib/seo/organizationSchema";
import { getHomePageKey } from "../lib/seo/overrides";
import { getSiteVerificationMetadata } from "../lib/seo/siteVerification";
import { getRequestSiteContext } from "../lib/request-site";
import "../components/labels/shelf-label.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSiteContext();
  const title = site.isMarketingHost ? "Craft & Board" : "FieldMetriq App";
  const description = site.isMarketingHost
    ? "Craft & Board creates custom floating shelves and made-to-order architectural wood products."
    : "FieldMetriq app for operations, production, labels, inventory, and machine workflows.";

  const baseMetadata = site.isMarketingHost
    ? generatePageSEO({
        title,
        description,
        pathname: "/",
        pageKey: getHomePageKey()
      })
    : {
        title,
        description,
        robots: {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true
          }
        }
      };

  return {
    ...baseMetadata,
    ...(site.isMarketingHost ? getSiteVerificationMetadata() : {}),
    metadataBase: new URL(site.resolvedOrigin),
    applicationName: site.isMarketingHost ? "Craft & Board" : "FieldMetriq",
    title: {
      default: title,
      template: site.isMarketingHost ? "%s" : "%s | FieldMetriq"
    }
  };
}

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getRequestSiteContext();
  const contextPromise = site.isMarketingHost ? null : getViewerContext();

  return (
    <html lang="en">
      <body className={site.isMarketingHost ? "storefront-shell" : "app-shell"}>
        {site.isMarketingHost ? <StructuredDataScript data={getOrganizationSchema()} /> : null}
        {site.isMarketingHost ? <SeoAttributionTracker /> : null}
        {site.isMarketingHost ? (
          children
        ) : (
          <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
            <header className="mb-10 rounded-[2rem] border border-white/10 bg-[var(--panel)] p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">fieldmetriq app</p>
                  <div>
                    <h1 className="text-4xl font-semibold tracking-tight text-white">FieldMetriq</h1>
                    <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                      Operating system for field and shop workflows, with orders, costing, manufacturing, telemetry, scans, containers, and inventory in one app shell.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-4 lg:items-end">
                  <CurrentContextChip context={await contextPromise} />
                  <Nav />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
