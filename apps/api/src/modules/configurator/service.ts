import type {
  ShelfConfiguratorInput,
  ShelfNormalizedSpec,
  ShelfQuoteRequest,
  ShelfQuoteResult,
  ShelfValidationResult
} from '@craft-and-board/shared';
import { getMaterialProfile } from '../settings/service.js';
import { productLabel } from '../productionBundles/naming.js';

function roundToNearestEighth(value: number) {
  return Math.round(value * 8) / 8;
}

function validateBounds(widthIn: number, depthIn: number) {
  const errors: string[] = [];

  if (widthIn < 8 || widthIn > 35) {
    errors.push('Width must be between 8 and 35 inches.');
  }

  if (depthIn < 8 || depthIn > 24) {
    errors.push('Depth must be between 8 and 24 inches.');
  }

  return errors;
}

export async function validateShelfConfiguratorInput(
  input: ShelfConfiguratorInput
): Promise<ShelfValidationResult> {
  if (process.env.DATABASE_URL) {
    try {
      await getMaterialProfile(input.materialCode);
    } catch {
      if (!['WHITE_MELAMINE', 'MAPLE_MELAMINE'].includes(input.materialCode)) {
        throw new Error(`Unsupported material code: ${input.materialCode}`);
      }
    }
  } else if (!['WHITE_MELAMINE', 'MAPLE_MELAMINE'].includes(input.materialCode)) {
    throw new Error(`Unsupported material code: ${input.materialCode}`);
  }

  const normalizedWidthIn = Number(roundToNearestEighth(input.widthIn).toFixed(3));
  const normalizedDepthIn = Number(roundToNearestEighth(input.depthIn).toFixed(3));
  const errors = validateBounds(normalizedWidthIn, normalizedDepthIn);
  const warnings: string[] = [];

  if (input.quantity < 1) {
    errors.push('Quantity must be at least 1.');
  }

  return {
    valid: errors.length === 0,
    normalizedWidthIn,
    normalizedDepthIn,
    materialCode: input.materialCode,
    errors,
    warnings
  };
}

export async function normalizeShelfConfiguratorInput(
  input: ShelfConfiguratorInput
): Promise<ShelfNormalizedSpec> {
  const validation = await validateShelfConfiguratorInput(input);

  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  return {
    widthIn: validation.normalizedWidthIn,
    depthIn: validation.normalizedDepthIn,
    thicknessIn: 0.75,
    materialCode: input.materialCode,
    edgeBandPattern: 'ALL_FOUR',
    quantity: input.quantity,
    channel: input.channel,
    productLabel: productLabel(input.materialCode as 'WHITE_MELAMINE' | 'MAPLE_MELAMINE')
  };
}

export async function quoteShelf(input: ShelfQuoteRequest): Promise<ShelfQuoteResult> {
  const spec = await normalizeShelfConfiguratorInput(input);
  const areaSqFt = (spec.widthIn * spec.depthIn) / 144;
  const baseRate = spec.materialCode === 'MAPLE_MELAMINE' ? 18 : 14;
  const unitPrice = Number((baseRate + areaSqFt * 9.5).toFixed(2));

  return {
    spec,
    unitPrice,
    totalPrice: Number((unitPrice * spec.quantity).toFixed(2)),
    estimatedLeadTimeDays: 7,
    pricingVersion: 'v1-local'
  };
}
