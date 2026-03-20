import Link from "next/link";
import type { CabinetShelfFinishComparison } from "../../../content/cabinetShelves";

export function CabinetShelfFinishComparison(input: {
  eyebrow?: string;
  title: string;
  body?: string;
  finishes: CabinetShelfFinishComparison[];
  showDecisionAid?: boolean;
  decisionAidTitle?: string;
  decisionAidChoices?: readonly string[];
}) {
  const {
    eyebrow,
    title,
    body,
    finishes,
    showDecisionAid = false,
    decisionAidTitle,
    decisionAidChoices = []
  } = input;

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">{eyebrow}</p> : null}
        <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#241811] sm:text-5xl">{title}</h2>
        {body ? <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{body}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {finishes.map((finish) => (
          <article
            key={finish.slug}
            className="rounded-[2rem] border border-[#dbcab9] bg-[#fffaf4] p-8 shadow-[0_18px_44px_rgba(59,39,26,0.06)]"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">{finish.title}</p>
            <h3 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">{finish.shortSummary}</h3>
            <div className="mt-5 space-y-4 text-sm leading-7 text-[#5c4a3d]">
              <p>{finish.visualStyle}</p>
              <p>{finish.practicalPositioning}</p>
              <p className="font-medium text-[#3f2d22]">{finish.bestForLine}</p>
            </div>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-[#4f3f33]">
              {finish.confidenceBullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
            <div className="mt-6 rounded-[1.25rem] border border-[#e0d2c4] bg-[#fbf5ee] p-4 text-sm leading-6 text-[#4f3f33]">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8d6b4f]">Choose this if</p>
              <p className="mt-2">{finish.chooseThisIf}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={finish.href} className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5]">
                View {finish.title}
              </Link>
              <Link
                href="/guides/how-to-measure-cabinet-shelves"
                className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33]"
              >
                Measurement Guide
              </Link>
            </div>
          </article>
        ))}
      </div>

      {showDecisionAid && decisionAidChoices.length ? (
        <div className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8d6b4f]">{decisionAidTitle ?? "Which One Is Right for Me?"}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {decisionAidChoices.map((choice) => (
              <div key={choice} className="rounded-[1.25rem] border border-[#e0d2c4] bg-[#fffaf4] p-4 text-sm leading-6 text-[#4f3f33]">
                {choice}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
