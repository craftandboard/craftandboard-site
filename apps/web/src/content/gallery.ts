export type GalleryItem = {
  id: string;
  title: string;
  caption: string;
  alt: string;
  tag: string;
  imagePublicId?: string;
};

export const galleryItems: GalleryItem[] = [
  {
    id: "living-room-oak",
    title: "Layered living room styling",
    caption: "White oak shelving styled as a low-contrast architectural feature.",
    alt: "Floating shelf installed in a warm living room setting",
    tag: "Living Room",
    imagePublicId: "craft-board/gallery-living-room"
  },
  {
    id: "kitchen-walnut",
    title: "Kitchen display shelf",
    caption: "Walnut shelf detail bringing depth and warmth to a bright kitchen wall.",
    alt: "Walnut floating shelf in a bright kitchen",
    tag: "Kitchen",
    imagePublicId: "craft-board/gallery-kitchen"
  },
  {
    id: "office-maple",
    title: "Workspace shelving",
    caption: "A lighter shelf finish used to keep a compact workspace open and calm.",
    alt: "Light wood floating shelves in a home office",
    tag: "Workspace",
    imagePublicId: "craft-board/gallery-office"
  },
  {
    id: "hallway-detail",
    title: "Minimal hallway statement",
    caption: "A long shelf used as a simple architectural line in a circulation space.",
    alt: "Long floating shelf in a hallway interior",
    tag: "Entry",
    imagePublicId: "craft-board/gallery-hallway"
  },
  {
    id: "dining-room-styling",
    title: "Dining room display line",
    caption: "A shelf proportioned to anchor art, serving pieces, and softer styling objects without visual clutter.",
    alt: "Floating shelf in a dining room setting",
    tag: "Dining",
    imagePublicId: "craft-board/gallery-dining"
  },
  {
    id: "bedroom-ledger",
    title: "Quiet bedroom accent",
    caption: "A narrow shelf used to introduce warmth and practical display in a softer private space.",
    alt: "Floating shelf in a bedroom interior",
    tag: "Bedroom",
    imagePublicId: "craft-board/gallery-bedroom"
  }
];

export const galleryPageContent = {
  title: "A visual starting point for made-to-order shelf projects.",
  body:
    "The gallery is intended to help with mood, scale, and finish direction. Even when an exact project looks different, the examples make it easier to understand where custom sizing creates a cleaner result.",
  cta: {
    label: "Explore Floating Shelves",
    href: "/shop/floating-shelves"
  }
} as const;
