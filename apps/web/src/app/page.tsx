import type { Metadata } from "next";
import { AdminDashboardContent } from "../components/admin-dashboard-content";
import { MarketingHome } from "../components/marketing-home";
import { getRequestSiteContext } from "../lib/request-site";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSiteContext();

  if (site.isMarketingHost) {
    return {
      title: "Craft & Board Admin Access",
      description: "Private Craft & Board admin access for authorized team members.",
      alternates: {
        canonical: "/"
      }
    };
  }

  return {
    title: "Craft & Board Admin",
    description: "Craft & Board admin for operations, production review, and marketing workflows.",
    alternates: {
      canonical: "/"
    }
  };
}

export default async function DashboardPage() {
  const site = await getRequestSiteContext();

  if (site.isMarketingHost) {
    return <MarketingHome appHomeHref="/login" signInHref="/login" />;
  }

  return <AdminDashboardContent />;
}
