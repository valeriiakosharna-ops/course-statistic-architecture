import {
  learnersFor,
  type CourseMode,
  type Learner,
  type StudentTask,
} from "./lab";

export const latestVersion = 3;
export type SystemId =
  "materials" | "moodle" | "work" | "sheets" | "discord" | "db" | "atlas";
export const systems: {
  id: SystemId;
  title: string;
  role: string;
  format: string;
  method: string;
  owns: string;
}[] = [
  {
    id: "materials",
    title: "GitLab · materials",
    role: "Tags, builds, manifest",
    format: "Git tag + commit SHA · manifest.json · HTML",
    method:
      "CI validates the manifest → builds an immutable artifact; a job reads releases",
    owns: "Course content and version compatibility. Student version pins are a protected projection of the database.",
  },
  {
    id: "moodle",
    title: "Moodle",
    role: "Learning and first activity",
    format: "Web Services JSON · plugin events · links",
    method:
      "A plugin records the start; an API job collects attempts, scores and completions",
    owns: "Quiz attempts, theory completion and practical submission links.",
  },
  {
    id: "work",
    title: "GitLab · students",
    role: "Code, MRs, checks, comments",
    format: "REST JSON · webhook · diff · CI result",
    method:
      "Webhooks speed up delivery; scheduled API reconciliation recovers missed events",
    owns: "Code and review. Merging an MR does not automatically award activity credit.",
  },
  {
    id: "sheets",
    title: "Google Spreadsheet",
    role: "Assignments, deadlines, grades",
    format: "Sheets API: rows → typed JSON · CSV",
    method:
      "A job reads a range using stable row_id values and checks each row hash",
    owns: "Approved rows: student/group, activity_id, deadline, grade, revision.",
  },
  {
    id: "discord",
    title: "Discord",
    role: "Task and deadline clarifications",
    format: "message_id · channel_id · author · text · edited_at",
    method:
      "Bot: Gateway events + REST reconciliation of accessible course channels",
    owns: "The original message and a proposed clarification. Author permissions and course policy are checked separately.",
  },
  {
    id: "db",
    title: "Database",
    role: "Canonical student record",
    format: "raw → facts → assignments → records → snapshots",
    method: "Transactions, unique keys, history and an update delivery queue",
    owns: "Pinned version, active track, decisions, links and calculated progress.",
  },
  {
    id: "atlas",
    title: "LearningAtlas",
    role: "Statistics and decisions",
    format: "Student record API · commands with revision and request_id",
    method: "Student / group / course; manual decisions or configured rules",
    owns: "The decision interface. Commands are saved to the database, which remains authoritative.",
  },
];

