import { useState } from "react";
import { ArrowRight, Check, GitBranch } from "lucide-react";
import type { CourseMode, Learner } from "../lab";
import { fmt, metrics, modes } from "../lab";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";

import {
  acceptPractice,
  critical,
  latestVersion,
  taskKind,
  type Card,
} from "../platform";

const statusLabels = {
  accepted: "Accepted",
  review: "Under review",
  todo: "Not submitted",
  unknown: "No data",
};
export default function Statistics({
  mode,
  setMode,
  cards,
  detail,
  onChange,
}: {
  mode: CourseMode;
  setMode: (m: CourseMode) => void;
  cards: Card[];
  detail: string;
  onChange: (card: Card) => void;
}) {
  const [scope, setScope] = useState<"student" | "group" | "course">("student"),
    [group, setGroup] = useState("A"),
    [student, setStudent] = useState(
      cards.some((c) => c.learner.id === detail) ? detail : "S-1",
    );
  const [status, setStatus] = useState("all"),
    [metric, setMetric] = useState("progress"),
    [sort, setSort] = useState("id");
  const [linked, setLinked] = useState(false);
  const config = modes.find((m) => m.id === mode)!;
  const data: Learner[] = cards.map((c) => c.learner);
  const acceptedMr =
    data[0].tasks.find((t) => t.id === "TASK-21")?.status === "accepted";
  const activeScope = !config.groups && scope === "group" ? "student" : scope;
  const current = data.find((l) => l.id === student) ?? data[0];
  const selection =
    activeScope === "student"
      ? [current]
      : activeScope === "course"
        ? data
        : data.filter((l) => l.group === group);
  const m = metrics(selection);
  const mixedRubrics =
    new Set(
      selection.map((l) => (l.version < 3 ? "assessment@1" : "assessment@2")),
    ).size > 1;
  const currentCard = cards.find((c) => c.learner.id === current.id)!;
  const selectedCards = cards.filter((c) =>
    selection.some((l) => l.id === c.learner.id),
  );
  const tasks = selection
    .flatMap((l) =>
      l.tasks.map((t) => ({
        ...t,
        learner: l.name,
        learnerId: l.id,
        plan: `v${l.version} / R${cards.find((c) => c.learner.id === l.id)!.revision}`,
      })),
    )
    .filter((t) => status === "all" || t.status === status)
    .sort((a, b) =>
      sort === "status"
        ? a.status.localeCompare(b.status)
        : sort === "due"
          ? (a.due ?? "z").localeCompare(b.due ?? "z")
          : a.learnerId.localeCompare(b.learnerId) || a.id.localeCompare(b.id),
    );
  const [selectedTask, setSelectedTask] = useState("TASK-01");
  const t =
    selection[0]?.tasks.find((t) => t.id === selectedTask) ??
    selection[0].tasks[0];
  const metricCards = [
    [
      "progress",
      "Progress",
      fmt(m.percent, "%"),
      `${m.accepted} / ${m.total} required weight`,
    ],
    [
      "score",
      "Average grade",
      mixedRubrics ? "By version" : fmt(m.score, "%"),
      `${m.graded} graded out of ${selection.flatMap((l) => l.tasks.filter((t) => t.required)).length} assignments`,
    ],
    ["review", "Under review", `${m.review}`, `${m.submitted} tasks submitted`],
    ...(mode === "ai"
      ? [
          [
            "version",
            activeScope === "student" ? "Pinned version" : "Critical versions",
            activeScope === "student"
              ? `v${current.version}`
              : `${selectedCards.filter(critical).length}`,
            activeScope === "student"
              ? "a new release does not change it"
              : "according to the course manifest",
          ],
        ]
      : [
          [
            "due",
            "Overdue",
            `${m.backlog}`,
            "deadline passed, no accepted result",
          ],
        ]),
    ...(mode === "java"
      ? [
          [
            "gitlab",
            "Accepted from GitLab",
            `${m.gitlab}`,
            "activities, not MR count",
          ],
        ]
      : []),
  ];
  const formulas: Record<string, [string, string, string]> = {
    progress: [
      `Accepted weight: ${m.accepted}`,
      `Required track weight: ${m.total}`,
      "Divide accepted by required × 100. The full Moodle catalog is not the denominator.",
    ],
    score: [
      "Score / maximum for each graded activity",
      `${m.graded} graded assignments`,
      mixedRubrics
        ? "The selection uses different rubrics. Show averages by version, without a combined grade."
        : "Average normalized grade under compatible criteria. A missing grade is not zero.",
    ],
    review: [
      `Submitted: ${m.submitted}`,
      `Awaiting acceptance: ${m.review}`,
      "A submission exists, but its result has not been accepted.",
    ],
    due: [
      `Unaccepted and past deadline: ${m.backlog}`,
      "Only activities with known data",
      "Unknown results do not automatically count as overdue. They are shown separately.",
    ],
    version: [
      activeScope === "student"
        ? `Pinned v${current.version}`
        : `Critically outdated: ${selectedCards.filter(critical).length}`,
      activeScope === "student"
        ? `Track R${currentCard.revision} uses v${current.version}`
        : `Total records: ${selection.length}`,
      "Only an explicit migration can change it.",
    ],
    gitlab: [
      `Accepted activities: ${m.gitlab}`,
      "Count assignments, not MRs",
      "Several MRs for one activity do not create several credits.",
    ],
  };
  const f =
    formulas[metricCards.some((c) => c[0] === metric) ? metric : "progress"];
  return (
    <>
      <Heading
        kicker="05 / THE INSTRUCTOR'S VIEW"
        title="Change the course, explore its statistics"
        sub="All metrics are calculated from demo assignments. Select a metric to see its formula."
      />
      <div className="mode-cards" aria-label="Statistics course type">
        {modes.map((c) => (
          <button
            key={c.id}
            aria-pressed={mode === c.id}
            onClick={() => {
              setMode(c.id);
              setStatus("all");
              setMetric("progress");
              setLinked(false);
            }}
            className={mode === c.id ? "selected" : ""}
          >
            <strong>{c.label}</strong>
            <span>{c.sources.join(" + ")}</span>
          </button>
        ))}
      </div>
      <div className="report-toolbar">
        <div className="tabs" aria-label="Report scope">
          <button
            aria-pressed={activeScope === "student"}
            className={activeScope === "student" ? "selected" : ""}
            onClick={() => setScope("student")}
          >
            Student
          </button>
          <button
            disabled={!config.groups}
            aria-pressed={activeScope === "group"}
            className={activeScope === "group" ? "selected" : ""}
            onClick={() => setScope("group")}
          >
            Group
          </button>
          <button
            aria-pressed={activeScope === "course"}
            className={activeScope === "course" ? "selected" : ""}
            onClick={() => setScope("course")}
          >
            Course
          </button>
        </div>
        {activeScope === "student" ? (
          <label>
            Who
            <select
              aria-label="Student"
              value={student}
              onChange={(e) => {
                setStudent(e.target.value);
                setSelectedTask("TASK-01");
              }}
            >
              {data.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.group ? ` · group ${l.group}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : activeScope === "group" ? (
          <label>
            Group
            <select
              aria-label="Group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option>A</option>
              <option>B</option>
            </select>
          </label>
        ) : (
          <strong>Entire course · {data.length} students</strong>
        )}
        <span className="demo-badge">
          DEMO · snapshot: 16 Oct 2026, 12:00 UTC
        </span>
      </div>
      {mode === "ai" && (
        <Hint>
          Self-paced course: no groups. The example tracks personal progress and
          versions; no individual deadlines are configured.
        </Hint>
      )}
      <div className="report-source">
        <span>Sources</span>
        {config.sources.map((s) => (
          <strong key={s}>{s}</strong>
        ))}
        <span>→</span>
        <strong>
          Track{" "}
          {activeScope === "student"
            ? `${current.version} / R${currentCard.revision}`
            : "for each student"}
        </strong>
        <span>→</span>
        <strong>
          {activeScope === "student"
            ? current.name
            : activeScope === "course"
              ? `Course · ${selection.length} students`
              : `Group ${group} · ${selection.length} students`}
        </strong>
      </div>
      <Section
        number="K"
        title={
          activeScope === "student"
            ? "Database student record"
            : "Versions and tracks in this selection"
        }
      >
        <div className="version-summary" data-testid="student-card">
          <div>
            <span>Version pin</span>
            <strong>
              {activeScope === "student"
                ? `v${current.version} · R${currentCard.revision}`
                : `${selection.length} records`}
            </strong>
            <small>
              {activeScope === "student"
                ? currentCard.trackSource
                : "Progress uses each person's own track"}
            </small>
          </div>
          <div className={selectedCards.some(critical) ? "critical-state" : ""}>
            <span>Manifest · latest v{latestVersion}</span>
            <strong>
              {selectedCards.filter(critical).length} need a decision
            </strong>
            <small>Critical differences, not release count</small>
          </div>
          <div>
            <span>History</span>
            <strong>
              {selectedCards.reduce((n, c) => n + c.audit.length, 0)} decisions
            </strong>
            <a
              href={
                activeScope === "student"
                  ? `#versions/${current.id}`
                  : "#versions"
              }
            >
              Compare and migrate version →
            </a>
          </div>
        </div>
        <div className="automation-grid">
          {["Theory", "Practice", "Quiz"].map((kind) => {
            const kindMetrics = metrics(
              selection.map((l) => ({
                ...l,
                tasks: l.tasks.filter((t) => taskKind(t) === kind),
              })),
            );
            return (
              <Block
                key={kind}
                title={kind}
                sub={`${kindMetrics.accepted} / ${kindMetrics.total} of assigned weight accepted`}
                tone={kind === "Quiz" ? "blue" : ""}
              />
            );
          })}
        </div>
        {mixedRubrics && (
          <Hint>
            Grades under different criteria are not combined.{" "}
            {Array.from(new Set(selection.map((l) => l.version)))
              .sort()
              .map(
                (v) =>
                  `v${v}: ${fmt(metrics(selection.filter((l) => l.version === v)).score, "%")}`,
              )
              .join(" · ")}
            . Progress combines accepted weights / assigned weights.
          </Hint>
        )}
      </Section>
      <div className="metric-grid">
        {metricCards.map(([id, label, value, caption]) => (
          <button
            key={id}
            aria-pressed={metric === id}
            className={`metric-card ${metric === id ? "selected" : ""}`}
            onClick={() => setMetric(id)}
          >
            <span>{label}</span>
            <strong
              data-testid={id === "progress" ? "report-progress" : undefined}
            >
              {value}
            </strong>
            <small>{caption}</small>
            <ArrowRight size={17} />
          </button>
        ))}
      </div>
      <div className="metric-explainer" aria-live="polite">
        <div>
          <span className="eyebrow">HOW THE NUMBER IS CALCULATED</span>
          <strong>{f[0]}</strong>
          <span>↓</span>
          <strong>{f[1]}</strong>
        </div>
        <p>{f[2]}</p>
        <small>
          Weight is an activity's contribution; every demo activity weighs 1 ·
          formula completion@1 · fixed snapshot date
        </small>
      </div>
      <Section number="↔" title="Distribution of required activities">
        <div className="status-legend">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button key={key} onClick={() => setStatus(key)}>
              <i className={key} />
              {label}
            </button>
          ))}
        </div>
        <div className="student-bars">
          {selection.map((l) => {
            const tasks = l.tasks.filter((t) => t.required);
            return (
              <div key={l.id}>
                <button
                  className="link-button"
                  onClick={() => {
                    setStudent(l.id);
                    setScope("student");
                  }}
                >
                  {l.name}
                </button>
                <div
                  className="stacked-bar"
                  role="group"
                  aria-label={`Activity states for ${l.name}`}
                >
                  {Object.entries(statusLabels).map(([key, label]) => {
                    const count = tasks.filter((t) => t.status === key).length;
                    return count ? (
                      <button
                        key={key}
                        style={{ width: `${(count / tasks.length) * 100}%` }}
                        className={key}
                        onClick={() => setStatus(key)}
                        aria-label={`${label}: ${count}`}
                        title={`${label}: ${count}`}
                      >
                        {count}
                      </button>
                    ) : null;
                  })}
                </div>
                <span>
                  {metrics([l]).accepted} / {tasks.length}
                </span>
              </div>
            );
          })}
        </div>
      </Section>
      <div className="quality-strip">
        <span>
          <strong>{m.unknown}</strong> assignments with unknown results
        </span>
        {mode !== "ai" && (
          <span>
            On time:{" "}
            <strong>
              {m.onTime} / {m.deadlineSubmissions}
            </strong>{" "}
            submissions with a known deadline
          </span>
        )}
        <span>Submitted ≠ accepted</span>
      </div>
      <Section
        number="A"
        title={
          activeScope === "student"
            ? "This student's activities"
            : activeScope === "course"
              ? "Entire course by student"
              : "Group breakdown by student"
        }
      >
        {activeScope !== "student" && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Version / track</th>
                  <th>Compatibility</th>
                  <th>Accepted / assigned</th>
                  <th>Progress</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selection.map((l) => {
                  const v = metrics([l]);
                  return (
                    <tr key={l.id}>
                      <td>{l.name}</td>
                      <td>
                        v{l.version} / R
                        {cards.find((c) => c.learner.id === l.id)!.revision}
                      </td>
                      <td>
                        <span
                          className={`badge ${critical(cards.find((c) => c.learner.id === l.id)!) ? "red" : "blue"}`}
                        >
                          {critical(cards.find((c) => c.learner.id === l.id)!)
                            ? "Migration needed"
                            : "Current"}
                        </span>
                      </td>
                      <td>
                        {v.accepted} / {v.total}
                      </td>
                      <td>{fmt(v.percent, "%")}</td>
                      <td>
                        <button
                          className="link-button"
                          onClick={() => {
                            setStudent(l.id);
                            setScope("student");
                          }}
                        >
                          Open student →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-controls">
          <label>
            Show
            <select
              aria-label="Status filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort
            <select
              aria-label="Activity ordering"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="id">Student → activity ID</option>
              <option value="status">By status</option>
              <option value="due">By deadline</option>
            </select>
          </label>
          <span>
            {tasks.length} records · optional activities are also shown
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Who / activity</th>
                <th>Assignment</th>
                <th>Status</th>
                <th>Source</th>
                <th>Grade</th>
                <th>Deadline UTC</th>
                <th>Why?</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={t.learnerId + t.id}>
                  <td>
                    <strong>{t.id}</strong>
                    <small>
                      {activeScope !== "student" ? t.learner : t.plan}
                    </small>
                  </td>
                  <td>{t.required ? "Required" : "Optional"}</td>
                  <td>
                    <span
                      className={`badge ${t.status === "accepted" ? "blue" : t.status === "unknown" ? "red" : ""}`}
                    >
                      {statusLabels[t.status]}
                    </span>
                  </td>
                  <td>{t.source}</td>
                  <td>
                    {t.score === null
                      ? "No grade"
                      : `${t.score} / ${t.maxScore}`}
                  </td>
                  <td>
                    {t.due ? t.due.slice(5, 16).replace("T", " ") : "Not set"}
                  </td>
                  <td>
                    <button
                      className="link-button"
                      aria-label={`Trace ${t.learner} ${t.id}`}
                      onClick={() => {
                        setSelectedTask(t.id);
                        if (activeScope !== "student") {
                          setStudent(t.learnerId);
                          setScope("student");
                        }
                        document
                          .getElementById("provenance")
                          ?.scrollIntoView({ block: "center" });
                      }}
                    >
                      Show →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <p className="empty-state">No activities have this status.</p>
          )}
        </div>
      </Section>
      <Section number="B" title="From a metric back to its source">
        <div id="provenance">
          <Flow label="Result provenance">
            {[
              <Block
                title={t.id}
                sub={
                  t.required
                    ? `Included in track R${currentCard.revision}`
                    : "Optional; outside the denominator"
                }
              />,
              <Block
                title={statusLabels[t.status]}
                sub={
                  t.status === "accepted"
                    ? "Accepted under course policy"
                    : "Result not accepted"
                }
                tone={t.status === "accepted" ? "blue" : ""}
              />,
              <Block title={t.evidence[0] ?? "No evidence"} sub={t.source} />,
              <Block
                title="Source + decision"
                sub="Time · hash · rule"
                tone="dark"
              />,
            ]}
          </Flow>
        </div>
      </Section>
      {mode === "java" && (
        <Section number="C" title="What changes when a submission is accepted">
          <Graph
            title="One MR can support several activities; several MRs can support one activity"
            height={320}
            zones={[
              { x: 10, y: 10, w: 250, h: 290, title: "GitLab · evidence" },
              {
                x: 380,
                y: 10,
                w: 260,
                h: 290,
                title: "S-1 track · assignments",
              },
            ]}
            nodes={[
              {
                id: "mr42",
                x: 35,
                y: 65,
                title: "MR !42",
                sub: "two solution files",
                w: 200,
              },
              {
                id: "mr43",
                x: 35,
                y: 205,
                title: "MR !43",
                sub: "follow-up on the first activity",
                w: 200,
              },
              {
                id: "task21",
                x: 410,
                y: 65,
                title: "TASK-21",
                sub: "one obligation",
                w: 200,
                tone: "blue",
              },
              {
                id: "task22",
                x: 410,
                y: 205,
                title: "TASK-22",
                sub: "another obligation",
                w: 200,
                tone: "blue",
              },
              {
                id: "decision",
                x: 800,
                y: 65,
                title: "Instructor decision",
                sub: "credit TASK-21 once",
                w: 215,
                tone: "red",
              },
            ]}
            edges={[
              { from: "mr42", to: "task21", label: "link 1" },
              { from: "mr42", to: "task22", label: "link 2" },
              { from: "mr43", to: "task21", label: "more evidence" },
              { from: "task21", to: "decision", label: "check quality" },
            ]}
          />
          <div className="mr-simulator">
            <div>
              <GitBranch size={24} />
              <strong>MR !42 · TASK-21 · Student 01</strong>
              <span>
                GitLab: merged. The track activity is still under review.
              </span>
            </div>
            <button
              className="button secondary"
              onClick={() => setLinked(true)}
              disabled={linked}
            >
              {linked ? "Link confirmed" : "1. Confirm link"}
            </button>
            <button
              className="button primary"
              disabled={!linked || acceptedMr}
              onClick={() => onChange(acceptPractice(cards[0], "TASK-21"))}
            >
              {acceptedMr ? "Submission accepted" : "2. Accept submission"}
            </button>
            <button
              className="link-button"
              onClick={() => {
                setLinked(false);
              }}
            >
              Reset
            </button>
          </div>
          <Hint>
            {acceptedMr
              ? "The activity now counts toward Student 01's accepted weight. No grade is invented, so grading coverage does not increase."
              : linked
                ? "Link confirmed. Progress is unchanged until the submission is accepted."
                : "One MR can cover several activities. This acceptance credits exactly one assignment."}
          </Hint>
          <div className="local-message" role="status">
            <Check size={16} />
            Student 01 progress: {fmt(metrics([data[0]]).percent, "%")}. The
            demo updates the shared record until the page reloads.
          </div>
        </Section>
      )}
    </>
  );
}
