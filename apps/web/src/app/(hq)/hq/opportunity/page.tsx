import { HqContentBlocks } from "../../../../components/hq/hq-content-blocks";
import { HqNav } from "../../../../components/hq/hq-nav";
import { HqPageHeader } from "../../../../components/hq/hq-page-header";
import { getHqOpportunity } from "../../../../lib/hq/data";

export default async function HqOpportunityPage() {
  const opportunity = await getHqOpportunity();

  return (
    <div className="space-y-6">
      <HqPageHeader
        eyebrow="Opportunity"
        title={opportunity.title}
        intent={opportunity.intent}
        status={opportunity.status}
      >
        <HqNav activeKey="opportunity" />
      </HqPageHeader>
      <HqContentBlocks blocks={opportunity.blocks} />
    </div>
  );
}
