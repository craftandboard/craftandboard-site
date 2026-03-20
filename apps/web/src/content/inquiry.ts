import {
  floatingShelfDefaultConfig,
  floatingShelfDepthOptions,
  floatingShelfDepthUnit,
  floatingShelfMaterialOptions,
  floatingShelfMountingOptions,
  floatingShelfProductFamily,
  floatingShelfProductName,
  floatingShelfProductSlug,
  floatingShelfThicknessOptions,
  floatingShelfThicknessUnit,
  floatingShelfWidthUnit
} from "../lib/storefront/floatingShelf";

export const shelfInquiryConfig = {
  productFamily: floatingShelfProductFamily,
  productSlug: floatingShelfProductSlug,
  productName: floatingShelfProductName,
  widthUnit: floatingShelfWidthUnit,
  depthUnit: floatingShelfDepthUnit,
  thicknessUnit: floatingShelfThicknessUnit,
  defaultValues: {
    widthValue: floatingShelfDefaultConfig.width,
    depthValue: floatingShelfDefaultConfig.depth,
    thicknessValue: floatingShelfDefaultConfig.thickness,
    quantity: floatingShelfDefaultConfig.quantity
  },
  depthOptions: floatingShelfDepthOptions,
  thicknessOptions: floatingShelfThicknessOptions,
  materialOptions: floatingShelfMaterialOptions,
  mountingOptions: floatingShelfMountingOptions,
  helperCopy: {
    title: "Start your custom shelf request",
    body:
      "Use this form to send the shelf size, finish, and mounting direction you want reviewed. Final fit and pricing are confirmed after review.",
    summaryNote: "Final quote and fit are confirmed after review.",
    checklist: [
      "Shelf width if known",
      "Preferred depth and thickness",
      "Finish or material direction",
      "Any mounting or room-specific questions"
    ],
    reassurance: [
      "Custom requests are welcome.",
      "You can submit even if a few details are still in progress.",
      "Craft & Board reviews fit and finish before confirming next steps."
    ]
  }
} as const;