export type Term = {
  id: string;
  name: string;
  definition: string;
  example: string;
  level: number;
  lives: string;
};
export const vocabulary: Term[] = [
  {
    id: "theory",
    name: "Theory",
    definition: "Learning material a student needs to study.",
    example: "Read an explanation of loops.",
    level: 0,
    lives: "Course materials GitLab → Moodle",
  },
  {
    id: "practice",
    name: "Practice",
    definition: "A task in which a student applies knowledge.",
    example: "Write a program and submit its link.",
    level: 0,
    lives: "Moodle + student GitLab",
  },
  {
    id: "test",
    name: "Quiz",
    definition: "A knowledge check with questions and grading rules.",
    example: "5 questions, up to 10 points.",
    level: 0,
    lives: "Moodle",
  },
  {
    id: "activity",
    name: "Activity",
    definition:
      "One individually tracked learning action: theory, practice or a quiz.",
    example: "activity_id=TASK-03; kind=quiz.",
    level: 1,
    lives: "Moodle ↔ database student record",
  },
  {
    id: "unit",
    name: "Unit",
    definition: "A small topic containing several activities.",
    example: "“Loops”: theory + quiz + practice.",
    level: 1,
    lives: "Course structure in GitLab and Moodle",
  },
  {
    id: "module",
    name: "Module",
    definition: "A course section made up of units.",
    example: "“Programming fundamentals”: 4 units.",
    level: 1,
    lives: "Course structure in GitLab and Moodle",
  },
  {
    id: "version",
    name: "Course version",
    definition: "A tagged, immutable build of course content and rules.",
    example: "course-v3 → commit SHA → HTML + manifest.",
    level: 2,
    lives: "Materials GitLab; version pin in the database",
  },
  {
    id: "track",
    name: "Learning track",
    definition:
      "A student's specific required activities, deadlines and completion rules.",
    example: "30 activities assigned from a catalog of 40.",
    level: 2,
    lives: "Sheets / LearningAtlas → database → Moodle",
  },
  {
    id: "manifest",
    name: "Manifest",
    definition:
      "Version transition rules: what to carry over, supplement, repeat or assign for the first time.",
    example: "v1 → v3: carry TASK-01 credit, repeat TASK-03.",
    level: 2,
    lives: "A versioned file in the course materials GitLab",
  },
  {
    id: "attempt",
    name: "Attempt",
    definition: "One submission of a quiz or task; it may be unsuccessful.",
    example: "Attempt #2, 8/10; the policy selects the best attempt.",
    level: 3,
    lives: "Moodle; practical submissions also use GitLab",
  },
  {
    id: "point",
    name: "Score",
    definition: "A numeric grade with a maximum and an assessment rule.",
    example: "8 / 10 under rubric assessment@1.",
    level: 3,
    lives: "Moodle / approved Sheets correction → database",
  },
  {
    id: "deadline",
    name: "Deadline",
    definition: "The cutoff time for a specific assignment, with a time zone.",
    example: "20.10, 23:59 Europe/Kyiv = 20:59 UTC.",
    level: 3,
    lives: "Sheets; a confirmed Discord clarification → database",
  },
  {
    id: "pr",
    name: "PR",
    definition: "Pull Request: a proposed change; the GitHub term.",
    example: "The GitLab equivalent is called an MR.",
    level: 3,
    lives: "GitHub; this architecture uses MRs",
  },
  {
    id: "mr",
    name: "MR",
    definition: "Merge Request: a proposal to merge changes in GitLab.",
    example: "MR !42 is linked to TASK-01 and TASK-02.",
    level: 3,
    lives: "Student GitLab; task links in the database",
  },
  {
    id: "comment",
    name: "Comment",
    definition:
      "Feedback on a submission or discussion; not a grade by itself.",
    example: "“Add an edge case test” on MR !42.",
    level: 3,
    lives: "GitLab / Discord → database with author and source link",
  },
  {
    id: "card",
    name: "Student record",
    definition:
      "One person's linked course data: version, track, results and decision history.",
    example: "S-1 · v1 · R1 · 20/30 · version migration needed.",
    level: 4,
    lives: "Database → LearningAtlas",
  },
  {
    id: "moodle",
    name: "Moodle",
    definition: "The platform where students complete assigned activities.",
    example: "Its catalog can be larger than a personal track.",
    level: 5,
    lives: "System 1",
  },
  {
    id: "gitlab",
    name: "GitLab",
    definition: "Two separate roles: course materials and student work.",
    example: "A course tag ≠ a branch containing a student's solution.",
    level: 5,
    lives: "Systems 2 and 3",
  },
  {
    id: "spreadsheet",
    name: "Google Spreadsheet",
    definition:
      "A spreadsheet for assignments, deadlines and, when configured, grades.",
    example: "Row: group A, TASK-21, deadline, revision.",
    level: 5,
    lives: "System 4",
  },
  {
    id: "discord",
    name: "Discord",
    definition: "Course chats containing task and deadline clarifications.",
    example: "“The TASK-21 deadline has changed for group A.”",
    level: 5,
    lives: "System 5",
  },
  {
    id: "db",
    name: "Database",
    definition:
      "Storage for source data, facts, links, student records and history.",
    example: "One student is linked to accounts across all sources.",
    level: 5,
    lives: "System 6",
  },
  {
    id: "atlas",
    name: "LearningAtlas",
    definition:
      "A site for statistics, track assignment and course version decisions.",
    example: "Reports for a student, a group and the entire course.",
    level: 5,
    lives: "System 7",
  },
];

export type MappingAction =
  "carry" | "repeat" | "supplement" | "retire" | "new";
