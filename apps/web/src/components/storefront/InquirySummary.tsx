export type InquirySummaryValue = {
  productName: string;
  widthValue: number;
  widthUnit: string;
  depthValue: number;
  depthUnit: string;
  thicknessValue: number;
  thicknessUnit: string;
  quantity: number;
  materialLabel: string;
  mountingLabel: string;
  note?: string;
};

export function InquirySummary({ summary }: { summary: InquirySummaryValue }) {
  return (
    <aside className="rounded-[2rem] border border-[#dbcab9] bg-[#f4e7d8] p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-[#8d6b4f]">Summary</p>
      <div className="mt-5 grid gap-3 text-sm text-[#4f3f33]">
        <div className="rounded-2xl bg-[#fff8f0] p-4">Product: {summary.productName}</div>
        <div className="rounded-2xl bg-[#fff8f0] p-4">
          Width: {summary.widthValue} {summary.widthUnit}
        </div>
        <div className="rounded-2xl bg-[#fff8f0] p-4">
          Depth: {summary.depthValue} {summary.depthUnit}
        </div>
        <div className="rounded-2xl bg-[#fff8f0] p-4">
          Thickness: {summary.thicknessValue} {summary.thicknessUnit}
        </div>
        <div className="rounded-2xl bg-[#fff8f0] p-4">Material: {summary.materialLabel}</div>
        <div className="rounded-2xl bg-[#fff8f0] p-4">Mounting: {summary.mountingLabel}</div>
        <div className="rounded-2xl bg-[#fff8f0] p-4">Quantity: {summary.quantity}</div>
      </div>
      {summary.note ? <p className="mt-5 text-sm leading-6 text-[#5b4c40]">{summary.note}</p> : null}
    </aside>
  );
}
