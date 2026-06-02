export type JPScaleInfo = {
  label: string;
  description: string;
};

// Official descriptions from Joshua Project AllProgressLevelsListing.csv
export const JP_SCALE: Record<number, JPScaleInfo> = {
  1: {
    label: 'Unreached',
    description:
      'Few evangelicals and few who identify as Christians. Little, if any, history of Christianity.',
  },
  2: {
    label: 'Minimally Reached',
    description:
      'Few evangelicals, but significant number who identify as Christians.',
  },
  3: {
    label: 'Superficially Reached',
    description:
      'Few evangelicals, but many who identify as Christians. In great need of spiritual renewal and commitment to biblical faith.',
  },
  4: {
    label: 'Partially Reached',
    description: 'Evangelicals have a modest to moderate presence.',
  },
  5: {
    label: 'Significantly Reached',
    description: 'Evangelicals have a significant presence.',
  },
};
