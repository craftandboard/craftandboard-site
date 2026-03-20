import { classicFloatingShelfDefinition } from "./floatingShelves/classicFloatingShelf.js";
import { classicFloatingMantelDefinition } from "./floatingMantels/classicFloatingMantel.js";
import type { ConfigurableProductDefinition } from "./types.js";

const productDefinitions = [
  classicFloatingShelfDefinition,
  classicFloatingMantelDefinition
] as const satisfies readonly ConfigurableProductDefinition[];

export const craftBoardStorefrontProductRegistry = productDefinitions;

export function getStorefrontProductDefinition(input: {
  productFamily: string;
  productSlug: string;
}) {
  return craftBoardStorefrontProductRegistry.find(
    (product) =>
      product.productFamily === input.productFamily &&
      product.productSlug === input.productSlug
  );
}
