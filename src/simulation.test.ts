import { describe, expect, it } from "vitest";
import { metrics } from "./lab";
import {
  newRun,
  runTo,
  simulate,
  simulationSteps,
  type SimulationCourse,
  type SimulationOptions,
} from "./simulation";
const defaults = newRun().options;
const approved: SimulationOptions = { ...defaults, manualApproved: true };
function at(course: SimulationCourse, id: string, options = defaults) {
  return simulate(
    course,
    simulationSteps(course, options).findIndex((s) => s.id === id),
    options,
  );
}
describe.each(["ai", "java"] as const)("%s learning journey", (course) => {
  it("separates enrollment, first activity and delivery, and starts without invented progress", () => {
    const enrolled = at(course, "enroll").state;
    expect(enrolled.enrolled).toBe(true);
    expect(enrolled.card).toBeNull();
    const started = at(course, "start");
    expect(started.state.card!.learner.version).toBe(1);
    expect(started.progress!.accepted).toBe(0);
    expect(started.progress!.total).toBe(course === "ai" ? 6 : 30);
    expect(started.state.card!.mirrors).toEqual({ materials: 0, moodle: 0 });
    const delivered = at(course, "pin-delivery").state.card!;
    expect(delivered.mirrors).toEqual({ materials: 1, moodle: 1 });
    expect(delivered.outbox.every((o) => o.materials && o.moodle)).toBe(true);
  });
  it("changes required obligations without deleting evidence or changing the pinned version", () => {
    const prior = at(course, course === "ai" ? "practice" : "accept-practice");
    const track = at(course, "track");
    expect(prior.progress!.accepted).toBe(3);
    expect(track.progress!.accepted).toBe(3);
    expect(track.progress!.total).toBe(4);
    expect(track.state.card!.learner.version).toBe(1);
    expect(track.state.card!.learner.tasks).toHaveLength(
      prior.state.card!.learner.tasks.length,
    );
    expect(
      track.state
        .card!.history.at(-1)!
        .learner.tasks.find((t) => t.id === "TASK-03")!.evidence.length,
    ).toBeGreaterThan(0);
  });
  it("keeps the existing pin after compatible publication, revisit and critical detection", () => {
    const compatible = at(course, "revisit");
    expect(compatible.state.latest).toBe(2);
    expect(compatible.state.card!.learner.version).toBe(1);
    expect(compatible.state.compatibility).toBe("compatible");
    const critical = at(course, "detect");
    expect(critical.state.latest).toBe(3);
    expect(critical.state.card!.learner.version).toBe(1);
    expect(critical.state.compatibility).toBe("critical");
    expect(critical.progress!.accepted).toBe(3);
  });
  it("pauses at the human decision even when attempting to jump beyond it", () => {
    const requested = simulate(course, 999, defaults);
    expect(requested.state.blocked).toContain("instructor");
    expect(requested.steps[requested.cursor].id).toBe("migrate");
    expect(requested.state.card!.learner.version).toBe(1);
    expect(runTo(course, 999, defaults).cursor).toBe(requested.cursor);
    const migrated = at(course, "migrate", approved);
    expect(migrated.state.blocked).toBeNull();
    expect(migrated.state.card!.learner.version).toBe(3);
    expect(migrated.progress!.accepted).toBe(2);
    expect(migrated.progress!.total).toBe(4);
    expect(
      metrics([migrated.state.card!.history.at(-1)!.learner]).accepted,
    ).toBe(3);
    expect(
      migrated.state.card!.learner.tasks.find((t) => t.id === "TASK-03")!
        .evidence,
    ).toEqual([]);
  });
  it("requires an enabled automatic policy that permits the manifest's new obligations", () => {
    const automatic = { ...defaults, migrationMode: "automatic" as const };
    expect(at(course, "migrate", automatic).state.blocked).toContain(
      "disabled",
    );
    expect(
      at(course, "migrate", { ...automatic, automaticEnabled: true }).state
        .blocked,
    ).toContain("new obligations");
    const migrated = at(course, "migrate", {
      ...automatic,
      automaticEnabled: true,
      allowNewWork: true,
    });
    expect(migrated.state.blocked).toBeNull();
    expect(migrated.state.card!.audit.at(-1)!.actor).toBe("policy@1");
    expect(
      simulate(course, 999, {
        ...automatic,
        automaticEnabled: true,
        allowNewWork: true,
      }).state.compatibility,
    ).toBe("migrated");
  });
  it("retains the committed database version on partial delivery and retries without double credit", () => {
    const options = { ...approved, failMigrationDelivery: true };
    const failed = at(course, "migration-delivery", options);
    const c = failed.state.card!;
    expect(c.learner.version).toBe(3);
    expect(failed.state.deliveryFailed).toBe(true);
    expect(c.mirrors.moodle).toBe(c.revision);
    expect(c.mirrors.materials).toBeLessThan(c.revision);
    const retried = at(course, "retry", options);
    expect(retried.state.deliveryFailed).toBe(false);
    expect(retried.state.card!.mirrors.materials).toBe(
      retried.state.card!.revision,
    );
    expect(
      retried.state.card!.outbox.every((o) => o.materials && o.moodle),
    ).toBe(true);
    expect(retried.progress!.accepted).toBe(failed.progress!.accepted);
    expect(
      retried.state.card!.audit.filter(
        (a) => a.requestId === "migration-simulation-v3",
      ),
    ).toHaveLength(1);
    expect(at(course, "retry", options).state).toEqual(retried.state);
  });
  it("replays backwards deterministically without mutating earlier snapshots", () => {
    const first = at(course, "quiz");
    const serialized = JSON.stringify(first);
    simulate(course, 999, approved);
    expect(JSON.stringify(first)).toBe(serialized);
    expect(at(course, "quiz")).toEqual(first);
    expect(simulate(course, -1, approved).state.enrolled).toBe(false);
  });
});
describe("Course-specific data paths", () => {
  it("uses all seven systems in Java, while self-paced AI has no student repo, Sheets or Discord flow", () => {
    const paths = (course: SimulationCourse) =>
      new Set(
        simulationSteps(course, defaults).flatMap((s) =>
          s.transfers.flatMap((t) => [t.from, t.to]),
        ),
      );
    expect(paths("java").size).toBe(7);
    expect(paths("ai").has("work")).toBe(false);
    expect(paths("ai").has("discord")).toBe(false);
    expect(paths("ai").has("sheets")).toBe(false);
    expect(at("java", "start").state.groupPlanReceived).toBe(true);
  });
  it("does not award credit for MR submission, duplicate link, tests, review or merge", () => {
    for (const id of ["mr-submit", "moodle-link", "mr-review"]) {
      const r = at("java", id);
      expect(r.progress!.accepted).toBe(2);
      expect(
        r.state.card!.learner.tasks.find((t) => t.id === "TASK-03")!.status,
      ).toBe("review");
    }
    const accepted = at("java", "accept-practice");
    expect(accepted.progress!.accepted).toBe(3);
    expect(
      accepted.state.card!.learner.tasks.find((t) => t.id === "TASK-03")!.score,
    ).toBeNull();
  });
  it("keeps Discord extraction as a proposal until explicit confirmation, retaining provenance", () => {
    const before = at("java", "discord");
    const after = at("java", "confirm-deadline");
    expect(before.state.clarification).toBe("proposed");
    expect(
      before.state.card!.learner.tasks.find((t) => t.id === "TASK-03")!.due,
    ).not.toBe("2026-10-22T20:59:00Z");
    expect(after.state.clarification).toBe("confirmed");
    expect(
      after.state.card!.learner.tasks.find((t) => t.id === "TASK-03")!.due,
    ).toBe("2026-10-22T20:59:00Z");
    expect(after.state.card!.audit.at(-1)!.reason).toContain("message-105");
    expect(after.state.card!.history.at(-1)!.reason).toContain("Discord");
  });
});
