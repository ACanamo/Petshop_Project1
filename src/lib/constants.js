/**
 * PETCHUP CONSTANTS & DEFAULT SEED DATA
 */

export const DEFAULT_PRODUCTS = [
  {
    id: "p1",
    sku: "SKU-SALMON12",
    name: "Salmon & Sweet Potato Crunchies (12lb)",
    category: "feeds",
    categoryLabel: "Feeds & Dry Food",
    pet: "dog",
    price: 34.99,
    originalPrice: 41.99,
    rating: 5,
    ratingCount: 142,
    popularity: 98,
    img: "🥩",
    imageUrl: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=600&q=80",
    badge: "Top Pick",
    badgeClass: "badge-bestseller",
    tintClass: "bg-yellow-tint",
    desc: "Oven-baked whole feeds with ancient grains and omega-3s for energy and shiny coats.",
    stockQuantity: 45,
    inStock: true
  },
  {
    id: "p2",
    sku: "SKU-DUCK6PK",
    name: "Pasture Duck Stew Cans (Pack of 6)",
    category: "feeds",
    categoryLabel: "Canned Wet Feeds",
    pet: "dog",
    price: 22.50,
    originalPrice: 0,
    unit: "(₱3.75/can)",
    rating: 5,
    ratingCount: 98,
    popularity: 95,
    img: "🥫",
    imageUrl: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80",
    badge: "New Recipe",
    badgeClass: "badge-new",
    tintClass: "bg-coral-tint",
    desc: "Slow-braised duck in 18-hour marrow bone broth. Zero gums or fillers.",
    stockQuantity: 30,
    inStock: true
  },
  {
    id: "p3-cat",
    sku: "SKU-CATPATE6",
    name: "Wild Pacific Salmon & Kelp Pâté (Pack of 6)",
    category: "feeds",
    categoryLabel: "Canned Wet Feeds",
    pet: "cat",
    price: 19.99,
    originalPrice: 24.00,
    rating: 4.9,
    ratingCount: 112,
    popularity: 92,
    img: "🐟",
    imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80",
    badge: "Feline Favorite",
    badgeClass: "badge-popular",
    tintClass: "bg-teal-tint",
    desc: "Smooth, high-moisture salmon purée with taurine and kelp for finicky eaters.",
    stockQuantity: 28,
    inStock: true
  },
  {
    id: "p3",
    sku: "SKU-RAINBOWLEASH",
    name: "Rainbow Weave No-Pull Leash & Collar Set",
    category: "accessories",
    categoryLabel: "Accessories",
    pet: "dog",
    price: 24.99,
    originalPrice: 29.99,
    rating: 5,
    ratingCount: 216,
    popularity: 96,
    img: "🌈",
    imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80",
    badge: "Fan Favorite",
    badgeClass: "badge-popular",
    tintClass: "bg-teal-tint",
    desc: "High-tensile climbing rope weave with padded handle and corrosion-proof hardware.",
    stockQuantity: 50,
    inStock: true
  },
  {
    id: "p4",
    sku: "SKU-CLOUDBED",
    name: "Cloud-Comfort Donut Calming Bed",
    category: "accessories",
    categoryLabel: "Accessories",
    pet: "all",
    price: 42.00,
    originalPrice: 54.00,
    rating: 5,
    ratingCount: 312,
    popularity: 99,
    img: "🛏️",
    imageUrl: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80",
    badge: "Ultra Soft",
    badgeClass: "badge-bestseller",
    tintClass: "bg-orange-tint",
    desc: "Raised rim creates cozy security to relieve pet anxiety. Machine washable cover.",
    stockQuantity: 22,
    inStock: true
  },
  {
    id: "p5",
    sku: "SKU-DONUTBONE",
    name: "Squishy Squeak Donut & Bone Bundle",
    category: "accessories",
    categoryLabel: "Toys & Play",
    pet: "dog",
    price: 14.99,
    originalPrice: 19.99,
    rating: 4.8,
    ratingCount: 85,
    popularity: 88,
    img: "🍩",
    imageUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80",
    badge: "Super Squeak",
    badgeClass: "badge-fun",
    tintClass: "bg-coral-tint",
    desc: "Double-layer plush with puncture-resistant squeakers that keep squeaking.",
    stockQuantity: 40,
    inStock: true
  },
  {
    id: "p7-cat-collar",
    sku: "SKU-CATCOLLAR",
    name: "Velvet-Soft Breakaway Safety Collar",
    category: "accessories",
    categoryLabel: "Accessories",
    pet: "cat",
    price: 14.50,
    originalPrice: 18.00,
    rating: 4.9,
    ratingCount: 64,
    popularity: 87,
    img: "🎀",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    badge: "Safety Quick-Release",
    badgeClass: "badge-health",
    tintClass: "bg-yellow-tint",
    desc: "Gentle elastic breakaway buckle prevents snagging on outdoor adventures.",
    stockQuantity: 35,
    inStock: true
  },
  {
    id: "p6",
    sku: "SKU-SALMONOIL",
    name: "Wild Alaskan Salmon Shiny Coat Oil (16oz)",
    category: "wellness",
    categoryLabel: "Wellness",
    pet: "all",
    price: 18.50,
    originalPrice: 22.00,
    rating: 5,
    ratingCount: 174,
    popularity: 94,
    img: "🐟",
    imageUrl: "https://images.unsplash.com/photo-1608248597359-251f03473950?auto=format&fit=crop&w=600&q=80",
    badge: "Shiny Coat",
    badgeClass: "badge-health",
    tintClass: "bg-teal-tint",
    desc: "Pure cold-pressed salmon oil packed with EPA and DHA for itchy skin and shiny fur.",
    stockQuantity: 38,
    inStock: true
  },
  {
    id: "p8-broth",
    sku: "SKU-BEEFBROTH",
    name: "Slow-Simmered Beef Bone Broth Topper (16oz)",
    category: "feeds",
    categoryLabel: "Feeds & Toppers",
    pet: "all",
    price: 12.99,
    originalPrice: 15.99,
    rating: 5,
    ratingCount: 128,
    popularity: 93,
    img: "🍲",
    badge: "Hydration Hit",
    badgeClass: "badge-bestseller",
    tintClass: "bg-coral-tint",
    desc: "Rich collagen elixir simmered for 18 hours. Entices fussy eaters instantly.",
    stockQuantity: 25,
    inStock: true
  },
  {
    id: "p9-kibble-chick",
    sku: "SKU-CHICKENKIBBLE",
    name: "Free-Range Chicken & Ancient Grains (10lb)",
    category: "feeds",
    categoryLabel: "Feeds & Dry Food",
    pet: "dog",
    price: 31.50,
    originalPrice: 38.00,
    rating: 4.9,
    ratingCount: 95,
    popularity: 91,
    img: "🍗",
    badge: "Oven Baked",
    badgeClass: "badge-popular",
    tintClass: "bg-yellow-tint",
    desc: "Slow baked with chia seeds, millet, and fresh cage-free chicken.",
    stockQuantity: 20,
    inStock: true
  },
  {
    id: "p10-shampoo",
    sku: "SKU-OATSHAMPOO",
    name: "Soothing Oatmeal & Honey Dog Wash (16oz)",
    category: "grooming",
    categoryLabel: "Grooming",
    pet: "dog",
    price: 15.99,
    originalPrice: 19.99,
    rating: 4.8,
    ratingCount: 89,
    popularity: 89,
    img: "🧴",
    badge: "Tear-Free",
    badgeClass: "badge-health",
    tintClass: "bg-teal-tint",
    desc: "Plant-based hypoallergenic formula relieves itchy skin and leaves a fresh clean scent.",
    stockQuantity: 30,
    inStock: true
  },
  {
    id: "p11-brush",
    sku: "SKU-DESHEDBRUSH",
    name: "Magic-Release De-Shedding Pet Brush",
    category: "grooming",
    categoryLabel: "Grooming",
    pet: "all",
    price: 16.50,
    originalPrice: 21.00,
    rating: 4.9,
    ratingCount: 153,
    popularity: 90,
    img: "🪮",
    badge: "Easy Clean",
    badgeClass: "badge-popular",
    tintClass: "bg-orange-tint",
    desc: "Removes loose undercoat fur with one-click hair release button. Ergonomic grip.",
    stockQuantity: 40,
    inStock: true
  },
  {
    id: "p12-joint",
    sku: "SKU-JOINTCHEWS",
    name: "Hip & Joint Glucosamine Chews (90ct)",
    category: "wellness",
    categoryLabel: "Wellness",
    pet: "dog",
    price: 26.99,
    originalPrice: 32.99,
    rating: 5,
    ratingCount: 240,
    popularity: 97,
    img: "🦴",
    badge: "Vet Recommended",
    badgeClass: "badge-health",
    tintClass: "bg-coral-tint",
    desc: "With chondroitin and green-lipped mussel for senior agility and pain-free walks.",
    stockQuantity: 32,
    inStock: true
  },
  {
    id: "p13-balm",
    sku: "SKU-PAWBALM",
    name: "Organic Shea Butter Paw & Snout Balm",
    category: "grooming",
    categoryLabel: "Grooming",
    pet: "all",
    price: 11.50,
    originalPrice: 14.00,
    rating: 4.9,
    ratingCount: 78,
    popularity: 86,
    img: "🐾",
    badge: "100% Organic",
    badgeClass: "badge-new",
    tintClass: "bg-yellow-tint",
    desc: "Heals dry, cracked paw pads from hot summer sidewalks and snowy winter trails.",
    stockQuantity: 50,
    inStock: true
  },
  {
    id: "p14-catnip",
    sku: "SKU-CATTEASER",
    name: "Catnip Infused Feather Teaser Wand",
    category: "accessories",
    categoryLabel: "Toys & Play",
    pet: "cat",
    price: 9.99,
    originalPrice: 12.99,
    rating: 4.8,
    ratingCount: 67,
    popularity: 85,
    img: "🪶",
    badge: "Pounce Ready",
    badgeClass: "badge-fun",
    tintClass: "bg-teal-tint",
    desc: "Natural guinea feathers on flexible carbon rod with organic Canadian catnip bell.",
    stockQuantity: 45,
    inStock: true
  },
  {
    id: "p15-treats",
    sku: "SKU-BEEFLIVER",
    name: "Freeze-Dried Raw Beef Liver Treats (4oz)",
    category: "feeds",
    categoryLabel: "Treats & Feeds",
    pet: "all",
    price: 13.50,
    originalPrice: 16.50,
    rating: 5,
    ratingCount: 195,
    popularity: 96,
    img: "🥓",
    badge: "High Value",
    badgeClass: "badge-bestseller",
    tintClass: "bg-coral-tint",
    desc: "Single-ingredient USDA beef liver. The ultimate high-value training reward.",
    stockQuantity: 60,
    inStock: true
  }
];

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    pill: "Limited offer",
    text: "Get 15% off your order with code FIRSTPAW15 — Dispatched within 24 hours",
    link: "/shop",
    linkText: "Explore deals",
    isActive: true,
    createdAt: "2026-09-01"
  },
  {
    id: "ann-2",
    pill: "Curator sale",
    text: "Buy 2 get 1 free on single-origin chew bones and salmon bites",
    link: "/shop?cat=feeds",
    linkText: "Browse feeds",
    isActive: false,
    createdAt: "2026-09-05"
  },
  {
    id: "ann-3",
    pill: "New arrivals",
    text: "Small-batch duck stews and memory foam orthopedic beds now in stock",
    link: "/shop?cat=accessories",
    linkText: "Explore arrivals",
    isActive: false,
    createdAt: "2026-09-07"
  }
];

