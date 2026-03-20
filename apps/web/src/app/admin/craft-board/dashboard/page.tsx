import { CraftBoardDashboard } from "../../../../components/craft-board-dashboard";
import { buildCraftBoardDashboardData } from "../../../../lib/seo/dashboard";

export const dynamic = "force-dynamic";

function parseLookbackDays(value: string | undefined) {
  const days = Number(value);
  return [7, 28, 90].includes(days) ? days : 28;
}

export default async function CraftBoardDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ days?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const lookbackDays = parseLookbackDays(resolvedSearchParams?.days);
  const data = await buildCraftBoardDashboardData({
    lookbackDays
  });

  return <CraftBoardDashboard data={data} />;
}
