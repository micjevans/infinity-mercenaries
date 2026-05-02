export type CompanyCreationStep =
  | "name"
  | "companyType"
  | "sectorials"
  | "captain"
  | "complete";

export type CompanyCreationRequirement =
  | "name"
  | "companyType"
  | "sectorial1"
  | "captain";

export type CompanyCreationDraft = {
  name?: string | null;
  companyTypeId?: string | null;
  sectorial1Id?: number | null;
  sectorial2Id?: number | null;
  captainProfileId?: string | null;
};

/**
 * Minimal captain data needed to evaluate eligibility and calculate XP.
 * The caller resolves this from the faction data before passing it in.
 */
export type CaptainCandidate = {
  profileId: string;
  /** CR cost of the selected unit option. */
  crCost: number;
  /** True when the unit is an Infinity Spec-Ops profile (skill ID 204). */
  isSpecOps: boolean;
  /** True when the selected option carries the Lieutenant special skill (skill ID 119). */
  hasLieutenant: boolean;
};

function hasValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasPositiveNumber(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function getMissingCompanyCreationRequirements(
  draft: CompanyCreationDraft,
): CompanyCreationRequirement[] {
  const missing: CompanyCreationRequirement[] = [];

  if (!hasValue(draft.name)) {
    missing.push("name");
  }

  if (!hasValue(draft.companyTypeId)) {
    missing.push("companyType");
  }

  if (!hasPositiveNumber(draft.sectorial1Id)) {
    missing.push("sectorial1");
  }

  if (!hasValue(draft.captainProfileId)) {
    missing.push("captain");
  }

  return missing;
}

export function getCompanyCreationStep(
  draft: CompanyCreationDraft,
): CompanyCreationStep {
  if (!hasValue(draft.name)) return "name";
  if (!hasValue(draft.companyTypeId)) return "companyType";
  if (!hasPositiveNumber(draft.sectorial1Id)) return "sectorials";
  if (!hasValue(draft.captainProfileId)) return "captain";
  return "complete";
}

export function canAccessCompanyManager(draft: CompanyCreationDraft): boolean {
  return getCompanyCreationStep(draft) === "complete";
}

export function validateCompanyCreationDraft(
  draft: CompanyCreationDraft,
): string[] {
  const errors: string[] = [];

  if (
    hasPositiveNumber(draft.sectorial1Id) &&
    hasPositiveNumber(draft.sectorial2Id) &&
    draft.sectorial1Id === draft.sectorial2Id
  ) {
    errors.push("Sectorial 1 and Sectorial 2 cannot be the same.");
  }

  return errors;
}

/**
 * A captain candidate is eligible if they are a Spec-Ops unit OR carry the
 * Lieutenant special skill. Both conditions are independently sufficient.
 *
 * Rules reference: "The Company" — The Captain section.
 */
export function isCaptainEligible(candidate: CaptainCandidate): boolean {
  return candidate.isSpecOps || candidate.hasLieutenant;
}

/**
 * Captain Spec-Ops XP = 28 − unit CR cost, minimum 0.
 *
 * Rules reference: "The Company" — Build Your Captain procedure.
 */
export function calculateCaptainXp(crCost: number): number {
  return Math.max(0, 28 - crCost);
}
