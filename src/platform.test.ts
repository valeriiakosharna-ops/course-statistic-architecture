import { describe, expect, it } from "vitest";
import { learnersFor, metrics, packets, routePacket } from "./lab";
import {
  assignTrack,
  clarifyDeadline,
  createCard,
  critical,
  manifestFor,
  migrate,
  migrationBlock,
  pinVersion,
  preview,
  resolveBuild,
  syncMirror,
  systems,
  vocabulary,
  type Policy,
} from "./platform";
const policy: Policy = {
  automatic: false,
  allowNewWork: false,
  fresh: true,
  authorized: true,
};
const card = () => createCard(learnersFor("java")[0]);
describe("Seven systems and logical vocabulary", () => {
  it("keeps two GitLab roles and the requested 22 terms distinct", () => {
    expect(systems).toHaveLength(7);
    expect(new Set(systems.map((s) => s.id)).size).toBe(7);
    expect(vocabulary).toHaveLength(22);
    expect(vocabulary.find((t) => t.id === "pr")!.definition).toContain(
      "GitHub",
    );
    expect(vocabulary.find((t) => t.id === "unit")!.level).toBeLessThan(
      vocabulary.find((t) => t.id === "version")!.level,
    );
  });
  it("routes manifests, Discord and Sheet grades separately from evidence and plans", () => {
    expect(routePacket(packets[3])).toBe("course-config");
    expect(routePacket(packets[4])).toBe("clarification-proposal");
    expect(routePacket(packets[5])).toBe("grade-candidate");
    expect(routePacket({ ...packets[5], learner: null })).toBe("review-queue");
  });
});
describe("Version pinning, manifest and credit transfer", () => {
  it("pins latest once and leaves a returning student on their previous tag", () => {
    expect(pinVersion(null, 2)).toBe(2);
    expect(pinVersion(2, 3)).toBe(2);
  });
  it("uses explicit manifest criticality rather than numerical version distance", () => {
    const c = card();
    expect(manifestFor(c.learner, 2).critical).toBe(false);
    expect(manifestFor(c.learner, 3).critical).toBe(true);
    expect(critical(c)).toBe(true);
    expect(critical(createCard(learnersFor("java")[5]))).toBe(false);
  });
  it("carries compatible credit, requires repeat and supplement, retires old and adds new without fabricating grades", () => {
    const c = card(),
      m = manifestFor(c.learner),
      p = preview(c, m);
    expect(p.tasks.find((t) => t.id === "TASK-01")).toEqual(c.learner.tasks[0]);
    for (const id of ["TASK-03", "TASK-04"]) {
      const t = p.tasks.find((t) => t.id === id)!;
      expect(t.status).toBe("todo");
      expect(t.score).toBeNull();
      expect(t.submitted).toBe(false);
      expect(t.due).toBeNull();
    }
    expect(p.tasks.some((t) => t.id === "TASK-05")).toBe(false);
    expect(p.tasks.find((t) => t.id === "NEW-01")!.status).toBe("todo");
    expect(metrics([p]).total).toBe(metrics([c.learner]).total);
    expect(metrics([p]).accepted).toBeLessThan(metrics([c.learner]).accepted);
    expect(c.learner.tasks[2].status).toBe("accepted");
  });
  it("retains unaccepted work as unaccepted and preserves individual optionality during migration", () => {
    let c = card();
    c = assignTrack(c, "individual", "track-1");
    const p = preview(c, manifestFor(c.learner));
    expect(p.tasks.find((t) => t.id === "NEW-01")!.required).toBe(false);
    expect(p.tasks.find((t) => t.id === "TASK-21")!.status).toBe("review");
    expect(metrics([p]).total).toBe(4);
  });
  it("stops automatic migration until the course owner allows the new obligations", () => {
    const c = card(),
      m = manifestFor(c.learner),
      automatic = { ...policy, automatic: true };
    expect(migrationBlock(c, m, automatic)).toContain("новые обязательства");
    expect(
      migrationBlock(c, m, { ...automatic, allowNewWork: true }),
    ).toBeNull();
    expect(
      migrate(c, m, { ...automatic, allowNewWork: true }, 1, "auto-1").audit[0]
        .actor,
    ).toBe("policy@1");
  });
  it("blocks unapproved, incomplete, ambiguous, stale and unauthorized migrations", () => {
    const c = card(),
      m = manifestFor(c.learner);
    for (const invalid of [
      { ...m, approved: false },
      { ...m, complete: false },
      { ...m, mappings: m.mappings.slice(1) },
      { ...m, mappings: [...m.mappings, m.mappings[0]] },
    ])
      expect(() => migrate(c, invalid, policy, 1, "bad")).toThrow();
    expect(() =>
      migrate(c, m, { ...policy, fresh: false }, 1, "bad"),
    ).toThrow();
    expect(() =>
      migrate(c, m, { ...policy, authorized: false }, 1, "bad"),
    ).toThrow();
  });
  it("commits history, version and outbox together, rejects stale previews and ignores repeated commands", () => {
    const c = card(),
      m = manifestFor(c.learner);
    const next = migrate(c, m, policy, 1, "move-1");
    expect(next.learner.version).toBe(3);
    expect(next.revision).toBe(2);
    expect(next.history[0].learner).toEqual(c.learner);
    expect(next.history[0].learner).not.toBe(c.learner);
    expect(next.outbox).toEqual([
      { revision: 2, materials: false, moodle: false },
    ]);
    expect(migrate(next, m, policy, 1, "move-1")).toBe(next);
    expect(() =>
      migrate(assignTrack(c, "individual", "track"), m, policy, 1, "stale"),
    ).toThrow("Карточка изменилась");
  });
});
describe("Projections, delivery and track decisions", () => {
  it("keeps DB authoritative during partial delivery and never rolls back a mirror on stale events", () => {
    let c = migrate(card(), manifestFor(card().learner), policy, 1, "move");
    c = syncMirror(c, "moodle");
    expect(c.mirrors).toEqual({ materials: 1, moodle: 2 });
    expect(resolveBuild(c, true, false)).toBe("course-v3/index.html");
    c = syncMirror(c, "materials");
    expect(c.outbox[0]).toEqual({ revision: 2, materials: true, moodle: true });
    expect(syncMirror(c, "materials", 1)).toBe(c);
    expect(resolveBuild(c, false, false)).toBeNull();
    expect(resolveBuild(c, false, true)).toBe("course-v3/index.html");
  });
  it("changes the denominator through an explicit track decision, without deleting prior results", () => {
    const c = card(),
      assigned = assignTrack(c, "individual", "track");
    expect(metrics([assigned.learner]).total).toBe(4);
    expect(assigned.learner.tasks).toHaveLength(c.learner.tasks.length);
    expect(assigned.history[0].learner.tasks).toEqual(c.learner.tasks);
    expect(assignTrack(assigned, "individual", "track")).toBe(assigned);
    expect(
      metrics([assignTrack(assigned, "group", "group").learner]).total,
    ).toBe(30);
  });
  it("applies a confirmed Discord clarification only in its group and only once", () => {
    const c = card(),
      next = clarifyDeadline(c);
    expect(next.learner.tasks[0].due).toBe("2026-10-22T20:59:00Z");
    expect(next.history[0].learner.tasks[0].due).toBe(c.learner.tasks[0].due);
    expect(clarifyDeadline(next)).toBe(next);
    const b = createCard(learnersFor("java")[3]);
    expect(clarifyDeadline(b)).toBe(b);
  });
});
