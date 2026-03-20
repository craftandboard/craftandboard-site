import { getCraftBoardStorefrontSeoAttributionSummary, type CraftBoardOutreachWorkspaceResponse } from "../api";
import { cabinetShelfCategory, cabinetShelfProducts } from "../../content/cabinetShelves";
import { marketingUrl } from "../site-config";
import { buildBacklinkOutreachCampaigns } from "./backlinkCampaigns";
import { buildBacklinkAssetEntries } from "./backlinks";
import { buildSeoHealthReports, summarizeAttributionByInventoryPath } from "./health";
import { getSeoInventoryEntries, type SeoInventoryEntry } from "./inventory";
import { buildSeoOpportunityQueue } from "./opportunities";
import { getCraftBoardOutreachWorkspaceData } from "./outreach";
import { buildCraftBoardOutreachDraftPacket, type CraftBoardOutreachDraftPacket } from "./outreachDrafts";
import { generatePinterestEntries, type PinterestPublishingEntry } from "./pinterest";
import { fetchSearchConsolePageMetrics } from "./searchConsole";

const CABINET_SHELF_CAMPAIGN_KEY = "cabinet-shelf-measurement-resource-outreach";
const MVP_PAGE_PATHS = [
  "/guides/how-to-measure-cabinet-shelves",
  "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
  "/shop/cabinet-shelves/maple-melamine-cabinet-shelf",
  "/shop/cabinet-shelves"
] as const;

type OutreachTargetSummary = CraftBoardOutreachWorkspaceResponse["targets"][number];
type OutreachTargetDetail = NonNullable<CraftBoardOutreachWorkspaceResponse["selectedTarget"]>;

export type CabinetShelfLaunchPriority = "HIGH" | "MEDIUM" | "LOW";

export type CabinetShelfLaunchPromotedPage = {
  pageKey: string;
  title: string;
  path: string;
  destinationUrl: string;
  whyItMatters: string;
  recommendedUse: string;
  productFamily: string | null;
};

export type CabinetShelfLaunchPin = {
  launchKey: string;
  group: "GUIDE" | "WHITE_MELAMINE" | "MAPLE_MELAMINE" | "CATEGORY";
  pageKey: string;
  pinTitle: string;
  boardLabel: string;
  imageUrl: string;
  destinationUrl: string;
  publishPriority: string;
};

export type CabinetShelfLaunchTarget = {
  id: string;
  siteName: string;
  domain: string;
  targetType: string;
  authorityTier: string;
  topicCluster: string;
  status: string;
  fitNotes: string;
  topCampaignKey: string | null;
  nextFollowUpAt: string | null;
};

export type CabinetShelfLaunchPacket = {
  packetKey: string;
  title: string;
  summary: string;
  primaryGuidePageKey: string;
  productPageKeys: string[];
  categoryPageKey: string;
  primaryPinterestEntryKeys: string[];
  primaryOutreachTargetIds: string[];
  recommendedOutreachAssetPageKeys: string[];
  recommendedSubjectLines: string[];
  recommendedPitchSummary: string;
  recommendedWeeklyActions: Array<{
    title: string;
    detail: string;
    href: string;
  }>;
  launchPriority: CabinetShelfLaunchPriority;
  lastUpdated: string;
  overview: {
    includedProducts: string[];
    primaryGuideTitle: string;
    channels: string[];
  };
  promotedPages: CabinetShelfLaunchPromotedPage[];
  messaging: {
    brandSummary: string;
    problemSummary: string;
    talkingPoints: string[];
    valueBullets: string[];
    pinterestSummary: string;
    outreachSummary: string;
    websiteSummary: string;
    whiteMelamineSummary: string;
    mapleMelamineSummary: string;
  };
  pinterest: {
    packetCount: number;
    pins: CabinetShelfLaunchPin[];
    groupedPins: Array<{
      label: string;
      pins: CabinetShelfLaunchPin[];
    }>;
  };
  outreach: {
    campaignKey: string;
    campaignLabel: string;
    primaryAsset: {
      pageKey: string;
      title: string;
      path: string;
      pitchAngle: string;
      notes: string | null;
      anchorThemes: string[];
    } | null;
    targetGroups: Array<{
      label: string;
      count: number;
    }>;
    targets: CabinetShelfLaunchTarget[];
    draftPacket: CraftBoardOutreachDraftPacket | null;
  };
  linkouts: Array<{
    label: string;
    href: string;
  }>;
};

