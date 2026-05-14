export type MenuGroup = "navigation" | "contracts" | "";

export type FillerArcMeta = {
  sizeRatioClass: string;
  gapClass: string;
  angleClass?: string;
};

export interface OrbitMeta {
  orbitNumber: number;
  fontSize: number;
  from: string;
  gap: number;
  isTopMenu: boolean;
  isFiller: boolean;
  isPairedMenu: boolean;
  isTitleOrbit: boolean;
  menuGroup: MenuGroup;
  rangeClass: string;
  angleClass: string;
  rotationDirection: "normal" | "reverse";
  sizeRatio: number;
  contracts: Array<string | FillerArcMeta>;
}

const ORBIT_SIZE_RATIO = 1.8;
const MIN_ORBIT_NUMBER = 6;
const MAX_ORBIT_NUMBER = 24;
const FONT_SCALE = 2.4;
const FONT_POWER = 1.05;

const getOrbitNumberFromCharCount = (charCount: number) =>
  Math.min(
    MAX_ORBIT_NUMBER,
    Math.max(
      MIN_ORBIT_NUMBER,
      Math.ceil((charCount * 6.6 * 24) / (Math.PI * 380)),
    ),
  );

const getOrbitFontSize = (orbitNumber: number) => {
  const minFont = 0.1;
  const maxFont = 0.55;
  return Math.max(
    minFont,
    Math.min(maxFont, FONT_SCALE / Math.pow(orbitNumber, FONT_POWER)),
  );
};

const getWeightedRandom = (min: number, max: number, exponent = 0.5) => {
  const value = Math.pow(Math.random(), exponent);
  return min + value * (max - min);
};

const getRandomGapClass = () =>
  `gap-${Math.round(getWeightedRandom(0, 30, 0.4))}`;

const getRandomSizeRatioClass = () => {
  const shouldShrink = Math.random() < 0.5;
  if (shouldShrink) {
    const shrinkValue = Math.floor(Math.random() * 21) * 5;
    return `shrink-${shrinkValue}`;
  }

  const rawGrowValue = Math.round(Math.random() * 10) / 10;
  const growValue = rawGrowValue === 0 ? 0.1 : rawGrowValue;
  return Number.isInteger(growValue)
    ? `grow-${growValue}x`
    : `grow-${growValue.toFixed(1)}x`;
};

const getRandomSizeRatio = () => 1.5 + Math.random() * 1.2;

const getFillerArcCount = () => {
  const choice = Math.random();
  if (choice < 0.18) return 1;
  if (choice < 0.58) return 2;
  if (choice < 0.9) return 3;
  return 4;
};

const getFillerOrbitRangeClass = (count: number) => {
  const minRange = 30;
  const maxRange = 360;
  const rawValue =
    count >= 3 ? 1 - Math.pow(Math.random(), 2) : Math.pow(Math.random(), 2);
  const rangeValue = minRange + rawValue * (maxRange - minRange);
  return `range-${Math.round(rangeValue)}`;
};

const createFillerArcItem = (count: number): FillerArcMeta => ({
  sizeRatioClass: getRandomSizeRatioClass(),
  gapClass: getRandomGapClass(),
});

const createFillerArcs = () => {
  const count = getFillerArcCount();
  return Array.from({ length: count }, () => createFillerArcItem(count));
};

const createOrbitMeta = ({
  items,
  orbitNumber,
  from = "0deg",
  gap = 2,
  isTopMenu = false,
  isFiller = false,
  isPairedMenu = false,
  isTitleOrbit = false,
  menuGroup = "",
  rangeClass = "range-90",
  angleClass = "",
  rotationDirection = "normal",
  sizeRatio = ORBIT_SIZE_RATIO,
}: {
  items: Array<string | FillerArcMeta>;
  orbitNumber: number;
  from?: string;
  gap?: number;
  isTopMenu?: boolean;
  isFiller?: boolean;
  isPairedMenu?: boolean;
  isTitleOrbit?: boolean;
  menuGroup?: MenuGroup;
  rangeClass?: string;
  angleClass?: string;
  rotationDirection?: "normal" | "reverse";
  sizeRatio?: number;
}): OrbitMeta => ({
  orbitNumber,
  fontSize: getOrbitFontSize(orbitNumber),
  from,
  gap,
  isTopMenu,
  isFiller,
  isPairedMenu,
  isTitleOrbit,
  menuGroup,
  rangeClass,
  angleClass,
  rotationDirection,
  sizeRatio,
  contracts: items,
});

const createMenuOrbitPair = ({
  items,
  orbitNumber,
  title,
  from = "0deg",
  menuGroup = "",
  isTopMenu = false,
}: {
  items: string[];
  orbitNumber: number;
  title: string;
  from?: string;
  menuGroup?: MenuGroup;
  isTopMenu?: boolean;
}) => [
  createOrbitMeta({
    items,
    orbitNumber,
    from,
    gap: 8,
    isTopMenu,
    menuGroup,
    sizeRatio: ORBIT_SIZE_RATIO,
  }),
  createOrbitMeta({
    items: [title],
    orbitNumber: orbitNumber + 2,
    from,
    gap: 0,
    isPairedMenu: true,
    isTitleOrbit: true,
    rangeClass: "range-120",
    sizeRatio: ORBIT_SIZE_RATIO,
  }),
];

