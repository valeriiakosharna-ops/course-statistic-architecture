import {
  AS_OF,
  learnersFor,
  metrics,
  type Learner,
  type StudentTask,
} from "./lab";
import {
  assignTrack,
  createCard,
  manifestFor,
  migrate,
  migrationBlock,
  syncMirror,
  type Card,
  type SystemId,
} from "./platform";

export type SimulationCourse = "ai" | "java";
export type SimulationOptions = {
  migrationMode: "manual" | "automatic";
  manualApproved: boolean;
  automaticEnabled: boolean;
  allowNewWork: boolean;
  failMigrationDelivery: boolean;
};
export type SimulationRun = { cursor: number; options: SimulationOptions };
export const newRun = (): SimulationRun => ({
  cursor: -1,
  options: {
    migrationMode: "manual",
    manualApproved: false,
    automaticEnabled: false,
    allowNewWork: false,
    failMigrationDelivery: false,
  },
});
export type Transfer = {
  from: SystemId;
  to: SystemId;
  via: string;
  label: string;
  payload: Record<string, unknown>;
};
export type SimulationStep = {
  id: string;
  title: string;
  actor: string;
  trigger: string;
  effect: string;
  transfers: Transfer[];
};
export type SimulationState = {
  enrolled: boolean;
  latest: number;
  card: Card | null;
  groupPlanReceived: boolean;
  mr: "none" | "submitted" | "reviewed" | "accepted";
  clarification: "none" | "proposed" | "confirmed";
  compatibility: "unchecked" | "compatible" | "critical" | "migrated";
  blocked: string | null;
  deliveryFailed: boolean;
  lastApplied: number;
};
const transfer = (
  from: SystemId,
  to: SystemId,
  label: string,
  via: string,
  payload: Record<string, unknown>,
): Transfer => ({ from, to, label, via, payload });
const context = { student_id: "S-1", moodle_user_id: 104 };
const event = (
  id: string,
  title: string,
  actor: string,
  trigger: string,
  effect: string,
  transfers: Transfer[],
): SimulationStep => ({ id, title, actor, trigger, effect, transfers });

