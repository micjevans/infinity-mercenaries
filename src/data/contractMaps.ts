type Zone = {
  label?: string;
  note?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
};

type Marker = {
  label?: string;
  note?: string;
  x: number;
  y: number;
  className?: string;
};

type Feature = {
  label?: string;
  note?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
};

type Dimension = {
  label: string;
  className: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
};

export type ContractDeployment = {
  title: string;
  width: number;
  height: number;
  zones: Zone[];
  markers?: Marker[];
  features?: Feature[];
  dimensions?: Dimension[];
  legend?: { label: string; className: string }[];
  showMidline?: boolean;
};

const standardZones: Zone[] = [
  {
    label: "Deployment Zone A",
    x: 0,
    y: 0,
    width: 36,
    height: 12,
    className: "zone-a",
  },
  { x: 0, y: 12, width: 36, height: 24, className: "neutral-zone" },
  {
    label: "Deployment Zone B",
    x: 0,
    y: 36,
    width: 36,
    height: 12,
    className: "zone-b",
  },
];

const standardZonesWithExclusion: Zone[] = [
  {
    label: "Deployment Zone A",
    x: 0,
    y: 0,
    width: 36,
    height: 12,
    className: "zone-a",
  },
  { x: 0, y: 12, width: 36, height: 4, className: "neutral-zone" },
  { x: 0, y: 16, width: 36, height: 16, className: "exclusion-zone" },
  { x: 0, y: 32, width: 36, height: 4, className: "neutral-zone" },
  {
    label: "Deployment Zone B",
    x: 0,
    y: 36,
    width: 36,
    height: 12,
    className: "zone-b",
  },
];

const standardDimensions: Dimension[] = [
  { label: '12"', className: "deployment-distance", x: -2, y: 0, height: 12 },
];

const standardDimensionsWithExclusion: Dimension[] = [
  { label: '12"', className: "deployment-distance", x: -2, y: 0, height: 12 },
  { label: '8"', className: "exclusion-distance", x: -2, y: 16, height: 8 },
];

const standardLegendWithExclusion = [
  { label: "Exclusion Zone", className: "exclusion-swatch" },
];

export const standardOpposedDeployment = (
  title: string,
  overrides: Partial<ContractDeployment> = {},
): ContractDeployment => ({
  title,
  width: 36,
  height: 48,
  zones: standardZones,
  dimensions: standardDimensions,
  legend: [],
  ...overrides,
});

export const standardOpposedDeploymentWithExclusion = (
  title: string,
  overrides: Partial<ContractDeployment> = {},
): ContractDeployment => ({
  title,
  width: 36,
  height: 48,
  zones: standardZonesWithExclusion,
  dimensions: standardDimensionsWithExclusion,
  legend: standardLegendWithExclusion,
  ...overrides,
});

export const sameSideDeployment = (
  title: string,
  overrides: Partial<ContractDeployment> = {},
): ContractDeployment => ({
  title,
  width: 36,
  height: 48,
  zones: [
    {
      label: "Player Deployment Zone",
      x: 0,
      y: 36,
      width: 36,
      height: 12,
      className: "zone-b",
    },
    { x: 0, y: 0, width: 36, height: 12, className: "exclusion-zone" },
    { x: 0, y: 12, width: 36, height: 24, className: "neutral-zone" },
  ],
  dimensions: [
    {
      label: '12"',
      className: "deployment-distance",
      x: -2,
      y: 36,
      height: 12,
    },
    { label: '12"', className: "exclusion-distance", x: -2, y: 0, height: 12 },
  ],
  legend: standardLegendWithExclusion,
  ...overrides,
});

export const standardTwistIntro =
  "After the end of Round 2, but before the beginning of Round 3, roll a single d20 and apply the result below.";
