import { describe, expect, it } from "vitest";
import {
  completion,
  groupPlan,
  linkEvidence,
  migrationTasks,
  previewMigration,
  resolveVersion,
  uniqueLinkedTasks,
} from "./model";

describe("Progress follows the locked required plan", () => {
  it("uses 30 and 35 required obligations for different groups, never 100 Moodle activities", () => {
    expect(completion(groupPlan("A"))).toEqual({
      denominator: 30,
      accepted: 18,
      percent: 60,
    });
    expect(completion(groupPlan("B")).denominator).toBe(35);
    expect(completion(groupPlan("B")).percent).toBeCloseTo(51.42857);
  });
  it("includes accepted required weights only; submissions, unknown and optional work do not grant credit", () => {
    expect(
      completion([
        { id: "a", required: true, weight: 2, status: "accepted" },
        { id: "b", required: true, weight: 1, status: "submitted" },
        { id: "c", required: true, weight: 1, status: "unknown" },
        { id: "d", required: false, weight: 10, status: "accepted" },
      ]),
    ).toEqual({ denominator: 4, accepted: 2, percent: 50 });
  });
  it("has no fabricated percentage when there is no applicable denominator", () => {
    expect(completion([]).percent).toBeNull();
  });
});

describe("Version and history invariants", () => {
  it("keeps existing v1 lock when v2-v5 are released, and assigns current release to new starts", () => {
    for (const release of [2, 3, 4, 5])
      expect(resolveVersion(1, release)).toBe(1);
    expect(resolveVersion(null, 5)).toBe(5);
  });
  it("does not change source evidence or fabricate credit for incompatible tasks during preview", () => {
    const before = structuredClone(migrationTasks);
    expect(previewMigration()).toEqual({
      oldTotal: 6,
      oldAccepted: 4,
      newTotal: 6,
      carried: 2,
      pending: 4,
    });
    expect(migrationTasks).toEqual(before);
  });
  it("does not carry a result that was not accepted even if assessment compatibility exists", () => {
    expect(
      previewMigration([
        {
          id: "X",
          name: "X",
          action: "CARRY_OVER",
          reason: "compatible",
          oldAccepted: false,
        },
      ]).carried,
    ).toBe(0);
  });
});

describe("Evidence association", () => {
  it("retains one MR to multiple tasks and multiple MRs to one task without double counting", () => {
    let links = linkEvidence({}, "MR-42", ["JAVA-010", "JAVA-011", "JAVA-011"]);
    links = linkEvidence(links, "MR-43", ["JAVA-011"]);
    expect(links["MR-42"]).toEqual(["JAVA-010", "JAVA-011"]);
    expect(links["MR-43"]).toEqual(["JAVA-011"]);
    expect(uniqueLinkedTasks(links)).toEqual(["JAVA-010", "JAVA-011"]);
  });
  it("keeps previous links immutable when superseded", () => {
    const previous = { "MR-42": ["JAVA-010"] };
    const next = linkEvidence(previous, "MR-42", ["JAVA-011"]);
    expect(previous["MR-42"]).toEqual(["JAVA-010"]);
    expect(next["MR-42"]).toEqual(["JAVA-011"]);
  });
});
