/**
 * PETCHUP CATALOG LOGIC (catalog.js)
 * High-performance, playful, accessible e-commerce catalog powered by Vanilla JS & Anime.js v4
 */

// ==========================================================================
// 1. DEMO PRODUCTS DATA (24 Curated Pantry Items)
// ==========================================================================
const DEMO_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Everyday Dog Food',
    category: 'feeds',
    animal: 'dog',
    size: '1 kg',
    price: 349,
    inStock: true,
    badge: 'PANTRY PICK',
    image: 'food_pouch_dog',
    imageUrl: '/images/prod_dog_food.png',
    routine: 'mealtime',
    desc: 'A simple everyday bowl.'
  },
  {
    id: 'prod-2',
    name: 'Salmon Cat Food',
    category: 'feeds',
    animal: 'cat',
    size: '800 g',
    price: 379,
    inStock: true,
    badge: 'POPULAR',
    image: 'salmon_cat_bowl',
    imageUrl: '',
    routine: 'mealtime',
    desc: 'Wild-caught salmon & wholesome grain-free crunch.'
  },
  {
    id: 'prod-3',
    name: 'Soft Rope Toy',
    category: 'play',
    animal: 'dog',
    size: 'One size',
    price: 149,
    inStock: true,
    badge: 'BESTSELLER',
    image: 'soft_rope_toy',
    imageUrl: '/images/prod_rope_toy.png',
    routine: 'playtime',
    desc: 'Durable braided natural unbleached cotton.'
  },
  {
    id: 'prod-4',
    name: 'Ceramic Pet Bowl',
    category: 'bowls',
    animal: 'all',
    size: 'Medium',
    price: 299,
    inStock: true,
    badge: null,
    image: 'ceramic_bowl',
    imageUrl: '/images/prod_ceramic_bowl.png',
    routine: 'mealtime',
    desc: 'Weighted matte stoneware bowl with paw emblem.'
  },
  {
    id: 'prod-5',
    name: 'Gentle Pet Shampoo',
    category: 'groom',
    animal: 'all',
    size: '250 ml',
    price: 229,
    inStock: true,
    badge: 'ORGANIC',
    image: 'pet_shampoo',
    imageUrl: '/images/prod_shampoo.png',
    routine: 'caretime',
    desc: 'Oatmeal & organic aloe soothing tearless wash.'
  },
  {
    id: 'prod-6',
    name: 'Treat Bites',
    category: 'treats',
    animal: 'all',
    size: '200 g',
    price: 179,
    inStock: true,
    badge: 'CRUNCHY',
    image: 'treat_bites',
    imageUrl: '',
    routine: 'mealtime',
    desc: 'Slow-baked tender beef & sweet potato cubes.'
  },
  {
    id: 'prod-7',
    name: 'Adjustable Collar',
    category: 'walk',
    animal: 'dog',
    size: 'Medium',
    price: 199,
    inStock: true,
    badge: null,
    image: 'orange_collar',
    imageUrl: '',
    routine: 'walktime',
    desc: 'Padded vibrant nylon with quick-release snap.'
  },
  {
    id: 'prod-8',
    name: 'Squeaky Ball',
    category: 'play',
    animal: 'dog',
    size: 'One size',
    price: 129,
    inStock: true,
    badge: null,
    image: 'squeaky_ball',
    imageUrl: '',
    routine: 'playtime',
    desc: 'Chew-safe textured natural rubber with high bounce.'
  },
  {
    id: 'prod-9',
    name: 'Grooming Brush',
    category: 'groom',
    animal: 'all',
    size: 'One size',
    price: 189,
    inStock: true,
    badge: null,
    image: 'grooming_brush',
    imageUrl: '',
    routine: 'caretime',
    desc: 'Ergonomic slicker brush with skin-safe coated pins.'
  },
  {
    id: 'prod-10',
    name: 'Cozy Pet Bed',
    category: 'rest',
    animal: 'all',
    size: 'Medium',
    price: 699,
    inStock: true,
    badge: 'COMFORT',
    image: 'donut_bed',
    imageUrl: '',
    routine: 'winddown',
    desc: 'Plush round calming marshmallow donut bed.'
  },
  {
    id: 'prod-11',
    name: 'Travel Water Bottle',
    category: 'walk',
    animal: 'all',
    size: '350 ml',
    price: 259,
    inStock: true,
    badge: null,
    image: 'travel_bottle',
    imageUrl: '',
    routine: 'walktime',
    desc: 'Leak-proof outdoor fold-out leaf drinking trough.'
  },
  {
    id: 'prod-12',
    name: 'Sage Classic Leash',
    category: 'walk',
    animal: 'dog',
    size: '1.5 m',
    price: 279,
    inStock: true,
    badge: null,
    image: 'sage_leash',
    imageUrl: '',
    routine: 'walktime',
    desc: 'Weather-resistant climbing-grade webbing leash.'
  },
  {
    id: 'prod-13',
    name: 'Crunchy Catnip Fish',
    category: 'play',
    animal: 'cat',
    size: 'Small',
    price: 119,
    inStock: true,
    badge: 'ORGANIC',
    image: 'catnip_fish',
    imageUrl: '',
    routine: 'playtime',
    desc: 'Stuffed with fresh fragrant organic mountain catnip.'
  },
  {
    id: 'prod-14',
    name: 'Dental Chew Sticks',
    category: 'treats',
    animal: 'dog',
    size: '150 g',
    price: 169,
    inStock: true,
    badge: 'VET PICK',
    image: 'dental_sticks',
    imageUrl: '',
    routine: 'caretime',
    desc: 'Spirulina & fresh mint plaque-fighting dental sticks.'
  },
  {
    id: 'prod-15',
    name: 'Freeze-Dried Chicken',
    category: 'treats',
    animal: 'all',
    size: '100 g',
    price: 249,
    inStock: true,
    badge: '100% MEAT',
    image: 'chicken_treats',
    imageUrl: '',
    routine: 'mealtime',
    desc: 'Single-ingredient pure protein crunch for dogs & cats.'
  },
  {
    id: 'prod-16',
    name: 'Calming Hemp Drops',
    category: 'rest',
    animal: 'all',
    size: '30 ml',
    price: 489,
    inStock: true,
    badge: 'WELLNESS',
    image: 'hemp_drops',
    imageUrl: '',
    routine: 'winddown',
    desc: 'Natural chamomile & hemp seed soothing tincture.'
  },
  {
    id: 'prod-17',
    name: 'Stainless Double Bowl',
    category: 'bowls',
    animal: 'all',
    size: 'Large',
    price: 429,
    inStock: true,
    badge: null,
    image: 'double_bowl',
    imageUrl: '',
    routine: 'mealtime',
    desc: 'Non-skid silicone base dual water & food station.'
  },
  {
    id: 'prod-18',
    name: 'Feather Wand Toy',
    category: 'play',
    animal: 'cat',
    size: '90 cm',
    price: 139,
    inStock: true,
    badge: null,
    image: 'feather_wand',
    imageUrl: '',
    routine: 'playtime',
    desc: 'Natural guinea fowl feathers on flexible carbon rod.'
  },
  {
    id: 'prod-19',
    name: 'Ear Cleaning Solution',
    category: 'groom',
    animal: 'all',
    size: '120 ml',
    price: 199,
    inStock: true,
    badge: null,
    image: 'ear_cleaner',
    imageUrl: '',
    routine: 'caretime',
    desc: 'Gentle eucalyptus ear rinse for gunk-free ears.'
  },
  {
    id: 'prod-20',
    name: 'Plant-Based Poop Bags',
    category: 'walk',
    animal: 'dog',
    size: '120 bags',
    price: 159,
    inStock: true,
    badge: 'ECO',
    image: 'poop_bags',
    imageUrl: '',
    routine: 'walktime',
    desc: 'Cornstarch certified compostable leak-proof rolls.'
  },
  {
    id: 'prod-21',
    name: 'Plush Squeaky Bone',
    category: 'play',
    animal: 'dog',
    size: 'One size',
    price: 139,
    inStock: true,
    badge: null,
    image: 'plush_bone',
    imageUrl: '',
    routine: 'playtime',
    desc: 'Soft corduroy textured bone with reinforced seams.'
  },
  {
    id: 'prod-22',
    name: 'Kitten Milk Replacer',
    category: 'feeds',
    animal: 'cat',
    size: '300 g',
    price: 389,
    inStock: false,
    badge: 'SOLD OUT',
    image: 'kitten_milk',
    imageUrl: '',
    routine: 'mealtime',
    desc: 'Complete nutrition formula for newborn nursing kittens.'
  },
  {
    id: 'prod-23',
    name: 'Orthopedic Sleep Mat',
    category: 'rest',
    animal: 'dog',
    size: 'Large',
    price: 849,
    inStock: true,
    badge: 'PREMIUM',
    image: 'memory_mat',
    imageUrl: '',
    routine: 'winddown',
    desc: 'High-density joint-relief memory foam with washable cover.'
  },
  {
    id: 'prod-24',
    name: 'Snout & Paw Balm',
    category: 'groom',
    animal: 'all',
    size: '60 g',
    price: 189,
    inStock: true,
    badge: null,
    image: 'paw_balm',
    imageUrl: '',
    routine: 'caretime',
    desc: 'Organic shea butter & beeswax protection stick.'
  }
];