const createFillerOrbit = ({
  orbitNumber,
  rotationDirection,
}: {
  orbitNumber: number;
  rotationDirection: "normal" | "reverse";
}) => {
  const items = createFillerArcs();
  return createOrbitMeta({
    items,
    orbitNumber,
    from: "0deg",
    gap: 0,
    isFiller: true,
    rangeClass: getFillerOrbitRangeClass(items.length),
    angleClass: "",
    rotationDirection,
    sizeRatio: getRandomSizeRatio(),
  });
};

export const buildOrbitScene = (contractNames: string[]) => {
  const outerMenuItems = ["rules", "companies", "events", "contracts"];
  const contractOrbitChunks =
    contractNames.length > 10
      ? [
          contractNames.slice(0, Math.ceil(contractNames.length / 2)),
          contractNames.slice(Math.ceil(contractNames.length / 2)),
        ]
      : [contractNames];

  const outerChunkCount = contractOrbitChunks[0]?.length || 0;
  const innerOrbitFrom =
    outerChunkCount > 0 ? `${180 / outerChunkCount}deg` : "0deg";

  const contractOrbitMeta: OrbitMeta[] = [];
  const spacingGap = 2;
  let lastOrbitNumber = 0;

  for (let index = 0; index < contractOrbitChunks.length; index += 2) {
    const outerChunk = contractOrbitChunks[index];
    const innerChunk = contractOrbitChunks[index + 1];

    const outerRequired = getOrbitNumberFromCharCount(
      Math.max(...outerChunk.map((name) => name.length)) *
        outerChunk.length *
        0.7,
    );

    const innerRequired = innerChunk
      ? getOrbitNumberFromCharCount(
          Math.max(...innerChunk.map((name) => name.length)) *
            innerChunk.length *
            0.7,
        )
      : null;

    const outerOrbitNumber = innerRequired
      ? Math.max(
          outerRequired,
          innerRequired + spacingGap,
          lastOrbitNumber + spacingGap,
        )
      : Math.max(outerRequired, lastOrbitNumber + spacingGap);

    const innerOrbitNumber = innerRequired
      ? outerOrbitNumber - spacingGap
      : null;

    contractOrbitMeta.push(
      ...createMenuOrbitPair({
        items: outerChunk,
        orbitNumber: outerOrbitNumber,
        title: "CONTRACTS // MISSION ARCHIVE",
        from: "0deg",
        menuGroup: "contracts",
      }),
    );

    if (innerChunk && innerOrbitNumber !== null) {
      contractOrbitMeta.push(
        createOrbitMeta({
          items: innerChunk,
          orbitNumber: innerOrbitNumber,
          from: innerOrbitFrom,
          gap: 2,
          sizeRatio: ORBIT_SIZE_RATIO,
          menuGroup: "contracts",
        }),
      );
    }

    lastOrbitNumber = outerOrbitNumber;
  }

  const topMenuOrbitNumber = 4;
  const topMenuOrbitMeta = createMenuOrbitPair({
    items: outerMenuItems,
    orbitNumber: topMenuOrbitNumber,
    title: "NAVIGATION // ROTARY SELECTOR",
    from: "0deg",
    isTopMenu: true,
    menuGroup: "navigation",
  });

  const menuOrbitMeta = [...topMenuOrbitMeta, ...contractOrbitMeta];
  const occupiedOrbitNumbers = Array.from(
    new Set(menuOrbitMeta.map((meta) => meta.orbitNumber)),
  ).sort((a, b) => a - b);

  const fillerOrbitMeta: OrbitMeta[] = [];
  const fillerStep = 2;
  occupiedOrbitNumbers.forEach((orbitNumber, index) => {
    const nextOrbitNumber = occupiedOrbitNumbers[index + 1];
    if (!nextOrbitNumber) return;

    for (
      let fillerOrbitNumber = orbitNumber + fillerStep;
      fillerOrbitNumber < nextOrbitNumber;
      fillerOrbitNumber += fillerStep
    ) {
      fillerOrbitMeta.push(
        createFillerOrbit({
          orbitNumber: fillerOrbitNumber,
          rotationDirection:
            fillerOrbitMeta.length % 2 === 0 ? "reverse" : "normal",
        }),
      );
    }
  });

  const orbitRingMeta: OrbitMeta[] = [
    ...topMenuOrbitMeta,
    ...fillerOrbitMeta,
    ...contractOrbitMeta,
  ];

  const largestOrbitNumber = Math.max(
    topMenuOrbitNumber,
    ...contractOrbitMeta.map((meta) => meta.orbitNumber),
    ...fillerOrbitMeta.map((meta) => meta.orbitNumber),
  );

  return {
    orbitRingMeta,
    gravitySpotSize: Math.ceil((largestOrbitNumber * 540) / 12),
  };
};
