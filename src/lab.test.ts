import { describe, expect, it } from "vitest";
import {
  ingest,
  learnersFor,
  metrics,
  packetKey,
  packets,
  routePacket,
  sortFacts,
} from "./lab";
describe("Read-only intake and evidence routing", () => {
  it("deduplicates the same origin and revision while retaining changed revisions", () => {
    let state = ingest({ facts: [], duplicates: 0 }, packets[0]);
    state = ingest(state, packets[0]);
    expect(state.facts).toHaveLength(1);
    expect(state.duplicates).toBe(1);
    state = ingest(state, {
      ...packets[0],
      revision: "corrected-grade",
      value: 9,
    });
    expect(state.facts).toHaveLength(2);
    expect(state.facts[0].value).toBe(8);
  });
  it("scopes IDs by instance and object type", () => {
    expect(packetKey(packets[0])).not.toBe(
      packetKey({ ...packets[0], instance: "another-school" }),
    );
    expect(packetKey(packets[0])).not.toBe(
      packetKey({ ...packets[0], type: "grade_item" }),
    );
  });
  it("routes missing identities to review and Sheets to proposals, never to automatic credit", () => {
    expect(routePacket({ ...packets[1], learner: null })).toBe("review-queue");
    expect(routePacket(packets[1])).toBe("evidence");
    expect(routePacket(packets[2])).toBe("plan-proposal");
  });
  it("sorts by event time without changing the received order", () => {
    const facts = [packets[1], packets[0], packets[2]];
    const sorted = sortFacts(facts);
    expect(sorted.map((p) => p.source)).toEqual(["Sheets", "Moodle", "GitLab"]);
    expect(facts[0].source).toBe("GitLab");
  });
});
describe("Student and group statistics", () => {
  it("uses required plans, excludes optional work and keeps group denominators distinct", () => {
    const students = learnersFor("java");
    expect(metrics([students[0]]).total).toBe(30);
    expect(metrics(students.filter((s) => s.group === "B")).total).toBe(105);
    const withOptionalCredit = structuredClone(students[0]);
    withOptionalCredit.tasks
      .filter((t) => !t.required)
      .forEach((t) => (t.status = "accepted"));
    expect(metrics([withOptionalCredit]).percent).toBe(
      metrics([students[0]]).percent,
    );
  });
  it("aggregates group weights rather than averaging percentages with different denominators", () => {
    const [a, b] = learnersFor("java");
    a.tasks = a.tasks.slice(0, 2);
    a.tasks[0].status = "accepted";
    a.tasks[1].status = "todo";
    a.tasks[0].weight = 3;
    b.tasks = b.tasks.slice(0, 1);
    b.tasks[0].status = "todo";
    expect(metrics([a, b]).percent).toBe(60);
  });
  it("distinguishes missing grades from zero and unknown tasks from overdue work", () => {
    const [s] = learnersFor("moodle");
    s.tasks = s.tasks.slice(0, 2);
    s.tasks[0].score = 0;
    s.tasks[1].score = null;
    s.tasks[1].status = "unknown";
    s.tasks[1].due = "2020-01-01T00:00:00Z";
    expect(metrics([s]).score).toBe(0);
    expect(metrics([s]).graded).toBe(1);
    expect(metrics([s]).backlog).toBe(0);
    expect(metrics([s]).unknown).toBe(1);
  });
  it("has no invented metrics for an empty population and self-paced mode has no groups or deadlines", () => {
    expect(metrics([]).percent).toBeNull();
    expect(metrics([]).score).toBeNull();
    expect(
      learnersFor("ai").every(
        (s) => s.group === null && s.tasks.every((t) => t.due === null),
      ),
    ).toBe(true);
  });
  it("counts an accepted MR task once without inventing an assessment score", () => {
    const [s] = learnersFor("java");
    const before = metrics([s]);
    const task = s.tasks.find((t) => t.id === "TASK-21")!;
    task.status = "accepted";
    const after = metrics([s]);
    expect(after.accepted).toBe(before.accepted + 1);
    expect(after.graded).toBe(before.graded);
  });
});