// 4 Routine Demo Items shown specifically under "Shop the Routine"
const ROUTINE_PRODUCTS = [
  DEMO_PRODUCTS[7],  // Squeaky Ball (₱129)
  DEMO_PRODUCTS[8],  // Grooming Brush (₱189)
  DEMO_PRODUCTS[9],  // Cozy Pet Bed (₱699)
  DEMO_PRODUCTS[10]  // Travel Water Bottle (₱259)
];

// ==========================================================================
// 2. STATE MANAGEMENT & LOCALSTORAGE KEYS
// ==========================================================================
const STORAGE_KEY_CART = 'petchup_cart';
const STORAGE_KEY_WISHLIST = 'petchup_wishlist';

const state = {
  category: 'all',
  animal: 'all',
  maxPrice: 1000,
  inStockOnly: true,
  sort: 'featured',
  searchQuery: '',
  routine: null,
  viewMode: 'grid', // 'grid' | 'list'
  page: 1,
  pageSize: 8,
  cart: [],
  wishlist: {},
  appliedCoupon: null
};

// ==========================================================================
// 3. ANIME.JS V4 COMPATIBILITY HELPER
// ==========================================================================
function safeAnime(params) {
  // Check user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }
  
  if (window.anime && typeof window.anime.animate === 'function') {
    // Anime.js v4 API
    const { targets, ...options } = params;
    return window.anime.animate(targets, options);
  } else if (typeof window.anime === 'function') {
    // Anime.js v3 fallback
    return window.anime(params);
  }
  return null;
}

