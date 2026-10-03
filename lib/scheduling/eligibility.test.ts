import { describe, expect, it } from "vitest";
import { getEligibleBeauticians } from "./eligibility";
import type { BeauticianCandidate } from "./types";

function beautician(overrides: Partial<BeauticianCandidate>): BeauticianCandidate {
  return {
    id: "b1",
    isActive: true,
    serviceIds: ["svc-haircut"],
    areaIds: ["area-deira"],
    availability: [],
    timeOff: [],
    ...overrides,
  };
}

describe("getEligibleBeauticians", () => {
  it("includes an active beautician who covers the area and has every requested skill", () => {
    const b = beautician({ serviceIds: ["svc-haircut", "svc-color"] });
    const result = getEligibleBeauticians([b], {
      areaId: "area-deira",
      serviceIds: ["svc-haircut", "svc-color"],
    });
    expect(result).toEqual([b]);
  });

  it("excludes an inactive beautician even if area and skills match", () => {
    const b = beautician({ isActive: false });
    const result = getEligibleBeauticians([b], {
      areaId: "area-deira",
      serviceIds: ["svc-haircut"],
    });
    expect(result).toEqual([]);
  });

  it("excludes a beautician who doesn't cover the requested area", () => {
    const b = beautician({ areaIds: ["area-marina"] });
    const result = getEligibleBeauticians([b], {
      areaId: "area-deira",
      serviceIds: ["svc-haircut"],
    });
    expect(result).toEqual([]);
  });

  it("ignores coverage areas entirely when no areaId is given (free-text area)", () => {
    const covers = beautician({ id: "b1", areaIds: ["area-deira"] });
    const coversNothing = beautician({ id: "b2", areaIds: [] });
    const result = getEligibleBeauticians([covers, coversNothing], {
      serviceIds: ["svc-haircut"],
    });
    expect(result).toEqual([covers, coversNothing]);
  });

  it("still requires every skill when no areaId is given", () => {
    const b = beautician({ serviceIds: ["svc-haircut"] });
    const result = getEligibleBeauticians([b], { serviceIds: ["svc-haircut", "svc-keratin"] });
    expect(result).toEqual([]);
  });

  it("excludes a beautician missing even one of the requested services", () => {
    const b = beautician({ serviceIds: ["svc-haircut"] });
    const result = getEligibleBeauticians([b], {
      areaId: "area-deira",
      serviceIds: ["svc-haircut", "svc-keratin"],
    });
    expect(result).toEqual([]);
  });

  it("returns an empty array when no beautician qualifies (no eligible beautician)", () => {
    const b1 = beautician({ id: "b1", areaIds: ["area-marina"] });
    const b2 = beautician({ id: "b2", isActive: false });
    const result = getEligibleBeauticians([b1, b2], {
      areaId: "area-deira",
      serviceIds: ["svc-haircut"],
    });
    expect(result).toEqual([]);
  });

  it("returns an empty array when given no beauticians at all", () => {
    expect(
      getEligibleBeauticians([], { areaId: "area-deira", serviceIds: ["svc-haircut"] }),
    ).toEqual([]);
  });
});
