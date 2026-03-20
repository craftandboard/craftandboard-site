import type { SeoInventoryEntry, SeoInventoryTopicCluster } from "./inventory";

export type PinterestBoardKey =
  | "cabinet-shelf-guides"
  | "replacement-cabinet-shelves"
  | "floating-shelves"
  | "floating-shelf-ideas"
  | "floating-shelf-installation"
  | "floating-mantels"
  | "fireplace-mantel-ideas"
  | "home-interior-design"
  | "wood-shelf-styling"
  | "mantel-styling";

export type PinterestBoardDefinition = {
  key: PinterestBoardKey;
  label: string;
  description: string;
};

export const pinterestBoards: Record<PinterestBoardKey, PinterestBoardDefinition> = {
  "cabinet-shelf-guides": {
    key: "cabinet-shelf-guides",
    label: "Cabinet Shelf Guides",
    description: "Measurement, planning, and practical replacement cabinet shelf content."
  },
  "replacement-cabinet-shelves": {
    key: "replacement-cabinet-shelves",
    label: "Replacement Cabinet Shelves",
    description: "Replacement cabinet shelf products and simple cabinet-fit buying paths."
  },
  "floating-shelves": {
    key: "floating-shelves",
    label: "Floating Shelves",
    description: "Commercial shelf pages and flagship shopping paths."
  },
  "floating-shelf-ideas": {
    key: "floating-shelf-ideas",
    label: "Floating Shelf Ideas",
    description: "Shelf inspiration, use cases, and idea-driven discovery pages."
  },
  "floating-shelf-installation": {
    key: "floating-shelf-installation",
    label: "Floating Shelf Installation",
    description: "Installation, planning, and support-oriented shelf content."
  },
  "floating-mantels": {
    key: "floating-mantels",
    label: "Floating Mantels",
    description: "Commercial mantel pages and flagship fireplace products."
  },
  "fireplace-mantel-ideas": {
    key: "fireplace-mantel-ideas",
    label: "Fireplace Mantel Ideas",
    description: "Mantel inspiration and fireplace-specific discovery content."
  },
  "home-interior-design": {
    key: "home-interior-design",
    label: "Home Interior Design",
    description: "Broad brand, category, and design-led pages."
  },
  "wood-shelf-styling": {
    key: "wood-shelf-styling",
    label: "Wood Shelf Styling",
    description: "Wood selection and styling pages for shelves."
  },
  "mantel-styling": {
    key: "mantel-styling",
    label: "Mantel Styling and Inspiration",
    description: "Mantel styling and inspiration-focused pages."
  }
};

function isGuide(entry: SeoInventoryEntry) {
  return entry.pageType === "GUIDE_ARTICLE" || entry.pageType === "GUIDE_INDEX";
}

function isCommercial(entry: SeoInventoryEntry) {
  return entry.pageType === "PRODUCT" || entry.pageType === "VARIANT" || entry.pageType === "VARIANT_COMBINATION";
}

function cluster(entry: SeoInventoryEntry): SeoInventoryTopicCluster | null {
  return entry.topicCluster ?? null;
}

export function resolveBoardForPage(entry: SeoInventoryEntry): PinterestBoardDefinition {
  if (entry.productFamily === "cabinet-shelves") {
    if (isGuide(entry)) {
      return pinterestBoards["cabinet-shelf-guides"];
    }
    return pinterestBoards["replacement-cabinet-shelves"];
  }

  if (entry.productFamily === "floating-mantels") {
    if (cluster(entry) === "design-ideas" || cluster(entry) === "styling-design" || entry.path.includes("fireplace")) {
      return pinterestBoards["fireplace-mantel-ideas"];
    }
    if (isGuide(entry)) {
      return pinterestBoards["mantel-styling"];
    }
    return isCommercial(entry) ? pinterestBoards["floating-mantels"] : pinterestBoards["home-interior-design"];
  }

  if (entry.productFamily === "floating-shelves") {
    if (cluster(entry) === "installation" || cluster(entry) === "weight-capacity") {
      return pinterestBoards["floating-shelf-installation"];
    }
    if (cluster(entry) === "materials" || cluster(entry) === "styling-design") {
      return pinterestBoards["wood-shelf-styling"];
    }
    if (isGuide(entry) || cluster(entry) === "use-cases") {
      return pinterestBoards["floating-shelf-ideas"];
    }
    return isCommercial(entry) ? pinterestBoards["floating-shelves"] : pinterestBoards["home-interior-design"];
  }

  if (entry.pageType === "HOME" || entry.pageType === "CATEGORY" || entry.pageType === "STATIC_PAGE") {
    return pinterestBoards["home-interior-design"];
  }

  return pinterestBoards["home-interior-design"];
}