// Values saved by an older non-UTF-8 template can arrive as CP1252-looking
// byte sequences (for example, "ðŸ§¼"). Decode those at the display boundary
// so old cart/localStorage records render correctly without a data migration.
const CP1252_BYTES = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85],
  ['†', 0x86], ['‡', 0x87], ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a],
  ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e], ['‘', 0x91], ['’', 0x92],
  ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['˜', 0x98], ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c],
  ['ž', 0x9e], ['Ÿ', 0x9f]
]);

export function normalizeEmoji(value, fallback = '🐾') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  let repaired = value;

  // A value can be corrupted more than once (UTF-8 bytes decoded as CP1252,
  // then saved again), so allow two repair passes for legacy records.
  for (let pass = 0; pass < 2 && /[ðÃÂâ]/.test(repaired); pass += 1) {
    try {
      const bytes = Uint8Array.from(Array.from(repaired), (character) => {
        const codePoint = character.codePointAt(0);
        return codePoint <= 0xff ? codePoint : CP1252_BYTES.get(character) ?? 0x3f;
      });
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (!decoded || decoded === repaired) break;
      repaired = decoded;
    } catch (_) {
      return fallback;
    }
  }

  return repaired || fallback;
}

export function formatPeso(value) {
  const num = typeof value === "number" ? value : parseFloat(value) || 0;
  return `₱${num.toFixed(2)}`;
}

