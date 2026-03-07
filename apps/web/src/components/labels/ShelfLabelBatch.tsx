import { ShelfLabel, type ShelfLabelViewModel } from "./ShelfLabel";

export function ShelfLabelBatch({
  labels,
  centered = false
}: {
  labels: ShelfLabelViewModel[];
  centered?: boolean;
}) {
  return (
    <div className="shelf-label-batch">
      {labels.map((label) => (
        <div
          key={label.partCode}
          className={centered ? "shelf-label-sheet" : undefined}
        >
          <ShelfLabel label={label} />
        </div>
      ))}
    </div>
  );
}
