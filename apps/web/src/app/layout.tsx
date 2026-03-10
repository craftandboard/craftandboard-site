import type { Metadata } from "next";
import Link from "next/link";
import { CurrentContextChip } from "../components/current-context-chip";
import { Nav } from "../components/nav";
import { getViewerContext } from "../lib/api";
import { getRequestSiteContext } from "../lib/request-site";
import { appUrl } from "../lib/site-config";
import "../components/labels/shelf-label.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSiteContext();
  const title = site.isMarketingHost ? "FieldMetriq" : "FieldMetriq App";
  const description = site.isMarketingHost
    ? "FieldMetriq is the operating system for field and shop workflows."
    : "FieldMetriq app for operations, production, labels, inventory, and machine workflows.";

  return {
    metadataBase: new URL(site.resolvedOrigin),
    applicationName: "FieldMetriq",
    title: {
      default: title,
      template: "%s | FieldMetriq"
    },
    description,
    openGraph: {
      title,
      description,
      siteName: "FieldMetriq",
      type: "website",
      url: site.resolvedOrigin
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
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
      <body>
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
          <header className="mb-10 rounded-[2rem] border border-white/10 bg-[var(--panel)] p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
                  {site.isMarketingHost ? "fieldmetriq.com" : "fieldmetriq app"}
                </p>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight text-white">
                    FieldMetriq
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                    {site.isMarketingHost
                      ? "Public marketing and product entry point for the FieldMetriq SaaS."
                      : "Operating system for field and shop workflows, with orders, costing, manufacturing, telemetry, scans, containers, and inventory in one app shell."}
                  </p>
                </div>
              </div>
              {site.isMarketingHost ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={appUrl("/login")}
                    className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-emerald-950"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={appUrl("/")}
                    className="rounded-full border border-white/10 px-5 py-3 text-sm text-white"
                  >
                    Open App
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 lg:items-end">
                  <CurrentContextChip context={await contextPromise} />
                  <Nav />
                </div>
              )}
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