export function simulationSteps(
  course: SimulationCourse,
  options: SimulationOptions,
): SimulationStep[] {
  const java = course === "java";
  const courseId = java ? "java-dual" : "ai-foundations";
  const base = { ...context, course_id: courseId };
  return [
    event(
      "enroll",
      "Enroll in the course",
      "Moodle administrator",
      "user_enrolment_created",
      "Link the Moodle account to S-1. Enrollment creates identity and access; it does not pin a course version.",
      [
        transfer("moodle", "db", "Enrollment", "Moodle event → ingestion job", {
          ...base,
          enrolled: true,
          group_id: java ? "A" : null,
          pinned_version: null,
        }),
        transfer("db", "atlas", "Enrollment visible", "Student record API", {
          ...base,
          status: "enrolled, not started",
        }),
      ],
    ),
    ...(java
      ? [
          event(
            "group-plan",
            "Import the group assignment template",
            "Sheets sync job",
            "Approved group A rows changed",
            "Store 30 required activities and deadlines as the approved group template. Personal assignments will be linked when the learning record starts.",
            [
              transfer(
                "sheets",
                "db",
                "Group A template",
                "Sheets API → typed rows",
                {
                  course_id: courseId,
                  group_id: "A",
                  required_activities: 30,
                  template_revision: 1,
                  timezone: "Europe/Kyiv",
                },
              ),
            ],
          ),
        ]
      : []),
    event(
      "start",
      "Open the first learning activity",
      "Student in Moodle",
      "First meaningful activity opened",
      "Atomically pin the latest published release, v1, and create the personal track. A repeated request reads the same pin.",
      [
        transfer(
          "moodle",
          "db",
          "Start + verified identity",
          "Authenticated plugin → pin transaction",
          {
            ...base,
            activity_id: "TASK-01",
            request_id: "first-start-104",
            latest_published: "course-v1",
          },
        ),
      ],
    ),
    event(
      "pin-delivery",
      "Deliver the pinned course build",
      "Outbox delivery job",
      "Version pin committed",
      "Publish the private version mapping, update Moodle's context and deliver course-v1. A static HTML build does not identify the student itself.",
      [
        transfer(
          "db",
          "materials",
          "Protected pin projection",
          "Outbox → protected JSON artifact",
          { ...base, course_tag: "course-v1", track_revision: 1 },
        ),
        transfer(
          "db",
          "moodle",
          "Version + track",
          "Plugin configuration API",
          { ...base, course_tag: "course-v1", required_count: java ? 30 : 6 },
        ),
        transfer(
          "materials",
          "moodle",
          "Exact tagged HTML",
          "Authenticated delivery component",
          {
            artifact: `${courseId}/course-v1/index.html`,
            access_checked: true,
          },
        ),
      ],
    ),
    event(
      "theory",
      "Complete the first theory activity",
      "Student in Moodle",
      "Activity completion event",
      "Accept TASK-01 completion under the course rule. Theory completion is not a fabricated quiz grade.",
      [
        transfer(
          "moodle",
          "db",
          "Theory completed",
          "Completion API / event + scheduled reconciliation",
          {
            ...base,
            activity_id: "TASK-01",
            completion: true,
            score: null,
            source_revision: "completion-1",
          },
        ),
        transfer("db", "atlas", "Progress refreshed", "Metrics snapshot", {
          ...base,
          accepted_weight: 1,
          required_weight: java ? 30 : 6,
        }),
      ],
    ),
    event(
      "quiz",
      "Pass the first quiz",
      "Student in Moodle",
      "quiz_attempt_submitted",
      "Keep the original attempt and score. The configured best-attempt policy accepts TASK-02 with 8/10.",
      [
        transfer(
          "moodle",
          "db",
          "Quiz attempt + score",
          "Moodle Web Services JSON",
          {
            ...base,
            activity_id: "TASK-02",
            attempt_id: 284,
            score: 8,
            max_score: 10,
            assessment: "assessment@1",
          },
        ),
        transfer(
          "db",
          "atlas",
          "Accepted quiz result",
          "Snapshot + source evidence",
          {
            ...base,
            accepted_weight: 2,
            required_weight: java ? 30 : 6,
            graded_count: 1,
          },
        ),
      ],
    ),
    ...(java
      ? [
          event(
            "mr-submit",
            "Submit a practical Merge Request",
            "Student in GitLab",
            "merge_request opened / updated",
            "Link MR !42 to TASK-03. The activity is submitted, not accepted; progress stays at two accepted activities.",
            [
              transfer(
                "work",
                "db",
                "MR evidence",
                "GitLab webhook + REST reconciliation",
                {
                  ...base,
                  project_id: 23,
                  mr_iid: 42,
                  activity_id: "TASK-03",
                  head_sha: "demo-sha-a3",
                  state: "opened",
                },
              ),
            ],
          ),
          event(
            "moodle-link",
            "Attach the MR link in Moodle",
            "Student in Moodle",
            "Assignment submission saved",
            "Store a second evidence link for the same activity. Linking the MR twice does not create another assignment or award credit.",
            [
              transfer(
                "moodle",
                "db",
                "Submission link",
                "Assignment submission API",
                {
                  ...base,
                  activity_id: "TASK-03",
                  url: "https://gitlab.example/student/project/-/merge_requests/42",
                  duplicate_credit: false,
                },
              ),
            ],
          ),
          event(
            "mr-review",
            "Run tests and AI-assisted review",
            "GitLab CI + reviewer",
            "MR pipeline completed",
            "CI tests pass and Claude Code suggests feedback against a rubric. The merged/reviewed MR remains evidence until the acceptance policy is satisfied.",
            [
              transfer(
                "work",
                "db",
                "Tests + review recommendation",
                "Isolated CI job → rubric-based JSON",
                {
                  ...base,
                  mr_iid: 42,
                  tests: "passed",
                  merged: true,
                  ai_recommendation: "ready for review",
                  accepted: false,
                  rubric: "practice@1",
                },
              ),
              transfer(
                "db",
                "atlas",
                "Needs instructor decision",
                "Review queue",
                { ...base, activity_id: "TASK-03", status: "under review" },
              ),
            ],
          ),
          event(
            "accept-practice",
            "Accept the practical assignment",
            "Authorized instructor",
            "Accept TASK-03 in LearningAtlas",
            "Accept one required activity, with references to MR !42 and the review. No numeric grade is invented.",
            [
              transfer(
                "atlas",
                "db",
                "Acceptance decision",
                "Authorized command + audit",
                {
                  ...base,
                  activity_id: "TASK-03",
                  accepted: true,
                  score: null,
                  request_id: "accept-practice-03",
                },
              ),
              transfer(
                "db",
                "atlas",
                "Progress refreshed",
                "Metrics snapshot",
                { ...base, accepted_weight: 3, required_weight: 30 },
              ),
            ],
          ),
          event(
            "discord",
            "Read a deadline clarification",
            "Instructor in Discord",
            "Message created or edited",
            "Store the message and extract a proposed TASK-03 deadline. No deadline changes before the author's authority, scope and time zone are confirmed.",
            [
              transfer(
                "discord",
                "db",
                "Proposed deadline",
                "Bot Gateway + REST → structured parser / AI",
                {
                  message_id: "105",
                  author_id: "teacher-7",
                  group_id: "A",
                  activity_id: "TASK-03",
                  proposed_due_at: "2026-10-22T20:59:00Z",
                  status: "proposal",
                },
              ),
              transfer(
                "db",
                "atlas",
                "Clarification awaiting approval",
                "Review queue with quotation",
                {
                  message_id: "105",
                  policy_check: "author + group + activity + timezone",
                },
              ),
            ],
          ),
          event(
            "confirm-deadline",
            "Confirm the deadline change",
            "Authorized instructor",
            "Clarification approved",
            "Revise the assignment deadline for S-1 in group A. Keep the previous deadline, source message, author and approval in history.",
            [
              transfer(
                "atlas",
                "db",
                "Confirmed clarification",
                "Decision command",
                {
                  ...base,
                  message_id: "105",
                  activity_id: "TASK-03",
                  due_at: "2026-10-22T20:59:00Z",
                  timezone: "Europe/Kyiv",
                  approved_by: "teacher-7",
                },
              ),
            ],
          ),
        ]
      : [
          event(
            "practice",
            "Complete a Moodle practical task",
            "Student + Moodle grading policy",
            "Practical result accepted",
            "Accept TASK-03 under the Moodle assessment policy, with its original 9/10 result. This course does not need student GitLab repositories.",
            [
              transfer(
                "moodle",
                "db",
                "Accepted practical result",
                "Assignment grade API",
                {
                  ...base,
                  activity_id: "TASK-03",
                  accepted: true,
                  score: 9,
                  max_score: 10,
                  assessment: "assessment@1",
                },
              ),
              transfer(
                "db",
                "atlas",
                "Progress refreshed",
                "Metrics snapshot",
                { ...base, accepted_weight: 3, required_weight: 6 },
              ),
            ],
          ),
        ]),
    event(
      "track",
      "Assign an individual learning track",
      "Instructor in LearningAtlas",
      "Personal track approved",
      "Select the first four activities as required. Keep other activities and all results as optional; the catalog and pinned version do not change.",
      [
        transfer(
          "atlas",
          "db",
          "Personal track command",
          "Expected revision + unique request_id",
          {
            ...base,
            required: ["TASK-01", "TASK-02", "TASK-03", "TASK-04"],
            source: "manual instructor decision",
            request_id: "personal-track-4",
          },
        ),
        transfer(
          "db",
          "atlas",
          "New denominator",
          "Recalculate against the new track",
          { ...base, accepted_weight: 3, required_weight: 4, progress: "75%" },
        ),
      ],
    ),
    event(
      "track-delivery",
      "Send the revised track to Moodle",
      "Outbox delivery job",
      "New track revision committed",
      "Deliver the new track and current pin. Moodle can keep a larger catalog, but only four activities count toward this student's required progress.",
      [
        transfer(
          "db",
          "moodle",
          "Updated required activities",
          "Plugin configuration API",
          { ...base, required_count: 4, pinned_version: "course-v1" },
        ),
        transfer(
          "db",
          "materials",
          "Updated track revision",
          "Protected pin projection",
          {
            ...base,
            pinned_version: "course-v1",
            track_revision: java ? 3 : 2,
          },
        ),
      ],
    ),
    event(
      "release-compatible",
      "Publish an editorial release, v2",
      "Course author + GitLab CI",
      "Protected tag course-v2 published",
      "CI checks the build and the manifest. The new release becomes available to new starters; existing students keep v1.",
      [
        transfer(
          "materials",
          "db",
          "Release v2 + manifest",
          "CI release notification + sync job",
          {
            course_id: courseId,
            tag: "course-v2",
            from: "course-v1",
            critical: false,
            mapping: "all activities compatible",
          },
        ),
      ],
    ),
    event(
      "compare-compatible",
      "Check compatibility with v2",
      "Manifest comparison job",
      "Published release imported",
      "The explicit v1 → v2 mapping is non-critical. LearningAtlas shows a compatible update; no migration command is issued.",
      [
        transfer(
          "db",
          "atlas",
          "Compatible update",
          "Manifest policy evaluation",
          {
            ...base,
            pinned: "course-v1",
            latest: "course-v2",
            critical: false,
            migrate: false,
          },
        ),
      ],
    ),
    event(
      "revisit",
      "Reopen a lesson after the new release",
      "Student in Moodle",
      "Activity opened again",
      "Read the existing v1 pin and deliver v1 again. A second visit never silently switches the student to latest.",
      [
        transfer(
          "moodle",
          "db",
          "Read existing pin",
          "Authenticated user/course lookup",
          { ...base, requested_activity: "TASK-01", existing_pin: "course-v1" },
        ),
        transfer(
          "materials",
          "moodle",
          "Still course-v1",
          "Delivery service uses the database pin",
          {
            artifact: `${courseId}/course-v1/index.html`,
            latest: "course-v2",
            selected: "course-v1",
          },
        ),
      ],
    ),
    event(
      "release-critical",
      "Publish a critical release, v3",
      "Course author + GitLab CI",
      "Approved manifest v1 → v3 released",
      "Import the new tag and explicit activity mapping. TASK-03 must be repeated; TASK-04 needs a supplement; compatible credit can transfer.",
      [
        transfer(
          "materials",
          "db",
          "Critical manifest",
          "Validated manifest.json + immutable build",
          {
            course_id: courseId,
            tag: "course-v3",
            from: "course-v1",
            critical: true,
            carry: ["TASK-01", "TASK-02"],
            repeat: ["TASK-03"],
            supplement: ["TASK-04"],
            replace: { "TASK-05": "NEW-01" },
          },
        ),
      ],
    ),
    event(
      "detect",
      "Flag the outdated student version",
      "Manifest comparison job",
      "Critical difference found for S-1",
      "Mark the student record for a migration decision. The flag itself does not change the version, track, grades or accepted work.",
      [
        transfer(
          "db",
          "atlas",
          "Decision required",
          "Version-health snapshot",
          {
            ...base,
            pinned: "course-v1",
            latest: "course-v3",
            critical: true,
            progress_unchanged: "3/4",
          },
        ),
      ],
    ),
    event(
      "migrate",
      options.migrationMode === "manual"
        ? "Approve the version migration"
        : "Run the automatic migration policy",
      options.migrationMode === "manual"
        ? "Authorized instructor"
        : "Scheduled policy job",
      options.migrationMode === "manual"
        ? "Explicit migration approval"
        : "policy@1 evaluates a critical version",
      "Validate the full mapping and policy, then save v3, a revised track, transfer evidence, history and outbox atomically. TASK-01/02 retain credit; TASK-03/04 require work. No Moodle attempts are fabricated.",
      [
        transfer(
          options.migrationMode === "manual" ? "atlas" : "db",
          "db",
          options.migrationMode === "manual"
            ? "Migration command"
            : "Policy transaction",
          options.migrationMode === "manual"
            ? "Authorized API command"
            : "Database job; no external round trip",
          {
            ...base,
            target: "course-v3",
            manifest: "demo-manifest-v1-v3",
            request_id: "migration-simulation-v3",
            actor:
              options.migrationMode === "manual" ? "instructor" : "policy@1",
          },
        ),
        transfer(
          "db",
          "atlas",
          "New version + transferred progress",
          "Committed student record snapshot",
          {
            ...base,
            pinned: "course-v3",
            accepted_weight: 2,
            required_weight: 4,
            progress: "50%",
            previous_progress: "3/4 retained in history",
          },
        ),
      ],
    ),
    event(
      "migration-delivery",
      "Deliver the new version and track",
      "Outbox delivery job",
      "Migration transaction committed",
      "Update the Moodle context and private GitLab projection independently. A failed GitLab delivery never rolls back the database decision.",
      [
        transfer(
          "db",
          "moodle",
          "Pin v3 + revised track",
          "Idempotent delivery job",
          { ...base, course_tag: "course-v3", required_count: 4 },
        ),
        transfer(
          "db",
          "materials",
          "New version projection",
          "Protected mapping update; retry on failure",
          {
            ...base,
            course_tag: "course-v3",
            request_id: "migration-simulation-v3",
          },
        ),
      ],
    ),
    event(
      "retry",
      "Reconcile and retry pending delivery",
      "Reconciliation job",
      "GitLab available; delivery queue checked",
      "Retry any undelivered projection and acknowledge it once. The student sees the correct pinned build; the old history remains accessible.",
      [
        transfer(
          "db",
          "materials",
          "Reconcile projection",
          "Retry job / acknowledgement",
          { ...base, course_tag: "course-v3", idempotent: true },
        ),
        transfer(
          "materials",
          "moodle",
          "Deliver course-v3 HTML",
          "Access-checked delivery using the database pin",
          {
            artifact: `${courseId}/course-v3/index.html`,
            student_version: "course-v3",
          },
        ),
        transfer(
          "db",
          "atlas",
          "Synchronized final record",
          "Student / group / course reports",
          {
            ...base,
            course_tag: "course-v3",
            progress: "2/4",
            old_results: "preserved",
          },
        ),
      ],
    ),
  ];
}

