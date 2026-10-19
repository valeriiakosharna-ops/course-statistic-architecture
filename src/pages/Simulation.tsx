import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";
import { fmt, metrics } from "../lab";
import ProcessingGuide, { ProcessingKey } from "../components/ProcessingGuide";
import { systems, type Card, type SystemId } from "../platform";
import {
  newRun,
  runTo,
  simulate,
  type SimulationCourse,
  type SimulationOptions,
  type SimulationRun,
} from "../simulation";

const names: Record<SystemId, string> = {
  moodle: "Moodle",
  materials: "GitLab · materials",
  work: "GitLab · students",
  sheets: "Google Spreadsheet",
  discord: "Discord",
  db: "Database",
  atlas: "LearningAtlas",
};
const positions: Record<SystemId, [number, number]> = {
  materials: [35, 60],
  moodle: [35, 260],
  work: [35, 460],
  sheets: [765, 60],
  db: [400, 260],
  atlas: [765, 260],
  discord: [765, 460],
};
const roles: Record<SystemId, string> = {
  materials: "Tags, manifest, private pin map",
  moodle: "Enrollment, learning, attempts",
  work: "Code, MRs, tests, review",
  sheets: "Group assignments and deadlines",
  discord: "Task and deadline clarifications",
  db: "Version + track + results + history",
  atlas: "Statistics, approval, track decisions",
};
function mirrorTag(card: Card | null, target: "moodle" | "materials") {
  if (!card || !card.mirrors[target]) return "Not delivered";
  const version =
    card.mirrors[target] === card.revision
      ? card.learner.version
      : card.history.find((h) => h.revision === card.mirrors[target])?.learner
          .version;
  return version
    ? `v${version} · R${card.mirrors[target]}`
    : `R${card.mirrors[target]}`;
}
export default function Simulation({
  course,
  run,
  onChange,
  setCourse,
  onInspect,
}: {
  course: SimulationCourse;
  run: SimulationRun;
  onChange: (run: SimulationRun) => void;
  setCourse: (course: SimulationCourse) => void;
  onInspect: (card: Card) => void;
}) {
  const [playing, setPlaying] = useState(false),
    [hop, setHop] = useState(0),
    [selected, setSelected] = useState<SystemId>("db");
  const { state, steps, progress, outcomes } = simulate(
    course,
    run.cursor,
    run.options,
  );
  const current = steps[run.cursor];
  const before = simulate(course, run.cursor - 1, run.options);
  const activeHop = Math.min(hop, (current?.transfers.length ?? 1) - 1);
  const packet = current?.transfers[activeHop];
  const selectedSystem = systems.find((s) => s.id === selected)!;
  useEffect(() => {
    setHop(0);
  }, [run.cursor]);
  useEffect(() => {
    if (!playing) return;
    if (
      state.blocked ||
      (run.cursor >= steps.length - 1 &&
        hop >= (current?.transfers.length ?? 1) - 1)
    ) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      if (current && hop < current.transfers.length - 1) setHop(hop + 1);
      else onChange(runTo(course, run.cursor + 1, run.options));
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [playing, hop, course, run, state.blocked, steps.length, onChange]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  function go(cursor: number) {
    setPlaying(false);
    onChange(runTo(course, cursor, run.options));
  }
  function configure(options: Partial<SimulationOptions>) {
    setPlaying(false);
    setHop(0);
    onChange(runTo(course, run.cursor, { ...run.options, ...options }));
  }
  const card = state.card;
  const pending =
    card?.outbox.filter((o) => !o.materials || !o.moodle).length ?? 0;
  const targetSystems = new Set(packet ? [packet.from, packet.to] : []);
  return (
    <>
      <Heading
        kicker="07 / LEARNING JOURNEY SIMULATOR"
        title="Watch learning move between systems"
        sub="Follow one student from enrollment to a new course version. Every event reveals its trigger, data transfers and effect on the student record."
      />
      <div className="simulation-course-cards" aria-label="Simulation course">
        <button
          aria-pressed={course === "ai"}
          className={course === "ai" ? "selected" : ""}
          onClick={() => {
            setPlaying(false);
            setCourse("ai");
          }}
        >
          <span>01 / SELF-PACED</span>
          <strong>Foundations of AI</strong>
          <small>Moodle learning → personal track → version migration</small>
        </button>
        <button
          aria-pressed={course === "java"}
          className={course === "java" ? "selected" : ""}
          onClick={() => {
            setPlaying(false);
            setCourse("java");
          }}
        >
          <span>02 / GROUP + CODE</span>
          <strong>Java Dual</strong>
          <small>Sheets → Moodle → GitLab practice → Discord → migration</small>
        </button>
      </div>
      <ProcessingKey />
      <div className="simulation-player">
        <div className="simulation-controls-row">
          <button
            className="button secondary"
            disabled={run.cursor < 0}
            onClick={() => go(run.cursor - 1)}
          >
            <ArrowLeft size={16} />
            Previous event
          </button>
          <button
            className="button primary"
            disabled={!!state.blocked || run.cursor >= steps.length - 1}
            onClick={() => go(run.cursor + 1)}
          >
            Next event
            <ArrowRight size={16} />
          </button>
          <button
            className="button secondary"
            disabled={
              !!state.blocked ||
              (run.cursor >= steps.length - 1 &&
                activeHop >= (current?.transfers.length ?? 1) - 1)
            }
            aria-pressed={playing}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? "Pause playback" : "Play journey"}
          </button>
          <button
            className="link-button"
            onClick={() => {
              setPlaying(false);
              onChange(newRun());
            }}
          >
            {" "}
            <RotateCcw size={15} />
            Reset journey
          </button>
          <strong data-testid="simulation-position">
            {Math.max(0, run.cursor + 1)} / {steps.length} events
          </strong>
        </div>
        <div
          className="simulation-progress"
          role="progressbar"
          aria-label="Journey progress"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={Math.max(0, run.cursor + 1)}
        >
          <span
            style={{ width: `${((run.cursor + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="journey-layout">
        <nav className="journey-timeline" aria-label="Journey events">
          {steps.map((step, i) => (
            <button
              key={step.id}
              aria-current={run.cursor === i ? "step" : undefined}
              className={`${run.cursor === i ? "selected" : ""} ${i < run.cursor ? "completed" : ""}`}
              onClick={() => go(i)}
            >
              <span>
                {i < run.cursor ? (
                  <Check size={13} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <strong>{step.title}</strong>
              {outcomes[i]?.status === "blocked" && <small>Waiting</small>}
            </button>
          ))}
        </nav>
        <div className="journey-stage">
          <div
            className={`event-card ${state.blocked ? "event-blocked" : ""}`}
            aria-live="polite"
            data-testid="simulation-event"
          >
            <span className="eyebrow">
              {current
                ? `EVENT ${run.cursor + 1} · ${current.actor}`
                : "BEFORE ENROLLMENT"}
            </span>
            <h2>{current?.title ?? "Ready to enroll"}</h2>
            <div className="trigger-chip">
              <span>TRIGGER</span>
              <code>{current?.trigger ?? "No event yet"}</code>
            </div>
            <p>
              {state.blocked ??
                current?.effect ??
                "Course-v1 is already published. Start the journey or select an event. The student has no course access, no pinned version and no accepted progress yet."}
            </p>
            {current && (
              <button
                className="link-button event-processing-link"
                aria-controls="event-processing-guide"
                onClick={() => {
                  setPlaying(false);
                  const guide = document.getElementById(
                    "event-processing-guide",
                  );
                  guide?.focus({ preventScroll: true });
                  guide?.scrollIntoView({ block: "start" });
                }}
              >
                See data processing ↓
              </button>
            )}
            {state.blocked &&
              (run.options.migrationMode === "manual" ? (
                <button
                  className="button primary event-approval"
                  onClick={() => configure({ manualApproved: true })}
                >
                  Approve this migration
                </button>
              ) : (
                <button
                  className="button secondary event-approval"
                  onClick={() =>
                    document
                      .getElementById("simulation-policy")
                      ?.scrollIntoView({ block: "center" })
                  }
                >
                  Review automatic policy
                </button>
              ))}
          </div>
          <div
            className="journey-live-summary"
            aria-live="polite"
            data-testid="simulation-live-summary"
          >
            <span>
              Student 01 · {state.enrolled ? "Enrolled" : "Not enrolled"}
            </span>
            <strong>
              {card
                ? `Pinned v${card.learner.version} · track R${card.revision}`
                : "Version not pinned"}
            </strong>
            <span>
              {progress
                ? `${progress.accepted}/${progress.total} accepted · ${fmt(progress.percent, "%")}`
                : "No learning progress yet"}
            </span>
          </div>
          <Graph
            title="Live data transfer · seven systems"
            motion={!!packet && !state.blocked && !state.deliveryFailed}
            height={580}
            selected={selected}
            onSelect={(id) => setSelected(id as SystemId)}
            nodes={systems.map((s) => ({
              id: s.id,
              x: positions[s.id][0],
              y: positions[s.id][1],
              w: s.id === "db" ? 240 : 235,
              title: names[s.id],
              sub: roles[s.id],
              tone: s.id === "db" ? "dark" : s.id === "atlas" ? "red" : "blue",
              inactive: !targetSystems.has(s.id),
            }))}
            edges={
              packet && packet.from !== packet.to
                ? [
                    {
                      from: packet.from,
                      to: packet.to,
                      label: packet.label,
                      active: true,
                      dashed:
                        !!state.blocked ||
                        (state.deliveryFailed && packet.to === "materials"),
                    },
                  ]
                : []
            }
          />
          {current && (
            <div className="transfer-panel">
              <div
                className="transfer-tabs"
                aria-label="Transfers in this event"
              >
                {current.transfers.map((t, i) => (
                  <button
                    key={i}
                    className={activeHop === i ? "selected" : ""}
                    aria-pressed={activeHop === i}
                    onClick={() => setHop(i)}
                  >
                    <span>{i + 1}</span>
                    {names[t.from]} <ArrowRight size={13} /> {names[t.to]}
                  </button>
                ))}
              </div>
              {packet && (
                <>
                  <div
                    className="transfer-description"
                    data-testid="simulation-transfer"
                  >
                    <strong>{packet.label}</strong>
                    <span>{packet.via}</span>
                    <small>
                      {state.blocked
                        ? "Waiting: the migration transaction has not committed."
                        : state.deliveryFailed && packet.to === "materials"
                          ? "Delivery failed; the database decision is retained and a retry is pending."
                          : packet.from === packet.to
                            ? "Internal database job. No external network transfer."
                            : "Illustrative transfer for this event; inspect its payload below."}
                    </small>
                  </div>
                  <ProcessingGuide
                    key={current.id}
                    step={current}
                    transfer={packet}
                    options={run.options}
                    blocked={!!state.blocked}
                    failed={state.deliveryFailed && packet.to === "materials"}
                  />
                </>
              )}
            </div>
          )}
          <div className="compact-inspector">
            <strong>{selectedSystem.title}</strong>
            <span>{selectedSystem.owns}</span>
          </div>
        </div>
      </div>
      <Section number="A" title="What changed in the student record">
        <Flow label="Record before and after this event">
          {[
            <Block
              title="Before this event"
              sub={
                before.state.card
                  ? `v${before.state.card.learner.version} · R${before.state.card.revision} · ${before.progress?.accepted}/${before.progress?.total} accepted`
                  : before.state.enrolled
                    ? "Enrolled; version not pinned"
                    : "Not enrolled; no learning record"
              }
            />,
            <Block
              title={
                state.blocked
                  ? "Waiting for a decision"
                  : (current?.trigger ?? "No trigger yet")
              }
              sub={
                state.blocked
                  ? "No migration has committed"
                  : "One explicit event"
              }
              tone={state.blocked ? "red" : "blue"}
            />,
            <Block
              title="After this event"
              sub={
                card
                  ? `v${card.learner.version} · R${card.revision} · ${progress?.accepted}/${progress?.total} accepted`
                  : state.enrolled
                    ? "Enrolled; version not pinned"
                    : "Not enrolled; no learning record"
              }
              tone="dark"
            />,
          ]}
        </Flow>
        <div className="simulation-record" data-testid="simulation-record">
          <div>
            <span>Enrollment</span>
            <strong>{state.enrolled ? "Enrolled" : "Not enrolled"}</strong>
            <small>
              {course === "java"
                ? "Group A · 30 activities initially"
                : "Self-paced · 6 activities initially"}
            </small>
          </div>
          <div>
            <span>Pinned version</span>
            <strong>{card ? `v${card.learner.version}` : "Not pinned"}</strong>
            <small>Latest published: v{state.latest}</small>
          </div>
          <div>
            <span>Required progress</span>
            <strong>
              {progress
                ? `${progress.accepted}/${progress.total} · ${fmt(progress.percent, "%")}`
                : "Not started"}
            </strong>
            <small>
              {card
                ? `Track R${card.revision} · ${card.trackSource}`
                : "Enrollment does not pin a version"}
            </small>
          </div>
          <div
            className={
              state.compatibility === "critical" ? "critical-state" : ""
            }
          >
            <span>Manifest status</span>
            <strong>
              {state.compatibility === "critical"
                ? "Decision required"
                : state.compatibility === "migrated"
                  ? "Migration committed"
                  : state.compatibility === "compatible"
                    ? "Compatible update"
                    : "Not checked"}
            </strong>
            <small>
              {card?.history.length ?? 0} historical snapshots retained
            </small>
          </div>
        </div>
        <div className="simulation-sync">
          <span>
            <strong>Database</strong>
            {card
              ? `v${card.learner.version} · R${card.revision}`
              : "No version pin"}
          </span>
          <span>
            <strong>GitLab projection</strong>
            {mirrorTag(card, "materials")}
          </span>
          <span>
            <strong>Moodle context</strong>
            {mirrorTag(card, "moodle")}
          </span>
          <span className={state.deliveryFailed ? "delivery-error" : ""}>
            <strong>Delivery queue</strong>
            {pending} pending ·{" "}
            {state.deliveryFailed
              ? "GitLab retry required"
              : "no current delivery error"}
          </span>
        </div>
        {course === "java" && (
          <div className="quality-strip" data-testid="simulation-java-status">
            <span>
              GitLab practical work: <strong>{state.mr}</strong>
            </span>
            <span>
              Discord clarification: <strong>{state.clarification}</strong>
            </span>
            <span>MR merge ≠ activity acceptance</span>
            <span>
              TASK-03 deadline:{" "}
              <strong>
                {card?.learner.tasks
                  .find((t) => t.id === "TASK-03")
                  ?.due?.replace("T", " ")
                  .replace("Z", " UTC") ?? "Not set"}
              </strong>
            </span>
          </div>
        )}
        {card && (
          <div className="automation-grid" data-testid="simulation-activities">
            {card.learner.tasks.slice(0, 3).map((task) => (
              <Block
                key={task.id}
                title={`${task.id} · ${task.kind}`}
                sub={`${task.status === "accepted" ? "Accepted" : task.status === "review" ? "Under review" : "Not completed"} · ${task.score === null ? "No numeric grade" : `${task.score}/${task.maxScore}`} · ${task.evidence.length} evidence links`}
                tone={task.status === "accepted" ? "blue" : ""}
              />
            ))}
          </div>
        )}
        <div className="simulation-result-actions">
          <button
            className="button secondary"
            disabled={!card}
            onClick={() => {
              setPlaying(false);
              if (card) onInspect(card);
            }}
          >
            Open this result in statistics
            <ArrowRight size={16} />
          </button>
          <small>
            The journey is a separate sandbox. This button copies its current
            record to Student 01 in this course's statistics.
          </small>
        </div>
      </Section>
      <Section
        number="B"
        title="Try a different migration policy or delivery failure"
      >
        <div className="simulation-settings" id="simulation-policy">
          <label>
            Migration decision
            <select
              aria-label="Simulation migration mode"
              value={run.options.migrationMode}
              onChange={(e) =>
                configure({
                  migrationMode: e.target
                    .value as SimulationOptions["migrationMode"],
                  manualApproved: false,
                })
              }
            >
              <option value="manual">Manual · instructor approval</option>
              <option value="automatic">Automatic · policy@1</option>
            </select>
          </label>
          {run.options.migrationMode === "automatic" ? (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={run.options.automaticEnabled}
                  onChange={(e) =>
                    configure({ automaticEnabled: e.target.checked })
                  }
                />
                Course owner enabled the automatic policy
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={run.options.allowNewWork}
                  onChange={(e) =>
                    configure({ allowNewWork: e.target.checked })
                  }
                />
                Policy allows reassessment and new work
              </label>
            </>
          ) : (
            <div>
              <span className="eyebrow">HUMAN DECISION</span>
              <p>
                Playback pauses at migration. Approve on the current event card
                to continue.
              </p>
            </div>
          )}
          <label>
            <input
              type="checkbox"
              checked={run.options.failMigrationDelivery}
              onChange={(e) =>
                configure({ failMigrationDelivery: e.target.checked })
              }
            />
            GitLab unavailable on first migration delivery
          </label>
        </div>
        {state.blocked && (
          <div className="hint" role="status">
            {state.blocked}{" "}
            {run.options.migrationMode === "manual"
              ? "Use “Approve this migration”, then continue with Next event."
              : "Enable the policy and allow the required new work to resume."}
          </div>
        )}
        <Hint>
          Changing a policy rebuilds this journey's preview from its event
          history. Back, reset and course switching never send real commands.
          Events compress the learning process; all records and payloads are
          synthetic.
        </Hint>
      </Section>
      <Section number="C" title="Event journal · trace every trigger">
        <div
          className="table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Simulation event journal"
        >
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Trigger and owner</th>
                <th>Data movement</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((outcome, i) => (
                <tr key={outcome.id}>
                  <td>
                    <button className="link-button" onClick={() => go(i)}>
                      {String(i + 1).padStart(2, "0")} · {steps[i].title}
                    </button>
                  </td>
                  <td>
                    <strong>{steps[i].actor}</strong>
                    <small>{steps[i].trigger}</small>
                  </td>
                  <td>
                    {steps[i].transfers
                      .map((t) => `${names[t.from]} → ${names[t.to]}`)
                      .join("; ")}
                  </td>
                  <td>
                    <span
                      className={`badge ${outcome.status === "applied" ? "blue" : "red"}`}
                    >
                      {outcome.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!outcomes.length && (
            <p className="empty-state">
              Run the first event to start the journal.
            </p>
          )}
        </div>
        {card && (
          <details className="simulation-payload">
            <summary>Version and track history · preserved results</summary>
            <pre>
              {JSON.stringify(
                card.history.map((h) => ({
                  revision: h.revision,
                  course_version: h.learner.version,
                  progress: `${metrics([h.learner]).accepted}/${metrics([h.learner]).total}`,
                  reason: h.reason,
                  previous_practice_evidence: h.learner.tasks.find(
                    (t) => t.id === "TASK-03",
                  )?.evidence,
                })),
                null,
                2,
              )}
            </pre>
          </details>
        )}
      </Section>
    </>
  );
}
