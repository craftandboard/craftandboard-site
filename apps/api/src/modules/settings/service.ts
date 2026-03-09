import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { MaterialCode } from '@craft-and-board/shared';
import { COST_RATE_KEYS } from '../costing/contracts.js';

const LOCAL_ORG_ID = 'org_local_craft_board';
const LOCAL_ORG_NAME = 'Craft & Board';
const LOCAL_ORG_SLUG = 'craftandboard';
const DEFAULT_COST_PROFILE_NAME = 'Starter Shelf Cost Profile';
const DEFAULT_COST_RATE_EFFECTIVE_FROM = new Date('2026-01-01T00:00:00.000Z');
const DEFAULT_PACKAGING_PROFILE_NAME = 'Starter Shelf Packaging';
const DEFAULT_PRODUCTION_ASSUMPTION_PROFILE_NAME = 'Starter Shelf Production Assumptions';
const DEFAULT_PRICING_POLICY_NAME = 'Starter Shelf Pricing Policy';
const DEFAULT_SHELF_PRODUCT_CODE = 'SHELF-WM-075';
const db = prisma as any;

const CRAFT_BOARD_BOOTSTRAP_DEFAULTS = {
  workstationNaming: {
    cncOutfeed: 'CNC_OUTFEED',
    edgebandQueue: 'EDGEBAND_QUEUE',
    packagingStaging: 'PACKAGING_STAGING',
    shippingStaging: 'SHIPPING_STAGING'
  },
  machineNaming: {
    cncPrimary: 'CNC-PRIMARY',
    edgebanderPrimary: 'EDGE-PRIMARY'
  },
  packagingDefaults: {
    profileName: DEFAULT_PACKAGING_PROFILE_NAME
  },
  shippingDefaults: {
    perUnitAllowanceKey: 'shipping_allowance_per_unit',
    perOrderAllowanceKey: 'shipping_allowance_per_order'
  },
  pricingDefaults: {
    costProfileName: DEFAULT_COST_PROFILE_NAME,
    productionAssumptionProfileName: DEFAULT_PRODUCTION_ASSUMPTION_PROFILE_NAME,
    pricingPolicyName: DEFAULT_PRICING_POLICY_NAME
  },
  materialDefaults: {
    primaryPanelMaterials: ['WHITE_MELAMINE', 'MAPLE_MELAMINE']
  }
} as const;

function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(3));
}

