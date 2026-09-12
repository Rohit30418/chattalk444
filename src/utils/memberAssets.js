export const PROFILE_DECORATIONS = [
  { id: 'aurora', label: 'Aurora', src: 'https://img.avatardecoration.com/decorations/aurora.png' },
  { id: 'fire', label: 'Fire', src: 'https://img.avatardecoration.com/decorations/fire.png' },
  { id: 'lightning', label: 'Lightning', src: 'https://img.avatardecoration.com/decorations/lightning.png' },
  { id: 'snowfall', label: 'Snowfall', src: 'https://img.avatardecoration.com/decorations/snowfall.png' },
  { id: 'black-hole', label: 'Black Hole', src: 'https://img.avatardecoration.com/decorations/black_hole.png' },
  { id: 'glowing-runes', label: 'Glowing Runes', src: 'https://img.avatardecoration.com/decorations/glowing_runes.png' },
  { id: 'phoenix', label: 'Phoenix', src: 'https://img.avatardecoration.com/decorations/phoenix.png' },
  { id: 'dragons-smile', label: "Dragon's Smile", src: 'https://img.avatardecoration.com/decorations/dragons_smile.png' },
  { id: 'butterflies', label: 'Butterflies', src: 'https://img.avatardecoration.com/decorations/butterflies.png' },
  { id: 'koi-pond', label: 'Koi Pond', src: 'https://img.avatardecoration.com/decorations/koi_pond.png' },
  { id: 'ghosts', label: 'Ghosts', src: 'https://img.avatardecoration.com/decorations/ghosts.png' },
  { id: 'witch-hat-midnight', label: 'Witch Hat', src: 'https://img.avatardecoration.com/decorations/witch_hat_midnight.png' },
  { id: 'jack-o-lantern', label: "Jack-o'-lantern", src: 'https://img.avatardecoration.com/decorations/jack_o_lantern.png' },
  { id: 'cozy-cat', label: 'Cozy Cat', src: 'https://img.avatardecoration.com/decorations/cozy_cat.png' },
  { id: 'skull-medallion', label: 'Skull Medallion', src: 'https://img.avatardecoration.com/decorations/skull_medallion.png' },
];

export const PROFILE_BANNERS = [
  { id: 'purple-moon', label: 'Purple Moon', src: '/member-assets/banners/purple-moon.webp' },
  { id: 'sakura-bridge', label: 'Sakura Bridge', src: '/member-assets/banners/sakura-bridge.webp' },
  { id: 'sakura-canopy', label: 'Sakura Canopy', src: '/member-assets/banners/sakura-canopy.webp' },
  { id: 'red-eyes-gaze', label: 'Red Eyes', src: '/member-assets/banners/red-eyes-gaze.webp' },
  { id: 'shadow-aura', label: 'Shadow Aura', src: '/member-assets/banners/shadow-aura.webp' },
  { id: 'broken-clock', label: 'Broken Clock', src: '/member-assets/banners/broken-clock.webp' },
  { id: 'glow-butterfly', label: 'Glow Butterfly', src: '/member-assets/banners/glow-butterfly.webp' },
  { id: 'black-hair', label: 'Black Hair', src: '/member-assets/banners/black-hair.webp' },
  { id: 'blurred-sedan', label: 'Blurred Sedan', src: '/member-assets/banners/blurred-sedan.webp' },
  { id: 'goth-smoker', label: 'Goth Smoker', src: '/member-assets/banners/goth-smoker.webp' },
  { id: 'itachi-akatsu', label: 'Akatsuki', src: '/member-assets/banners/itachi-akatsu.webp' },
  { id: 'red-forest', label: 'Red Forest', src: '/member-assets/banners/red-forest.webp' },
  { id: 'sunflower-dusk', label: 'Sunflower Dusk', src: '/member-assets/banners/sunflower-dusk.webp' },
  { id: 'surreal', label: 'Surreal', src: '/member-assets/banners/surreal.webp' },
  { id: 'wing-shadow', label: 'Wing Shadow', src: '/member-assets/banners/wing-shadow.webp' },
];

const decorationMap = new Map(PROFILE_DECORATIONS.map((item) => [item.id, item]));
const bannerMap = new Map(PROFILE_BANNERS.map((item) => [item.id, item]));

export const legacyDecorationId = (value) => {
  const theme = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (theme === 'gold') return 'glowing-runes';
  if (theme === 'galaxy') return 'black-hole';
  return 'aurora';
};

export const normalizeProfileDecorationId = (value, legacyValue = 'aurora') => {
  const id = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return decorationMap.has(id) ? id : legacyDecorationId(legacyValue);
};

export const normalizeProfileBannerId = (value) => {
  const id = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return bannerMap.has(id) ? id : 'purple-moon';
};

export const getProfileDecoration = (value, legacyValue) => (
  decorationMap.get(normalizeProfileDecorationId(value, legacyValue)) || PROFILE_DECORATIONS[0]
);

export const getProfileBanner = (value) => (
  bannerMap.get(normalizeProfileBannerId(value)) || PROFILE_BANNERS[0]
);
