export type CountryStatus = 'seeded' | 'empty';

export type Country = {
  name: string;
  slug: string;
  continent: string;
  region: string;
  status: CountryStatus;
  groupCount: number;
  image: string;
  // Joshua Project data (source: AllCountriesListing.csv)
  population: number;
  primaryReligion: string;
  percentEvangelical: number | null; // null = data unavailable in JP dataset
  peopleGroups: number;
  leastReached: number;
  in1040Window: boolean;
  jpScale: number; // 1–5
};

export const CONTINENT_ORDER = [
  'Central America',
  'East Asia',
  'Europe',
  'South Asia',
  'Southeast Asia',
];

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
    population: 83998000,
    primaryReligion: 'Christianity',
    percentEvangelical: 2.13,
    peopleGroups: 108,
    leastReached: 42,
    in1040Window: false,
    jpScale: 4,
  },
  {
    name: 'Kosovo',
    slug: 'kosovo',
    continent: 'Europe',
    region: 'EUROPE',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/kosovo.jpg',
    population: 1628000,
    primaryReligion: 'Islam',
    percentEvangelical: 0.20,
    peopleGroups: 9,
    leastReached: 6,
    in1040Window: false,
    jpScale: 1,
  },
  {
    name: 'Spain',
    slug: 'spain',
    continent: 'Europe',
    region: 'EUROPE',
    status: 'seeded',
    groupCount: 1,
    image: '/images/countries/spain.jpg',
    population: 47765000,
    primaryReligion: 'Christianity',
    percentEvangelical: 1.60,
    peopleGroups: 78,
    leastReached: 12,
    in1040Window: false,
    jpScale: 3,
  },
  {
    name: 'United Kingdom',
    slug: 'united-kingdom',
    continent: 'Europe',
    region: 'EUROPE',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/united-kingdom.jpg',
    population: 69410000,
    primaryReligion: 'Christianity',
    percentEvangelical: 7.51,
    peopleGroups: 128,
    leastReached: 46,
    in1040Window: false,
    jpScale: 4,
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
    population: 18516000,
    primaryReligion: 'Christianity',
    percentEvangelical: 25.09,
    peopleGroups: 57,
    leastReached: 2,
    in1040Window: false,
    jpScale: 5,
  },
  {
    name: 'Honduras',
    slug: 'honduras',
    continent: 'Central America',
    region: 'CENTRAL AMERICA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/honduras.jpg',
    population: 10899000,
    primaryReligion: 'Christianity',
    percentEvangelical: 27.62,
    peopleGroups: 19,
    leastReached: 1,
    in1040Window: false,
    jpScale: 5,
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
    population: 174504000,
    primaryReligion: 'Islam',
    percentEvangelical: null,
    peopleGroups: 278,
    leastReached: 256,
    in1040Window: true,
    jpScale: 1,
  },
  {
    name: 'India',
    slug: 'india',
    continent: 'South Asia',
    region: 'SOUTH ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/india.jpg',
    population: 1453737000,
    primaryReligion: 'Hinduism',
    percentEvangelical: null,
    peopleGroups: 2263,
    leastReached: 2033,
    in1040Window: true,
    jpScale: 1,
  },
  {
    name: 'Pakistan',
    slug: 'pakistan',
    continent: 'South Asia',
    region: 'SOUTH ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/pakistan.jpg',
    population: 253377000,
    primaryReligion: 'Islam',
    percentEvangelical: null,
    peopleGroups: 776,
    leastReached: 768,
    in1040Window: true,
    jpScale: 1,
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
    population: 1397668000,
    primaryReligion: 'Non-Religious',
    percentEvangelical: 7.58,
    peopleGroups: 546,
    leastReached: 442,
    in1040Window: true,
    jpScale: 4,
  },
  {
    name: 'North Korea',
    slug: 'north-korea',
    continent: 'East Asia',
    region: 'EAST ASIA',
    status: 'seeded',
    groupCount: 0,
    image: '/images/countries/north-korea.jpg',
    population: 26493000,
    primaryReligion: 'Non-Religious',
    percentEvangelical: 1.58,
    peopleGroups: 4,
    leastReached: 2,
    in1040Window: true,
    jpScale: 1,
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
    population: 282707000,
    primaryReligion: 'Islam',
    percentEvangelical: 3.44,
    peopleGroups: 788,
    leastReached: 234,
    in1040Window: true,
    jpScale: 4,
  },
];

export function getCountriesByContinent(): Record<string, Country[]> {
  const grouped: Record<string, Country[]> = {};
  for (const country of countries) {
    if (!grouped[country.continent]) grouped[country.continent] = [];
    grouped[country.continent].push(country);
  }
  for (const continent of Object.keys(grouped)) {
    grouped[continent].sort((a, b) => a.name.localeCompare(b.name));
  }
  return grouped;
}

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
