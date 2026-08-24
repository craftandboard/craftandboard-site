import { HqNav } from "../../../../components/hq/hq-nav";
import { HqPageHeader } from "../../../../components/hq/hq-page-header";
import { requireHqViewer } from "../../../../lib/hq/access";
import { getHqPartnerResponses, getHqRolesContent } from "../../../../lib/hq/data";
import { formatHqDate } from "../../../../lib/hq/format";
import { saveHqAnswerAction } from "./actions";

/**
 * Phone-first, and blind-then-reveal.
 *
 * Nothing on this page hides another partner's answer with CSS, because the
 * API never sends one for a question the viewer has not answered. What arrives
 * for a locked question is a name and `hasAnswered: true` — that is all there
 * is to render.
 */
export default async function HqRolesPage() {
  const viewer = await requireHqViewer();
  const [content, view] = await Promise.all([
    getHqRolesContent(),
    getHqPartnerResponses(viewer.organizationId)
  ]);

  const viewerPersonName = view.viewer.personName;

  return (
    <div className="space-y-5">
      <HqPageHeader
        title={content.intro.title}
        intent={content.intro.intent}
        status={content.intro.status}
      >
        <HqNav activeKey="roles" />
      </HqPageHeader>

      {/* A — the four questions, question-first, each locked until you answer it */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
          <h3 className="text-xl font-semibold text-[#2c221b]">The four questions</h3>
          <p className="text-base font-medium text-[#87664b]">
            {`${view.totals.answered} of ${view.totals.target} in.`}
          </p>
        </div>

        {content.questions.map((question) => {
          const questionView = view.questions.find((entry) => entry.question === question.number);
          const unlocked = questionView?.unlocked ?? false;
          const visible = questionView?.responses ?? [];
          const lockedNames = new Set((questionView?.locked ?? []).map((entry) => entry.personName));
          const own = visible.find((entry) => entry.isOwn) ?? null;
          const answeredHere = unlocked ? visible.length : lockedNames.size;

          return (
            <details
              key={question.number}
              className="group overflow-hidden rounded-[1.5rem] border border-[#e2d6c9] bg-[#fffaf4]"
            >
              <summary className="flex min-h-[3.5rem] cursor-pointer select-none list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="block break-words text-base font-semibold leading-6 text-[#2c221b]">
                    {question.prompt}
                  </span>
                  <span className="mt-1 block text-sm text-[#87664b]">
                    {unlocked
                      ? `${answeredHere} of ${content.partners.length} answered`
                      : own
                        ? "answered"
                        : "locked — answer to see the others"}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e2d6c9] text-lg leading-none text-[#87664b] transition-transform duration-150 group-open:rotate-90"
                >
                  &rsaquo;
                </span>
              </summary>

              <div className="space-y-3 border-t border-[#f0e7db] p-4">
                <p className="text-sm leading-6 text-[#6f5f51]">{question.intent}</p>

                {content.partners.map((partner) => {
                  const answer = visible.find((entry) => entry.personName === partner.name) ?? null;

                  if (answer) {
                    const submitted = formatHqDate(answer.submittedAt);

                    return (
                      <div
                        key={partner.name}
                        className="rounded-[1.125rem] border border-[#ece2d6] bg-[#fdf7f0] p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className="text-base font-semibold text-[#2c221b]">
                            {partner.name}
                            {answer.isOwn ? (
                              <span className="ml-2 text-sm font-normal text-[#87664b]">you</span>
                            ) : null}
                          </p>
                          {submitted ? <p className="text-sm text-[#87664b]">{submitted}</p> : null}
                        </div>
                        <p className="mt-2 whitespace-pre-line break-words text-base leading-7 text-[#5c4a3d]">
                          {answer.body}
                        </p>
                      </div>
                    );
                  }

                  if (lockedNames.has(partner.name)) {
                    return (
                      <p key={partner.name} className="text-base leading-7">
                        <span className="font-medium text-[#2c221b]">{partner.name} answered</span>{" "}
                        <span className="text-[#786b5f]">— answer yours to see it.</span>
                      </p>
                    );
                  }

                  if (partner.name === viewerPersonName) {
                    return null;
                  }

                  return (
                    <p key={partner.name} className="text-base leading-7">
                      <span className="font-medium text-[#2c221b]">{partner.name}</span>{" "}
                      <span className="text-[#786b5f]">waiting</span>
                    </p>
                  );
                })}

                {viewerPersonName ? (
                  <form action={saveHqAnswerAction} className="mt-2 space-y-3">
                    <input type="hidden" name="question" value={question.number} />
                    <input type="hidden" name="responseId" value={own?.id ?? ""} />
                    <label
                      className="block text-sm uppercase tracking-[0.16em] text-[#67714d]"
                      htmlFor={`answer-${question.number}`}
                    >
                      {own ? "Your answer — edit any time" : "Your answer"}
                    </label>
                    <textarea
                      id={`answer-${question.number}`}
                      name="body"
                      required
                      defaultValue={own?.body ?? ""}
                      rows={5}
                      placeholder="Type your answer…"
                      className="w-full rounded-[1.125rem] border border-[#ded2c5] bg-[#fffdfa] p-4 text-base leading-7 text-[#2c221b] placeholder:text-[#786b5f] focus:border-[#87664b] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#2c221b] px-6 text-base font-medium text-[#fffaf4] transition hover:bg-[#43342a] sm:w-auto"
                    >
                      {own ? "Save changes" : "Save answer"}
                    </button>
                  </form>
                ) : null}
              </div>
            </details>
          );
        })}
      </section>

      {/* B — roles, one stacked card per function area */}
      <section className="space-y-3">
        <h3 className="px-1 text-xl font-semibold text-[#2c221b]">Roles</h3>

        {content.roleRows.map((row) => (
          <article
            key={row.area}
            className="rounded-[1.5rem] border border-[#e2d6c9] bg-[#fffaf4] p-4"
          >
            <h4 className="break-words text-base font-semibold text-[#2c221b]">{row.area}</h4>
            <dl className="mt-3 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <dt className="text-sm uppercase tracking-[0.16em] text-[#67714d]">Owns</dt>
                <dd
                  className={
                    row.owner
                      ? "break-words text-base text-[#2c221b]"
                      : "text-base italic text-[#786b5f]"
                  }
                >
                  {row.owner ?? "unassigned"}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <dt className="text-sm uppercase tracking-[0.16em] text-[#67714d]">Consulted</dt>
                <dd
                  className={
                    row.consulted
                      ? "break-words text-base text-[#2c221b]"
                      : "text-base italic text-[#786b5f]"
                  }
                >
                  {row.consulted ?? "unassigned"}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      {/* C — ownership options, one stacked card each, no comparison table */}
      <section className="space-y-3">
        <h3 className="px-1 text-xl font-semibold text-[#2c221b]">Ownership options</h3>

        {content.ownershipOptions.map((option) => (
          <article
            key={option.label}
            className="rounded-[1.5rem] border border-[#e2d6c9] bg-[#fffaf4] p-4"
          >
            <h4 className="break-words text-base font-semibold text-[#2c221b]">{option.label}</h4>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-sm uppercase tracking-[0.16em] text-[#67714d]">
                  Tim&rsquo;s stake
                </dt>
                <dd
                  className={
                    option.timStake
                      ? "mt-1 break-words text-base leading-7 text-[#2c221b]"
                      : "mt-1 text-base italic text-[#786b5f]"
                  }
                >
                  {option.timStake ?? "not set"}
                </dd>
              </div>
              <div>
                <dt className="text-sm uppercase tracking-[0.16em] text-[#67714d]">
                  How capital comes back
                </dt>
                <dd className="mt-1 break-words text-base leading-7 text-[#5c4a3d]">
                  {option.capitalReturn}
                </dd>
              </div>
              <div>
                <dt className="text-sm uppercase tracking-[0.16em] text-[#67714d]">When it fits</dt>
                <dd className="mt-1 break-words text-base leading-7 text-[#5c4a3d]">
                  {option.fitsWhen}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}
