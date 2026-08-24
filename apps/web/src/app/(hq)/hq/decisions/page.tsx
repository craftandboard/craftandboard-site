import { HqContentBlocks } from "../../../../components/hq/hq-content-blocks";
import { HqNav } from "../../../../components/hq/hq-nav";
import { HqPageHeader } from "../../../../components/hq/hq-page-header";
import { requireHqViewer } from "../../../../lib/hq/access";
import { getHqDecisions, getHqDecisionsContent } from "../../../../lib/hq/data";
import { formatHqDate } from "../../../../lib/hq/format";

export default async function HqDecisionsPage() {
  const viewer = await requireHqViewer();
  const [intro, decisions] = await Promise.all([
    getHqDecisionsContent(),
    getHqDecisions(viewer.organizationId)
  ]);

  return (
    <div className="space-y-6">
      <HqPageHeader
        eyebrow="Decisions"
        title={intro.title}
        intent={intro.intent}
        status={intro.status}
      >
        <HqNav activeKey="decisions" />
      </HqPageHeader>

      <HqContentBlocks blocks={intro.blocks} />

      <section className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6">
        <h3 className="text-lg font-semibold text-[#2c221b]">Decision log</h3>

        {decisions.decisions.length === 0 ? (
          <p className="mt-3 text-sm italic leading-6 text-[#9a8a7b]">
            Nothing agreed yet. The first entry lands here once all three of us sign off on it.
          </p>
        ) : (
          <ol className="mt-5 space-y-4">
            {decisions.decisions.map((decision) => {
              const decidedAt = formatHqDate(decision.decidedAt);

              return (
                <li
                  key={decision.id}
                  className="rounded-[1.25rem] border border-[#ece2d6] bg-[#fdf7f0] p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-base font-semibold text-[#2c221b]">{decision.title}</h4>
                    {decidedAt ? (
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8d6b4f]">
                        {decidedAt}
                      </p>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#5c4a3d]">
                    {decision.body}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#6b7550]">
                    Agreed by {decision.agreedBy.length > 0 ? decision.agreedBy.join(", ") : "—"}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
