export interface ShelfLabelViewModel {
  bundleCode: string;
  shipByDate: string;
  productLabel: string;
  quantityDisplay: string;
  customerLastName: string;
  orderId: string;
  boxCode: string | null;
  shelfLengthIn: string;
  shelfDepthIn: string;
  jobNumber: number;
  partCode: string;
  barcodeValue: string;
  materialCode: string;
  barcodeSvg: string;
}

export function ShelfLabel({ label }: { label: ShelfLabelViewModel }) {
  return (
    <article className="shelf-label">
      <div className="shelf-label__row shelf-label__row--top">
        <section className="shelf-label__cell">
          <div className="shelf-label__meta">Shelf QTY</div>
          <div className="shelf-label__value">{label.quantityDisplay}</div>
        </section>
        <section className="shelf-label__cell">
          <div className="shelf-label__meta">Customer Name</div>
          <div className="shelf-label__value shelf-label__value--name">{label.customerLastName}</div>
        </section>
        <section className="shelf-label__cell">
          <div className="shelf-label__meta">Box Code</div>
          <div className={`shelf-label__value ${label.boxCode ? "" : "shelf-label__empty"}`}>
            {label.boxCode ?? ""}
          </div>
        </section>
        <section className="shelf-label__cell shelf-label__cell--no-right">
          <div className="shelf-label__meta">Job #</div>
          <div className="shelf-label__value">{label.jobNumber}</div>
        </section>
      </div>

      <div className="shelf-label__row shelf-label__row--middle">
        <section className="shelf-label__cell shelf-label__vertical">SHELF</section>
        <section className="shelf-label__cell">
          <div className="shelf-label__meta">Product SKU</div>
          <div className="shelf-label__value">{label.productLabel}</div>
        </section>
        <section className="shelf-label__cell">
          <div className="shelf-label__meta">Shelf Length</div>
          <div className="shelf-label__value shelf-label__value--dim">{label.shelfLengthIn}</div>
        </section>
        <section className="shelf-label__cell shelf-label__cell--no-right">
          <div className="shelf-label__meta">Shelf Depth</div>
          <div className="shelf-label__value shelf-label__value--dim">{label.shelfDepthIn}</div>
        </section>
      </div>

      <div className="shelf-label__row shelf-label__row--bottom">
        <section className="shelf-label__cell shelf-label__cell--row-bottom">
          <div className="shelf-label__meta">Order ID</div>
          <div className="shelf-label__barcode-wrap">
            <div
              className="shelf-label__barcode"
              dangerouslySetInnerHTML={{ __html: label.barcodeSvg }}
            />
            <div className="shelf-label__barcode-text">{label.orderId}</div>
          </div>
        </section>
        <section className="shelf-label__cell shelf-label__cell--row-bottom shelf-label__cell--no-right">
          <div className="shelf-label__meta">Ship By Date</div>
          <div className="shelf-label__value shelf-label__value--ship">{label.shipByDate}</div>
        </section>
      </div>
    </article>
  );
}