// ==========================================================================
// 4. SVG PLACEHOLDER GENERATOR (High-Fidelity Placeholders with marked spots)
// ==========================================================================
function getProductSvg(imageKey, name) {
  switch (imageKey) {
    case 'food_pouch_dog':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_dog_food.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <path d="M25 24 L32 10 L88 10 L95 24 L100 108 C100 112 96 115 90 115 L30 115 C24 115 20 112 20 108 Z" fill="#FFFFFF" stroke="#E5DCCE" stroke-width="2"/>
          <path d="M32 10 L88 10 L85 18 L35 18 Z" fill="#D6CEC5"/>
          <circle cx="60" cy="55" r="14" fill="#FF5A1F"/>
          <ellipse cx="60" cy="56" rx="4" ry="5" fill="#FFFFFF"/>
          <circle cx="54" cy="50" r="2" fill="#FFFFFF"/>
          <circle cx="66" cy="50" r="2" fill="#FFFFFF"/>
          <text x="60" y="85" text-anchor="middle" font-size="9" font-family="'Outfit', sans-serif" font-weight="900" fill="#232220">GOOD FOOD</text>
        </svg>`;

    case 'salmon_cat_bowl':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_cat_salmon.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <ellipse cx="60" cy="85" rx="46" ry="14" fill="#3B1F3F" fill-opacity="0.12"/>
          <path d="M18 55 C18 80 34 88 60 88 C86 88 102 80 102 55 L98 42 C98 32 80 32 60 32 C40 32 22 32 22 42 Z" fill="#FBF8F2" stroke="#E6DCCE" stroke-width="2"/>
          <ellipse cx="60" cy="45" rx="36" ry="12" fill="#6B3A1C"/>
          <!-- Salmon piece -->
          <polygon points="70,38 92,45 80,56 62,48" fill="#FF7F50" stroke="#E05A32" stroke-width="1.5"/>
          <line x1="72" y1="44" x2="82" y2="48" stroke="#FFFFFF" stroke-width="1.5"/>
        </svg>`;

    case 'soft_rope_toy':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_rope_toy.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <path d="M22 60 Q60 35 98 60" stroke="#FF5A1F" stroke-width="14" stroke-linecap="round" stroke-dasharray="6 5"/>
          <path d="M22 60 Q60 35 98 60" stroke="#FFF1E0" stroke-width="7" stroke-linecap="round" stroke-dasharray="7 7"/>
          <path d="M22 60 L10 50 M22 60 L6 62 M22 60 L12 72" stroke="#FF5A1F" stroke-width="3" stroke-linecap="round"/>
          <path d="M98 60 L110 50 M98 60 L114 62 M98 60 L108 72" stroke="#FF5A1F" stroke-width="3" stroke-linecap="round"/>
        </svg>`;

    case 'ceramic_bowl':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_ceramic_bowl.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <ellipse cx="60" cy="85" rx="46" ry="12" fill="#3B1F3F" fill-opacity="0.1"/>
          <path d="M18 55 C18 78 34 86 60 86 C86 86 102 78 102 55 L98 42 C98 32 80 32 60 32 C40 32 22 32 22 42 Z" fill="#F4EFE6" stroke="#DCD3C5" stroke-width="2"/>
          <circle cx="60" cy="68" r="4" fill="#FF5A1F"/>
          <circle cx="56" cy="63" r="1.5" fill="#FF5A1F"/>
          <circle cx="64" cy="63" r="1.5" fill="#FF5A1F"/>
        </svg>`;

    case 'pet_shampoo':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_shampoo.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <!-- Pump top -->
          <path d="M48 22 L60 22 L60 32 L54 32" stroke="#B0A695" stroke-width="3" stroke-linecap="round" fill="none"/>
          <rect x="52" y="32" width="16" height="8" rx="2" fill="#FFFFFF" stroke="#D1C7BA" stroke-width="1.5"/>
          <!-- Bottle body -->
          <path d="M42 42 C42 38 48 38 60 38 C72 38 78 38 78 42 L80 102 C80 106 75 108 60 108 C45 108 40 106 40 102 Z" fill="#FFFFFF" stroke="#E0D7CB" stroke-width="2"/>
          <circle cx="60" cy="72" r="6" fill="#FF5A1F"/>
          <circle cx="56" cy="65" r="2" fill="#FF5A1F"/>
          <circle cx="64" cy="65" r="2" fill="#FF5A1F"/>
        </svg>`;

    case 'treat_bites':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_treat_bites.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <rect x="35" y="25" width="50" height="70" rx="4" fill="#FFFFFF" stroke="#E0D7CB" stroke-width="2"/>
          <rect x="35" y="25" width="50" height="10" fill="#FFD966"/>
          <!-- Treat nuggets -->
          <rect x="25" y="85" width="16" height="14" rx="3" fill="#8B4513" transform="rotate(12 33 92)"/>
          <rect x="80" y="82" width="16" height="14" rx="3" fill="#8B4513" transform="rotate(-15 88 89)"/>
          <rect x="50" y="90" width="18" height="14" rx="3" fill="#A0522D"/>
        </svg>`;

    case 'orange_collar':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_orange_collar.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <ellipse cx="60" cy="60" rx="42" ry="24" stroke="#FF5A1F" stroke-width="12" fill="none"/>
          <rect x="75" y="52" width="14" height="16" rx="3" fill="#232220"/>
          <circle cx="45" cy="78" r="5" fill="#D1D5DB" stroke="#9CA3AF" stroke-width="1.5"/>
        </svg>`;

    case 'squeaky_ball':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_squeaky_ball.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <circle cx="60" cy="60" r="34" fill="#FF5A1F"/>
          <ellipse cx="60" cy="60" rx="16" ry="34" stroke="#E04812" stroke-width="2" fill="none"/>
          <ellipse cx="60" cy="60" rx="34" ry="16" stroke="#E04812" stroke-width="2" fill="none"/>
          <circle cx="48" cy="48" r="4" fill="#FFFFFF" fill-opacity="0.3"/>
        </svg>`;

    case 'grooming_brush':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_grooming_brush.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <rect x="25" y="20" width="50" height="40" rx="8" transform="rotate(18 50 40)" fill="#232220"/>
          <rect x="30" y="24" width="40" height="32" rx="4" transform="rotate(18 50 40)" fill="#4B5563"/>
          <rect x="52" y="62" width="12" height="42" rx="6" transform="rotate(18 58 83)" fill="#FF5A1F"/>
          <rect x="54" y="70" width="8" height="24" rx="4" transform="rotate(18 58 82)" fill="#232220"/>
        </svg>`;

    case 'donut_bed':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_donut_bed.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <ellipse cx="60" cy="74" rx="46" ry="22" fill="#3B1F3F" fill-opacity="0.12"/>
          <ellipse cx="60" cy="62" rx="44" ry="24" fill="#C9B19C"/>
          <ellipse cx="60" cy="58" rx="40" ry="20" fill="#E2D4C5"/>
          <ellipse cx="60" cy="62" rx="22" ry="10" fill="#A48C77"/>
        </svg>`;

    case 'travel_bottle':
      return `<!-- IMAGE PLACEHOLDER: Swap with <img src="/images/prod_travel_bottle.png" alt="${name}"> -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <rect x="44" y="38" width="32" height="66" rx="8" fill="#7E9675"/>
          <path d="M44 38 C44 26 76 26 76 38 Z" fill="#688062"/>
          <rect x="54" y="16" width="12" height="12" rx="3" fill="#D1D5DB"/>
        </svg>`;

    default:
      return `<!-- IMAGE PLACEHOLDER: Swap with real photo -->
        <svg viewBox="0 0 120 120" class="product-thumb-svg" fill="none">
          <circle cx="60" cy="60" r="44" fill="#FFF6EC"/>
          <g transform="translate(42, 42) scale(1.5)" fill="#FF5A1F">
            <ellipse cx="6.5" cy="8.5" rx="2.4" ry="3.4"/>
            <ellipse cx="17.5" cy="8.5" rx="2.4" ry="3.4"/>
            <ellipse cx="10" cy="5" rx="2.2" ry="3.1"/>
            <ellipse cx="14" cy="5" rx="2.2" ry="3.1"/>
            <path d="M12 10.5 C8.5 10.5 6.2 13.5 6.7 17.2 C7.1 19.8 9.5 21.2 12 21.2 C14.5 21.2 16.9 19.8 17.3 17.2 C17.8 13.5 15.5 10.5 12 10.5 Z"/>
          </g>
        </svg>`;
  }
}

// ==========================================================================
// 5. LOCALSTORAGE HELPERS (Persisting Cart & Wishlist)
// ==========================================================================
function loadPersistedCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CART);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Unable to load cart from localStorage:', err);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  } catch (err) {
    console.warn('Unable to save cart to localStorage:', err);
  }
  updateHeaderCartCount();
  renderCartDrawer();
}

function loadPersistedWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WISHLIST);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function saveWishlist(wishlist) {
  try {
    localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(wishlist));
  } catch (err) {
    console.warn('Unable to save wishlist:', err);
  }
}

// ==========================================================================
// 6. URL QUERY PARAMETERS SYNC
// ==========================================================================
function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('category')) state.category = params.get('category').toLowerCase();
  if (params.has('cat')) state.category = params.get('cat').toLowerCase();
  if (params.has('animal')) state.animal = params.get('animal').toLowerCase();
  if (params.has('pet')) state.animal = params.get('pet').toLowerCase();
  if (params.has('maxPrice')) state.maxPrice = Number(params.get('maxPrice')) || 1000;
  if (params.has('instock')) state.inStockOnly = params.get('instock') === 'true';
  if (params.has('sort')) state.sort = params.get('sort');
  if (params.has('q')) state.searchQuery = params.get('q');
  if (params.has('routine')) state.routine = params.get('routine');
}

