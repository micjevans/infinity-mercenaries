import { describe, expect, it, vi } from "vitest";

vi.mock("./metadata", () => ({
  findFactionBySlug: vi.fn(() => ({ name: "Mock Faction" })),
  loadFactionData: vi.fn(async () => null),
  loadFactionDataSet: vi.fn(async () => []),
  mapType: vi.fn((value: unknown) => String(value ?? "")),
}));

import { loadFactionDataSet } from "./metadata";
import { getRecruitableUnits, loadRecruitmentPool } from "./recruitment";
import type { FactionData, Unit } from "./types";

describe("recruitment pool and captain filters", () => {
  it("includes specops.units in recruitment pool", async () => {
    const baseUnit: Unit = {
      id: 1,
      slug: "order-sergeants",
      isc: "Order Sergeants",
      profileGroups: [
        {
          profiles: [{ name: "ORDER SERGEANTS", skills: [] }],
          options: [{ id: 1, name: "Base", swc: "0", points: 13, skills: [] }],
        },
      ],
    } as unknown as Unit;

    const specopsUnit: Unit = {
      id: 1,
      slug: "order-sergeants-specops",
      isc: "Order Sergeants",
      profileGroups: [
        {
          profiles: [{ name: "ORDER SERGEANTS", skills: [] }],
          options: [
            {
              id: 13,
              name: "ORDER SERGEANTS INDIGO FTO",
              swc: "0",
              points: 14,
              skills: [{ id: 204 }],
            },
          ],
        },
      ],
    } as unknown as Unit;

    const data: FactionData = {
      units: [baseUnit],
      resume: [
        { id: 1, type: 1, logo: "https://example.com/order-sergeant.svg" },
      ],
      specops: {
        equip: [],
        skills: [],
        weapons: [],
        units: [specopsUnit],
      } as any,
    };

    vi.mocked(loadFactionDataSet).mockResolvedValueOnce([data]);

    const pool = await loadRecruitmentPool(["military-orders"]);
    expect(pool.units.length).toBe(2);
    expect(pool.units.some((u) => u.slug === "order-sergeants-specops")).toBe(
      true,
    );
  });

  it("shows specops option in captain filter", () => {
    const captainSpecops: Unit = {
      id: 1,
      slug: "order-sergeants-specops",
      isc: "Order Sergeants",
      profileGroups: [
        {
          profiles: [{ name: "ORDER SERGEANTS", skills: [] }],
          options: [
            {
              id: 13,
              name: "ORDER SERGEANTS INDIGO FTO",
              swc: "0",
              points: 14,
              skills: [{ id: 204 }],
            },
          ],
        },
      ],
    } as unknown as Unit;

    const filtered = getRecruitableUnits([captainSpecops], true, {
      companyTypeId: "tag",
      existingTroopers: [],
    });

    expect(filtered.some((u) => u.slug === "order-sergeants-specops")).toBe(
      true,
    );
  });

  it("injects TAG special profile only when not already used", () => {
    const noExisting = getRecruitableUnits([], true, {
      companyTypeId: "tag",
      existingTroopers: [],
    });
    expect(noExisting.some((u: any) => u.tagCompanySpecialTag)).toBe(true);

    const withExisting = getRecruitableUnits([], true, {
      companyTypeId: "tag",
      existingTroopers: [{ id: "tag-company-special-profile" }],
    });
    expect(withExisting.some((u: any) => u.tagCompanySpecialTag)).toBe(false);
  });
});
