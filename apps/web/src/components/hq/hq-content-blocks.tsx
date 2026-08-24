import type { HqContentBlock } from "../../lib/hq/types";

export function HqContentBlocks({ blocks }: { blocks: HqContentBlock[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {blocks.map((block) => (
        <section
          key={block.heading}
          className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6"
        >
          <h3 className="text-lg font-semibold text-[#2c221b]">{block.heading}</h3>
          <p className="mt-3 text-sm leading-7 text-[#6f5f51]">{block.body}</p>
          {block.points.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {block.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6 text-[#5c4a3d]">
                  <span aria-hidden className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#8d6b4f]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