function byPath(path: string, inventory: SeoInventoryEntry[]) {
  return inventory.find((entry) => entry.path === path) ?? null;
}

function sortTargetForLaunch(left: OutreachTargetSummary, right: OutreachTargetSummary) {
  const statusWeight: Record<string, number> = {
    QUALIFIED: 0,
    PROSPECT: 1,
    CONTACTED: 2,
    FOLLOW_UP_DUE: 3,
    RESPONDED: 4,
    WON: 5,
    DEFERRED: 6,
    REJECTED: 7
  };
  const authorityWeight: Record<string, number> = {
    HIGH: 0,
    MEDIUM: 1,
    NICHE: 2
  };

  return (
    (statusWeight[left.status] ?? 9) - (statusWeight[right.status] ?? 9) ||
    (authorityWeight[left.authorityTier] ?? 9) - (authorityWeight[right.authorityTier] ?? 9) ||
    left.siteName.localeCompare(right.siteName)
  );
}

function buildPromotedPages(inventory: SeoInventoryEntry[]) {
  const guide = byPath("/guides/how-to-measure-cabinet-shelves", inventory);
  const white = byPath("/shop/cabinet-shelves/white-melamine-cabinet-shelf", inventory);
  const maple = byPath("/shop/cabinet-shelves/maple-melamine-cabinet-shelf", inventory);
  const category = byPath("/shop/cabinet-shelves", inventory);

  return [
    guide
      ? {
          pageKey: guide.pageKey,
          title: guide.title.replace(/\s+\|\s+Craft & Board$/, "").trim(),
          path: guide.path,
          destinationUrl: marketingUrl(guide.path),
          whyItMatters: "This is the lead education asset for search, Pinterest, and outreach because it solves the measurement problem before the customer hits the product pages.",
          recommendedUse: "Best link for DIY, kitchen-renovation, and measurement-help outreach.",
          productFamily: guide.productFamily
        }
      : null,
    white
      ? {
          pageKey: white.pageKey,
          title: white.title.replace(/\s+\|\s+Craft & Board$/, "").trim(),
          path: white.path,
          destinationUrl: marketingUrl(white.path),
          whyItMatters: "This is the clearest commercial page for homeowners who want a bright, practical replacement shelf after measuring.",
          recommendedUse: "Best page for clean kitchen and utility cabinet replacement traffic.",
          productFamily: white.productFamily
        }
      : null,
    maple
      ? {
          pageKey: maple.pageKey,
          title: maple.title.replace(/\s+\|\s+Craft & Board$/, "").trim(),
          path: maple.path,
          destinationUrl: marketingUrl(maple.path),
          whyItMatters: "This gives the launch a warmer wood-look option so the MVP does not feel like a one-finish product.",
          recommendedUse: "Best page for warmer maple-style cabinet interior replacements.",
          productFamily: maple.productFamily
        }
      : null,
    category
      ? {
          pageKey: category.pageKey,
          title: category.title.replace(/\s+\|\s+Craft & Board$/, "").trim(),
          path: category.path,
          destinationUrl: marketingUrl(category.path),
          whyItMatters: "This is the collection-level handoff for customers who want to compare both melamine finishes before starting the order request.",
          recommendedUse: "Best page for broad replacement cabinet shelf exploration.",
          productFamily: category.productFamily
        }
      : null
  ].filter(Boolean) as CabinetShelfLaunchPromotedPage[];
}

