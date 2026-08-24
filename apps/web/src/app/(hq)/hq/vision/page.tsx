import { HqContentBlocks } from "../../../../components/hq/hq-content-blocks";
import { HqNav } from "../../../../components/hq/hq-nav";
import { HqPageHeader } from "../../../../components/hq/hq-page-header";
import { getHqVision } from "../../../../lib/hq/data";

export default async function HqVisionPage() {
  const vision = await getHqVision();

  return (
    <div className="space-y-6">
      <HqPageHeader
        eyebrow="Vision"
        title={vision.title}
        intent={vision.intent}
        status={vision.status}
      >
        <HqNav activeKey="vision" />
      </HqPageHeader>
      <HqContentBlocks blocks={vision.blocks} />
    </div>
  );
}
