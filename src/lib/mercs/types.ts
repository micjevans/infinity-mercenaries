export type AttributeKey =
  | "move"
  | "cc"
  | "bs"
  | "wip"
  | "ph"
  | "arm"
  | "bts"
  | "w"
  | "s";

export type ItemKey =
  | "weapons"
  | "skills"
  | "equips"
  | "equip"
  | "peripherals"
  | "peripheral"
  | AttributeKey
  | "type";

export type MetadataItem = {
  id: string | number;
  name?: string;
  type?: string | number;
  key?: string;
  extra?: unknown;
  extras?: unknown;
  [key: string]: unknown;
};

export type Profile = {
  move?: number[];
  cc?: number;
  bs?: number;
  ph?: number;
  wip?: number;
  arm?: number;
  bts?: number;
  w?: number;
  s?: number | string;
  skills?: MetadataItem[];
  equip?: MetadataItem[];
  equips?: MetadataItem[];
  weapons?: MetadataItem[];
  peripheral?: MetadataItem[];
  peripherals?: MetadataItem[];
  chars?: Array<string | number>;
  [key: string]: unknown;
};

export type ProfileOption = {
  id?: string | number;
  points?: number;
  swc?: string;
  skills?: MetadataItem[];
  equip?: MetadataItem[];
  equips?: MetadataItem[];
  weapons?: MetadataItem[];
  peripheral?: MetadataItem[];
  peripherals?: MetadataItem[];
  includes?: Array<{ option: string | number }>;
  orders?: Array<{ type: string; list: number; total: number }>;
  [key: string]: unknown;
};

export type ProfileGroup = {
  profiles: Profile[];
  options: ProfileOption[];
  category?: string | number;
  [key: string]: unknown;
};

export type FactionResume = {
  id: string | number;
  type?: number;
  category?: number;
  logo?: string;
  [key: string]: unknown;
};

export type Unit = {
  id: string | number;
  slug: string;
  isc: string;
  name?: string;
  resume?: FactionResume | null;
  profileGroups: ProfileGroup[];
  perks?: MetadataItem[];
  [key: string]: unknown;
};

export type FactionMetadata = {
  id: number;
  parent: number;
  name: string;
  slug: string;
  discontinued?: boolean;
  logo?: string;
};

export type FactionData = {
  units?: Unit[];
  resume?: FactionResume[];
  specops?: {
    equip?: MetadataItem[];
    equips?: MetadataItem[];
    skills?: MetadataItem[];
    weapons?: MetadataItem[];
  };
  [key: string]: unknown;
};

export type Company = {
  id: string;
  name: string;
  sectorial1?: FactionMetadata | null;
  sectorial2?: FactionMetadata | null;
  credits?: number;
  swc?: number;
  notoriety?: number;
  sponsor?: string;
  troopers?: Array<CompanyTrooper | Trooper | Record<string, unknown>>;
  inventory?: MetadataItem[];
  seed?: string;
  [key: string]: unknown;
};

export type CompanyTrooper = {
  id: string;
  recruitmentId: string;
  unitId: string | number;
  unitSlug: string;
  isc: string;
  optionName: string;
  profileName?: string;
  points: number;
  swc: string;
  sourceFaction: string;
  sourceSlug: string;
  type?: string | number | null;
  captain?: boolean;
  xp?: number;
  injuries?: string[];
};

export type Trooper = Unit & {
  id: string;
  captain?: boolean;
  xp?: number;
  perkPoints?: number;
  perks?: MetadataItem[];
  primary?: MetadataItem | null;
  secondary?: MetadataItem | null;
  sidearm?: MetadataItem | null;
  accessory?: MetadataItem | null;
  augment?: MetadataItem | null;
  armor?: MetadataItem | null;
  local?: boolean;
  name?: string;
  profileName?: string;
  optionName?: string;
  points?: number;
  swc?: string;
  orders?: Array<{ type: string; list: number; total: number }>;
  move?: number[] | string;
  cc?: number;
  bs?: number;
  ph?: number;
  wip?: number;
  arm?: number;
  bts?: number;
  w?: number;
  s?: number | string;
  skills?: MetadataItem[];
  weapons?: MetadataItem[];
  equip?: MetadataItem[];
  equips?: MetadataItem[];
  peripheral?: MetadataItem[];
  peripherals?: MetadataItem[];
};