function buildLaunchPins(entries: PinterestPublishingEntry[]) {
  const entryByPath = new Map(entries.map((entry) => [entry.path, entry]));
  const guide = entryByPath.get("/guides/how-to-measure-cabinet-shelves");
  const white = entryByPath.get("/shop/cabinet-shelves/white-melamine-cabinet-shelf");
  const maple = entryByPath.get("/shop/cabinet-shelves/maple-melamine-cabinet-shelf");
  const category = entryByPath.get("/shop/cabinet-shelves");

  const pins: CabinetShelfLaunchPin[] = [
    guide
      ? {
          launchKey: `${guide.pageKey}:guide-primary`,
          group: "GUIDE",
          pageKey: guide.pageKey,
          pinTitle: "How to Measure Cabinet Shelves",
          boardLabel: guide.boardLabel,
          imageUrl: guide.imageUrl,
          destinationUrl: guide.utmDestinationUrl,
          publishPriority: guide.publishPriority
        }
      : null,
    guide
      ? {
          launchKey: `${guide.pageKey}:guide-secondary`,
          group: "GUIDE",
          pageKey: guide.pageKey,
          pinTitle: "Cabinet Shelf Measurement Guide",
          boardLabel: guide.boardLabel,
          imageUrl: guide.imageUrl,
          destinationUrl: guide.utmDestinationUrl,
          publishPriority: guide.publishPriority
        }
      : null,
    guide
      ? {
          launchKey: `${guide.pageKey}:guide-clearance`,
          group: "GUIDE",
          pageKey: guide.pageKey,
          pinTitle: "Cabinet Shelf Fit and Clearance Tips",
          boardLabel: guide.boardLabel,
          imageUrl: guide.imageUrl,
          destinationUrl: guide.utmDestinationUrl,
          publishPriority: guide.publishPriority
        }
      : null,
    white
      ? {
          launchKey: `${white.pageKey}:white-primary`,
          group: "WHITE_MELAMINE",
          pageKey: white.pageKey,
          pinTitle: "White Melamine Replacement Cabinet Shelf",
          boardLabel: white.boardLabel,
          imageUrl: white.imageUrl,
          destinationUrl: white.utmDestinationUrl,
          publishPriority: white.publishPriority
        }
      : null,
    white
      ? {
          launchKey: `${white.pageKey}:white-secondary`,
          group: "WHITE_MELAMINE",
          pageKey: white.pageKey,
          pinTitle: "Bright Cabinet Shelf Replacement",
          boardLabel: white.boardLabel,
          imageUrl: white.imageUrl,
          destinationUrl: white.utmDestinationUrl,
          publishPriority: white.publishPriority
        }
      : null,
    maple
      ? {
          launchKey: `${maple.pageKey}:maple-primary`,
          group: "MAPLE_MELAMINE",
          pageKey: maple.pageKey,
          pinTitle: "Maple Melamine Replacement Cabinet Shelf",
          boardLabel: maple.boardLabel,
          imageUrl: maple.imageUrl,
          destinationUrl: maple.utmDestinationUrl,
          publishPriority: maple.publishPriority
        }
      : null,
    maple
      ? {
          launchKey: `${maple.pageKey}:maple-secondary`,
          group: "MAPLE_MELAMINE",
          pageKey: maple.pageKey,
          pinTitle: "Warm Wood-Look Cabinet Shelf Replacement",
          boardLabel: maple.boardLabel,
          imageUrl: maple.imageUrl,
          destinationUrl: maple.utmDestinationUrl,
          publishPriority: maple.publishPriority
        }
      : null,
    category
      ? {
          launchKey: `${category.pageKey}:category-primary`,
          group: "CATEGORY",
          pageKey: category.pageKey,
          pinTitle: "Replacement Cabinet Shelves Made Simple",
          boardLabel: category.boardLabel,
          imageUrl: category.imageUrl,
          destinationUrl: category.utmDestinationUrl,
          publishPriority: category.publishPriority
        }
      : null,
    category
      ? {
          launchKey: `${category.pageKey}:category-secondary`,
          group: "CATEGORY",
          pageKey: category.pageKey,
          pinTitle: "Easy Cabinet Shelf Replacement",
          boardLabel: category.boardLabel,
          imageUrl: category.imageUrl,
          destinationUrl: category.utmDestinationUrl,
          publishPriority: category.publishPriority
        }
      : null,
    category
      ? {
          launchKey: `${category.pageKey}:category-order`,
          group: "CATEGORY",
          pageKey: category.pageKey,
          pinTitle: "Order Replacement Cabinet Shelves",
          boardLabel: category.boardLabel,
          imageUrl: category.imageUrl,
          destinationUrl: category.utmDestinationUrl,
          publishPriority: category.publishPriority
        }
      : null
  ].filter(Boolean) as CabinetShelfLaunchPin[];

  return {
    pins,
    groupedPins: [
      {
        label: "Guide Pins",
        pins: pins.filter((pin) => pin.group === "GUIDE")
      },
      {
        label: "White Melamine Shelf Pins",
        pins: pins.filter((pin) => pin.group === "WHITE_MELAMINE")
      },
      {
        label: "Maple Melamine Shelf Pins",
        pins: pins.filter((pin) => pin.group === "MAPLE_MELAMINE")
      },
      {
        label: "Category Pins",
        pins: pins.filter((pin) => pin.group === "CATEGORY")
      }
    ]
  };
}

