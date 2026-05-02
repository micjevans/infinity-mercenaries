import { describe, expect, it } from "vitest";
import {
  cleanUnitForRoster,
  flattenTrooperForRoster,
  getCaptainSpecOpsXpBudget,
} from "./trooperUtils";

describe("captain spec-ops XP budget", () => {
  it("uses normal 28 minus points for regular captains", () => {
    const trooper = {
      profileGroups: [{ options: [{ points: 10 }] }],
    };
    expect(getCaptainSpecOpsXpBudget(trooper)).toBe(18);
  });

  it("uses fixed 20 XP for TAG company special profile", () => {
    const trooper = {
      id: "tag-company-special-profile",
      profileGroups: [{ options: [{ points: 40 }] }],
    };
    expect(getCaptainSpecOpsXpBudget(trooper)).toBe(20);
  });
});

describe("cleanUnitForRoster captain requirements", () => {
  it("adds Lieutenant and Specialist Operative skills plus Lieutenant order for captains", () => {
    const unit: any = {
      id: "unit-1",
      slug: "unit-1",
      isc: "Test Unit",
      profileGroups: [],
    };
    const group: any = {
      profiles: [{ name: "Base Profile", skills: [] }],
      options: [],
    };
    const option: any = {
      name: "Base Option",
      points: 20,
      swc: "0",
      skills: [],
      orders: [{ type: "REGULAR", list: 1, total: 1 }],
    };

    const cleaned = cleanUnitForRoster(unit, group, option, true);
    const skills = cleaned.profileGroups[0].profiles[0].skills || [];
    const skillNames = skills.map((skill: any) => String(skill.name));
    const orders = cleaned.profileGroups[0].options[0].orders || [];
    const orderTypes = orders.map((order: any) => String(order.type));

    expect(skillNames).toContain("Lieutenant");
    expect(skillNames).toContain("Specialist Operative");
    expect(orderTypes).toContain("REGULAR");
    expect(orderTypes).toContain("LIEUTENANT");
  });

  it("does not inject captain-only skills for non-captain troopers", () => {
    const unit: any = {
      id: "unit-2",
      slug: "unit-2",
      isc: "Test Unit",
      profileGroups: [],
    };
    const group: any = {
      profiles: [{ name: "Base Profile", skills: [] }],
      options: [],
    };
    const option: any = {
      name: "Base Option",
      points: 20,
      swc: "0",
      skills: [],
      orders: [{ type: "REGULAR", list: 1, total: 1 }],
    };

    const cleaned = cleanUnitForRoster(unit, group, option, false);
    const skills = cleaned.profileGroups[0].profiles[0].skills || [];
    const skillNames = skills.map((skill: any) => String(skill.name));
    const orders = cleaned.profileGroups[0].options[0].orders || [];
    const orderTypes = orders.map((order: any) => String(order.type));

    expect(skillNames).not.toContain("Lieutenant");
    expect(skillNames).not.toContain("Specialist Operative");
    expect(orderTypes).toEqual(["REGULAR"]);
  });
});

describe("flattenTrooperForRoster", () => {
  it("moves selected profile data to parent and removes profiles", () => {
    const trooper: any = {
      isc: "Order Sergeants",
      profileGroups: [
        {
          category: 10,
          profiles: [
            {
              name: "Order Sergeant",
              move: [4, 4],
              cc: 16,
              bs: 12,
              ph: 10,
              wip: 13,
              arm: 1,
              bts: 3,
              w: 1,
              s: 2,
              type: "LI",
              skills: [{ id: 189, name: "Specialist Operative" }],
              weapons: [{ id: 1, name: "Combi Rifle" }],
              equip: [{ id: 2, name: "MedKit" }],
            },
          ],
          options: [
            {
              name: "Order Sergeant",
              points: 14,
              swc: "0",
              orders: [{ type: "REGULAR", list: 1, total: 1 }],
            },
          ],
        },
      ],
    };

    const flattened = flattenTrooperForRoster(trooper);

    expect(flattened.profileGroups).toEqual([]);
    expect(flattened.name).toBe("Order Sergeant");
    expect(flattened.points).toBe(14);
    expect(flattened.swc).toBe("0");
    expect(flattened.orders?.[0]?.type).toBe("REGULAR");
    expect(flattened.bs).toBe(12);
    expect(
      flattened.skills?.some((s: any) => s.name === "Specialist Operative"),
    ).toBe(true);
    expect(flattened.weapons?.some((w: any) => w.name === "Combi Rifle")).toBe(
      true,
    );
  });
});