export async function ensureDefaultProfiles() {
  await db.organization.upsert({
    where: { id: LOCAL_ORG_ID },
    update: { name: LOCAL_ORG_NAME, slug: LOCAL_ORG_SLUG },
    create: { id: LOCAL_ORG_ID, name: LOCAL_ORG_NAME, slug: LOCAL_ORG_SLUG }
  });

  await db.orgSettings.upsert({
    where: {
      organizationId: LOCAL_ORG_ID
    },
    update: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      defaultUnitSystem: 'IMPERIAL',
      bootstrapDefaultsJson: CRAFT_BOARD_BOOTSTRAP_DEFAULTS
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      defaultUnitSystem: 'IMPERIAL',
      bootstrapDefaultsJson: CRAFT_BOARD_BOOTSTRAP_DEFAULTS
    }
  });

  await db.machineProfile.upsert({
    where: { code: 'LAGUNA_SYNTEC_V1' },
    update: {
      name: 'Laguna Syntec V1',
      controllerType: 'SYNTEC_V1',
      fileExtension: '.NC',
      units: 'INCH',
      toolDiameterIn: decimal(0.375),
      spindleRpm: 18000,
      feedRateIpm: 450,
      plungeRateIpm: 80,
      cutDepthIn: decimal(0.76),
      onionSkinDepthIn: decimal(0.72),
      safeZIn: decimal(0.5),
      defaultCutStrategy: 'RECTANGLE_PROFILE',
      active: true,
      organizationId: LOCAL_ORG_ID
    },
    create: {
      code: 'LAGUNA_SYNTEC_V1',
      name: 'Laguna Syntec V1',
      controllerType: 'SYNTEC_V1',
      fileExtension: '.NC',
      units: 'INCH',
      toolDiameterIn: decimal(0.375),
      spindleRpm: 18000,
      feedRateIpm: 450,
      plungeRateIpm: 80,
      cutDepthIn: decimal(0.76),
      onionSkinDepthIn: decimal(0.72),
      safeZIn: decimal(0.5),
      defaultCutStrategy: 'RECTANGLE_PROFILE',
      active: true,
      organizationId: LOCAL_ORG_ID
    }
  });

  const materials: Array<{ code: MaterialCode; name: string }> = [
    { code: 'WHITE_MELAMINE', name: 'White Melamine' },
    { code: 'MAPLE_MELAMINE', name: 'Maple Melamine' }
  ];

  for (const material of materials) {
    await db.materialProfile.upsert({
      where: {
        organizationId_code: {
          organizationId: LOCAL_ORG_ID,
          code: material.code
        }
      },
      update: {
        name: material.name,
        thicknessIn: decimal(0.75),
        sheetWidthIn: decimal(48),
        sheetDepthIn: decimal(96),
        trimMarginIn: decimal(0.25),
        defaultEdgeBandPattern: 'ALL_FOUR',
        active: true
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        code: material.code,
        name: material.name,
        thicknessIn: decimal(0.75),
        sheetWidthIn: decimal(48),
        sheetDepthIn: decimal(96),
        trimMarginIn: decimal(0.25),
        defaultEdgeBandPattern: 'ALL_FOUR',
        active: true
      }
    });
  }

  const existingDefaultCostProfile = await db.costProfile.findFirst({
    where: {
      organizationId: LOCAL_ORG_ID,
      isDefault: true
    }
  });

  const costProfile =
    existingDefaultCostProfile ??
    (await db.costProfile.create({
      data: {
        organizationId: LOCAL_ORG_ID,
        name: DEFAULT_COST_PROFILE_NAME,
        isDefault: true,
        currency: 'USD',
        notes: 'Starter assumptions only. Replace with validated Hugo/Brandon production numbers before using for live pricing decisions.'
      }
    }));

  const starterRates: Array<{ key: (typeof COST_RATE_KEYS)[number]; valueDecimal: number; unit: string; notes: string }> = [
    {
      key: 'sheet_material_cost_per_sqft',
      valueDecimal: 2.85,
      unit: 'usd_per_sqft',
      notes: 'Starter assumption for melamine shelf material.'
    },
    {
      key: 'edge_band_cost_per_linear_ft',
      valueDecimal: 0.18,
      unit: 'usd_per_linear_ft',
      notes: 'Starter assumption for matching shelf edge band.'
    },
    {
      key: 'glue_cost_per_linear_ft',
      valueDecimal: 0.03,
      unit: 'usd_per_linear_ft',
      notes: 'Starter assumption for glue/consumables per banded foot.'
    },
    {
      key: 'cnc_machine_cost_per_min',
      valueDecimal: 0.85,
      unit: 'usd_per_min',
      notes: 'Starter assumption for CNC machine time.'
    },
    {
      key: 'edgebander_cost_per_min',
      valueDecimal: 0.62,
      unit: 'usd_per_min',
      notes: 'Starter assumption for edgebander runtime.'
    },
    {
      key: 'labor_cost_per_min',
      valueDecimal: 0.55,
      unit: 'usd_per_min',
      notes: 'Starter assumption for direct labor.'
    },
    {
      key: 'packaging_cost_per_unit',
      valueDecimal: 0.9,
      unit: 'usd_per_unit',
      notes: 'Starter packaging material cost per shelf.'
    },
    {
      key: 'packaging_cost_per_order',
      valueDecimal: 1.5,
      unit: 'usd_per_order',
      notes: 'Starter packaging allowance per order.'
    },
    {
      key: 'shipping_allowance_per_unit',
      valueDecimal: 0.75,
      unit: 'usd_per_unit',
      notes: 'Starter shipping allowance per shelf.'
    },
    {
      key: 'shipping_allowance_per_order',
      valueDecimal: 2.25,
      unit: 'usd_per_order',
      notes: 'Starter shipping allowance per order.'
    },
    {
      key: 'overhead_percent',
      valueDecimal: 12,
      unit: 'percent',
      notes: 'Starter overhead allocation percent.'
    },
    {
      key: 'growth_margin_percent',
      valueDecimal: 18,
      unit: 'percent',
      notes: 'Starter growth/profit margin percent.'
    },
    {
      key: 'waste_percent',
      valueDecimal: 9,
      unit: 'percent',
      notes: 'Starter sheet waste factor percent.'
    },
    {
      key: 'setup_minutes_per_run',
      valueDecimal: 10,
      unit: 'minutes',
      notes: 'Starter setup/test-run minutes per manufacturing run.'
    },
    {
      key: 'handling_minutes_per_unit',
      valueDecimal: 1.75,
      unit: 'minutes_per_unit',
      notes: 'Starter handling labor per shelf.'
    },
    {
      key: 'packaging_minutes_per_unit',
      valueDecimal: 0.8,
      unit: 'minutes_per_unit',
      notes: 'Starter packaging labor per shelf.'
    },
    {
      key: 'cnc_minutes_per_sqft',
      valueDecimal: 1.4,
      unit: 'minutes_per_sqft',
      notes: 'Starter CNC runtime factor.'
    },
    {
      key: 'edgebander_minutes_per_linear_ft',
      valueDecimal: 0.35,
      unit: 'minutes_per_linear_ft',
      notes: 'Starter edgebander runtime factor.'
    }
  ];

  for (const rate of starterRates) {
    await db.costRate.upsert({
      where: {
        costProfileId_key_effectiveFrom: {
          costProfileId: costProfile.id,
          key: rate.key,
          effectiveFrom: DEFAULT_COST_RATE_EFFECTIVE_FROM
        }
      },
      update: {
        organizationId: LOCAL_ORG_ID,
        unit: rate.unit,
        notes: rate.notes,
        valueDecimal: decimal(rate.valueDecimal),
        effectiveTo: null
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        costProfileId: costProfile.id,
        key: rate.key,
        valueDecimal: decimal(rate.valueDecimal),
        unit: rate.unit,
        notes: rate.notes,
        effectiveFrom: DEFAULT_COST_RATE_EFFECTIVE_FROM,
        effectiveTo: null
      }
    });
  }

  const packagingProfile = await db.packagingProfile.upsert({
    where: {
      organizationId_name: {
        organizationId: LOCAL_ORG_ID,
        name: DEFAULT_PACKAGING_PROFILE_NAME
      }
    },
    update: {
      boxCostCentsPerUnit: 65,
      bubbleWrapCostCentsPerUnit: 10,
      shrinkWrapCostCentsPerUnit: 5,
      tapeCostCentsPerUnit: 4,
      labelCostCentsPerUnit: 6,
      insertFlyerCostCentsPerUnit: 3,
      otherPackagingCostCentsPerUnit: 2,
      isActive: true,
      notes: 'Starter packaging assumptions only. Replace with validated shop packaging costs.'
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      name: DEFAULT_PACKAGING_PROFILE_NAME,
      boxCostCentsPerUnit: 65,
      bubbleWrapCostCentsPerUnit: 10,
      shrinkWrapCostCentsPerUnit: 5,
      tapeCostCentsPerUnit: 4,
      labelCostCentsPerUnit: 6,
      insertFlyerCostCentsPerUnit: 3,
      otherPackagingCostCentsPerUnit: 2,
      isActive: true,
      notes: 'Starter packaging assumptions only. Replace with validated shop packaging costs.'
    }
  });

  await db.productionAssumptionProfile.upsert({
    where: {
      organizationId_name: {
        organizationId: LOCAL_ORG_ID,
        name: DEFAULT_PRODUCTION_ASSUMPTION_PROFILE_NAME
      }
    },
    update: {
      isDefault: true,
      cncLoadMinutesPerRun: decimal(6),
      cncUnloadMinutesPerRun: decimal(4),
      cncRunMinutesPerUnit: decimal(2.8),
      edgebanderSetupMinutesPerRun: decimal(7),
      edgebanderRunMinutesPerLinearFt: decimal(0.35),
      handlingMinutesPerUnit: decimal(1.75),
      packagingMinutesPerUnit: decimal(0.8),
      qcMinutesPerUnit: decimal(0.4),
      notes: 'Starter production assumptions only. Replace with measured shop timings.'
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      name: DEFAULT_PRODUCTION_ASSUMPTION_PROFILE_NAME,
      isDefault: true,
      cncLoadMinutesPerRun: decimal(6),
      cncUnloadMinutesPerRun: decimal(4),
      cncRunMinutesPerUnit: decimal(2.8),
      edgebanderSetupMinutesPerRun: decimal(7),
      edgebanderRunMinutesPerLinearFt: decimal(0.35),
      handlingMinutesPerUnit: decimal(1.75),
      packagingMinutesPerUnit: decimal(0.8),
      qcMinutesPerUnit: decimal(0.4),
      notes: 'Starter production assumptions only. Replace with measured shop timings.'
    }
  });

  await db.pricingPolicy.upsert({
    where: {
      organizationId_name: {
        organizationId: LOCAL_ORG_ID,
        name: DEFAULT_PRICING_POLICY_NAME
      }
    },
    update: {
      isDefault: true,
      manufacturingMarkupPercent: decimal(12),
      minimumChargeCentsPerUnit: 2400,
      minimumRunChargeCents: 12000,
      roundingMode: 'UP',
      roundToCents: 25,
      notes: 'Starter pricing policy only. Replace with Hugo-approved pricing rules.'
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      name: DEFAULT_PRICING_POLICY_NAME,
      isDefault: true,
      manufacturingMarkupPercent: decimal(12),
      minimumChargeCentsPerUnit: 2400,
      minimumRunChargeCents: 12000,
      roundingMode: 'UP',
      roundToCents: 25,
      notes: 'Starter pricing policy only. Replace with Hugo-approved pricing rules.'
    }
  });

  const shelfProduct = await db.shelfProduct.upsert({
    where: {
      organizationId_code: {
        organizationId: LOCAL_ORG_ID,
        code: DEFAULT_SHELF_PRODUCT_CODE
      }
    },
    update: {
      name: '3/4 White Melamine Shelf',
      materialType: 'WHITE_MELAMINE',
      defaultThicknessIn: decimal(0.75),
      defaultEdgeBandPattern: 'ALL_FOUR',
      packagingProfileId: packagingProfile.id,
      isActive: true,
      notes: 'Starter shelf product for pricing validation.'
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      name: '3/4 White Melamine Shelf',
      code: DEFAULT_SHELF_PRODUCT_CODE,
      materialType: 'WHITE_MELAMINE',
      defaultThicknessIn: decimal(0.75),
      defaultEdgeBandPattern: 'ALL_FOUR',
      packagingProfileId: packagingProfile.id,
      isActive: true,
      notes: 'Starter shelf product for pricing validation.'
    }
  });

  const existingStarterSalesOrder = await db.salesOrder.findFirst({
    where: {
      organizationId: LOCAL_ORG_ID,
      sourceType: 'MANUAL',
      sourceOrderId: 'STARTER-SHELF-ORDER-001'
    }
  });

  if (!existingStarterSalesOrder) {
    const starterOrder = await db.salesOrder.create({
      data: {
        organizationId: LOCAL_ORG_ID,
        sourceType: 'MANUAL',
        sourceOrderId: 'STARTER-SHELF-ORDER-001',
        customerName: 'Starter Intake Customer',
        customerEmail: 'starter-orders@craftboard.local',
        shipToName: 'Starter Intake Customer',
        currency: 'USD',
        status: 'DRAFT',
        orderedAt: new Date('2026-03-08T00:00:00.000Z'),
        notes: 'Starter mixed-validity shelf intake order for order normalization and pricing tests.'
      }
    });

    await db.salesOrderItem.createMany({
      data: [
        {
          organizationId: LOCAL_ORG_ID,
          salesOrderId: starterOrder.id,
          sourceLineId: 'LINE-VALID-001',
          shelfProductId: shelfProduct.id,
          sku: 'WM-SHELF-30X12',
          title: 'Starter Valid White Melamine Shelf',
          quantity: 2,
          lengthIn: decimal(30),
          depthIn: decimal(12),
          requiresPackaging: true,
          packagingProfileId: packagingProfile.id,
          normalizationStatus: 'PENDING',
          pricingStatus: 'PENDING'
        },
        {
          organizationId: LOCAL_ORG_ID,
          salesOrderId: starterOrder.id,
          sourceLineId: 'LINE-INVALID-001',
          title: 'Starter Invalid Shelf Missing Depth',
          quantity: 1,
          lengthIn: decimal(24),
          requiresPackaging: true,
          normalizationStatus: 'PENDING',
          pricingStatus: 'PENDING',
          notes: 'Intentionally invalid starter line for HOLD/ERROR behavior.'
        }
      ]
    });
  }

  await db.labelTemplateVersion.upsert({
    where: {
      organizationId_code_version: {
        organizationId: LOCAL_ORG_ID,
        code: 'SHELF_PART_BACKBONE',
        version: 1
      }
    },
    update: {
      name: 'Starter Shelf Part Backbone Label',
      isDefault: true,
      templateJson: {
        fields: [
          'partNumber',
          'packetNumber',
          'material',
          'thicknessIn',
          'lengthIn',
          'depthIn',
          'edgeBandPattern',
          'barcodeValue',
          'qrValue'
        ],
        notes: 'Starter label payload contract only. Rendering comes in a later phase.'
      }
    },
    create: {
      organizationId: LOCAL_ORG_ID,
      name: 'Starter Shelf Part Backbone Label',
      code: 'SHELF_PART_BACKBONE',
      version: 1,
      isDefault: true,
      templateJson: {
        fields: [
          'partNumber',
          'packetNumber',
          'material',
          'thicknessIn',
          'lengthIn',
          'depthIn',
          'edgeBandPattern',
          'barcodeValue',
          'qrValue'
        ],
        notes: 'Starter label payload contract only. Rendering comes in a later phase.'
      }
    }
  });

  const starterWorkflowRules = [
    { stationType: 'CUT', entityType: 'MANUFACTURING_PART', fromStatus: 'READY_FOR_BATCH', actionType: 'CHECK_IN', toStatus: 'CUT_IN_PROGRESS' },
    { stationType: 'CUT', entityType: 'MANUFACTURING_PART', fromStatus: 'BATCHED', actionType: 'CHECK_IN', toStatus: 'CUT_IN_PROGRESS' },
    { stationType: 'CUT', entityType: 'MANUFACTURING_PART', fromStatus: 'CUT_PENDING', actionType: 'CHECK_IN', toStatus: 'CUT_IN_PROGRESS' },
    { stationType: 'CUT', entityType: 'MANUFACTURING_PART', fromStatus: 'CUT_IN_PROGRESS', actionType: 'MARK_STAGE_COMPLETE', toStatus: 'CUT_COMPLETE' },
    { stationType: 'EDGEBAND', entityType: 'MANUFACTURING_PART', fromStatus: 'CUT_COMPLETE', actionType: 'CHECK_IN', toStatus: 'EDGEBAND_IN_PROGRESS' },
    { stationType: 'EDGEBAND', entityType: 'MANUFACTURING_PART', fromStatus: 'EDGEBAND_PENDING', actionType: 'CHECK_IN', toStatus: 'EDGEBAND_IN_PROGRESS' },
    { stationType: 'EDGEBAND', entityType: 'MANUFACTURING_PART', fromStatus: 'EDGEBAND_IN_PROGRESS', actionType: 'MARK_STAGE_COMPLETE', toStatus: 'EDGEBAND_COMPLETE' },
    { stationType: 'PACKAGING', entityType: 'MANUFACTURING_PART', fromStatus: 'EDGEBAND_COMPLETE', actionType: 'CHECK_IN', toStatus: 'PACKAGING_IN_PROGRESS' },
    { stationType: 'PACKAGING', entityType: 'MANUFACTURING_PART', fromStatus: 'PACKAGING_PENDING', actionType: 'CHECK_IN', toStatus: 'PACKAGING_IN_PROGRESS' },
    { stationType: 'PACKAGING', entityType: 'MANUFACTURING_PART', fromStatus: 'PACKAGING_IN_PROGRESS', actionType: 'MARK_STAGE_COMPLETE', toStatus: 'PACKAGED' }
  ] as const;

  for (const rule of starterWorkflowRules) {
    await db.workflowStationRule.upsert({
      where: {
        organizationId_stationType_entityType_fromStatus_actionType_toStatus: {
          organizationId: LOCAL_ORG_ID,
          stationType: rule.stationType,
          entityType: rule.entityType,
          fromStatus: rule.fromStatus,
          actionType: rule.actionType,
          toStatus: rule.toStatus
        }
      },
      update: {
        isActive: true,
        notes: 'Starter scan workflow rule for manufacturing part progression.'
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        stationType: rule.stationType,
        entityType: rule.entityType,
        fromStatus: rule.fromStatus,
        actionType: rule.actionType,
        toStatus: rule.toStatus,
        isActive: true,
        notes: 'Starter scan workflow rule for manufacturing part progression.'
      }
    });
  }

  const starterLocations = [
    { code: 'CNC_OUTFEED', name: 'CNC Outfeed', zone: 'CNC', notes: 'Starter location for immediate post-cut sorting.' },
    { code: 'EDGEBAND_QUEUE', name: 'Edgeband Queue', zone: 'EDGEBAND', notes: 'Starter queue location before edgebanding.' },
    { code: 'PACKAGING_STAGING', name: 'Packaging Staging', zone: 'PACKAGING', notes: 'Starter location for packaging staging.' },
    { code: 'SHIPPING_STAGING', name: 'Shipping Staging', zone: 'SHIPPING', notes: 'Starter location for completed shipment staging.' }
  ] as const;

  for (const location of starterLocations) {
    await db.containerLocation.upsert({
      where: {
        organizationId_code: {
          organizationId: LOCAL_ORG_ID,
          code: location.code
        }
      },
      update: {
        name: location.name,
        zone: location.zone,
        notes: location.notes,
        isActive: true
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        code: location.code,
        name: location.name,
        zone: location.zone,
        notes: location.notes,
        isActive: true
      }
    });
  }

  const locationMap = new Map(
    (
      await db.containerLocation.findMany({
        where: {
          organizationId: LOCAL_ORG_ID,
          code: { in: starterLocations.map((location) => location.code) }
        }
      })
    ).map((location: any) => [location.code, location.id])
  );

  const starterMachineSources = [
    {
      code: 'CNC-PRIMARY',
      name: 'Primary CNC Router',
      type: 'CNC',
      sourceType: 'LOCAL_AGENT',
      status: 'ACTIVE',
      currentLocationCode: 'CNC_OUTFEED',
      adapterType: 'generic-cnc-agent',
      notes: 'Starter CNC telemetry source for development and machine-event intake tests.'
    },
    {
      code: 'EDGE-PRIMARY',
      name: 'Primary Edgebander',
      type: 'EDGEBANDER',
      sourceType: 'LOCAL_AGENT',
      status: 'ACTIVE',
      currentLocationCode: 'EDGEBAND_QUEUE',
      adapterType: 'generic-edgebander-agent',
      notes: 'Starter edgebander telemetry source for development and machine-event intake tests.'
    }
  ] as const;

  for (const machine of starterMachineSources) {
    await db.machine.upsert({
      where: {
        organizationId_code: {
          organizationId: LOCAL_ORG_ID,
          code: machine.code
        }
      },
      update: {
        name: machine.name,
        type: machine.type,
        sourceType: machine.sourceType,
        status: machine.status,
        currentLocationId: locationMap.get(machine.currentLocationCode) ?? null,
        locationLabel: starterLocations.find((location) => location.code === machine.currentLocationCode)?.name ?? null,
        adapterType: machine.adapterType,
        metadataJson: {
          starter: true,
          seededBy: 'ensureDefaultProfiles'
        },
        isActive: true,
        notes: machine.notes
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        code: machine.code,
        name: machine.name,
        type: machine.type,
        sourceType: machine.sourceType,
        status: machine.status,
        currentLocationId: locationMap.get(machine.currentLocationCode) ?? null,
        locationLabel: starterLocations.find((location) => location.code === machine.currentLocationCode)?.name ?? null,
        adapterType: machine.adapterType,
        metadataJson: {
          starter: true,
          seededBy: 'ensureDefaultProfiles'
        },
        isActive: true,
        notes: machine.notes
      }
    });
  }

  const starterContainers = [
    {
      containerCode: 'BIN-CNC-001',
      displayName: 'CNC Bin 001',
      containerType: 'BIN',
      currentLocationCode: 'CNC_OUTFEED',
      description: 'Starter CNC sorting bin for shelf parts.'
    },
    {
      containerCode: 'BIN-CNC-002',
      displayName: 'CNC Bin 002',
      containerType: 'BIN',
      currentLocationCode: 'CNC_OUTFEED',
      description: 'Starter backup CNC sorting bin.'
    },
    {
      containerCode: 'CART-STAGING-001',
      displayName: 'Staging Cart 001',
      containerType: 'CART',
      currentLocationCode: 'PACKAGING_STAGING',
      description: 'Starter staging cart for downstream packaging.'
    }
  ] as const;

  for (const container of starterContainers) {
    await db.container.upsert({
      where: {
        organizationId_code: {
          organizationId: LOCAL_ORG_ID,
          code: container.containerCode
        }
      },
      update: {
        code: container.containerCode,
        label: container.displayName,
        displayName: container.displayName,
        type: container.containerType,
        description: container.description,
        barcodeValue: `CONTAINER:${container.containerCode}`,
        qrValue: `CONTAINER:${container.containerCode}`,
        status: 'AVAILABLE',
        currentLocationId: locationMap.get(container.currentLocationCode) ?? null,
        isActive: true
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        containerCode: container.containerCode,
        code: container.containerCode,
        label: container.displayName,
        displayName: container.displayName,
        type: container.containerType,
        description: container.description,
        barcodeValue: `CONTAINER:${container.containerCode}`,
        qrValue: `CONTAINER:${container.containerCode}`,
        status: 'AVAILABLE',
        currentLocationId: locationMap.get(container.currentLocationCode) ?? null,
        isActive: true
      }
    });
  }

  const sampleRemnants = [
    {
      remnantCode: 'REM-WM-001',
      materialCode: 'WHITE_MELAMINE',
      materialLabel: 'White Melamine',
      thicknessIn: 0.75,
      lengthIn: 24,
      widthIn: 18,
      usableAreaSqIn: 420,
      sourceType: 'CNC_LEFTOVER',
      status: 'AVAILABLE',
      grainDirection: 'NONE',
      edgeCondition: 'RAW',
      qualityGrade: 'A',
      currentContainerCode: 'BIN-CNC-001',
      currentLocationCode: 'CNC_OUTFEED',
      notes: 'Starter available remnant for remnant-aware planning tests.'
    },
    {
      remnantCode: 'REM-MM-001',
      materialCode: 'MAPLE_MELAMINE',
      materialLabel: 'Maple Melamine',
      thicknessIn: 0.75,
      lengthIn: 18,
      widthIn: 10,
      usableAreaSqIn: 150,
      sourceType: 'MANUAL_ENTRY',
      status: 'HOLD',
      grainDirection: 'NONE',
      edgeCondition: 'ONE_CLEAN_EDGE',
      qualityGrade: 'B',
      currentContainerCode: undefined,
      currentLocationCode: 'PACKAGING_STAGING',
      notes: 'Starter hold remnant to verify non-available inventory behavior.'
    }
  ] as const;

  const seededContainers = new Map(
    (
      await db.container.findMany({
        where: {
          organizationId: LOCAL_ORG_ID,
          code: { in: starterContainers.map((container) => container.containerCode) }
        }
      })
    ).map((container: any) => [container.code, container.id])
  );

  for (const remnant of sampleRemnants) {
    const areaSqIn = remnant.lengthIn * remnant.widthIn;
    const currentContainerId = remnant.currentContainerCode ? seededContainers.get(remnant.currentContainerCode) ?? null : null;
    const currentLocationId = locationMap.get(remnant.currentLocationCode) ?? null;
    await db.remnant.upsert({
      where: {
        organizationId_remnantCode: {
          organizationId: LOCAL_ORG_ID,
          remnantCode: remnant.remnantCode
        }
      },
      update: {
        code: remnant.remnantCode,
        materialKey: `${remnant.materialCode}:${remnant.thicknessIn.toFixed(3)}:ALL_FOUR`,
        materialCode: remnant.materialCode,
        materialLabel: remnant.materialLabel,
        materialName: remnant.materialLabel,
        thicknessIn: decimal(remnant.thicknessIn),
        edgeBandPattern: 'ALL_FOUR',
        lengthIn: decimal(remnant.lengthIn),
        widthIn: decimal(remnant.widthIn),
        areaSqIn: decimal(areaSqIn),
        usableAreaSqIn: decimal(remnant.usableAreaSqIn),
        sourceType: remnant.sourceType,
        grainDirection: remnant.grainDirection,
        edgeCondition: remnant.edgeCondition,
        status: remnant.status,
        qualityGrade: remnant.qualityGrade,
        barcodeValue: `REMNANT:${remnant.remnantCode}`,
        qrValue: `REMNANT:${remnant.remnantCode}`,
        currentContainerId,
        currentLocationId,
        locationLabel: starterLocations.find((location) => location.code === remnant.currentLocationCode)?.name ?? null,
        notes: remnant.notes
      },
      create: {
        organizationId: LOCAL_ORG_ID,
        code: remnant.remnantCode,
        remnantCode: remnant.remnantCode,
        materialKey: `${remnant.materialCode}:${remnant.thicknessIn.toFixed(3)}:ALL_FOUR`,
        materialCode: remnant.materialCode,
        materialLabel: remnant.materialLabel,
        materialName: remnant.materialLabel,
        thicknessIn: decimal(remnant.thicknessIn),
        edgeBandPattern: 'ALL_FOUR',
        lengthIn: decimal(remnant.lengthIn),
        widthIn: decimal(remnant.widthIn),
        areaSqIn: decimal(areaSqIn),
        usableAreaSqIn: decimal(remnant.usableAreaSqIn),
        sourceType: remnant.sourceType,
        grainDirection: remnant.grainDirection,
        edgeCondition: remnant.edgeCondition,
        status: remnant.status,
        qualityGrade: remnant.qualityGrade,
        barcodeValue: `REMNANT:${remnant.remnantCode}`,
        qrValue: `REMNANT:${remnant.remnantCode}`,
        currentContainerId,
        currentLocationId,
        locationLabel: starterLocations.find((location) => location.code === remnant.currentLocationCode)?.name ?? null,
        notes: remnant.notes
      }
    });
  }
}