function updateUrlParams() {
  const params = new URLSearchParams();
  if (state.category !== 'all') params.set('category', state.category);
  if (state.animal !== 'all') params.set('animal', state.animal);
  if (state.maxPrice < 1000) params.set('maxPrice', state.maxPrice);
  if (!state.inStockOnly) params.set('instock', 'false');
  if (state.sort !== 'featured') params.set('sort', state.sort);
  if (state.searchQuery.trim()) params.set('q', state.searchQuery.trim());
  if (state.routine) params.set('routine', state.routine);

  const queryStr = params.toString();
  const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}

// ==========================================================================
// 7. TOAST NOTIFICATION SYSTEM
// ==========================================================================
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'pantry-toast';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

// ==========================================================================
// 8. ADD TO CART & FLYING PAW ANIMATION
// ==========================================================================
function addToCart(product, buttonElement = null) {
  const existing = state.cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      size: product.size,
      img: '🐾',
      imageUrl: product.imageUrl || '',
      qty: 1
    });
  }

  saveCart(state.cart);

  // Flying Paw animation
  if (buttonElement) {
    animateFlyingPaw(buttonElement);
  }

  // Cart Bump
  triggerCartBump();

  // Toast
  showToast(`🐾 Added <strong>${product.name}</strong> to your pantry cart!`);
}

function animateFlyingPaw(fromElement) {
  const flyingPaw = document.getElementById('flyingPaw');
  const targetCart = document.getElementById('headerCartBtn');
  if (!flyingPaw || !targetCart) return;

  const startRect = fromElement.getBoundingClientRect();
  const endRect = targetCart.getBoundingClientRect();

  flyingPaw.style.display = 'block';
  flyingPaw.style.left = `${startRect.left + startRect.width / 2}px`;
  flyingPaw.style.top = `${startRect.top + startRect.height / 2}px`;
  flyingPaw.style.opacity = '1';
  flyingPaw.style.transform = 'translate(-50%, -50%) scale(1)';

  safeAnime({
    targets: flyingPaw,
    left: endRect.left + endRect.width / 2,
    top: endRect.top + endRect.height / 2,
    scale: [1, 1.6, 0.4],
    rotate: [0, 45, 90],
    opacity: [1, 1, 0],
    duration: 650,
    easing: 'easeInQuad',
    complete: () => {
      flyingPaw.style.display = 'none';
    }
  });
}

function triggerCartBump() {
  const cartBtn = document.getElementById('headerCartBtn');
  if (!cartBtn) return;
  cartBtn.classList.remove('cart-bump');
  void cartBtn.offsetWidth; // force reflow
  cartBtn.classList.add('cart-bump');
}

function updateHeaderCartCount() {
  const countBadge = document.getElementById('headerCartCount');
  const drawerPill = document.getElementById('drawerCartCountPill');
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);

  if (countBadge) countBadge.textContent = totalCount;
  if (drawerPill) drawerPill.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
}

// ==========================================================================
// 9. WISHLIST HEART & HEARTS BURST
// ==========================================================================
function toggleWishlist(productId, heartButtonElement) {
  state.wishlist[productId] = !state.wishlist[productId];
  saveWishlist(state.wishlist);

  const isFav = !!state.wishlist[productId];
  if (heartButtonElement) {
    heartButtonElement.classList.toggle('is-fav', isFav);
    
    // Animate heart
    safeAnime({
      targets: heartButtonElement,
      scale: [1, 1.35, 1],
      duration: 350,
      easing: 'spring(1, 80, 10, 0)'
    });

    if (isFav) {
      spawnHeartsBurst(heartButtonElement);
      showToast(`❤️ Saved to your wishlist!`);
    } else {
      showToast(`Removed from wishlist.`);
    }
  }
}

function spawnHeartsBurst(originEl) {
  const rect = originEl.getBoundingClientRect();
  const emojis = ['❤️', '🐾', '✨', '🧡'];

  for (let i = 0; i < 6; i++) {
    const burst = document.createElement('div');
    burst.className = 'burst-heart';
    burst.textContent = emojis[i % emojis.length];
    burst.style.left = `${rect.left + rect.width / 2}px`;
    burst.style.top = `${rect.top + rect.height / 2}px`;

    const angle = (i / 6) * Math.PI * 2;
    const distance = 35 + Math.random() * 25;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 20;

    burst.style.setProperty('--dx', `${dx}px`);
    burst.style.setProperty('--dy', `${dy}px`);

    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 850);
  }
}

// ==========================================================================
// 10. PRODUCT FILTERING & SORTING ENGINE
// ==========================================================================
function getFilteredProducts() {
  return DEMO_PRODUCTS.filter(item => {
    // Category filter
    if (state.category !== 'all' && item.category !== state.category) {
      return false;
    }

    // Animal filter
    if (state.animal !== 'all') {
      if (item.animal !== state.animal && item.animal !== 'all') {
        return false;
      }
    }

    // Price range
    if (item.price > state.maxPrice) {
      return false;
    }

    // In-stock
    if (state.inStockOnly && !item.inStock) {
      return false;
    }

    // Routine filter
    if (state.routine && item.routine !== state.routine) {
      return false;
    }

    // Search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchDesc = item.desc ? item.desc.toLowerCase().includes(q) : false;
      if (!matchName && !matchCat && !matchDesc) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (state.sort === 'price-low') return a.price - b.price;
    if (state.sort === 'price-high') return b.price - a.price;
    if (state.sort === 'name-az') return a.name.localeCompare(b.name);
    // 'featured'
    return 0;
  });
}

