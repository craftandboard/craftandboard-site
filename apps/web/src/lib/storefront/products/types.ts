import type { FloatingShelfConfig } from "../floatingShelf";
import type { FloatingMantelConfig } from "../floatingMantel";
import type {
  ConfigurableProductCheckoutDraft,
  ConfigurableProductEligibilityResult,
  ProductFamilyCode,
  ProductLiveStatus
} from "../order";
import type { FloatingMantelPricingResult, FloatingShelfPricingResult } from "../../api";

export type ConfigurableProductConfiguration = FloatingShelfConfig | FloatingMantelConfig;
export type ConfigurableProductPricingResult = FloatingShelfPricingResult | FloatingMantelPricingResult;
export type ConfigurableProductCheckoutData = ConfigurableProductCheckoutDraft<
  ConfigurableProductConfiguration,
  ConfigurableProductPricingResult
>;
export type ConfigurableProductEligibility = ConfigurableProductEligibilityResult;

export type StorefrontProductContent = {
  shortDescription: string;
  description: string;
  storytelling: string;
  featureBullets: string[];
  sizeCallouts: string[];
  detailBlocks: Array<{
    title: string;
    body: string;
  }>;
  processSteps: string[];
  reassurance: string;
};

export type StorefrontCategoryContent = {
  title: string;
  description: string;
  supportingCopy?: string;
  imagePublicId?: string;
};

export type ConfigurableProductDefinition<
  TConfiguration extends ConfigurableProductConfiguration = ConfigurableProductConfiguration
> = {
  productFamily: ProductFamilyCode;
  productSlug: string;
  displayName: string;
  categorySlug: string;
  liveStatus: ProductLiveStatus;
  supportsInstantPricing: boolean;
  supportsStandardCheckout: boolean;
  supportsDepositPayment: boolean;
  supportsReviewFallback: boolean;
  pdpPath: string;
  checkoutPath: string;
  imagePublicId?: string;
  category: StorefrontCategoryContent;
  content: StorefrontProductContent;
  buildCheckoutHref(configuration: TConfiguration): string;
  buildPdpHref(configuration: TConfiguration): string;
  buildInquiryHref(configuration: TConfiguration, sourcePath: string): string;
  summarizeConfiguration(configuration: TConfiguration): string[];
};