export const actionLabels: Record<MappingAction, string> = {
  carry: "Carry over",
  repeat: "Repeat",
  supplement: "Supplement",
  retire: "Remove from track",
  new: "Assign new",
};
export type Manifest = {
  from: number;
  to: number;
  tag: string;
  hash: string;
  critical: boolean;
  approved: boolean;
  complete: boolean;
  mappings: { id: string; action: MappingAction; reason: string }[];
};
export function manifestFor(
  learner: Learner,
  target = latestVersion,
): Manifest {
  return {
    from: learner.version,
    to: target,
    tag: `course-v${target}`,
    hash: `demo-manifest-v${learner.version}-v${target}`,
    critical: learner.version < 3 && target === 3,
    approved: true,
    complete: true,
    mappings: [
      ...learner.tasks.map((t) => ({
        id: t.id,
        action: (target <= learner.version || target === 2
          ? "carry"
          : t.id === "TASK-03"
            ? "repeat"
            : t.id === "TASK-04"
              ? "supplement"
              : t.id === "TASK-05"
                ? "retire"
                : "carry") as MappingAction,
        reason:
          target <= learner.version || target === 2
            ? "Editorial changes; assessment criteria unchanged"
            : t.id === "TASK-03"
              ? "New mandatory assessment criteria"
              : t.id === "TASK-04"
                ? "An additional skill must be demonstrated"
                : t.id === "TASK-05"
                  ? "Replaced by a new activity"
                  : "Content and assessment criteria are compatible",
      })),
      ...(target > learner.version &&
      target === 3 &&
      !learner.tasks.some((t) => t.id === "NEW-01")
        ? [
            {
              id: "NEW-01",
              action: "new" as const,
              reason: "New activity replacing TASK-05",
            },
          ]
        : []),
    ],
  };
}
export type Card = {
  learner: Learner;
  revision: number;
  trackSource: string;
  history: { revision: number; learner: Learner; reason: string }[];
  audit: {
    requestId: string;
    reason: string;
    actor: string;
    manifest: string | null;
  }[];
  mirrors: { materials: number; moodle: number };
  outbox: { revision: number; materials: boolean; moodle: boolean }[];
};
export function createCard(learner: Learner): Card {
  return {
    learner,
    revision: 1,
    trackSource: "Initial course track",
    history: [],
    audit: [],
    mirrors: { materials: 1, moodle: 1 },
    outbox: [],
  };
}
export const createPlatform = () =>
  Object.fromEntries(
    (["ai", "java", "moodle", "sheets"] as CourseMode[]).map((m) => [
      m,
      learnersFor(m).map(createCard),
    ]),
  ) as Record<CourseMode, Card[]>;