function buildLaunchTargets(targets: OutreachTargetSummary[]) {
  return targets.map((target) => ({
    id: target.id,
    siteName: target.siteName,
    domain: target.domain,
    targetType: target.targetType,
    authorityTier: target.authorityTier,
    topicCluster: target.topicCluster,
    status: target.status,
    fitNotes: target.fitNotes,
    topCampaignKey: target.topCampaignKey,
    nextFollowUpAt: target.nextFollowUpAt
  }));
}

export async function buildCabinetShelfLaunchPacket(): Promise<CabinetShelfLaunchPacket> {
  const inventory = getSeoInventoryEntries();
  const [searchConsole, attributionPayload, outreachWorkspaceResponse] = await Promise.all([
    fetchSearchConsolePageMetrics({
      inventory,
      lookbackWindowDays: 28
    }),
    getCraftBoardStorefrontSeoAttributionSummary({
      lookbackDays: 28
    }).catch(() => ({ ok: true as const, lookbackDays: 28, attempts: [] })),
    getCraftBoardOutreachWorkspaceData({
      campaignKey: CABINET_SHELF_CAMPAIGN_KEY
    })
  ]);

  const reports = buildSeoHealthReports({
    inventory,
    metrics: searchConsole.metrics.filter((metric) => metric.status === "MATCHED")
  });
  const attributionSummary = summarizeAttributionByInventoryPath(attributionPayload?.attempts ?? []);
  const opportunities = buildSeoOpportunityQueue({
    inventory,
    reports,
    metrics: searchConsole.metrics.filter((metric) => metric.status === "MATCHED"),
    attributionSummary
  });
  const pinterestEntries = generatePinterestEntries({
    inventory,
    opportunities
  }).filter((entry) => MVP_PAGE_PATHS.includes(entry.path as (typeof MVP_PAGE_PATHS)[number]));
  const backlinkAssets = buildBacklinkAssetEntries({
    inventory,
    opportunities
  }).filter((asset) => MVP_PAGE_PATHS.includes(asset.path as (typeof MVP_PAGE_PATHS)[number]));
  const outreachCampaign = buildBacklinkOutreachCampaigns(backlinkAssets).find(
    (campaign) => campaign.campaignKey === CABINET_SHELF_CAMPAIGN_KEY
  );

  const outreachWorkspace =
    outreachWorkspaceResponse ??
    ({
      ok: true,
      summary: {
        totalTargets: 0,
        qualifiedTargets: 0,
        contactedTargets: 0,
        followUpsDue: 0,
        linksWon: 0,
        rejectedTargets: 0,
        activeCampaigns: 0
      },
      targets: [],
      followUpsDue: [],
      campaignProgress: [],
      recentActivities: [],
      selectedTarget: null
    } satisfies CraftBoardOutreachWorkspaceResponse);

  const actionableTargets = outreachWorkspace.targets
    .filter((target) => !["WON", "REJECTED", "DEFERRED"].includes(target.status))
    .sort(sortTargetForLaunch)
    .slice(0, 12);
  const selectedTargetId = actionableTargets[0]?.id ?? outreachWorkspace.targets.sort(sortTargetForLaunch)[0]?.id ?? null;
  const selectedWorkspace =
    selectedTargetId === null
      ? null
      : await getCraftBoardOutreachWorkspaceData({
          campaignKey: CABINET_SHELF_CAMPAIGN_KEY,
          targetId: selectedTargetId
        }).catch(() => null);
  const draftPacket =
    selectedWorkspace?.selectedTarget ? await buildCraftBoardOutreachDraftPacket({ target: selectedWorkspace.selectedTarget }) : null;

  const guideEntry = byPath("/guides/how-to-measure-cabinet-shelves", inventory);
  const categoryEntry = byPath("/shop/cabinet-shelves", inventory);
  const promotedPages = buildPromotedPages(inventory);
  const launchPins = buildLaunchPins(pinterestEntries);
  const primaryAsset = backlinkAssets.find((asset) => asset.path === "/guides/how-to-measure-cabinet-shelves") ?? backlinkAssets[0] ?? null;
  const targetGroups = actionableTargets.reduce<Array<{ label: string; count: number }>>((groups, target) => {
    const existing = groups.find((group) => group.label === target.targetType);
    if (existing) {
      existing.count += 1;
    } else {
      groups.push({
        label: target.targetType,
        count: 1
      });
    }
    return groups;
  }, []);

  return {
    packetKey: "cabinet-shelf-mvp-launch",
    title: "Cabinet Shelf MVP Launch Packet",
    summary:
      "A focused launch worksheet for promoting the cabinet shelf measurement guide first, then routing homeowners into the white and maple melamine replacement shelf pages.",
    primaryGuidePageKey: guideEntry?.pageKey ?? "GUIDE:how-to-measure-cabinet-shelves",
    productPageKeys: cabinetShelfProducts
      .map((product) => byPath(product.href, inventory)?.pageKey)
      .filter(Boolean) as string[],
    categoryPageKey: categoryEntry?.pageKey ?? "CATEGORY:cabinet-shelves",
    primaryPinterestEntryKeys: launchPins.pins.slice(0, 4).map((pin) => pin.pageKey),
    primaryOutreachTargetIds: actionableTargets.map((target) => target.id),
    recommendedOutreachAssetPageKeys: backlinkAssets.slice(0, 3).map((asset) => asset.pageKey),
    recommendedSubjectLines:
      draftPacket?.suggestedSubjectLines ??
      [
        "Cabinet shelf measurement guide for your readers",
        "Helpful cabinet shelf sizing resource",
        "Replacement cabinet shelf guide you might like"
      ],
    recommendedPitchSummary:
      draftPacket?.pitchSummary ??
      "Lead with the measurement guide as a practical homeowner resource for replacing cabinet shelves. Use the category and melamine product pages only as supporting links after the educational asset.",
    recommendedWeeklyActions: [
      {
        title: "Post the first cabinet shelf Pinterest batch",
        detail: `Start with ${launchPins.pins.slice(0, 4).length} launch-ready pins led by the measurement guide and both melamine product pages.`,
        href: "/admin/craft-board/seo/pinterest"
      },
      {
        title: "Send the first cabinet shelf outreach emails",
        detail: `Begin with ${actionableTargets.length} launch-ready DIY, kitchen, and home-improvement targets using the measurement guide as the lead asset.`,
        href: "/admin/craft-board/outreach"
      },
      {
        title: "Watch the guide and cabinet shelf product traffic",
        detail: "Use the marketing dashboard to confirm whether the guide is feeding product-page visits and order starts.",
        href: "/admin/craft-board/dashboard"
      },
      {
        title: "Review inquiry starts before changing messaging",
        detail: "Only refresh copy if real traffic or inquiry notes show confusion around measurement, fit, or finish selection.",
        href: "/admin/craft-board/seo"
      }
    ],
    launchPriority: "HIGH",
    lastUpdated: new Date().toISOString(),
    overview: {
      includedProducts: cabinetShelfProducts.map((product) => product.title),
      primaryGuideTitle: guideEntry?.title.replace(/\s+\|\s+Craft & Board$/, "").trim() ?? "How to Measure Cabinet Shelves",
      channels: ["Google / SEO", "Pinterest", "Outreach"]
    },
    promotedPages,
    messaging: {
      brandSummary:
        "Craft & Board is launching as a specialist replacement cabinet shelf brand with one simple promise: make measuring and ordering easier for normal homeowners.",
      problemSummary:
        "Most homeowners do not want a custom millwork process. They want to measure the cabinet correctly, pick the right melamine finish, and submit a replacement shelf request without second-guessing the fit.",
      talkingPoints: [
        "Replacement cabinet shelves made simple with beginner-friendly measurement guidance.",
        "1/8-inch increments keep the sizing process understandable instead of overwhelming.",
        "The measurement guide leads the funnel so homeowners can check fit before they order.",
        "White melamine and maple melamine cover the two clearest finish directions for the MVP.",
        "Every order request is reviewed, so unclear measurements can be caught before the job moves forward."
      ],
      valueBullets: [
        "Simple fit guidance for homeowners replacing a missing or worn shelf.",
        "Clear 1/8-inch measurement entry instead of tape-measure overload.",
        "Two practical melamine finish options: bright white or warmer maple look.",
        "Made-to-order shelf requests with real review if something looks unclear.",
        "Guide-to-product funnel built around confidence, not generic shelf browsing."
      ],
      pinterestSummary: "Measure your cabinet shelf the easy way and order a replacement with confidence.",
      outreachSummary:
        "Lead with the cabinet shelf measurement guide as a practical homeowner resource, then support it with the white and maple melamine product pages.",
      websiteSummary:
        "Replacement cabinet shelves made simple with clear measurement help, 1/8-inch increments, and a guided order-start process.",
      whiteMelamineSummary: "Bright, clean, practical replacement option for common kitchen and utility cabinet interiors.",
      mapleMelamineSummary: "Warmer wood-look replacement option for homeowners who want a more finished cabinet interior."
    },
    pinterest: {
      packetCount: launchPins.pins.length,
      pins: launchPins.pins,
      groupedPins: launchPins.groupedPins
    },
    outreach: {
      campaignKey: outreachCampaign?.campaignKey ?? CABINET_SHELF_CAMPAIGN_KEY,
      campaignLabel: outreachCampaign?.campaignLabel ?? "Cabinet Shelf Measurement Resource Outreach",
      primaryAsset: primaryAsset
        ? {
            pageKey: primaryAsset.pageKey,
            title:
              byPath(primaryAsset.path, inventory)?.title.replace(/\s+\|\s+Craft & Board$/, "").trim() ??
              primaryAsset.path,
            path: primaryAsset.path,
            pitchAngle: primaryAsset.pitchAngle,
            notes: primaryAsset.notes,
            anchorThemes: primaryAsset.suggestedAnchorThemes.slice(0, 4)
          }
        : null,
      targetGroups,
      targets: buildLaunchTargets(actionableTargets),
      draftPacket
    },
    linkouts: [
      { label: "Open Dashboard", href: "/admin/craft-board/dashboard" },
      { label: "Open Pinterest Ops", href: "/admin/craft-board/seo/pinterest" },
      { label: "Open Backlinks Report", href: "/admin/craft-board/seo/backlinks" },
      { label: "Open Outreach Workspace", href: "/admin/craft-board/outreach" },
      { label: "Open SEO Opportunities", href: "/admin/craft-board/seo" }
    ]
  };
}