// ==========================================================================
// 11. BENTO GRID & CARD RENDERING
// ==========================================================================
function renderProductGrid() {
  const container = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const countLabel = document.getElementById('toolbarProductCount');
  const categoryHeading = document.getElementById('toolbarCategoryTitle');
  if (!container) return;

  const filtered = getFilteredProducts();

  // Update live counts
  if (countLabel) countLabel.textContent = `${filtered.length} demo product${filtered.length === 1 ? '' : 's'}`;
  if (categoryHeading) {
    categoryHeading.textContent = state.category === 'all' ? 'All goods' : state.category;
  }

  // Handle Empty State
  if (filtered.length === 0) {
    container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    renderPagination(0);
    return;
  } else {
    container.style.display = state.viewMode === 'grid' ? 'grid' : 'flex';
    if (emptyState) emptyState.style.display = 'none';
  }

  // Pagination Slice
  const totalPages = Math.ceil(filtered.length / state.pageSize) || 1;
  if (state.page > totalPages) state.page = 1;

  const startIndex = (state.page - 1) * state.pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + state.pageSize);

  renderPagination(totalPages);

  // Build Bento Layout Cards
  let html = '';

  pageItems.forEach((item, index) => {
    const isFav = !!state.wishlist[item.id];
    const isFirstFeatured = (state.page === 1 && index === 0 && state.viewMode === 'grid');

    if (isFirstFeatured) {
      // 1. Large Featured Card ("Everyday Dog Food" style)
      html += `
        <article class="product-card-featured" data-id="${item.id}">
          <div class="featured-card-header">
            ${item.badge ? `<span class="featured-card-badge">${item.badge}</span>` : ''}
            <h3 class="featured-card-title">${item.name}</h3>
            <div class="featured-card-size">${item.size}</div>
            <div class="featured-card-price">₱${item.price}</div>
            <p class="featured-card-desc">${item.desc}</p>
          </div>

          <div class="featured-card-visual">
            <div class="featured-hero-img-wrap">
              <img src="/images/banner_puppy_hd.jpg" alt="${item.name}" class="featured-hero-img" onerror="this.src='/images/prod_dog_food.png'">
            </div>
          </div>

          <div class="featured-card-footer">
            <button type="button" class="featured-add-cart-btn" data-action="add-cart" data-id="${item.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span>Add to cart</span>
            </button>
          </div>

          <div class="card-top-actions">
            <button type="button" class="card-heart-btn ${isFav ? 'is-fav' : ''}" data-action="toggle-fav" data-id="${item.id}" aria-label="Favorite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>
        </article>
      `;
    } else {
      // 2. Regular Product Card
      html += `
        <article class="product-card" data-id="${item.id}">
          <div class="card-top-actions">
            <button type="button" class="card-heart-btn ${isFav ? 'is-fav' : ''}" data-action="toggle-fav" data-id="${item.id}" aria-label="Favorite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>

          ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}

          <div class="product-card-thumb-frame">
            ${item.imageUrl 
              ? `<img src="${item.imageUrl}" alt="${item.name}" class="product-thumb-img" loading="lazy">`
              : getProductSvg(item.image, item.name)
            }
          </div>

          <div class="product-card-info">
            <span class="product-card-category">${item.category}</span>
            <h4 class="product-card-name">${item.name}</h4>
            <div class="product-card-size">${item.size}</div>
          </div>

          <div class="product-card-footer">
            <span class="product-card-price">₱${item.price}</span>
            <button type="button" class="card-round-add-btn" data-action="add-cart" data-id="${item.id}" aria-label="Add ${item.name} to cart" title="Add to cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </button>
          </div>
        </article>
      `;
    }

    // In Bento Grid on Page 1: Insert Promo Banner after card 2
    if (state.page === 1 && state.viewMode === 'grid' && index === 2) {
      html += `
        <div class="bento-promo-banner" aria-label="Special Feeding Promo">
          <div class="bento-promo-content">
            <h3 class="bento-promo-title">A better bowl starts here.</h3>
            <p class="bento-promo-sub">Good food. Happier days.</p>
            <button type="button" class="bento-promo-link" data-nav-category="feeds">
              Shop feeding &rarr;
            </button>
          </div>
          <div class="bento-promo-visual">
            <svg viewBox="0 0 160 120" class="promo-cat-bowl-svg" fill="none">
              <!-- Tuxedo Cat silhouette -->
              <ellipse cx="110" cy="90" rx="36" ry="18" fill="#3B1F3F" fill-opacity="0.12"/>
              <ellipse cx="110" cy="70" rx="30" ry="24" fill="#232220"/>
              <ellipse cx="110" cy="74" rx="14" ry="16" fill="#FFFFFF"/>
              <!-- Cat Ears -->
              <polygon points="90,52 86,30 102,44" fill="#232220"/>
              <polygon points="120,44 136,30 132,52" fill="#232220"/>
              <!-- Ceramic bowl in front -->
              <ellipse cx="50" cy="95" rx="32" ry="10" fill="#3B1F3F" fill-opacity="0.1"/>
              <path d="M22 75 C22 92 34 98 52 98 C70 98 82 92 82 75 L80 66 C80 58 66 58 52 58 C38 58 24 58 24 66 Z" fill="#FBF8F2" stroke="#E6DCCE" stroke-width="2"/>
              <circle cx="52" cy="85" r="3" fill="#FF5A1F"/>
            </svg>
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;

  // Stagger animation on cards
  safeAnime({
    targets: container.querySelectorAll('.product-card, .product-card-featured, .bento-promo-banner'),
    translateY: [16, 0],
    opacity: [0, 1],
    delay: (el, i) => i * 45,
    easing: 'easeOutQuad',
    duration: 400
  });

  attachCardEventListeners();
}

function attachCardEventListeners() {
  const container = document.getElementById('productsGrid');
  if (!container) return;

  // Add to cart buttons
  container.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const prod = DEMO_PRODUCTS.find(p => p.id === id);
      if (prod) addToCart(prod, btn);
    });
  });

  // Toggle favorite wishlist buttons
  container.querySelectorAll('[data-action="toggle-fav"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      toggleWishlist(id, btn);
    });
  });

  // Promo link button inside bento
  container.querySelectorAll('[data-nav-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-nav-category');
      setCategoryFilter(cat);
      scrollToGridTop();
    });
  });
}

// Render "Shop the Routine" Row of 4 Products
function renderRoutineProductsRow() {
  const row = document.getElementById('routineProductsRow');
  if (!row) return;

  let html = '';
  ROUTINE_PRODUCTS.forEach(item => {
    const isFav = !!state.wishlist[item.id];
    html += `
      <article class="product-card" data-id="${item.id}">
        <div class="card-top-actions">
          <button type="button" class="card-heart-btn ${isFav ? 'is-fav' : ''}" data-action="toggle-fav" data-id="${item.id}" aria-label="Favorite">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
        <div class="product-card-thumb-frame">
          ${item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.name}" class="product-thumb-img" loading="lazy">`
            : getProductSvg(item.image, item.name)
          }
        </div>
        <div class="product-card-info">
          <span class="product-card-category">${item.category}</span>
          <h4 class="product-card-name">${item.name}</h4>
          <div class="product-card-size">${item.size}</div>
        </div>
        <div class="product-card-footer">
          <span class="product-card-price">₱${item.price}</span>
          <button type="button" class="card-round-add-btn" data-action="add-cart" data-id="${item.id}" aria-label="Add ${item.name} to cart" title="Add to cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
        </div>
      </article>
    `;
  });

  row.innerHTML = html;

  row.querySelectorAll('[data-action="add-cart"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prod = DEMO_PRODUCTS.find(p => p.id === btn.getAttribute('data-id'));
      if (prod) addToCart(prod, btn);
    });
  });

  row.querySelectorAll('[data-action="toggle-fav"]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleWishlist(btn.getAttribute('data-id'), btn);
    });
  });
}

// ==========================================================================
// 12. PAGINATION CONTROLS
// ==========================================================================
function renderPagination(totalPages) {
  const counter = document.getElementById('pageCounterText');
  const fill = document.getElementById('paginationProgressFill');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  const currentPage = state.page;
  const maxPages = Math.max(1, totalPages);

  if (counter) {
    counter.textContent = `${String(currentPage).padStart(2, '0')} / ${String(maxPages).padStart(2, '0')}`;
  }

  if (fill) {
    const pct = (currentPage / maxPages) * 100;
    fill.style.width = `${pct}%`;
  }

  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= maxPages;
}

function scrollToGridTop() {
  const target = document.getElementById('catalog-shelves');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

// ==========================================================================
// 13. FILTER HANDLERS (Chips, Marquee, Drawer, Routine, View Mode)
// ==========================================================================
function setCategoryFilter(category) {
  state.category = category;
  state.page = 1;
  state.routine = null;

  // Update marquee items active status
  document.querySelectorAll('.marquee-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-category') === category);
  });

  // Update Drawer checklist
  document.querySelectorAll('#categoryChecklist input[name="cat"]').forEach(input => {
    input.checked = category === 'all' ? false : input.value === category;
  });

  updateUrlParams();
  renderProductGrid();
}

function updateActiveFiltersBadge() {
  let count = 0;
  if (state.category !== 'all') count++;
  if (state.animal !== 'all') count++;
  if (state.maxPrice < 1000) count++;
  if (state.inStockOnly) count++;
  if (state.routine) count++;

  const badge = document.getElementById('activeFiltersBadge');
  const summary = document.getElementById('filtersSummaryText');

  if (badge) badge.textContent = count;
  if (summary) summary.textContent = `${count} active filter${count === 1 ? '' : 's'}`;
}

// ==========================================================================
// 14. CART DRAWER RENDERING & LOGIC
// ==========================================================================
function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }
}

function renderCartDrawer() {
  const body = document.getElementById('cartDrawerBody');
  const subtotalEl = document.getElementById('cartSubtotalAmount');
  if (!body) return;

  if (state.cart.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--cat-muted);">
        <div style="font-size: 44px; margin-bottom: 12px;">🐾</div>
        <h4 style="font-family: var(--font-cat-display); font-size: 18px; color: var(--cat-ink); margin: 0 0 6px;">Your pantry cart is empty!</h4>
        <p style="font-size: 13.5px; margin: 0 0 16px;">Pick some healthy treats to make tails wag.</p>
        <button type="button" class="empty-reset-btn" onclick="document.getElementById('closeCartBtn').click()">Browse pantry</button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '₱0';
    return;
  }

  let html = '';
  let subtotal = 0;

  state.cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    html += `
      <div class="cart-item-row" data-id="${item.id}">
        <div class="cart-item-thumb">
          ${item.imageUrl 
            ? `<img src="${item.imageUrl}" alt="${item.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
            : `<span style="font-size: 24px;">${item.img || '🐾'}</span>`
          }
        </div>
        <div class="cart-item-info">
          <h5 class="cart-item-name">${item.name}</h5>
          ${item.size ? `<div class="cart-item-unit">${item.size}</div>` : ''}
          <div class="cart-item-price">₱${item.price} &times; ${item.qty}</div>
        </div>
        <div class="cart-item-actions">
          <button type="button" class="qty-control-btn" data-action="dec-qty" data-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
          <span class="qty-number">${item.qty}</span>
          <button type="button" class="qty-control-btn" data-action="inc-qty" data-id="${item.id}" aria-label="Increase quantity">&plus;</button>
          <button type="button" class="cart-item-remove-btn" data-action="remove-item" data-id="${item.id}" aria-label="Remove item">&times;</button>
        </div>
      </div>
    `;
  });

  body.innerHTML = html;

  // Apply Coupon discount if present
  let finalSubtotal = subtotal;
  if (state.appliedCoupon === 'PETCHUP10') {
    finalSubtotal = Math.round(subtotal * 0.9);
  }

  if (subtotalEl) {
    if (state.appliedCoupon) {
      subtotalEl.innerHTML = `<s style="font-size: 16px; color: #A8A29E;">₱${subtotal}</s> ₱${finalSubtotal}`;
    } else {
      subtotalEl.textContent = `₱${finalSubtotal}`;
    }
  }

  // Cart item events
  body.querySelectorAll('[data-action="dec-qty"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = state.cart.find(i => i.id === id);
      if (item) {
        if (item.qty > 1) {
          item.qty -= 1;
        } else {
          state.cart = state.cart.filter(i => i.id !== id);
        }
        saveCart(state.cart);
      }
    });
  });

  body.querySelectorAll('[data-action="inc-qty"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = state.cart.find(i => i.id === id);
      if (item) {
        item.qty += 1;
        saveCart(state.cart);
      }
    });
  });

  body.querySelectorAll('[data-action="remove-item"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      state.cart = state.cart.filter(i => i.id !== id);
      saveCart(state.cart);
    });
  });
}