export function pinVersion(existing: number | null, latest: number) {
  return existing ?? latest;
}
export function critical(card: Card) {
  return (
    card.learner.version < latestVersion && manifestFor(card.learner).critical
  );
}
export function preview(card: Card, manifest: Manifest): Learner {
  const tasks: StudentTask[] = card.learner.tasks.flatMap((t) => {
    const action = manifest.mappings.find((m) => m.id === t.id)?.action;
    if (action === "retire") return [];
    if (action === "repeat" || action === "supplement")
      return [
        {
          ...t,
          status: "todo" as const,
          submitted: false,
          submittedAt: null,
          due: null,
          score: null,
          evidence: [],
          source: t.source,
        },
      ];
    return [{ ...t, evidence: [...t.evidence] }];
  });
  for (const mapping of manifest.mappings.filter((m) => m.action === "new")) {
    if (!tasks.some((t) => t.id === mapping.id))
      tasks.push({
        kind: "Practice",
        id: mapping.id,
        required:
          card.learner.tasks.find((t) => t.id === "TASK-05")?.required ?? true,
        weight: 1,
        status: "todo",
        submitted: false,
        due: null,
        submittedAt: null,
        score: null,
        maxScore: 10,
        source: "Moodle",
        evidence: [],
      });
  }
  return { ...card.learner, version: manifest.to, tasks };
}
export type Policy = {
  automatic: boolean;
  allowNewWork: boolean;
  fresh: boolean;
  authorized: boolean;
};
export function migrationBlock(
  card: Card,
  manifest: Manifest,
  policy: Policy,
): string | null {
  if (!policy.authorized) return "No permission to change the version";
  if (card.learner.version !== manifest.from || manifest.to <= manifest.from)
    return "The pinned version has already changed";
  if (!manifest.approved) return "The manifest is not approved";
  if (
    !manifest.complete ||
    new Set(manifest.mappings.map((m) => m.id)).size !==
      manifest.mappings.length ||
    card.learner.tasks.some(
      (t) => !manifest.mappings.some((m) => m.id === t.id),
    )
  )
    return "The activity mapping is incomplete or ambiguous";
  if (!policy.fresh) return "Student data is stale: synchronize first";
  if (
    policy.automatic &&
    !policy.allowNewWork &&
    manifest.mappings.some((m) =>
      ["repeat", "supplement", "new"].includes(m.action),
    )
  )
    return "The automatic policy does not allow new obligations";
  return null;
}
function commit(
  card: Card,
  learner: Learner,
  reason: string,
  requestId: string,
  actor: string,
  manifest: string | null,
): Card {
  const revision = card.revision + 1;
  return {
    ...card,
    learner,
    revision,
    history: [
      ...card.history,
      {
        revision: card.revision,
        learner: structuredClone(card.learner),
        reason,
      },
    ],
    audit: [...card.audit, { requestId, reason, actor, manifest }],
    outbox: [...card.outbox, { revision, materials: false, moodle: false }],
  };
}
export function migrate(
  card: Card,
  manifest: Manifest,
  policy: Policy,
  expectedRevision: number,
  requestId: string,
): Card {
  if (card.audit.some((a) => a.requestId === requestId)) return card;
  if (card.revision !== expectedRevision)
    throw new Error("The student record changed: refresh the preview");
  const block = migrationBlock(card, manifest, policy);
  if (block) throw new Error(block);
  return commit(
    card,
    preview(card, manifest),
    `Migration v${manifest.from} → v${manifest.to}`,
    requestId,
    policy.automatic ? "policy@1" : "Instructor",
    manifest.hash,
  );
}
export function assignTrack(
  card: Card,
  kind: "individual" | "group",
  requestId: string,
): Card {
  if (card.audit.some((a) => a.requestId === requestId)) return card;
  const lastId = Math.max(
    ...card.learner.tasks
      .filter((t) => t.id.startsWith("TASK-"))
      .map((t) => Number(t.id.slice(5))),
  );
  const tasks = card.learner.tasks.map((t, i) => ({
    ...t,
    required:
      kind === "individual"
        ? i < Math.min(4, card.learner.tasks.length)
        : t.id === "NEW-01" || Number(t.id.slice(5)) <= lastId - 2,
  }));
  return {
    ...commit(
      card,
      { ...card.learner, tasks },
      kind === "individual"
        ? "Individual track: first 4 activities"
        : "Group track template",
      requestId,
      kind === "group" ? "group-rule@1" : "Instructor",
      null,
    ),
    trackSource:
      kind === "individual"
        ? "LearningAtlas · manual assignment"
        : "Google Spreadsheet · group rule",
  };
}
export function acceptPractice(card: Card, taskId: string): Card {
  if (card.learner.tasks.find((t) => t.id === taskId)?.status === "accepted")
    return card;
  return commit(
    card,
    {
      ...card.learner,
      tasks: card.learner.tasks.map((t) =>
        t.id === taskId ? { ...t, status: "accepted", score: null } : t,
      ),
    },
    `Credit awarded for ${taskId}`,
    `accept-${taskId}`,
    "Instructor",
    null,
  );
}
export function syncMirror(
  card: Card,
  target: "materials" | "moodle",
  revision = card.revision,
): Card {
  if (revision > card.revision || revision <= card.mirrors[target]) return card;
  return {
    ...card,
    mirrors: { ...card.mirrors, [target]: revision },
    outbox: card.outbox.map((o) =>
      o.revision <= revision ? { ...o, [target]: true } : o,
    ),
  };
}
export function resolveBuild(
  card: Card,
  available: boolean,
  verifiedCache: boolean,
) {
  if (!available && !verifiedCache) return null;
  return `course-v${card.learner.version}/index.html`;
}
export function clarifyDeadline(card: Card): Card {
  const requestId = "discord-message-105-" + card.learner.id;
  if (
    card.learner.group !== "A" ||
    card.audit.some((a) => a.requestId === requestId)
  )
    return card;
  return commit(
    card,
    {
      ...card.learner,
      tasks: card.learner.tasks.map((t) =>
        t.id === "TASK-01" ? { ...t, due: "2026-10-22T20:59:00Z" } : t,
      ),
    },
    "Discord message-105: teacher-7, group A, Europe/Kyiv",
    requestId,
    "Instructor",
    null,
  );
}
export const taskKind = (task: StudentTask) =>
  task.kind ?? (task.source === "GitLab" ? "Practice" : "Quiz");