function startingLearner(course: SimulationCourse): Learner {
  const learner = learnersFor(course)[0];
  return {
    ...learner,
    version: 1,
    tasks: learner.tasks.map((t, i) => ({
      ...t,
      kind: i === 0 ? "Theory" : i === 1 ? "Quiz" : "Practice",
      source: course === "java" && i >= 2 ? "GitLab" : "Moodle",
      status: "todo",
      submitted: false,
      submittedAt: null,
      score: null,
      evidence: [],
    })),
  };
}
function result(
  card: Card,
  id: string,
  change: Partial<StudentTask>,
  requestId: string,
): Card {
  if (card.audit.some((a) => a.requestId === requestId)) return card;
  return {
    ...card,
    learner: {
      ...card.learner,
      tasks: card.learner.tasks.map((t) =>
        t.id === id ? { ...t, ...change } : t,
      ),
    },
    audit: [
      ...card.audit,
      {
        requestId,
        reason: `Source result for ${id}`,
        actor: "source-policy@1",
        manifest: null,
      },
    ],
  };
}
function deadline(card: Card): Card {
  const revision = card.revision + 1;
  return {
    ...card,
    revision,
    learner: {
      ...card.learner,
      tasks: card.learner.tasks.map((t) =>
        t.id === "TASK-03" ? { ...t, due: "2026-10-22T20:59:00Z" } : t,
      ),
    },
    history: [
      ...card.history,
      {
        revision: card.revision,
        learner: structuredClone(card.learner),
        reason: "Confirmed Discord deadline clarification",
      },
    ],
    audit: [
      ...card.audit,
      {
        requestId: "confirmed-message-105",
        reason: "teacher-7 · group A · TASK-03 · Europe/Kyiv · message-105",
        actor: "Instructor",
        manifest: null,
      },
    ],
    outbox: [...card.outbox, { revision, materials: false, moodle: false }],
  };
}
export function simulate(
  course: SimulationCourse,
  requestedCursor: number,
  options: SimulationOptions,
) {
  const steps = simulationSteps(course, options);
  const state: SimulationState = {
    enrolled: false,
    latest: 1,
    card: null,
    groupPlanReceived: false,
    mr: "none",
    clarification: "none",
    compatibility: "unchecked",
    blocked: null,
    deliveryFailed: false,
    lastApplied: -1,
  };
  const outcomes: {
    id: string;
    status: "applied" | "blocked" | "retry pending";
  }[] = [];
  for (
    let cursor = 0;
    cursor <= Math.min(requestedCursor, steps.length - 1);
    cursor++
  ) {
    const id = steps[cursor].id;
    let c = state.card;
    switch (id) {
      case "enroll":
        state.enrolled = true;
        break;
      case "group-plan":
        state.groupPlanReceived = true;
        break;
      case "start":
        c = createCard({ ...startingLearner(course), version: state.latest });
        c = {
          ...c,
          trackSource:
            course === "java"
              ? "Approved Sheets group A template"
              : "Default self-paced track",
          mirrors: { materials: 0, moodle: 0 },
          outbox: [{ revision: 1, materials: false, moodle: false }],
        };
        break;
      case "pin-delivery":
      case "track-delivery":
        if (c) c = syncMirror(syncMirror(c, "materials"), "moodle");
        break;
      case "theory":
        if (c)
          c = result(
            c,
            "TASK-01",
            { status: "accepted", evidence: ["moodle/completion/TASK-01"] },
            id,
          );
        break;
      case "quiz":
        if (c)
          c = result(
            c,
            "TASK-02",
            {
              status: "accepted",
              submitted: true,
              submittedAt: AS_OF,
              score: 8,
              evidence: ["moodle/quiz/attempt-284"],
            },
            id,
          );
        break;
      case "practice":
        if (c)
          c = result(
            c,
            "TASK-03",
            {
              status: "accepted",
              submitted: true,
              submittedAt: AS_OF,
              score: 9,
              evidence: ["moodle/assignment/TASK-03"],
            },
            id,
          );
        break;
      case "mr-submit":
        state.mr = "submitted";
        if (c)
          c = result(
            c,
            "TASK-03",
            {
              status: "review",
              submitted: true,
              submittedAt: AS_OF,
              evidence: ["project:23/MR:42"],
            },
            id,
          );
        break;
      case "moodle-link":
        if (c)
          c = result(
            c,
            "TASK-03",
            {
              evidence: ["project:23/MR:42", "moodle/submission-link/TASK-03"],
            },
            id,
          );
        break;
      case "mr-review":
        state.mr = "reviewed";
        break;
      case "accept-practice":
        state.mr = "accepted";
        if (c)
          c = result(c, "TASK-03", { status: "accepted", score: null }, id);
        break;
      case "discord":
        state.clarification = "proposed";
        break;
      case "confirm-deadline":
        state.clarification = "confirmed";
        if (c) c = deadline(c);
        break;
      case "track":
        if (c) c = assignTrack(c, "individual", "personal-track-4");
        break;
      case "release-compatible":
        state.latest = 2;
        break;
      case "compare-compatible":
        state.compatibility = "compatible";
        break;
      case "release-critical":
        state.latest = 3;
        break;
      case "detect":
        state.compatibility = "critical";
        break;
      case "migrate":
        if (c) {
          const policy = {
            automatic: options.migrationMode === "automatic",
            allowNewWork: options.allowNewWork,
            fresh: true,
            authorized:
              options.migrationMode === "manual"
                ? options.manualApproved
                : options.automaticEnabled,
          };
          state.blocked = !policy.authorized
            ? options.migrationMode === "manual"
              ? "Waiting for an authorized instructor to approve this migration."
              : "Automatic migration is disabled by the course owner."
            : migrationBlock(c, manifestFor(c.learner), policy);
          if (!state.blocked) {
            c = migrate(
              c,
              manifestFor(c.learner),
              policy,
              c.revision,
              "migration-simulation-v3",
            );
            state.compatibility = "migrated";
          }
        }
        break;
      case "migration-delivery":
        if (c) {
          c = syncMirror(c, "moodle");
          if (!options.failMigrationDelivery) c = syncMirror(c, "materials");
          else state.deliveryFailed = true;
        }
        break;
      case "retry":
        if (c) c = syncMirror(syncMirror(c, "materials"), "moodle");
        state.deliveryFailed = false;
        break;
    }
    state.card = c;
    state.lastApplied = cursor;
    outcomes.push({
      id,
      status: state.blocked
        ? "blocked"
        : state.deliveryFailed && id === "migration-delivery"
          ? "retry pending"
          : "applied",
    });
    if (state.blocked) break;
  }
  return {
    state,
    outcomes,
    cursor: state.lastApplied,
    steps,
    progress: state.card ? metrics([state.card.learner]) : null,
  };
}
export function runTo(
  course: SimulationCourse,
  cursor: number,
  options: SimulationOptions,
): SimulationRun {
  return { cursor: simulate(course, cursor, options).cursor, options };
}
