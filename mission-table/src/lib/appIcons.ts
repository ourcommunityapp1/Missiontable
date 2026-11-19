// Home-screen app icons. Each country's icon is its photo, cropped square
// (built by scripts/make-country-icons.cjs into public/icons/countries).

const COUNTRY_ICONS = new Set([
  'bangladesh', 'china', 'germany', 'guatemala', 'honduras', 'india',
  'indonesia', 'kosovo', 'north-korea', 'pakistan', 'spain', 'united-kingdom',
]);

export type AppIcons = { apple: string; icon192: string; icon512: string; type: string };

export function appIconsFor(countrySlug: string | null | undefined): AppIcons {
  if (countrySlug && COUNTRY_ICONS.has(countrySlug)) {
    const base = `/icons/countries/${countrySlug}`;
    return { apple: `${base}-180.png`, icon192: `${base}-192.jpg`, icon512: `${base}-512.jpg`, type: 'image/jpeg' };
  }
  return { apple: '/icons/apple-touch-icon.png', icon192: '/icons/icon-192.png', icon512: '/icons/icon-512.png', type: 'image/png' };
}

/** The label under the icon on a home screen (iOS shows about 12–14 characters). */
export function homeScreenName(title: string): string {
  return title.length > 18 ? title.split(' ').slice(0, 2).join(' ') : title;
}
