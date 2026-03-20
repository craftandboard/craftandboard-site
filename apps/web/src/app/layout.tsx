import type { Metadata } from "next";
import { CurrentContextChip } from "../components/current-context-chip";
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
  const title = site.isMarketingHost ? "Craft & Board" : "Craft & Board Admin";
  const description = site.isMarketingHost
    ? "Craft & Board creates replacement cabinet shelves and made-to-order wood shelving with a calm, guided ordering experience."
    : "Craft & Board admin for orders, marketing, outreach, and cabinet shelf operations.";

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
    applicationName: site.isMarketingHost ? "Craft & Board" : "Craft & Board Admin",
    title: {
      default: title,
      template: site.isMarketingHost ? "%s" : "%s | Craft & Board Admin"
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
          <div className="cb-admin-report min-h-screen">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
              <header className="mb-8 rounded-[2rem] border border-[#e2d6c9] bg-[#fffaf4]/95 p-6 shadow-[0_18px_48px_rgba(73,50,33,0.08)] backdrop-blur">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-[0.35em] text-[#6b7550]">Craft &amp; Board Admin</p>
                    <div>
                      <h1 className="text-4xl font-semibold tracking-tight text-[#2c221b]">Private workspace for Craft &amp; Board</h1>
                      <p className="mt-2 max-w-2xl text-sm text-[#6f5f51]">
                        Orders, marketing, SEO, outreach, and cabinet shelf operations in one locked-down internal workspace.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-4 lg:items-end">
                    <CurrentContextChip context={await contextPromise} />
                  </div>
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
