import { HqContentBlocks } from "../../../../components/hq/hq-content-blocks";
import { HqNav } from "../../../../components/hq/hq-nav";
import { HqPageHeader } from "../../../../components/hq/hq-page-header";
import { requireHqViewer } from "../../../../lib/hq/access";
import { getHqPartnerResponses, getHqRolesContent } from "../../../../lib/hq/data";
import { formatHqDate } from "../../../../lib/hq/format";

export default async function HqRolesPage() {
  const viewer = await requireHqViewer();
  const [content, responses] = await Promise.all([
    getHqRolesContent(),
    getHqPartnerResponses(viewer.organizationId)
  ]);

  const answerFor = (personName: string, question: number) =>
    responses.responses.find(
      (response) => response.personName === personName && response.question === question
    ) ?? null;

  return (
    <div className="space-y-6">
      <HqPageHeader
        eyebrow="Roles"
        title={content.intro.title}
        intent={content.intro.intent}
        status={content.intro.status}
      >
        <HqNav activeKey="roles" />
      </HqPageHeader>

      <HqContentBlocks blocks={content.intro.blocks} />

      <section className="space-y-5">
        <h3 className="text-xl font-semibold text-[#2c221b]">The four questions</h3>
        {content.questions.map((question) => (
          <article
            key={question.number}
            className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6"
          >
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-xs uppercase tracking-[0.3em] text-[#6b7550]">
                Question {question.number}
              </span>
              <h4 className="text-lg font-semibold text-[#2c221b]">{question.prompt}</h4>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#6f5f51]">{question.intent}</p>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {content.partners.map((partner) => {
                const answer = answerFor(partner.name, question.number);
                const hasAnswer = Boolean(answer && answer.body.trim().length > 0);
                const submitted = formatHqDate(answer?.submittedAt);

                return (
                  <div
                    key={partner.name}
                    className="rounded-[1.25rem] border border-[#ece2d6] bg-[#fdf7f0] p-4"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-[#2c221b]">{partner.name}</p>
                      {submitted ? (
                        <p className="text-xs text-[#8d6b4f]">{submitted}</p>
                      ) : null}
                    </div>
                    {hasAnswer ? (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#5c4a3d]">
                        {answer?.body}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm italic leading-6 text-[#9a8a7b]">
                        Awaiting answer.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6">
        <h3 className="text-xl font-semibold text-[#2c221b]">Working split</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f5f51]">
          Proposed, not agreed. Each row moves to the decision log once all three of us sign off.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {content.partners.map((partner) => (
            <div key={partner.name} className="rounded-[1.25rem] border border-[#ece2d6] bg-[#fdf7f0] p-4">
              <p className="text-sm font-semibold text-[#2c221b]">{partner.name}</p>
              <p className="mt-1 text-sm leading-6 text-[#5c4a3d]">{partner.focus}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8d6b4f]">
                {partner.availability}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2d6c9] text-xs uppercase tracking-[0.18em] text-[#6b7550]">
                <th scope="col" className="py-3 pr-4 font-medium">Area</th>
                <th scope="col" className="py-3 pr-4 font-medium">Owner</th>
                <th scope="col" className="py-3 pr-4 font-medium">Support</th>
                <th scope="col" className="py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {content.roleRows.map((row) => (
                <tr key={row.area} className="border-b border-[#f0e7db] align-top">
                  <td className="py-3 pr-4 font-medium text-[#2c221b]">{row.area}</td>
                  <td className="py-3 pr-4 text-[#5c4a3d]">{row.owner}</td>
                  <td className="py-3 pr-4 text-[#5c4a3d]">{row.support}</td>
                  <td className="py-3 text-[#6f5f51]">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-[#2c221b]">Ownership options</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f5f51]">
            Four structures on the table. No split is filled in — that stays open until all three
            sets of answers are in.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {content.ownershipOptions.map((option) => (
            <article
              key={option.label}
              className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6"
            >
              <h4 className="text-lg font-semibold text-[#2c221b]">{option.label}</h4>
              <p className="mt-3 text-sm leading-6 text-[#5c4a3d]">{option.structure}</p>
              <p className="mt-3 text-sm leading-6 text-[#6f5f51]">{option.tradeoff}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#8d6b4f]">
                {option.split ?? "Split not set"}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
