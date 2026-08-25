import type { Metadata } from "next";
import { AdminDashboardContent } from "../../../../components/admin-dashboard-content";

export const metadata: Metadata = {
  title: "Craft & Board Admin",
  description: "Craft & Board admin for operations, production review, and marketing workflows."
};

export default function CraftBoardDashboardPage() {
  return <AdminDashboardContent />;
}
