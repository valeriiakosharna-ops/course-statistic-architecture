export type CourseMode = "ai" | "java" | "moodle" | "sheets";
export const modes: {
  id: CourseMode;
  label: string;
  short: string;
  sources: string[];
  groups: boolean;
}[] = [
  {
    id: "ai",
    label: "Основы ИИ",
    short: "Самостоятельно",
    sources: ["Moodle", "GitLab: материалы"],
    groups: false,
  },
  {
    id: "java",
    label: "Java Dual",
    short: "Группа + код",
    sources: ["Moodle", "GitLab: работы", "Sheets"],
    groups: true,
  },
  {
    id: "moodle",
    label: "Курс в Moodle",
    short: "Тесты и задания",
    sources: ["Moodle"],
    groups: true,
  },
  {
    id: "sheets",
    label: "Moodle + таблица",
    short: "Разные назначения",
    sources: ["Moodle", "Sheets"],
    groups: true,
  },
];
export type TaskStatus = "accepted" | "review" | "todo" | "unknown";
export type StudentTask = {
  id: string;
  required: boolean;
  weight: number;
  status: TaskStatus;
  submitted: boolean;
  due: string | null;
  submittedAt: string | null;
  score: number | null;
  maxScore: number;
  source: string;
  evidence: string[];
};
export type Learner = {
  id: string;
  name: string;
  group: "A" | "B" | null;
  version: number;
  tasks: StudentTask[];
};
export const AS_OF = "2026-10-16T12:00:00Z";
export function learnersFor(mode: CourseMode): Learner[] {
  return [
    "Студент 01",
    "Студент 02",
    "Студент 03",
    "Студент 04",
    "Студент 05",
    "Студент 06",
  ].map((name, i) => {
    const group =
      mode === "ai" ? null : i < 3 ? ("A" as const) : ("B" as const);
    const total =
      mode === "ai"
        ? 6
        : mode === "java"
          ? group === "A"
            ? 30
            : 35
          : group === "A"
            ? 8
            : 10;
    const accepted = Math.max(
      1,
      Math.floor(total * [0.67, 0.5, 0.83, 0.4, 0.6, 0.7][i]),
    );
    return {
      id: `S-${i + 1}`,
      name,
      group,
      version: i < 4 ? 1 : 2,
      tasks: Array.from({ length: total + 2 }, (_, j) => {
        const status: TaskStatus =
          j < accepted
            ? "accepted"
            : j < accepted + 2
              ? "review"
              : j === total - 1
                ? "unknown"
                : "todo";
        const submitted = status === "accepted" || status === "review";
        const source = mode === "java" && j % 2 === 0 ? "GitLab" : "Moodle";
        return {
          id: `TASK-${String(j + 1).padStart(2, "0")}`,
          required: j < total,
          weight: 1,
          status,
          submitted,
          due:
            mode === "ai"
              ? null
              : j % 3 === 0
                ? "2026-10-20T20:59:00Z"
                : "2026-10-12T20:59:00Z",
          submittedAt: submitted
            ? j % 4 === 0
              ? "2026-10-14T10:00:00Z"
              : "2026-10-11T10:00:00Z"
            : null,
          score:
            status === "accepted" && j % 4 !== 3
              ? [8, 7, 10, 9][(i + j) % 4]
              : null,
          maxScore: 10,
          source,
          evidence: submitted
            ? [
                source === "GitLab"
                  ? `project:23/MR:${j + 10}`
                  : `site:demo/quiz:${j + 1}`,
              ]
            : [],
        };
      }),
    };
  });
}
export function metrics(learners: Learner[], asOf = AS_OF) {
  const tasks = learners.flatMap((l) => l.tasks.filter((t) => t.required));
  const total = tasks.reduce((sum, t) => sum + t.weight, 0);
  const accepted = tasks
    .filter((t) => t.status === "accepted")
    .reduce((sum, t) => sum + t.weight, 0);
  const graded = tasks.filter((t) => t.score !== null);
  const deadlineSubmissions = tasks.filter((t) => t.submittedAt && t.due);
  return {
    total,
    accepted,
    percent: total ? (accepted / total) * 100 : null,
    submitted: tasks.filter((t) => t.submitted).length,
    review: tasks.filter((t) => t.status === "review").length,
    unknown: tasks.filter((t) => t.status === "unknown").length,
    backlog: tasks.filter(
      (t) =>
        t.due &&
        t.due < asOf &&
        t.status !== "accepted" &&
        t.status !== "unknown",
    ).length,
    score: graded.length
      ? graded.reduce((sum, t) => sum + (t.score! / t.maxScore) * 100, 0) /
        graded.length
      : null,
    graded: graded.length,
    onTime: deadlineSubmissions.filter((t) => t.submittedAt! <= t.due!).length,
    deadlineSubmissions: deadlineSubmissions.length,
    gitlab: tasks.filter(
      (t) => t.source === "GitLab" && t.status === "accepted",
    ).length,
  };
}
export type Packet = {
  source: "Moodle" | "GitLab" | "Sheets";
  instance: string;
  type: string;
  externalId: string;
  revision: string;
  eventTime: string;
  learner: string | null;
  task: string | null;
  value: number | null;
};
export const packets: Packet[] = [
  {
    source: "Moodle",
    instance: "school-demo",
    type: "quiz_attempt",
    externalId: "284",
    revision: "hash-a",
    eventTime: "2026-10-16T09:00:00Z",
    learner: "S-1",
    task: "TASK-01",
    value: 8,
  },
  {
    source: "GitLab",
    instance: "project-23",
    type: "merge_request",
    externalId: "42",
    revision: "head-a3",
    eventTime: "2026-10-16T10:00:00Z",
    learner: "S-1",
    task: "TASK-01",
    value: null,
  },
  {
    source: "Sheets",
    instance: "sheet-demo/tab-A",
    type: "plan_row",
    externalId: "row-12",
    revision: "row-hash-1",
    eventTime: "2026-10-16T08:00:00Z",
    learner: null,
    task: "TASK-01",
    value: null,
  },
];
export const packetKey = (p: Packet) =>
  `${p.source}/${p.instance}/${p.type}/${p.externalId}`;
export type Intake = { facts: Packet[]; duplicates: number };
export function ingest(state: Intake, packet: Packet): Intake {
  const same = state.facts.some(
    (p) => packetKey(p) === packetKey(packet) && p.revision === packet.revision,
  );
  return same
    ? { ...state, duplicates: state.duplicates + 1 }
    : { ...state, facts: [...state.facts, { ...packet }] };
}
export function routePacket(p: Packet) {
  if (p.source === "Sheets") return "plan-proposal";
  if (!p.learner || !p.task) return "review-queue";
  return "evidence";
}
export function sortFacts(facts: Packet[]) {
  return [...facts].sort(
    (a, b) =>
      a.eventTime.localeCompare(b.eventTime) ||
      packetKey(a).localeCompare(packetKey(b)),
  );
}
export const fmt = (value: number | null, suffix = "") =>
  value === null
    ? "Нет данных"
    : `${new Intl.NumberFormat("ru", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
