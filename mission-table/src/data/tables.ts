export type TableType = 'in-person' | 'virtual';

export type Table = {
  id: string;
  countrySlug: string;
  hostedBy: string;
  groupType: TableType;
  city?: string;       // in-person only
  state?: string;      // in-person only
  rhythm: string;
  time: string;
  memberCount: number;
  maxSize?: number;    // in-person only — omit for virtual (no cap)
};

export function getTablesForCountry(slug: string): Table[] {
  return tables.filter((t) => t.countrySlug === slug);
}

// Seeded tables — Spain has one in-person + Mission Table Global placeholder
export const tables: Table[] = [
  {
    id: 'spain-1',
    countrySlug: 'spain',
    hostedBy: 'Daniel & Maria R.',
    groupType: 'in-person',
    city: 'Austin',
    state: 'TX',
    rhythm: 'Every 3rd Sunday',
    time: '6:00 PM',
    memberCount: 4,
    maxSize: 6,
  },
  {
    id: 'spain-global',
    countrySlug: 'spain',
    hostedBy: 'Mission Table Global',
    groupType: 'virtual',
    rhythm: 'Every 3rd Sunday',
    time: '6:00 PM',
    memberCount: 4,
  },
];
