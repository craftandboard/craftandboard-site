export type GuideSection = {
  title: string;
  paragraphs: string[];
};

export type GuideFaqItem = {
  question: string;
  answer: string;
};

export type GuideLink = {
  title: string;
  href: string;
  description: string;
};

export type GuideContentEntry = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  heroHeading: string;
  intro: string;
  sections: GuideSection[];
  faqItems: GuideFaqItem[];
  relatedProducts: GuideLink[];
  relatedSeoVariants: GuideLink[];
  relatedGuides: string[];
  primaryCta: {
    href: string;
    label: string;
    body: string;
  };
  targetKeywords: string[];
  lastUpdated?: string;
};

export const guides: GuideContentEntry[] = [
  {
    slug: "how-to-measure-cabinet-shelves",
    title: "How to Measure Cabinet Shelves | Craft & Board",
    description:
      "Learn how to measure cabinet shelves correctly before ordering a replacement shelf. Simple width, depth, clearance, and 1/8 inch sizing guide.",
    summary:
      "A simple cabinet shelf measurement guide for homeowners ordering replacement shelves in white or maple melamine.",
    heroHeading: "How to measure your cabinet shelf the simple way.",
    intro:
      "If you can measure the inside width of the cabinet and the shelf depth, you can order a replacement cabinet shelf with a lot more confidence than most homeowners expect. The goal is not perfect carpenter language. The goal is getting the right shelf size the first time.",
    sections: [
      {
        title: "Why cabinet shelf measurements matter",
        paragraphs: [
          "A replacement shelf that is too wide will not slide in cleanly, and a shelf that is too small can feel loose or sloppy inside the cabinet. Good measurements keep the order simple and reduce the chance of guessing wrong.",
          "This guide is built for homeowners, not tradespeople. If you follow the width, depth, and clearance rules below, you will have what you need for a much cleaner replacement-shelf order."
        ]
      },
      {
        title: "Tools you need",
        paragraphs: [
          "Use a tape measure, something to write the numbers down with, and a flat surface where you can set the old shelf if you still have it. A phone note works fine if that is easier than paper.",
          "If the original shelf is missing, that is okay. The most important measurement is still the inside of the cabinet opening, not the old shelf."
        ]
      },
      {
        title: "Step-by-step measuring guide",
        paragraphs: [
          "Step 1: Remove the existing shelf if you have it. Step 2: Measure the inside width of the cabinet from one interior side to the other. Step 3: Measure the shelf depth from the back of the cabinet toward the front. Step 4: Write both numbers down clearly before you order.",
          "Always measure the inside of the cabinet, not just the old shelf. The old shelf may already be undersized, damaged, or slightly out of square, so the cabinet opening is the more reliable starting point."
        ]
      },
      {
        title: "Understanding inches made simple",
        paragraphs: [
          "Most homeowners only need four tape-measure ideas here: 1 inch, 1/2 inch, 1/4 inch, and 1/8 inch. Craft & Board replacement cabinet shelves are measured in 1/8 inch increments so you do not need to work in smaller marks than that.",
          "A tape measure reading might look like 24 inches, 24 1/8 inches, 24 1/4 inches, or 24 3/8 inches. If you can identify those marks, you can order the shelf size in the format this product line uses."
        ]
      },
      {
        title: "Why we use 1/8 inch increments",
        paragraphs: [
          "Using 1/8 inch increments keeps replacement shelf sizing accurate without making the order process feel overly technical. It gives enough flexibility for real cabinet openings while staying easy to read and write down.",
          "This is also why the best approach is to measure carefully once, then order using the cleanest 1/8 inch number that matches the opening and the clearance rule."
        ]
      },
      {
        title: "How much clearance to leave",
        paragraphs: [
          "Replacement cabinet shelves should usually be slightly smaller than the cabinet opening so they slide in easily. A simple rule of thumb is to subtract 1/8 inch from the cabinet width when ordering the shelf width.",
          "For example, if the inside cabinet opening measures 24 inches wide, the replacement shelf width would usually be 23 7/8 inches. That small amount of play helps the shelf fit without forcing it into the cabinet."
        ]
      },
      {
        title: "Example measurement scenarios",
        paragraphs: [
          "Example 1: Cabinet width 30 inches. Recommended shelf width 29 7/8 inches. Example 2: Cabinet depth 12 inches. Shelf depth ordered 12 inches. Example 3: If the cabinet is slightly out of square, use the smaller inside width so the shelf still slides in cleanly.",
          "If you do not have the original shelf, that does not change the process. Measure the inside opening width, confirm the depth, note the numbers clearly, and use the replacement-shelf product page that matches the finish you want."
        ]
      },
      {
        title: "Order the replacement shelf that matches your cabinet interior",
        paragraphs: [
          "White melamine is usually the right fit when you want a bright, clean cabinet interior that blends easily with painted kitchen cabinetry. Maple melamine is a better fit when the cabinet interior needs a warmer wood-look direction.",
          "Once your width and depth are written down, move into the white or maple melamine product page and use the replacement-shelf order path with the exact size you measured."
        ]
      }
    ],
    faqItems: [
      {
        question: "How much smaller should my cabinet shelf be?",
        answer:
          "A good starting rule is to order the shelf width 1/8 inch smaller than the inside cabinet opening so the shelf slides in more easily."
      },
      {
        question: "What if my cabinet is not perfectly square?",
        answer:
          "Use the smaller inside width so the replacement shelf still fits. It is better for the shelf to slide in cleanly than to be too tight."
      },
      {
        question: "Do I measure the cabinet or the shelf?",
        answer:
          "Measure the inside of the cabinet first. The old shelf can help as a reference, but the cabinet opening is the more reliable number."
      },
      {
        question: "What if I don’t have the original shelf?",
        answer:
          "That is fine. Measure the inside cabinet width and the shelf depth directly from the cabinet, then order from those numbers."
      }
    ],
    relatedProducts: [
      {
        title: "White Melamine Cabinet Shelf",
        href: "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
        description: "Best for bright, clean cabinet interiors and straightforward replacement-shelf projects."
      },
      {
        title: "Maple Melamine Cabinet Shelf",
        href: "/shop/cabinet-shelves/maple-melamine-cabinet-shelf",
        description: "Best for warmer cabinet interiors that still need the practicality of melamine."
      }
    ],
    relatedSeoVariants: [],
    relatedGuides: [],
    primaryCta: {
      href: "/shop/cabinet-shelves/white-melamine-cabinet-shelf",
      label: "Order Your Replacement Shelf",
      body:
        "Use your cabinet width and depth measurements to move into the white or maple melamine replacement-shelf product path."
    },
    targetKeywords: [
      "how to measure cabinet shelves",
      "cabinet shelf replacement size",
      "how to measure shelf for cabinet",
      "cabinet shelf dimensions guide"
    ],
    lastUpdated: "2026-03-14"
  },
  {
    slug: "install-floating-shelves",
    title: "How to Install Floating Shelves | Craft & Board",
    description:
      "Learn how to install floating shelves securely, choose the right concealed mounting path, and plan shelf placement for contractor-grade results.",
    summary:
      "A practical guide to planning, measuring, and installing floating shelves so the finished shelf feels intentional and secure.",
    heroHeading: "How to install floating shelves with a cleaner, more built-in result.",
    intro:
      "Installing floating shelves well is less about rushing the bracket into the wall and more about planning the exact width, depth, stud conditions, and visual alignment before the shelf is ever finished. The strongest installs start with the room, not the hardware box.",
    sections: [
      {
        title: "Start by measuring the room instead of the bracket.",
        paragraphs: [
          "Before drilling anything, confirm the final shelf width, depth, and elevation in context with the wall, nearby cabinets, artwork, tile lines, or fireplace surround. Floating shelves usually fail visually when they are close to the right proportion instead of exact.",
          "Mark the shelf line with painter's tape and step back from multiple angles. This makes it easier to confirm if the shelf needs to align with millwork, center over furniture, or relate to another architectural line in the room."
        ]
      },
      {
        title: "Match the concealed mounting path to the wall condition.",
        paragraphs: [
          "A concealed floating shelf bracket works best when the wall framing and fastener path are understood early. Solid backing, stud placement, and surface conditions all affect how cleanly the shelf can install and how much confidence the final mount inspires.",
          "If the wall has unusual framing, masonry, or finish buildup, it is better to review the mounting path before the shelf is finalized than to force a standard install assumption later."
        ]
      },
      {
        title: "Plan for styling depth and real shelf use.",
        paragraphs: [
          "Shelf depth matters as much as width. A shallow shelf may look elegant but fail once dishes, books, or layered objects need to sit comfortably. A deeper shelf can be more practical, but it should still feel proportionate to the room and not project awkwardly.",
          "When planning installation height, think about both access and sight lines. A shelf that looks good from across the room but feels cramped in use will never read as fully resolved."
        ]
      },
      {
        title: "Use the product configurator to lock in the right dimensions before install day.",
        paragraphs: [
          "The cleanest installation results usually come from starting with a made-to-order shelf width and finish direction instead of trying to adapt a stock shelf after the fact. That is especially true for longer spans and walls that need the shelf to align precisely with furniture or millwork.",
          "Craft & Board keeps the install path grounded in the live shelf product page so the project can move from planning into a real build and checkout flow without losing the dimensional intent."
        ]
      }
    ],
    faqItems: [
      {
        question: "How high should floating shelves be installed?",
        answer:
          "Shelf height depends on the surrounding furniture, visual balance, and how the shelf will actually be used. Start with the room composition first, then refine the exact elevation from there."
      },
      {
        question: "Do floating shelves need to hit studs?",
        answer:
          "Stud placement or equivalent solid backing matters for most concealed mounting paths. If the wall condition is unusual, review that before finalizing the shelf rather than treating the install as generic."
      },
      {
        question: "Can I install a long floating shelf over tile or stone?",
        answer:
          "Yes, but the substrate and fastening path should be reviewed carefully. Long spans deserve a mounting strategy that matches the wall condition rather than a one-size-fits-all assumption."
      }
    ],
    relatedProducts: [
      {
        title: "Classic Floating Shelf",
        href: "/shop/floating-shelves/classic-floating-shelf",
        description: "Use the live configurator to define the exact shelf width, depth, thickness, and mounting direction."
      },
      {
        title: "Floating Shelves Collection",
        href: "/shop/floating-shelves",
        description: "Browse the shelf category to compare the live collection and positioning."
      }
    ],
    relatedSeoVariants: [
      {
        title: "72 Inch Floating Shelf",
        href: "/floating-shelves/72-inch",
        description: "A useful reference for longer architectural shelf spans."
      },
      {
        title: "Floating Shelves for Kitchens",
        href: "/floating-shelves/kitchen",
        description: "See how custom shelf placement changes open-shelving layouts."
      }
    ],
    relatedGuides: ["floating-shelf-weight-limits", "best-wood-for-floating-shelves"],
    primaryCta: {
      href: "/shop/floating-shelves/classic-floating-shelf",
      label: "Configure Your Floating Shelf",
      body:
        "Move from planning into the live shelf configurator to define the exact size, material direction, and concealed mounting path."
    },
    targetKeywords: ["how to install floating shelves", "floating shelf installation", "install concealed floating shelves"],
    lastUpdated: "2026-03-14"
  },
  {
    slug: "floating-shelf-weight-limits",
    title: "How Much Weight Can Floating Shelves Hold? | Craft & Board",
    description:
      "Understand what affects floating shelf weight capacity, including span, depth, mounting path, and how the shelf will actually be used.",
    summary:
      "A practical look at the variables that influence floating shelf weight capacity so customers can plan around real use instead of vague claims.",
    heroHeading: "How much weight can floating shelves hold in real-world use?",
    intro:
      "There is no honest single-number answer for every floating shelf. Weight capacity depends on shelf span, depth, thickness, material, concealed bracket path, wall condition, and how the load is distributed across the shelf.",
    sections: [
      {
        title: "Span changes the conversation quickly.",
        paragraphs: [
          "A shorter floating shelf generally has fewer structural compromises than a longer one because the concealed support has less distance to manage. As width grows, the shelf is doing more visual and structural work at the same time.",
          "That does not mean longer shelves are a bad idea. It means longer shelves deserve a made-to-order approach where the span and concealed mounting path are reviewed together instead of treated like a generic stock product."
        ]
      },
      {
        title: "Depth and load distribution matter as much as raw pounds.",
        paragraphs: [
          "A shelf loaded with evenly spaced dishes behaves differently than a shelf carrying a dense cluster of books or equipment at the front edge. Depth changes leverage, and leverage changes how hard the concealed support needs to work.",
          "When evaluating weight limits, think about what will live on the shelf every day, not just the heaviest theoretical number you might set on it once."
        ]
      },
      {
        title: "Wall construction matters more than most customers expect.",
        paragraphs: [
          "Even a strong shelf can be undermined by a weak mounting condition. Stud alignment, blocking, masonry, tile buildup, and existing wall finish all influence how confident the install can be.",
          "That is why contractor-grade shelf planning focuses on the full system: shelf size, material build, concealed bracket path, and the actual wall it needs to land on."
        ]
      },
      {
        title: "Use the configurator and review path when the shelf needs to do real work.",
        paragraphs: [
          "If the project needs a long span, deeper shelf, or heavier everyday use, the best path is to start with the live shelf product so the commercial and mounting assumptions stay grounded in the actual project.",
          "Craft & Board keeps those decisions tied to the product configuration flow rather than flattening them into a single oversimplified weight claim."
        ]
      }
    ],
    faqItems: [
      {
        question: "Can floating shelves hold books?",
        answer:
          "They can, but book loads are denser than styling loads and deserve a shelf span, depth, and mounting path that account for that heavier everyday use."
      },
      {
        question: "Do longer floating shelves hold less weight?",
        answer:
          "Longer spans usually require more careful support planning because the shelf is covering more distance. That is why span and mounting review matter together."
      },
      {
        question: "Is a thicker shelf always stronger?",
        answer:
          "Not automatically. Thickness changes visual weight and can influence structure, but the overall system still depends on span, mounting design, and wall condition."
      }
    ],
    relatedProducts: [
      {
        title: "Classic Floating Shelf",
        href: "/shop/floating-shelves/classic-floating-shelf",
        description: "Start the live shelf flow when the project needs specific span and mounting decisions."
      }
    ],
    relatedSeoVariants: [
      {
        title: "84 Inch Floating Shelf",
        href: "/floating-shelves/84-inch",
        description: "Explore a longer shelf span where mounting and structural planning matter more."
      },
      {
        title: "Floating Shelves for Living Rooms",
        href: "/floating-shelves/living-room",
        description: "See how longer decorative and functional shelf spans work in living rooms."
      }
    ],
    relatedGuides: ["install-floating-shelves", "floating-shelves-vs-brackets"],
    primaryCta: {
      href: "/shop/floating-shelves/classic-floating-shelf",
      label: "Plan a Shelf Around Real Use",
      body:
        "Use the live shelf page to define the span, depth, and mounting direction that match what the shelf actually needs to hold."
    },
    targetKeywords: ["how much weight can floating shelves hold", "floating shelf weight capacity", "long floating shelf weight limits"],
    lastUpdated: "2026-03-14"
  },
  {
    slug: "best-wood-for-floating-shelves",
    title: "Best Wood for Floating Shelves | Craft & Board",
    description:
      "Compare white oak, walnut, and maple for floating shelves, including grain character, tone, and where each wood direction works best.",
    summary:
      "A practical wood-selection guide for floating shelves with material comparisons and room-based guidance.",
    heroHeading: "What is the best wood for floating shelves?",
    intro:
      "The best wood for floating shelves depends on the room, the finish palette, and how much visual presence the shelf should carry. Some projects need warmth and visible grain, while others need a quieter wood direction that supports the room without dominating it.",
    sections: [
      {
        title: "White oak is often the most flexible starting point.",
        paragraphs: [
          "White oak is popular because it brings warmth, visible grain, and enough neutrality to work across kitchens, living rooms, and fireplace walls. It feels grounded without becoming overly dark or heavy.",
          "For many customers, white oak is the easiest way to get a shelf that feels architectural and current while still pairing well with stone, painted millwork, and natural-finish cabinetry."
        ]
      },
      {
        title: "Walnut adds contrast and visual weight.",
        paragraphs: [
          "Walnut shelves tend to read richer and more dramatic than lighter hardwoods. That makes them a strong fit when the shelf should stand out against plaster, tile, or lighter cabinetry rather than blend quietly into the wall.",
          "Walnut works especially well in rooms where the shelf is part of a more deliberate, high-contrast material palette."
        ]
      },
      {
        title: "Maple keeps the wood direction lighter and calmer.",
        paragraphs: [
          "Maple is useful when the room wants a lighter hardwood note with less contrast than walnut and a different character than white oak. It can help a shelf feel clean and bright without becoming visually sterile.",
          "This is often a strong direction for kitchens, breakfast spaces, and interiors that already have a calm material palette."
        ]
      },
      {
        title: "Choose the wood that matches the room, not just the trend.",
        paragraphs: [
          "The shelf should relate to the larger composition around it, including cabinetry, flooring, plaster tone, stone, and adjacent millwork. A beautiful wood can still feel wrong if it fights the rest of the room.",
          "Craft & Board keeps the material path tied to the live product and SEO landing pages so customers can compare real directions before moving into the configurator."
        ]
      }
    ],
    faqItems: [
      {
        question: "Is white oak or walnut better for floating shelves?",
        answer:
          "Neither is universally better. White oak is often more flexible and warm-neutral, while walnut creates a darker, richer statement."
      },
      {
        question: "What wood works best for kitchen floating shelves?",
        answer:
          "White oak and maple are both strong kitchen directions, depending on whether the room needs more grain presence or a lighter overall wood tone."
      },
      {
        question: "Should shelves match the floor exactly?",
        answer:
          "Not always. It is usually better for shelves to feel related to the room palette than to chase a perfect match that ends up looking forced."
      }
    ],
    relatedProducts: [
      {
        title: "Classic Floating Shelf",
        href: "/shop/floating-shelves/classic-floating-shelf",
        description: "Compare material direction inside the live shelf product flow."
      }
    ],
    relatedSeoVariants: [
      {
        title: "White Oak Floating Shelves",
        href: "/floating-shelves/white-oak",
        description: "Explore the white oak shelf direction directly."
      },
      {
        title: "Walnut Floating Shelves",
        href: "/floating-shelves/walnut",
        description: "See how walnut shelves shift the tone and contrast."
      },
      {
        title: "Maple Floating Shelves",
        href: "/floating-shelves/maple",
        description: "Review a lighter hardwood shelf direction."
      }
    ],
    relatedGuides: ["how-to-style-floating-shelves", "install-floating-shelves"],
    primaryCta: {
      href: "/floating-shelves/white-oak",
      label: "Explore Shelf Wood Directions",
      body:
        "Move from wood-selection research into the shelf landing pages and live configurator to narrow the right material direction."
    },
    targetKeywords: ["best wood for floating shelves", "white oak floating shelves", "walnut floating shelves"],
    lastUpdated: "2026-03-14"
  },
  {
    slug: "floating-shelves-vs-brackets",
    title: "Floating Shelves vs Brackets | Craft & Board",
    description:
      "Compare floating shelves and bracket shelves to understand the visual, structural, and design tradeoffs before choosing the right shelf path.",
    summary:
      "A guide to when concealed floating shelves make sense and when an exposed bracket shelf may be the better fit.",
    heroHeading: "Floating shelves vs brackets: which shelf path fits the room better?",
    intro:
      "The right answer depends on what the shelf needs to do visually and structurally. Floating shelves create a cleaner architectural line, while bracket shelves make the support visible and can shift the design language of the whole wall.",
    sections: [
      {
        title: "Floating shelves are usually chosen for cleaner visual lines.",
        paragraphs: [
          "A concealed floating shelf keeps the emphasis on the wood profile and the shelf span itself. That makes it a strong fit for rooms where the shelf should feel built in, calm, and integrated with nearby millwork or architecture.",
          "This approach is especially useful when the shelf sits over furniture, in a kitchen, or near a fireplace wall where exposed support hardware would compete with other finish elements."
        ]
      },
      {
        title: "Bracket shelves can be right when the support is part of the aesthetic.",
        paragraphs: [
          "If the project wants an industrial, utilitarian, or visibly assembled look, brackets can become part of the design story rather than something to hide.",
          "Bracket shelves can also make sense when the room already leans more casual or when the shelf system is intentionally exposed."
        ]
      },
      {
        title: "The wall and load still matter regardless of style.",
        paragraphs: [
          "Whether the shelf is floating or bracketed, wall condition, load, span, and daily use all matter. A clean concealed look should still be planned around how the shelf will actually live in the room.",
          "That is why made-to-order floating shelves tend to outperform generic stock decisions in more architectural interiors."
        ]
      },
      {
        title: "Choose based on the room language, not just the hardware.",
        paragraphs: [
          "If the room wants the shelf to disappear into the architecture, floating shelves are usually the stronger direction. If the room wants the support to show and contribute to the look, brackets may be more appropriate.",
          "Craft & Board focuses on the floating path and keeps that route connected to the live configurator when the goal is a more refined built-in result."
        ]
      }
    ],
    faqItems: [
      {
        question: "Are floating shelves stronger than bracket shelves?",
        answer:
          "Strength depends on the full system and wall condition, not just whether the support is visible. The choice is usually a design-and-application decision first."
      },
      {
        question: "Do floating shelves look more modern?",
        answer:
          "Often yes. Floating shelves usually read cleaner and more architectural, especially in contemporary or transitional interiors."
      }
    ],
    relatedProducts: [
      {
        title: "Floating Shelves Collection",
        href: "/shop/floating-shelves",
        description: "Browse the live shelf category built around concealed-support shelf designs."
      },
      {
        title: "Classic Floating Shelf",
        href: "/shop/floating-shelves/classic-floating-shelf",
        description: "Move directly into the shelf product and configuration path."
      }
    ],
    relatedSeoVariants: [
      {
        title: "Floating Shelves for Living Rooms",
        href: "/floating-shelves/living-room",
        description: "See how concealed shelving reads in primary living spaces."
      },
      {
        title: "72 Inch Floating Shelf",
        href: "/floating-shelves/72-inch",
        description: "Review a longer shelf span where the clean line matters more."
      }
    ],
    relatedGuides: ["floating-shelf-weight-limits", "how-to-style-floating-shelves"],
    primaryCta: {
      href: "/shop/floating-shelves/classic-floating-shelf",
      label: "Start a Floating Shelf Project",
      body:
        "If the room wants a cleaner architectural result, move into the live floating shelf product to define the right span and material path."
    },
    targetKeywords: ["floating shelves vs brackets", "floating shelf vs bracket shelf", "concealed shelf vs bracket shelf"],
    lastUpdated: "2026-03-14"
  },
  {
    slug: "how-to-style-floating-shelves",
    title: "How to Style Floating Shelves | Craft & Board",
    description:
      "Use practical shelf styling ideas to balance objects, negative space, and material contrast on custom floating shelves.",
    summary:
      "Shelf styling guidance for customers who want floating shelves to feel considered rather than crowded.",
    heroHeading: "How to style floating shelves so they look considered, not crowded.",
    intro:
      "Good floating shelf styling is usually about restraint. The shelf should still read as part of the architecture, with the objects helping the room rather than overwhelming it. That starts with the right shelf size and continues with how the objects are grouped.",
    sections: [
      {
        title: "Start with fewer objects than you think you need.",
        paragraphs: [
          "The fastest way to make a custom shelf feel generic is to overcrowd it. Leave enough negative space for the shelf itself to read as a design element rather than just a storage plank.",
          "A longer shelf does not need to be filled edge to edge. Instead, use groupings that create rhythm and let the room breathe."
        ]
      },
      {
        title: "Balance tall, low, and textured elements.",
        paragraphs: [
          "Mixing heights helps the shelf feel layered, but the groupings should still feel intentional. Pair taller objects with lower pieces and add one or two softer or more textured materials so the arrangement does not become too rigid.",
          "Books, ceramics, framed art, and small vessels can work well together when the grouping has contrast and enough breathing room."
        ]
      },
      {
        title: "Let the shelf width and depth guide the styling plan.",
        paragraphs: [
          "A 48 inch shelf may need tighter editing than a 72 inch or 84 inch shelf, while a deeper shelf can support slightly fuller arrangements. Styling should follow the geometry of the shelf instead of fighting it.",
          "This is one of the reasons custom sizing matters: the right shelf dimensions make styling easier before the first object is placed."
        ]
      },
      {
        title: "Use the material tone as part of the composition.",
        paragraphs: [
          "White oak, walnut, and maple all change the shelf's visual weight. A darker shelf may need lighter objects for contrast, while a lighter shelf may benefit from a few deeper accents to keep the arrangement grounded.",
          "If the room already has strong stone, tile, or cabinetry nearby, let the shelf styling support that finish palette instead of competing with it."
        ]
      }
    ],
    faqItems: [
      {
        question: "How many items should go on a floating shelf?",
        answer:
          "Usually fewer than you expect. Start light, create one or two groupings, and leave enough negative space for the shelf itself to read clearly."
      },
      {
        question: "Should floating shelves be symmetrical?",
        answer:
          "Not always. Balanced asymmetry often feels more natural, as long as the shelf still looks intentional from across the room."
      }
    ],
    relatedProducts: [
      {
        title: "Classic Floating Shelf",
        href: "/shop/floating-shelves/classic-floating-shelf",
        description: "Start with the live shelf product to choose the dimensions that support better styling."
      }
    ],
    relatedSeoVariants: [
      {
        title: "Floating Shelves for Living Rooms",
        href: "/floating-shelves/living-room",
        description: "Review living-room shelf ideas where styling is central."
      },
      {
        title: "White Oak Floating Shelves",
        href: "/floating-shelves/white-oak",
        description: "See a warm, flexible wood direction for styled shelf compositions."
      }
    ],
    relatedGuides: ["best-wood-for-floating-shelves", "install-floating-shelves"],
    primaryCta: {
      href: "/floating-shelves/living-room",
      label: "Explore Styled Shelf Directions",
      body:
        "Use the shelf landing pages and live configurator to choose a span and wood direction that supports how the shelf will actually be styled."
    },
    targetKeywords: ["how to style floating shelves", "floating shelf styling ideas", "living room floating shelves"],
    lastUpdated: "2026-03-14"
  },
  {
    slug: "floating-mantel-design-ideas",
    title: "Floating Mantel Design Ideas | Craft & Board",
    description:
      "Explore floating mantel design ideas, material directions, and sizing guidance for fireplace walls that need a stronger architectural focal point.",
    summary:
      "Design guidance for choosing a floating mantel that feels proportionate to the fireplace wall and the larger room.",
    heroHeading: "Floating mantel design ideas for a fireplace wall that feels resolved.",
    intro:
      "A floating mantel often becomes the visual anchor of the entire fireplace wall, which means the span, profile depth, and wood tone need to feel intentional in the larger room composition. The best mantels are scaled to the full wall, not just the firebox opening.",
    sections: [
      {
        title: "Start with the wall composition, not just the firebox.",
        paragraphs: [
          "A mantel that only responds to the width of the opening can feel undersized once the whole fireplace wall comes into view. Consider the surround, adjacent millwork, art placement, and the width of the room before deciding on mantel span.",
          "Longer floating mantels usually read more architectural because they connect the fireplace to the larger room composition instead of stopping abruptly at the surround."
        ]
      },
      {
        title: "Use wood tone to control how heavy or light the mantel feels.",
        paragraphs: [
          "White oak tends to keep the wall warm and flexible, walnut adds contrast and richness, and maple can soften the effect when the room already has a lot of visual weight.",
          "The mantel does not have to match every nearby finish exactly. It should feel intentional against the stone, plaster, tile, or built-ins around it."
        ]
      },
      {
        title: "Profile depth changes the visual weight more than many customers expect.",
        paragraphs: [
          "A deeper or taller mantel section can make the fireplace feel more grounded, while a slimmer section keeps the wall lighter. The right answer depends on the room scale and how strong the mantel should read from across the space.",
          "This is why custom mantel sizing is so valuable: the section can be tuned to the room instead of forced into a stock proportion."
        ]
      },
      {
        title: "Tie the inspiration back to a real product path.",
        paragraphs: [
          "Design ideas are useful only if they lead into a real project. Craft & Board routes mantel research back into the live floating mantel product so span, wood direction, and mounting assumptions stay grounded in a real order flow.",
          "Use the mantel landing pages to compare variants, then move into the configurator when the design direction is ready to become a buildable specification."
        ]
      }
    ],
    faqItems: [
      {
        question: "How long should a floating mantel be?",
        answer:
          "The mantel should relate to the full fireplace wall and surrounding composition, not only the firebox opening. Longer spans often feel more architectural when the wall can support them."
      },
      {
        question: "Is white oak or walnut better for a floating mantel?",
        answer:
          "White oak is usually more flexible and warm-neutral, while walnut creates a darker, more dramatic focal point."
      }
    ],
    relatedProducts: [
      {
        title: "Classic Floating Mantel",
        href: "/shop/floating-mantels/classic-floating-mantel",
        description: "Move into the live mantel product to define span, profile, and material direction."
      },
      {
        title: "Floating Mantels Collection",
        href: "/shop/floating-mantels",
        description: "Browse the mantel category and launch positioning."
      }
    ],
    relatedSeoVariants: [
      {
        title: "72 Inch Floating Mantel",
        href: "/floating-mantels/72-inch",
        description: "See a strong focal-point mantel span."
      },
      {
        title: "White Oak Floating Mantels",
        href: "/floating-mantels/white-oak",
        description: "Review a warm mantel material direction."
      },
      {
        title: "Floating Mantels for Fireplaces",
        href: "/floating-mantels/fireplace",
        description: "Explore fireplace-specific mantel positioning."
      }
    ],
    relatedGuides: ["best-wood-for-floating-shelves", "how-to-style-floating-shelves"],
    primaryCta: {
      href: "/shop/floating-mantels/classic-floating-mantel",
      label: "Start Your Floating Mantel Design",
      body:
        "Use the live floating mantel page to move from design ideas into an actual configurable product and checkout path."
    },
    targetKeywords: ["floating mantel ideas", "floating mantel design ideas", "modern floating mantel"],
    lastUpdated: "2026-03-14"
  }
];

export function getGuideBySlug(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
