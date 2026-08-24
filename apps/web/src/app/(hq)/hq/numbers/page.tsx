import { HqContentBlocks } from "../../../../components/hq/hq-content-blocks";
import { HqNav } from "../../../../components/hq/hq-nav";
import { HqPageHeader } from "../../../../components/hq/hq-page-header";
import { getHqNumbers } from "../../../../lib/hq/data";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export default async function HqNumbersPage() {
  const { intro, groups } = await getHqNumbers();

  return (
    <div className="space-y-6">
      <HqPageHeader
        eyebrow="Numbers"
        title={intro.title}
        intent={intro.intent}
        status={intro.status}
      >
        <HqNav activeKey="numbers" />
      </HqPageHeader>

      <HqContentBlocks blocks={intro.blocks} />

      <div className="space-y-5">
        {groups.map((group) => {
          const confirmed = group.lines.filter((line) => line.amountUsd !== null).length;

          return (
            <section
              key={group.title}
              className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-lg font-semibold text-[#2c221b]">{group.title}</h3>
                <p className="text-xs uppercase tracking-[0.18em] text-[#87664b]">
                  {confirmed} of {group.lines.length} confirmed
                </p>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f5f51]">{group.intent}</p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e2d6c9] text-xs uppercase tracking-[0.18em] text-[#67714d]">
                      <th scope="col" className="py-3 pr-4 font-medium">Line item</th>
                      <th scope="col" className="py-3 pr-4 font-medium">Amount</th>
                      <th scope="col" className="py-3 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.lines.map((line) => (
                      <tr key={line.label} className="border-b border-[#f0e7db] align-top">
                        <td className="py-3 pr-4 font-medium text-[#2c221b]">{line.label}</td>
                        <td className="py-3 pr-4">
                          {line.amountUsd === null ? (
                            <span className="italic text-[#786b5f]">Not confirmed</span>
                          ) : (
                            <span className="text-[#2c221b]">{currency.format(line.amountUsd)}</span>
                          )}
                        </td>
                        <td className="py-3 text-[#6f5f51]">{line.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