export async function getDefaultMachineProfile(organizationId = LOCAL_ORG_ID) {
  await ensureDefaultProfiles();
  return db.machineProfile.findFirstOrThrow({
    where: {
      organizationId,
      code: 'LAGUNA_SYNTEC_V1'
    }
  });
}

export async function getMaterialProfile(materialCode: MaterialCode, organizationId = LOCAL_ORG_ID) {
  await ensureDefaultProfiles();
  return db.materialProfile.findFirstOrThrow({
    where: { organizationId, code: materialCode, active: true }
  });
}

export async function getOrganizationSettings(organizationId = LOCAL_ORG_ID) {
  await ensureDefaultProfiles();
  return db.orgSettings.findUniqueOrThrow({
    where: {
      organizationId
    }
  });
}

export function resolveActiveOrganizationId(organizationId?: string | null) {
  return organizationId?.trim() || LOCAL_ORG_ID;
}

export function getCurrentOrganizationContext() {
  return {
    id: LOCAL_ORG_ID,
    name: LOCAL_ORG_NAME,
    slug: LOCAL_ORG_SLUG
  };
}

export function getCraftBoardBootstrapDefaults() {
  return CRAFT_BOARD_BOOTSTRAP_DEFAULTS;
}

export async function ensureCraftBoardTenantBootstrap() {
  await ensureDefaultProfiles();
  return {
    organization: getCurrentOrganizationContext(),
    settings: await getOrganizationSettings(LOCAL_ORG_ID),
    bootstrapDefaults: getCraftBoardBootstrapDefaults()
  };
}

export { LOCAL_ORG_ID, LOCAL_ORG_NAME, LOCAL_ORG_SLUG };
