import { describe, expect, it } from 'vitest';
import { quoteShelf, validateShelfConfiguratorInput } from '../modules/configurator/service.js';
import { projectCustomerOrderStatus } from '../modules/customerStatus/service.js';
import {
  canApproveCnc,
  canApproveNesting,
  canCompleteOrFailCncStatus,
  canPostCncStatus,
  isAllowedBundleTransition,
  nextAllowedBundleActions
} from '../modules/manufacturingLifecycle/service.js';

describe('manufacturing lifecycle guardrails', () => {
  it('allows only explicit bundle transitions', () => {
    expect(isAllowedBundleTransition('draft', 'ready_for_nesting')).toBe(true);
    expect(isAllowedBundleTransition('ready_for_nesting', 'nested')).toBe(true);
    expect(isAllowedBundleTransition('ready_for_nesting', 'approved_for_production')).toBe(false);
    expect(nextAllowedBundleActions('ready_for_cnc')).toContain('generate_cnc');
  });

  it('requires current versions for approvals and valid cnc state changes', () => {
    expect(canApproveNesting({ bundleStatus: 'ready_for_nesting', currentNestVersion: 1 })).toBe(true);
    expect(canApproveNesting({ bundleStatus: 'draft', currentNestVersion: 1 })).toBe(false);
    expect(canApproveCnc({ bundleStatus: 'ready_for_cnc', currentCncVersion: 2 })).toBe(true);
    expect(canApproveCnc({ bundleStatus: 'nested', currentCncVersion: 2 })).toBe(false);
    expect(canPostCncStatus('approved')).toBe(true);
    expect(canPostCncStatus('generated')).toBe(false);
    expect(canCompleteOrFailCncStatus('posted')).toBe(true);
    expect(canCompleteOrFailCncStatus('approved')).toBe(false);
  });
});

describe('configurator contract', () => {
  it('validates and normalizes website/manual/amazon inputs through one rule set', async () => {
    const validation = await validateShelfConfiguratorInput({
      widthIn: 19.26,
      depthIn: 12.49,
      materialCode: 'WHITE_MELAMINE',
      quantity: 2,
      channel: 'WEBSITE'
    });

    expect(validation.valid).toBe(true);
    expect(validation.normalizedWidthIn).toBe(19.25);
    expect(validation.normalizedDepthIn).toBe(12.5);

    const quote = await quoteShelf({
      widthIn: 19.26,
      depthIn: 12.49,
      materialCode: 'MAPLE_MELAMINE',
      quantity: 2,
      channel: 'AMAZON'
    });

    expect(quote.spec.edgeBandPattern).toBe('ALL_FOUR');
    expect(quote.spec.channel).toBe('AMAZON');
    expect(quote.totalPrice).toBeGreaterThan(quote.unitPrice);
  });
});

describe('customer status projection', () => {
  it('maps granular manufacturing state into customer-safe statuses', () => {
    expect(
      projectCustomerOrderStatus({
        orderId: 'O-1',
        bundleStatuses: ['draft'],
        shipmentTrackingNo: null
      }).customerStatus
    ).toBe('order_received');

    expect(
      projectCustomerOrderStatus({
        orderId: 'O-2',
        bundleStatuses: ['ready_for_cnc'],
        shipmentTrackingNo: null
      }).customerStatus
    ).toBe('in_production');

    expect(
      projectCustomerOrderStatus({
        orderId: 'O-3',
        bundleStatuses: ['cut_complete'],
        shipmentTrackingNo: null
      }).customerStatus
    ).toBe('preparing_shipment');

    expect(
      projectCustomerOrderStatus({
        orderId: 'O-4',
        bundleStatuses: ['in_production'],
        shipmentTrackingNo: '1Z999'
      }).customerStatus
    ).toBe('shipped');

    expect(
      projectCustomerOrderStatus({
        orderId: 'O-5',
        bundleStatuses: ['qc_hold'],
        shipmentTrackingNo: null
      }).customerStatus
    ).toBe('issue_detected');
  });
});
