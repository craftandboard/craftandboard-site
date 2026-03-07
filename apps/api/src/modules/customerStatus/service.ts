import type { CustomerOrderStatusView, ProductionBundleStatus } from '@craft-and-board/shared';

export function projectCustomerOrderStatus(input: {
  orderId: string;
  orderStatus?: string | null;
  bundleStatuses: ProductionBundleStatus[];
  shipmentTrackingNo?: string | null;
}): CustomerOrderStatusView {
  if (input.shipmentTrackingNo) {
    return {
      orderId: input.orderId,
      customerStatus: 'shipped',
      detail: 'Tracking has been created for this order.'
    };
  }

  if (input.bundleStatuses.some((status) => status === 'error' || status === 'qc_hold')) {
    return {
      orderId: input.orderId,
      customerStatus: 'issue_detected',
      detail: 'An internal issue is being reviewed before shipment.'
    };
  }

  if (input.bundleStatuses.some((status) => ['packed', 'cut_complete'].includes(status))) {
    return {
      orderId: input.orderId,
      customerStatus: 'preparing_shipment',
      detail: 'Your shelves are complete and being prepared for shipment.'
    };
  }

  if (
    input.bundleStatuses.some((status) =>
      ['approved_for_production', 'in_production', 'cnc_generated', 'ready_for_cnc', 'nested'].includes(status)
    )
  ) {
    return {
      orderId: input.orderId,
      customerStatus: 'in_production',
      detail: 'Your shelves are in production.'
    };
  }

  return {
    orderId: input.orderId,
    customerStatus: 'order_received',
    detail: 'Your order has been received and is waiting for production scheduling.'
  };
}
