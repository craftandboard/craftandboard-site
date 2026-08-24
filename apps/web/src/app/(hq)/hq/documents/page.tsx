import { HqContentBlocks } from "../../../../components/hq/hq-content-blocks";
import { HqNav } from "../../../../components/hq/hq-nav";
import { HqPageHeader } from "../../../../components/hq/hq-page-header";
import { HqStatusBadge } from "../../../../components/hq/hq-status-badge";
import { requireHqViewer } from "../../../../lib/hq/access";
import { getHqDocuments, getHqDocumentsContent } from "../../../../lib/hq/data";
import { formatHqDate } from "../../../../lib/hq/format";

export default async function HqDocumentsPage() {
  const viewer = await requireHqViewer();
  const [content, documents] = await Promise.all([
    getHqDocumentsContent(),
    getHqDocuments(viewer.organizationId)
  ]);

  const linkedTitles = new Set(documents.documents.map((document) => document.title.toLowerCase()));
  const missing = content.expected.filter((expected) => !linkedTitles.has(expected.title.toLowerCase()));

  return (
    <div className="space-y-6">
      <HqPageHeader
        eyebrow="Documents"
        title={content.intro.title}
        intent={content.intro.intent}
        status={content.intro.status}
      >
        <HqNav activeKey="documents" />
      </HqPageHeader>

      <HqContentBlocks blocks={content.intro.blocks} />

      <section className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6">
        <h3 className="text-lg font-semibold text-[#2c221b]">Linked documents</h3>
        {documents.documents.length === 0 ? (
          <p className="mt-3 text-sm italic leading-6 text-[#9a8a7b]">
            No Google Docs linked yet. Everything below is still to be created.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {documents.documents.map((document) => {
              const updated = formatHqDate(document.updatedAt);

              return (
                <li
                  key={document.id}
                  className="flex flex-col gap-2 rounded-[1.25rem] border border-[#ece2d6] bg-[#fdf7f0] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-semibold text-[#2c221b] underline decoration-[#c9b7a3] underline-offset-4 hover:decoration-[#2c221b]"
                    >
                      {document.title}
                    </a>
                    {updated ? (
                      <p className="mt-1 text-xs text-[#8d6b4f]">Updated {updated}</p>
                    ) : null}
                  </div>
                  <HqStatusBadge status={document.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[1.75rem] border border-[#e2d6c9] bg-[#fffaf4] p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-lg font-semibold text-[#2c221b]">Still to be created</h3>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8d6b4f]">
            {missing.length} of {content.expected.length} outstanding
          </p>
        </div>

        {missing.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#5c4a3d]">
            Every expected document exists and is linked above.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2d6c9] text-xs uppercase tracking-[0.18em] text-[#6b7550]">
                  <th scope="col" className="py-3 pr-4 font-medium">Document</th>
                  <th scope="col" className="py-3 pr-4 font-medium">Purpose</th>
                  <th scope="col" className="py-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {missing.map((expected) => (
                  <tr key={expected.title} className="border-b border-[#f0e7db] align-top">
                    <td className="py-3 pr-4 font-medium text-[#2c221b]">{expected.title}</td>
                    <td className="py-3 pr-4 text-[#6f5f51]">{expected.purpose}</td>
                    <td className="py-3 text-[#5c4a3d]">{expected.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
