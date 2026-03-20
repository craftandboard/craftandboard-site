import { CraftBoardOrderDetail } from "../../../../../components/craft-board-order-detail";

export default async function CraftBoardOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;

  return <CraftBoardOrderDetail orderId={resolved.id} />;
}