// ==========================================================================
// 15. DESKTOP PAW-PRINT CURSOR TRAIL
// ==========================================================================
function initPawCursorTrail() {
  const canvas = document.getElementById('paw-cursor-canvas');
  if (!canvas || window.innerWidth < 1024) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let lastX = 0;
  let lastY = 0;
  let throttle = false;

  window.addEventListener('mousemove', (e) => {
    if (throttle) return;
    const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    if (dist < 42) return; // Only spawn every 42px of movement

    lastX = e.clientX;
    lastY = e.clientY;
    throttle = true;
    setTimeout(() => { throttle = false; }, 80);

    const paw = document.createElement('div');
    paw.className = 'trail-paw';
    paw.textContent = '🐾';
    paw.style.left = `${e.clientX}px`;
    paw.style.top = `${e.clientY}px`;
    paw.style.color = Math.random() > 0.5 ? '#FF5A1F' : '#3B1F3F';
    paw.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 40 - 20}deg) scale(0.9)`;

    canvas.appendChild(paw);

    setTimeout(() => {
      paw.style.opacity = '0';
      paw.style.transform = `translate(-50%, -50%) scale(0.4)`;
      setTimeout(() => paw.remove(), 800);
    }, 450);
  });
}

// ==========================================================================
// 16. HEADLINE & LOAD ANIMATIONS
// ==========================================================================
function initOnLoadAnimations() {
  // Stagger letters or title bounce
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    safeAnime({
      targets: heroTitle.children,
      translateY: [24, 0],
      opacity: [0, 1],
      easing: 'spring(1, 80, 12, 0)',
      delay: (el, i) => 150 + i * 120,
      duration: 700
    });
  }

  // Hero Still Life Items Float In
  safeAnime({
    targets: '.peach-stage-card .still-item',
    scale: [0.85, 1],
    opacity: [0, 1],
    translateY: [15, 0],
    delay: (el, i) => 250 + i * 80,
    easing: 'easeOutQuad',
    duration: 600
  });

  // Continuous bobbing animation on still life items
  safeAnime({
    targets: '[data-bob="pouch"]',
    translateY: [-4, 4],
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    duration: 2600
  });

  safeAnime({
    targets: '[data-bob="bowl"]',
    translateY: [2, -3],
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    duration: 3100
  });

  safeAnime({
    targets: '[data-bob="brush"]',
    rotate: [13, 17],
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
    duration: 2200
  });
}

// ==========================================================================
// 17. INITIALIZATION & EVENT LISTENERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Load persisted data & URL parameters
  state.cart = loadPersistedCart();
  state.wishlist = loadPersistedWishlist();
  readUrlParams();

  // 2. Initialize Views & Headers
  updateHeaderCartCount();
  renderCartDrawer();
  updateActiveFiltersBadge();

  // 3. Render Product Grids
  renderProductGrid();
  renderRoutineProductsRow();

  // 4. Smooth scroll on "Browse the shelves"
  const browseBtn = document.getElementById('browseShelvesBtn');
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToGridTop();
    });
  }

  // 5. Marquee category items click
  document.querySelectorAll('.marquee-item').forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.getAttribute('data-category');
      setCategoryFilter(cat);
      scrollToGridTop();
    });
  });

  // 6. Filter Chips
  const chipDog = document.getElementById('chipDog');
  const chipCat = document.getElementById('chipCat');
  const chipUnder500 = document.getElementById('chipUnder500');
  const chipAvailable = document.getElementById('chipAvailable');

  if (chipDog) {
    chipDog.addEventListener('click', () => {
      state.animal = state.animal === 'dog' ? 'all' : 'dog';
      chipDog.classList.toggle('is-active', state.animal === 'dog');
      if (chipCat) chipCat.classList.remove('is-active');
      state.page = 1;
      updateUrlParams();
      renderProductGrid();
      updateActiveFiltersBadge();
    });
  }

  if (chipCat) {
    chipCat.addEventListener('click', () => {
      state.animal = state.animal === 'cat' ? 'all' : 'cat';
      chipCat.classList.toggle('is-active', state.animal === 'cat');
      if (chipDog) chipDog.classList.remove('is-active');
      state.page = 1;
      updateUrlParams();
      renderProductGrid();
      updateActiveFiltersBadge();
    });
  }

  if (chipUnder500) {
    chipUnder500.addEventListener('click', () => {
      state.maxPrice = state.maxPrice === 500 ? 1000 : 500;
      chipUnder500.classList.toggle('is-active', state.maxPrice === 500);
      const slider = document.getElementById('priceRangeSlider');
      const disp = document.getElementById('priceDisplay');
      if (slider) slider.value = state.maxPrice;
      if (disp) disp.textContent = `₱${state.maxPrice}`;
      state.page = 1;
      updateUrlParams();
      renderProductGrid();
      updateActiveFiltersBadge();
    });
  }

  if (chipAvailable) {
    chipAvailable.addEventListener('click', () => {
      state.inStockOnly = !state.inStockOnly;
      chipAvailable.classList.toggle('is-active', state.inStockOnly);
      const stockCheck = document.getElementById('drawerInStockCheck');
      if (stockCheck) stockCheck.checked = state.inStockOnly;
      state.page = 1;
      updateUrlParams();
      renderProductGrid();
      updateActiveFiltersBadge();
    });
  }

  // 7. Filters Drawer Panel
  const openFiltersBtn = document.getElementById('openFiltersPanelBtn');
  const closeFiltersBtn = document.getElementById('closeFiltersBtn');
  const filtersDrawer = document.getElementById('filtersPanelDrawer');
  const filtersBackdrop = document.getElementById('filtersBackdrop');

  const openDrawer = () => {
    filtersDrawer.classList.add('is-open');
    filtersBackdrop.classList.add('is-open');
    filtersDrawer.setAttribute('aria-hidden', 'false');
  };

  const closeDrawer = () => {
    filtersDrawer.classList.remove('is-open');
    filtersBackdrop.classList.remove('is-open');
    filtersDrawer.setAttribute('aria-hidden', 'true');
  };

  if (openFiltersBtn) openFiltersBtn.addEventListener('click', openDrawer);
  if (closeFiltersBtn) closeFiltersBtn.addEventListener('click', closeDrawer);
  if (filtersBackdrop) filtersBackdrop.addEventListener('click', closeDrawer);

  // Price Slider inside Drawer
  const priceSlider = document.getElementById('priceRangeSlider');
  const priceDisplay = document.getElementById('priceDisplay');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      state.maxPrice = val;
      priceDisplay.textContent = `₱${val}`;
      if (chipUnder500) chipUnder500.classList.toggle('is-active', val <= 500);
    });
  }

  // Animal Radios inside Drawer
  document.querySelectorAll('#animalRadioPills .animal-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#animalRadioPills .animal-pill-btn').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.animal = btn.getAttribute('data-animal');
      if (chipDog) chipDog.classList.toggle('is-active', state.animal === 'dog');
      if (chipCat) chipCat.classList.toggle('is-active', state.animal === 'cat');
    });
  });

  // Drawer Apply Button
  const drawerApplyBtn = document.getElementById('drawerApplyBtn');
  if (drawerApplyBtn) {
    drawerApplyBtn.addEventListener('click', () => {
      // Check category checkboxes
      const checkedCats = Array.from(document.querySelectorAll('#categoryChecklist input[name="cat"]:checked')).map(i => i.value);
      if (checkedCats.length === 1) {
        state.category = checkedCats[0];
      } else if (checkedCats.length > 1) {
        state.category = checkedCats[0]; // Primary filter
      } else {
        state.category = 'all';
      }

      const stockCheck = document.getElementById('drawerInStockCheck');
      if (stockCheck) {
        state.inStockOnly = stockCheck.checked;
        if (chipAvailable) chipAvailable.classList.toggle('is-active', state.inStockOnly);
      }

      state.page = 1;
      updateUrlParams();
      renderProductGrid();
      updateActiveFiltersBadge();
      closeDrawer();
      scrollToGridTop();
    });
  }

  // Drawer Clear All Button
  const drawerClearBtn = document.getElementById('drawerClearBtn');
  const emptyResetBtn = document.getElementById('emptyResetBtn');
  const resetAllFilters = () => {
    state.category = 'all';
    state.animal = 'all';
    state.maxPrice = 1000;
    state.inStockOnly = false;
    state.routine = null;
    state.searchQuery = '';
    state.page = 1;

    // Reset controls
    if (priceSlider) priceSlider.value = 1000;
    if (priceDisplay) priceDisplay.textContent = '₱1,000';
    if (chipDog) chipDog.classList.remove('is-active');
    if (chipCat) chipCat.classList.remove('is-active');
    if (chipUnder500) chipUnder500.classList.remove('is-active');
    if (chipAvailable) chipAvailable.classList.remove('is-active');
    document.querySelectorAll('#categoryChecklist input').forEach(c => c.checked = false);
    document.querySelectorAll('#animalRadioPills .animal-pill-btn').forEach(b => {
      b.classList.toggle('is-selected', b.getAttribute('data-animal') === 'all');
    });

    updateUrlParams();
    renderProductGrid();
    updateActiveFiltersBadge();
  };

  if (drawerClearBtn) drawerClearBtn.addEventListener('click', () => { resetAllFilters(); closeDrawer(); });
  if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAllFilters);

  // 8. Sort Select
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.value = state.sort;
    sortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      updateUrlParams();
      renderProductGrid();
    });
  }

  // 9. View Mode (Grid vs List)
  const viewGridBtn = document.getElementById('viewGridBtn');
  const viewListBtn = document.getElementById('viewListBtn');
  const gridContainer = document.getElementById('productsGrid');

  if (viewGridBtn && viewListBtn && gridContainer) {
    viewGridBtn.addEventListener('click', () => {
      state.viewMode = 'grid';
      viewGridBtn.classList.add('is-active');
      viewListBtn.classList.remove('is-active');
      gridContainer.setAttribute('data-view', 'grid');
      renderProductGrid();
    });

    viewListBtn.addEventListener('click', () => {
      state.viewMode = 'list';
      viewListBtn.classList.add('is-active');
      viewGridBtn.classList.remove('is-active');
      gridContainer.setAttribute('data-view', 'list');
      renderProductGrid();
    });
  }

  // 10. Routine Quick Links & Routine Cards
  document.querySelectorAll('.routine-pill-link, .routine-card').forEach(el => {
    el.addEventListener('click', () => {
      const routine = el.getAttribute('data-routine');
      state.routine = routine;
      state.category = 'all';
      state.page = 1;
      updateUrlParams();
      renderProductGrid();
      updateActiveFiltersBadge();
      scrollToGridTop();
      showToast(`Showing routine essentials for <strong>${routine.toUpperCase()}</strong>!`);
    });
  });

  // 11. Pagination Buttons
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.page > 1) {
        state.page -= 1;
        renderProductGrid();
        scrollToGridTop();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      state.page += 1;
      renderProductGrid();
      scrollToGridTop();
    });
  }

  // 12. Cart Drawer Triggers
  const headerCartBtn = document.getElementById('headerCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartBackdrop = document.getElementById('cartBackdrop');

  if (headerCartBtn) headerCartBtn.addEventListener('click', openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);

  // Cart Coupon Code Demo
  const applyCouponBtn = document.getElementById('applyCouponBtn');
  const couponInput = document.getElementById('couponInput');
  const couponMessage = document.getElementById('couponMessage');

  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === 'PETCHUP10') {
        state.appliedCoupon = code;
        couponMessage.style.color = '#1B4D3E';
        couponMessage.textContent = '🎉 10% pantry discount applied!';
        renderCartDrawer();
      } else {
        couponMessage.style.color = '#B91C1C';
        couponMessage.textContent = 'Invalid code. Try "PETCHUP10"';
      }
    });
  }

  // Checkout Demo Button
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast('Your cart is empty!');
        return;
      }
      showToast('🎉 Order simulated! Thank you for shopping with PETCHUP!');
      state.cart = [];
      saveCart(state.cart);
      setTimeout(closeCartDrawer, 1200);
    });
  }

  // 13. Search Modal Overlay
  const openSearchBtn = document.getElementById('openSearchBtn');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const searchModal = document.getElementById('searchModal');
  const searchBackdrop = document.getElementById('searchBackdrop');
  const searchInput = document.getElementById('searchModalInput');
  const searchResults = document.getElementById('searchResultsContainer');

  const openSearch = () => {
    if (searchModal && searchBackdrop) {
      searchModal.classList.add('is-open');
      searchBackdrop.classList.add('is-open');
      if (searchInput) {
        searchInput.value = state.searchQuery;
        searchInput.focus();
      }
      renderSearchResults(state.searchQuery);
    }
  };

  const closeSearch = () => {
    if (searchModal && searchBackdrop) {
      searchModal.classList.remove('is-open');
      searchBackdrop.classList.remove('is-open');
    }
  };

  if (openSearchBtn) openSearchBtn.addEventListener('click', openSearch);
  if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);
  if (searchBackdrop) searchBackdrop.addEventListener('click', closeSearch);

  // Keyboard shortcut: Cmd/Ctrl + K or Escape
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeDrawer();
      closeCartDrawer();
    }
  });

  function renderSearchResults(q) {
    if (!searchResults) return;
    if (!q || !q.trim()) {
      searchResults.innerHTML = '<div style="padding: 20px; color: var(--cat-muted); text-align: center;">Start typing to find feeds, toys, treats or grooming essentials...</div>';
      return;
    }

    const matches = DEMO_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(q.toLowerCase()) || 
      p.category.toLowerCase().includes(q.toLowerCase())
    );

    if (matches.length === 0) {
      searchResults.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--cat-muted);">No products found matching "${q}"</div>`;
      return;
    }

    searchResults.innerHTML = matches.map(m => `
      <div class="search-result-item" data-id="${m.id}">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">🐾</span>
          <div>
            <div style="font-weight: 800; color: var(--cat-ink);">${m.name}</div>
            <div style="font-size: 12px; color: var(--cat-muted); text-transform: uppercase;">${m.category} &bull; ${m.size}</div>
          </div>
        </div>
        <div style="font-weight: 900; color: var(--cat-orange);">₱${m.price}</div>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const prod = DEMO_PRODUCTS.find(p => p.id === id);
        if (prod) {
          state.searchQuery = prod.name;
          closeSearch();
          updateUrlParams();
          renderProductGrid();
          scrollToGridTop();
        }
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  // 14. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeMobileNavBtn = document.getElementById('closeMobileNavBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');

  if (mobileMenuBtn && mobileNavDrawer && mobileNavBackdrop) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNavDrawer.classList.add('is-open');
      mobileNavBackdrop.classList.add('is-open');
    });

    const closeMobile = () => {
      mobileNavDrawer.classList.remove('is-open');
      mobileNavBackdrop.classList.remove('is-open');
    };

    if (closeMobileNavBtn) closeMobileNavBtn.addEventListener('click', closeMobile);
    mobileNavBackdrop.addEventListener('click', closeMobile);
  }

  // 15. Newsletter Subscription Validation
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterEmail = document.getElementById('newsletterEmail');
  const newsletterFeedback = document.getElementById('newsletterFeedback');

  if (newsletterForm && newsletterEmail) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = newsletterEmail.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(val)) {
        if (newsletterFeedback) {
          newsletterFeedback.style.color = '#FF8080';
          newsletterFeedback.textContent = 'Please enter a valid email address.';
        }
        return;
      }

      if (newsletterFeedback) {
        newsletterFeedback.style.color = 'var(--cat-butter)';
        newsletterFeedback.textContent = `🎉 Welcome to the pack! Check ${val} for your 10% welcome gift.`;
      }
      showToast(`🎉 You're in! Check your inbox for your welcome discount.`);
      newsletterEmail.value = '';
    });
  }

  // 16. Initialize Cursor Trail & Load Animations
  initPawCursorTrail();
  initOnLoadAnimations();
});