export function getCategoryLabel(category) {
  switch (category) {
    case "feeds":
      return "Feeds & Pet Food";
    case "accessories":
      return "Pet Accessories";
    case "grooming":
      return "Grooming Essentials";
    case "wellness":
      return "Health & Wellness";
    default:
      return "Pet Goodies";
  }
}

export function getCategoryTint(category) {
  switch (category) {
    case "feeds":
      return "bg-yellow-tint";
    case "accessories":
      return "bg-peach-tint";
    case "grooming":
      return "bg-teal-tint";
    case "wellness":
      return "bg-coral-tint";
    default:
      return "bg-yellow-tint";
  }
}

export function getBadgeClass(badge) {
  if (!badge) return "";
  const lower = badge.toLowerCase();
  if (lower.includes("new")) return "badge-new";
  if (lower.includes("vet") || lower.includes("health") || lower.includes("organic")) return "badge-health";
  if (lower.includes("squeak") || lower.includes("play") || lower.includes("pounce")) return "badge-fun";
  if (lower.includes("popular") || lower.includes("favorite")) return "badge-popular";
  return "badge-bestseller";
}

export function getPetLabel(pet) {
  switch (pet) {
    case "dog":
      return "🐶 Dogs";
    case "cat":
      return "🐱 Cats";
    default:
      return "🐶 & 🐱 All Pets";
  }
}

export function getOrderStatusMeta(status) {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "pending":
      return { label: "Pending", emoji: "🕒", pillClass: "status-pending", desc: "Order placed, awaiting fulfillment" };
    case "processing":
      return { label: "Processing", emoji: "📦", pillClass: "status-processing", desc: "Packing treats & goodies" };
    case "shipped":
      return { label: "Shipped", emoji: "🚚", pillClass: "status-shipped", desc: "On the way to fur baby" };
    case "delivered":
    case "completed":
      return { label: "Delivered", emoji: "🎉", pillClass: "status-delivered", desc: "Safely arrived & enjoyed" };
    case "cancelled":
      return { label: "Cancelled", emoji: "❌", pillClass: "status-cancelled", desc: "Order was cancelled" };
    default:
      return { label: status || "Confirmed", emoji: "✨", pillClass: "status-pending", desc: "Order confirmed" };
  }
}
