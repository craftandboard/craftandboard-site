import { HqNav } from "../../../components/hq/hq-nav";
import { HqPageHeader } from "../../../components/hq/hq-page-header";
import { HqSectionCard } from "../../../components/hq/hq-section-card";
import { requireHqViewer } from "../../../lib/hq/access";
import { getHqOverview } from "../../../lib/hq/data";

export default async function HqLandingPage() {
  const viewer = await requireHqViewer();
  const overview = await getHqOverview(viewer.organizationId);

  return (
    <div className="space-y-6">
      <HqPageHeader
        eyebrow="Where things stand"
        title="The plan, and what is still open"
        intent="Six sections. Status below reflects the actual state of each one — nothing is marked further along than it is."
      >
        <HqNav />
      </HqPageHeader>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {overview.sections.map((section) => (
          <HqSectionCard key={section.key} section={section} />
        ))}
      </div>

      <section className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6">
        <h3 className="text-lg font-semibold text-[#2c221b]">How to use this</h3>
        <ul className="mt-4 space-y-2">
          {[
            "Read the vision and opportunity pages first — they set the terms of everything else.",
            "Roles is the live one. Answers get added as they come back.",
            "Numbers stays blank until figures are confirmed. A blank is not a zero.",
            "Nothing is agreed until it appears on the decisions page."
          ].map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-6 text-[#5c4a3d]">
              <span aria-hidden className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8d6b4f]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
