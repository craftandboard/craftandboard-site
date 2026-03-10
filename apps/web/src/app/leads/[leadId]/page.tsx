import { MvpLeadEditor } from "../../../components/mvp-lead-editor";

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  return <MvpLeadEditor leadId={leadId} />;
}
