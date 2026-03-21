import Link from "next/link";
import { cabinetShelfSupportContent } from "../../../content/cabinetShelves";

export function CabinetShelfMeasurementHelp() {
  return (
    <article className="rounded-[2rem] border border-[#dbcab9] bg-[#f8eee2] p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Measurement Help</p>
      <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl text-[#281a13]">
        {cabinetShelfSupportContent.guideReminderTitle}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#5c4a3d]">{cabinetShelfSupportContent.guideReminderBody}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/guides/how-to-measure-cabinet-shelves"
          className="rounded-full bg-[#2b1d16] px-5 py-3 text-sm font-medium text-[#f7efe5] transition hover:bg-[#4a3529]"
        >
          Read the cabinet shelf measurement guide
        </Link>
        <Link
          href="/shop/cabinet-shelves"
          className="rounded-full border border-[#cdb59e] px-5 py-3 text-sm font-medium text-[#4f3f33] transition hover:bg-white"
        >
          Browse cabinet shelf finishes
        </Link>
      </div>
    </article>
  );
}
