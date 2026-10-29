import { describe, expect, it } from "vitest";
import {
  emptyScenarioFilters,
  filterScenarios,
  planChangeMatrix,
  scenarioGroups,
  scenarios,
} from "./scenarios";

describe("Discovery catalogue navigation and search", () => {
  it("combines group, phase, dimension, type and word filters", () => {
    const found = filterScenarios({
      ...emptyScenarioFilters,
      group: "sheets",
      phase: "change",
      dimension: "Deadlines",
      kind: "change",
      query: "  PERSONAL   GROUP  ",
    });
    expect(found.map((s) => s.id)).toEqual(["sheet-personal-override"]);
    expect(
      filterScenarios({
        ...emptyScenarioFilters,
        query: "  ORIGINAL   TITLE ",
      }).map((s) => s.id),
    ).toContain("wrong-mr-title");
    expect(
      filterScenarios({
        ...emptyScenarioFilters,
        query: "nothing-matches-this-query",
      }),
    ).toEqual([]);
    expect(
      filterScenarios({ ...emptyScenarioFilters, query: "   " }),
    ).toHaveLength(scenarios.length);
  });
  it("keeps unique deep links, resolvable related cases and populated groups", () => {
    const ids = new Set(scenarios.map((s) => s.id));
    expect(ids.size).toBe(scenarios.length);
    for (const s of scenarios) {
      expect(s.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(scenarioGroups.some((g) => g.id === s.group)).toBe(true);
      for (const related of s.related ?? [])
        expect(ids.has(related)).toBe(true);
    }
    for (const group of scenarioGroups)
      expect(scenarios.some((s) => s.group === group.id)).toBe(true);
  });
  it("covers the four independent version/track combinations and real overlapping cases", () => {
    expect(
      new Set(planChangeMatrix.map((cell) => `${cell.version}/${cell.track}`))
        .size,
    ).toBe(4);
    for (const cell of planChangeMatrix)
      expect(scenarios.some((s) => s.id === cell.scenario)).toBe(true);
    const combinations = filterScenarios({
      ...emptyScenarioFilters,
      group: "combined",
    });
    expect(combinations.length).toBeGreaterThanOrEqual(5);
    expect(
      combinations.every((s) => s.dimensions.length >= 3 && s.related?.length),
    ).toBe(true);
    expect(
      filterScenarios({
        ...emptyScenarioFilters,
        dimension: "Deadlines",
        query: "planned",
      }).map((s) => s.id),
    ).toContain("longer-than-planned");
  });
});
