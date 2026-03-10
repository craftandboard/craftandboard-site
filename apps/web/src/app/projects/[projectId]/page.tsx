import { MvpProjectDetail } from "../../../components/mvp-project-detail";

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <MvpProjectDetail projectId={projectId} />;
}
