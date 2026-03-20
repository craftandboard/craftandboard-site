import { CraftBoardInquiryDetail } from "../../../../../components/craft-board-inquiry-detail";

export default async function CraftBoardInquiryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;

  return <CraftBoardInquiryDetail inquiryId={resolved.id} />;
}
