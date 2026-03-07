import type {
  ShelfLabelBatch,
  ShelfLabelData,
  ShelfLabelRenderOptions
} from "@craft-and-board/shared";

export type { ShelfLabelBatch, ShelfLabelData, ShelfLabelRenderOptions };

export interface RenderedShelfLabelData extends ShelfLabelData {
  barcodeSvg: string;
}

export interface RenderedShelfLabelBatch {
  bundleCode: string;
  labelCount: number;
  labels: RenderedShelfLabelData[];
}
