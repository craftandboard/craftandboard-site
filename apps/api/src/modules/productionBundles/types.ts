import type {
  LabelExportRow,
  LegacyXmlBundleExport,
  MaterialCode,
  OptimizerExportRow,
  PickListRow,
  ProductionBundleSummary,
  ProductionPickList
} from "@craft-and-board/shared";

export type {
  LabelExportRow,
  LegacyXmlBundleExport,
  MaterialCode,
  OptimizerExportRow,
  PickListRow,
  ProductionBundleSummary,
  ProductionPickList
};

export interface ProductionBundleFiles {
  manifestJson: string;
  pickListHtml: string;
  pickListCsv: string;
  labelsCsv: string;
  optimizerCsv: string;
  legacyXml: string;
}

export interface ProductionBundleDetail {
  summary: ProductionBundleSummary;
  pickList: ProductionPickList;
  labels: {
    totalRows: number;
    rows: LabelExportRow[];
    csv: string;
  };
  optimizer: {
    totalRows: number;
    rows: OptimizerExportRow[];
    csv: string;
  };
  legacyXml: LegacyXmlBundleExport;
  files: ProductionBundleFiles;
}
