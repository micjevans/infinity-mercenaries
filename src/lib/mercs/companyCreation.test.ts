import { describe, expect, it } from "vitest";
import {
  calculateCaptainXp,
  canAccessCompanyManager,
  getCompanyCreationStep,
  getMissingCompanyCreationRequirements,
  isCaptainEligible,
  validateCompanyCreationDraft,
  type CaptainCandidate,
  type CompanyCreationDraft,
} from "./companyCreation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseDraft(): CompanyCreationDraft {
  return {
    name: "Iron Wasp",
    companyTypeId: "standard-company",
    sectorial1Id: 10,
    sectorial2Id: 17,
    captainProfileId: "captain-keisotsu-specops",
  };
}

function specOpsCandidate(
  overrides: Partial<CaptainCandidate> = {},
): CaptainCandidate {
  return {
    profileId: "keisotsu-specops",
    crCost: 10,
    isSpecOps: true,
    hasLieutenant: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Step 1 — Name
// ---------------------------------------------------------------------------

describe("company creation: name step", () => {
  it("blocks progress when name is missing", () => {
    const draft = baseDraft();
    draft.name = null;

    expect(getCompanyCreationStep(draft)).toBe("name");
    expect(getMissingCompanyCreationRequirements(draft)).toContain("name");
    expect(canAccessCompanyManager(draft)).toBe(false);
  });

  it("blocks progress when name is only whitespace", () => {
    const draft = baseDraft();
    draft.name = "   ";

    expect(getCompanyCreationStep(draft)).toBe("name");
    expect(getMissingCompanyCreationRequirements(draft)).toContain("name");
    expect(canAccessCompanyManager(draft)).toBe(false);
  });

  it("advances past name when a non-empty name is provided", () => {
    const draft = baseDraft();
    draft.companyTypeId = null;

    expect(getCompanyCreationStep(draft)).toBe("companyType");
  });
});

// ---------------------------------------------------------------------------
// Step 2 — Company type
// ---------------------------------------------------------------------------

describe("company creation: company type step", () => {
  it("blocks progress when company type is missing", () => {
    const draft = baseDraft();
    draft.companyTypeId = null;

    expect(getCompanyCreationStep(draft)).toBe("companyType");
    expect(getMissingCompanyCreationRequirements(draft)).toContain(
      "companyType",
    );
    expect(canAccessCompanyManager(draft)).toBe(false);
  });

  it("blocks progress when company type is empty string", () => {
    const draft = baseDraft();
    draft.companyTypeId = "";

    expect(getCompanyCreationStep(draft)).toBe("companyType");
    expect(getMissingCompanyCreationRequirements(draft)).toContain(
      "companyType",
    );
  });

  it("advances past company type when one is chosen", () => {
    const draft = baseDraft();
    draft.sectorial1Id = null;

    expect(getCompanyCreationStep(draft)).toBe("sectorials");
  });
});

// ---------------------------------------------------------------------------
// Step 3 — Sectorials
// ---------------------------------------------------------------------------

describe("company creation: sectorial step", () => {
  it("blocks progress when primary sectorial is missing", () => {
    const draft = baseDraft();
    draft.sectorial1Id = null;

    expect(getCompanyCreationStep(draft)).toBe("sectorials");
    expect(getMissingCompanyCreationRequirements(draft)).toContain(
      "sectorial1",
    );
    expect(canAccessCompanyManager(draft)).toBe(false);
  });

  it("blocks progress when primary sectorial is zero or negative", () => {
    const draft = baseDraft();
    draft.sectorial1Id = 0;

    expect(getCompanyCreationStep(draft)).toBe("sectorials");
    expect(getMissingCompanyCreationRequirements(draft)).toContain(
      "sectorial1",
    );
  });

  it("advances past sectorials when primary is chosen, even without a second", () => {
    const draft = baseDraft();
    draft.sectorial2Id = null;
    draft.captainProfileId = null;

    expect(getCompanyCreationStep(draft)).toBe("captain");
  });

  it("allows two different sectorials", () => {
    const draft = baseDraft();
    draft.sectorial1Id = 10;
    draft.sectorial2Id = 17;

    expect(validateCompanyCreationDraft(draft)).toEqual([]);
  });

  it("rejects duplicate sectorial selections", () => {
    const draft = baseDraft();
    draft.sectorial2Id = draft.sectorial1Id;

    expect(validateCompanyCreationDraft(draft)).toContain(
      "Sectorial 1 and Sectorial 2 cannot be the same.",
    );
  });

  it("allows empty second sectorial for single-sectorial companies", () => {
    const draft = baseDraft();
    draft.sectorial2Id = null;

    expect(validateCompanyCreationDraft(draft)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Step 4 — Captain eligibility
// ---------------------------------------------------------------------------

describe("captain eligibility", () => {
  it("accepts a Spec-Ops profile as captain", () => {
    const candidate = specOpsCandidate({
      isSpecOps: true,
      hasLieutenant: false,
    });
    expect(isCaptainEligible(candidate)).toBe(true);
  });

  it("accepts a Lieutenant profile as captain", () => {
    const candidate = specOpsCandidate({
      profileId: "kuge-delegate",
      isSpecOps: false,
      hasLieutenant: true,
    });
    expect(isCaptainEligible(candidate)).toBe(true);
  });

  it("accepts a profile that is both Spec-Ops and has Lieutenant", () => {
    const candidate = specOpsCandidate({
      isSpecOps: true,
      hasLieutenant: true,
    });
    expect(isCaptainEligible(candidate)).toBe(true);
  });

  it("rejects a profile that is neither Spec-Ops nor Lieutenant", () => {
    const candidate = specOpsCandidate({
      profileId: "regular-infantry",
      isSpecOps: false,
      hasLieutenant: false,
    });
    expect(isCaptainEligible(candidate)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Step 4 — Captain XP calculation
// ---------------------------------------------------------------------------

describe("captain XP calculation", () => {
  it("is 18 XP for a 10 CR unit (Keisotsu Spec-Ops)", () => {
    expect(calculateCaptainXp(10)).toBe(18);
  });

  it("is 4 XP for a 24 CR unit (Muyib Spec-Ops)", () => {
    expect(calculateCaptainXp(24)).toBe(4);
  });

  it("is 0 XP when CR cost equals 28", () => {
    expect(calculateCaptainXp(28)).toBe(0);
  });

  it("clamps to 0 XP when CR cost exceeds 28 (Knight of Santiago example)", () => {
    expect(calculateCaptainXp(35)).toBe(0);
  });

  it("is 28 XP for a free (0 CR) unit", () => {
    expect(calculateCaptainXp(0)).toBe(28);
  });
});

// ---------------------------------------------------------------------------
// Company creation complete
// ---------------------------------------------------------------------------

describe("company creation: completion", () => {
  it("is complete when all required fields are present", () => {
    const draft = baseDraft();

    expect(getCompanyCreationStep(draft)).toBe("complete");
    expect(getMissingCompanyCreationRequirements(draft)).toEqual([]);
    expect(canAccessCompanyManager(draft)).toBe(true);
  });

  it("blocks access to company manager when captain is still missing", () => {
    const draft = baseDraft();
    draft.captainProfileId = "";

    expect(getCompanyCreationStep(draft)).toBe("captain");
    expect(getMissingCompanyCreationRequirements(draft)).toContain("captain");
    expect(canAccessCompanyManager(draft)).toBe(false);
  });

  it("captain step is the final gate before completion", () => {
    // Everything except captain is present — step must be 'captain', not 'complete'.
    const draft = baseDraft();
    draft.captainProfileId = null;

    expect(getCompanyCreationStep(draft)).toBe("captain");
    expect(canAccessCompanyManager(draft)).toBe(false);
  });
});
