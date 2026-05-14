export type MenuGroup = string;

export interface OrbitMenuItem {
  text: string;
  items?: OrbitMenu;
  onClick?: string;
}

export interface OrbitMenu {
  title: string;
  menuGroup?: MenuGroup;
  items: OrbitMenuItem[];
}

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
  isSubmenu: boolean;
  menuGroup: MenuGroup;
  rangeClass: string;
  angleClass: string;
  rotationDirection: "normal" | "reverse";
  sizeRatio: number;
  contracts: Array<string | FillerArcMeta>;
}

type BuildOrbitSceneOptions = {
  includeSubmenu?: boolean;
  targetMenuGroup?: string;
};

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
  isSubmenu = false,
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
  isSubmenu?: boolean;
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
  isSubmenu,
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
  isSubmenu = false,
}: {
  items: string[];
  orbitNumber: number;
  title: string;
  from?: string;
  menuGroup?: MenuGroup;
  isTopMenu?: boolean;
  isSubmenu?: boolean;
}) => [
  createOrbitMeta({
    items,
    orbitNumber,
    from,
    gap: 8,
    isTopMenu,
    isSubmenu,
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
    isSubmenu,
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

export const buildOrbitScene = (
  rootMenu: OrbitMenu,
  options: BuildOrbitSceneOptions = {},
) => {
  const includeSubmenu = options.includeSubmenu ?? true;
  const targetMenuGroup = options.targetMenuGroup;
  const rootMenuItems = rootMenu.items.map((item) => item.text);

  // Find submenu container: if targetMenuGroup specified, find matching group, otherwise use contracts or first available
  let submenuContainerItem: (typeof rootMenu.items)[number] | undefined;
  if (targetMenuGroup) {
    submenuContainerItem = rootMenu.items.find(
      (item) => item.items?.menuGroup === targetMenuGroup,
    );
  } else {
    submenuContainerItem =
      rootMenu.items.find(
        (item) => item.items && item.text.toLowerCase() === "contracts",
      ) ?? rootMenu.items.find((item) => item.items);
  }

  const submenu = submenuContainerItem?.items;
  const submenuNames = submenu?.items.map((item) => item.text) ?? [];
  const submenuTitle = submenu?.title ?? "SUBMENU";
  const submenuGroup =
    submenu?.menuGroup ??
    submenuContainerItem?.text?.toLowerCase() ??
    "submenu";

  const submenuOrbitChunks =
    submenuNames.length === 0
      ? []
      : submenuNames.length > 10
        ? [
            submenuNames.slice(0, Math.ceil(submenuNames.length / 2)),
            submenuNames.slice(Math.ceil(submenuNames.length / 2)),
          ]
        : [submenuNames];

  const outerChunkCount = submenuOrbitChunks[0]?.length || 0;
  const innerOrbitFrom =
    outerChunkCount > 0 ? `${180 / outerChunkCount}deg` : "0deg";

  const submenuOrbitMeta: OrbitMeta[] = [];
  const spacingGap = 2;
  let lastOrbitNumber = 0;

  if (includeSubmenu) {
    for (let index = 0; index < submenuOrbitChunks.length; index += 2) {
      const outerChunk = submenuOrbitChunks[index];
      const innerChunk = submenuOrbitChunks[index + 1];

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

      submenuOrbitMeta.push(
        ...createMenuOrbitPair({
          items: outerChunk,
          orbitNumber: outerOrbitNumber,
          title: submenuTitle,
          from: "0deg",
          isSubmenu: true,
          menuGroup: submenuGroup,
        }),
      );

      if (innerChunk && innerOrbitNumber !== null) {
        submenuOrbitMeta.push(
          createOrbitMeta({
            items: innerChunk,
            orbitNumber: innerOrbitNumber,
            from: innerOrbitFrom,
            gap: 2,
            isSubmenu: true,
            sizeRatio: ORBIT_SIZE_RATIO,
            menuGroup: submenuGroup,
          }),
        );
      }

      lastOrbitNumber = outerOrbitNumber;
    }
  }

  const topMenuOrbitNumber = 4;
  const topMenuOrbitMeta = createMenuOrbitPair({
    items: rootMenuItems,
    orbitNumber: topMenuOrbitNumber,
    title: rootMenu.title,
    from: "0deg",
    isTopMenu: true,
    menuGroup: rootMenu.menuGroup ?? "navigation",
  });

  const menuOrbitMeta = [...topMenuOrbitMeta, ...submenuOrbitMeta];
  const occupiedOrbitNumbers = Array.from(
    new Set(menuOrbitMeta.map((meta) => meta.orbitNumber)),
  ).sort((a, b) => a - b);

  const fillerOrbitMeta: OrbitMeta[] = [];
  if (includeSubmenu) {
    const fillerStep = 2;
    occupiedOrbitNumbers.forEach((orbitNumber, index) => {
      const nextOrbitNumber = occupiedOrbitNumbers[index + 1];
      if (!nextOrbitNumber) return;

      for (
        let fillerOrbitNumber = orbitNumber + fillerStep;
        fillerOrbitNumber < nextOrbitNumber - 1;
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
  }

  const orbitRingMeta: OrbitMeta[] = [
    ...topMenuOrbitMeta,
    ...fillerOrbitMeta,
    ...submenuOrbitMeta,
  ];

  const largestOrbitNumber = Math.max(
    ...topMenuOrbitMeta.map((meta) => meta.orbitNumber),
    ...submenuOrbitMeta.map((meta) => meta.orbitNumber),
    ...fillerOrbitMeta.map((meta) => meta.orbitNumber),
  );

  return {
    orbitRingMeta,
    gravitySpotSize: Math.ceil((largestOrbitNumber * 540) / 12),
  };
};
