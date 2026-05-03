import type {
  Company,
  CompanyTrooper,
  FactionMetadata,
  Trooper,
} from "./types";

const STORAGE_KEY = "mercenaries.localCompanies.v1";

export type LocalCompany = Company & {
  createdAt: string;
  updatedAt: string;
  description?: string;
  eventFileId?: string;
  eventName?: string;
  eventLink?: string;
  shareFileId?: string;
  shareLink?: string;
  companyEventFileId?: string;
  companyEventShareLink?: string;
};

export type NewCompanyInput = {
  name: string;
  companyTypeId?: string;
  sectorial1?: FactionMetadata | null;
  sectorial2?: FactionMetadata | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `company-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function createLocalCompany(input: NewCompanyInput): LocalCompany {
  const timestamp = nowIso();

  return {
    id: makeId(),
    name: input.name.trim(),
    companyTypeId: input.companyTypeId ?? "",
    sectorial1: input.sectorial1 ?? null,
    sectorial2: input.sectorial2 ?? null,
    credits: 0,
    swc: 0,
    notoriety: 0,
    sponsor: "",
    troopers: [],
    inventory: [],
    description: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function loadLocalCompanies(): LocalCompany[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalCompanies(companies: LocalCompany[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
}

export function upsertLocalCompany(company: LocalCompany): LocalCompany[] {
  const companies = loadLocalCompanies();
  const updatedCompany = { ...company, updatedAt: nowIso() };
  const index = companies.findIndex((existing) => existing.id === company.id);

  if (index >= 0) {
    companies[index] = updatedCompany;
  } else {
    companies.push(updatedCompany);
  }

  saveLocalCompanies(companies);
  return companies;
}

export function deleteLocalCompany(companyId: string): LocalCompany[] {
  const companies = loadLocalCompanies().filter(
    (company) => company.id !== companyId,
  );
  saveLocalCompanies(companies);
  return companies;
}

export function updateCompanySectorials(
  company: LocalCompany,
  sectorial1: FactionMetadata | null,
  sectorial2: FactionMetadata | null,
): LocalCompany {
  return {
    ...company,
    sectorial1,
    sectorial2,
  };
}

type StoredTrooper = CompanyTrooper | Trooper | Record<string, any>;

export function addCompanyTrooper(
  company: LocalCompany,
  trooper: StoredTrooper,
): LocalCompany {
  const existingTroopers = (company.troopers || []) as StoredTrooper[];
  const nextTroopers = trooper.captain
    ? existingTroopers.map((existing) => ({ ...existing, captain: false }))
    : existingTroopers;

  return {
    ...company,
    troopers: [...nextTroopers, trooper],
  };
}

export function removeCompanyTrooper(
  company: LocalCompany,
  trooperId: string,
): LocalCompany {
  return {
    ...company,
    troopers: ((company.troopers || []) as StoredTrooper[]).filter(
      (trooper) => trooper.id !== trooperId,
    ),
  };
}

export function setCompanyCaptain(
  company: LocalCompany,
  trooperId: string,
): LocalCompany {
  return {
    ...company,
    troopers: ((company.troopers || []) as StoredTrooper[]).map((trooper) => ({
      ...trooper,
      captain: trooper.id === trooperId,
    })),
  };
}
