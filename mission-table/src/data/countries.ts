export type CountryStatus = 'seeded' | 'empty';

export type Country = {
  name: string;
  slug: string;
  continent: string;   // section grouping key
  region: string;      // display label on card tag e.g. "SOUTH ASIA"
  status: CountryStatus;
  groupCount: number;
  image: string;       // path under /public — replace with real photos before launch
};

// Continent display order
export const CONTINENT_ORDER = [
  'Central America',
  'East Asia',
  'Europe',
  'South Asia',
  'Southeast Asia',
];

// v1 seeded countries — images go in /public/images/countries/[slug].jpg
// Placeholder images go in /public/images/placeholders/[continent-slug].jpg
export const countries: Country[] = [
  // Europe
  {
    name: 'Germany',
    slug: 'germany',
    continent: 'Europe',
    region: 'EUROPE',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/germany.jpg',
  },
  {
    name: 'Kosovo',
    slug: 'kosovo',
    continent: 'Europe',
    region: 'EUROPE',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/kosovo.jpg',
  },
  {
    name: 'Spain',
    slug: 'spain',
    continent: 'Europe',
    region: 'EUROPE',
    status: 'seeded',
    groupCount: 1,
    image: '/images/countries/spain.jpg',
  },
  {
    name: 'United Kingdom',
    slug: 'united-kingdom',
    continent: 'Europe',
    region: 'EUROPE',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/united-kingdom.jpg',
  },

  // Central America
  {
    name: 'Guatemala',
    slug: 'guatemala',
    continent: 'Central America',
    region: 'CENTRAL AMERICA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/guatemala.jpg',
  },
  {
    name: 'Honduras',
    slug: 'honduras',
    continent: 'Central America',
    region: 'CENTRAL AMERICA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/honduras.jpg',
  },

  // South Asia
  {
    name: 'Bangladesh',
    slug: 'bangladesh',
    continent: 'South Asia',
    region: 'SOUTH ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/bangladesh.jpg',
  },
  {
    name: 'India',
    slug: 'india',
    continent: 'South Asia',
    region: 'SOUTH ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/india.jpg',
  },
  {
    name: 'Pakistan',
    slug: 'pakistan',
    continent: 'South Asia',
    region: 'SOUTH ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/pakistan.jpg',
  },

  // East Asia
  {
    name: 'China',
    slug: 'china',
    continent: 'East Asia',
    region: 'EAST ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/china.jpg',
  },
  {
    name: 'North Korea',
    slug: 'north-korea',
    continent: 'East Asia',
    region: 'EAST ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/north-korea.jpg',
  },

  // Southeast Asia
  {
    name: 'Indonesia',
    slug: 'indonesia',
    continent: 'Southeast Asia',
    region: 'SOUTHEAST ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/indonesia.jpg',
  },
];

// Group countries by continent in display order
export function getCountriesByContinent(): Record<string, Country[]> {
  const grouped: Record<string, Country[]> = {};
  for (const country of countries) {
    if (!grouped[country.continent]) grouped[country.continent] = [];
    grouped[country.continent].push(country);
  }
  // Sort alphabetically within each continent
  for (const continent of Object.keys(grouped)) {
    grouped[continent].sort((a, b) => a.name.localeCompare(b.name));
  }
  return grouped;
}

// Continent-specific placeholder image paths (for unseeded countries)
export const continentPlaceholders: Record<string, string> = {
  'Africa': '/images/placeholders/africa.jpg',
  'Central America': '/images/placeholders/central-america.jpg',
  'East Asia': '/images/placeholders/east-asia.jpg',
  'Europe': '/images/placeholders/europe.jpg',
  'Middle East': '/images/placeholders/middle-east.jpg',
  'North America': '/images/placeholders/north-america.jpg',
  'Oceania': '/images/placeholders/oceania.jpg',
  'South America': '/images/placeholders/south-america.jpg',
  'South Asia': '/images/placeholders/south-asia.jpg',
  'Southeast Asia': '/images/placeholders/southeast-asia.jpg',
};
