import { useState } from "react";
import {
  actionLabels,
  latestVersion,
  manifestFor,
  migrate,
  migrationBlock,
  pinVersion,
  preview,
  resolveBuild,
  syncMirror,
  type Card,
  type Policy,
} from "../platform";
import { fmt, metrics } from "../lab";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";
export default function Versions({
  cards,
  detail,
  onChange,
}: {
  cards: Card[];
  detail: string;
  onChange: (card: Card) => void;
}) {
  const [student, setStudent] = useState(
    cards.some((c) => c.learner.id === detail) ? detail : "S-1",
  );
  const card = cards.find((c) => c.learner.id === student) ?? cards[0];
  const [target, setTarget] = useState(3),
    [automatic, setAutomatic] = useState(false),
    [allowNew, setAllowNew] = useState(false),
    [authorized, setAuthorized] = useState(false);
  const [incomplete, setIncomplete] = useState(false),
    [stale, setStale] = useState(false),
    [failGitlab, setFailGitlab] = useState(false);
  const [available, setAvailable] = useState(true),
    [cacheRevision, setCacheRevision] = useState<number | null>(null),
    [feedback, setFeedback] = useState("");
  const [newLock, setNewLock] = useState<number | null>(null),
    [published, setPublished] = useState(2);
  const manifest = {
    ...manifestFor(card.learner, target),
    complete: !incomplete,
  };
  const policy: Policy = {
    automatic,
    allowNewWork: allowNew,
    fresh: !stale,
    authorized,
  };
  const block = migrationBlock(card, manifest, policy);
  const after = preview(card, manifest),
    beforeMetrics = metrics([card.learner]),
    afterMetrics = metrics([after]);
  const path = resolveBuild(card, available, cacheRevision === card.revision);
  const applied = card.learner.version >= target;
  const requiredTarget = after.tasks.filter((t) => t.required);
  const coverage = [
    { label: "Compatible portion", action: "carry", color: "var(--blue-ink)" },
    { label: "Repeat", action: "repeat", color: "var(--red)" },
    { label: "Supplement", action: "supplement", color: "var(--red-ink)" },
    { label: "New", action: "new", color: "var(--ink)" },
  ].map((part) => ({
    ...part,
    count: requiredTarget.filter(
      (t) =>
        manifest.mappings.find((m) => m.id === t.id)?.action === part.action,
    ).length,
  }));
  function apply() {
    try {
      onChange(
        migrate(
          card,
          manifest,
          policy,
          card.revision,
          `migration-${card.learner.id}-v${manifest.from}-v${manifest.to}-R${card.revision}`,
        ),
      );
      setFeedback(
        "Migration saved atomically. History retained; GitLab and Moodle delivery is queued.",
      );
    } catch (e) {
      setFeedback((e as Error).message);
    }
  }
  function synchronize() {
    let next = syncMirror(card, "moodle");
    if (!failGitlab) next = syncMirror(next, "materials");
    onChange(next);
    setFeedback(
      failGitlab
        ? "Moodle updated. GitLab unavailable: the database pin is retained and delivery will retry."
        : "GitLab and Moodle projections are synchronized with the database.",
    );
  }
  return (
    <>
      <Heading
        kicker="04 / TAG → MANIFEST → PIN → MIGRATION"
        title="Versions change by policy, not by age"
        sub="The manifest defines critical differences. A new tag does not silently change an existing student's course."
      />
      <div className="lab-controls">
        <label>
          Whose version and learning track
          <select
            aria-label="Student to migrate"
            value={student}
            onChange={(e) => {
              setStudent(e.target.value);
              setAuthorized(false);
              setCacheRevision(null);
              setFeedback("");
            }}
          >
            {cards.map((c) => (
              <option key={c.learner.id} value={c.learner.id}>
                {c.learner.name} · v{c.learner.version} · R{c.revision}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Section number="A" title="How a course becomes a published release">
        <Flow label="Course publication">
          {[
            <Block
              title="GitLab: tag course-v3"
              sub="Code and materials fixed by commit SHA"
            />,
            <Block
              title="CI validates manifest"
              sub="Stable activity_id values · complete mapping"
              tone="blue"
            />,
            <Block
              title="Immutable build"
              sub="HTML + manifest + hashes → protected delivery"
            />,
            <Block
              title="Job → database"
              sub="Release published; v1 → v3 rules available"
              tone="dark"
            />,
          ]}
        </Flow>
        <Hint>
          Published tags are protected from rewriting. Corrections require a new
          tag. The build, manifest and assessment criteria have their own
          identifiers, making every decision traceable.
        </Hint>
      </Section>
      <Section number="B" title="First activity pins the latest release once">
        <div className="lab-controls">
          <button
            className="button primary"
            onClick={() =>
              setNewLock((existing) => pinVersion(existing, published))
            }
          >
            New student's first / repeat activity
          </button>
          <button
            className="button secondary"
            disabled={published === 3}
            onClick={() => setPublished(3)}
          >
            Publish v3 in the start example
          </button>
        </div>
        <Flow label="New student version pin">
          {[
            <Block
              title={`Latest: v${published}`}
              sub="Latest approved release"
            />,
            <Block
              title={
                newLock === null
                  ? "Student has not started"
                  : `Pinned v${newLock}`
              }
              sub="Unique: student_id + course_id"
              tone="dark"
            />,
            <Block
              title="Repeat visit"
              sub="Always reads the existing pin"
              tone="blue"
            />,
          ]}
        </Flow>
        <Hint>
          At the first learning activity, a Moodle plugin requests a database
          pin. A transaction and unique key protect concurrent starts. This
          miniature example is separate from the selected student record below.
        </Hint>
      </Section>
      <Section
        number="C"
        title="The manifest explains compatibility for each activity"
      >
        <div className="lab-controls">
          <label>
            Compare with version
            <select
              aria-label="Target course version"
              value={target}
              onChange={(e) => {
                setTarget(Number(e.target.value));
                setFeedback("");
              }}
            >
              <option value="2">v2 · editorial, non-critical</option>
              <option value="3">v3 · new criteria, critical</option>
            </select>
          </label>
          <span className={`badge ${manifest.critical ? "red" : "blue"}`}>
            {applied
              ? "This version is already pinned or superseded"
              : manifest.critical
                ? "Critical difference in the manifest"
                : "Compatible release · staying is allowed"}
          </span>
        </div>
        <div className="version-summary">
          <div>
            <span>{card.learner.name} · database record</span>
            <strong data-testid="old-version">
              Pinned v{card.learner.version}
            </strong>
            <small>
              Track R{card.revision} · latest v{latestVersion}
            </small>
          </div>
          <div>
            <span>Transition</span>
            <strong>
              v{manifest.from} → v{manifest.to}
            </strong>
            <small>
              {manifest.tag} · {manifest.hash}
            </small>
          </div>
          <div>
            <span>Compatible credit</span>
            <strong>
              {
                manifest.mappings.filter(
                  (m) =>
                    m.action === "carry" &&
                    card.learner.tasks.find((t) => t.id === m.id)?.status ===
                      "accepted",
                ).length
              }{" "}
              activities
            </strong>
            <small>From accepted results in the current track</small>
          </div>
        </div>
        {!applied && (
          <div className="coverage-panel">
            <span className="eyebrow">
              HOW MUCH OF THE TARGET TRACK THE PREVIOUS VERSION COVERS
            </span>
            <div
              className="coverage-bar"
              role="img"
              aria-label={coverage
                .map((p) => `${p.label}: ${p.count}`)
                .join("; ")}
            >
              {coverage
                .filter((p) => p.count)
                .map((p) => (
                  <div
                    key={p.action}
                    style={{
                      width: `${(p.count / requiredTarget.length) * 100}%`,
                      background: p.color,
                    }}
                  >
                    {p.count}
                  </div>
                ))}
            </div>
            <div className="coverage-legend">
              {coverage.map((p) => (
                <span key={p.action}>
                  <i style={{ background: p.color }} />
                  {p.label}: {p.count}/{requiredTarget.length}
                </span>
              ))}
            </div>
            <small>
              This shows content compatibility, not the student's completed
              work. Actual accepted progress is shown separately below.
            </small>
          </div>
        )}
        <details className="reference">
          <summary>Manifest format · example JSON</summary>
          <pre>
            {JSON.stringify(
              {
                manifest_revision: "manifest@1",
                from: `v${manifest.from}`,
                to: manifest.tag,
                critical: manifest.critical,
                approved: manifest.approved,
                complete: manifest.complete,
                assessment_from: "assessment@1",
                assessment_to: target === 3 ? "assessment@2" : "assessment@1",
                mappings: manifest.mappings.slice(0, 6),
                note: "All other IDs are also mapped explicitly; this is an excerpt.",
              },
              null,
              2,
            )}
          </pre>
        </details>
        {!applied && (
          <>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Activity migration rules"
            >
              <table>
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Manifest decision</th>
                    <th>Reason</th>
                    <th>In the target track</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.mappings
                    .filter((m, i) => i < 6 || m.action === "new")
                    .map((m) => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>
                          <span
                            className={`badge ${m.action === "carry" ? "blue" : "red"}`}
                          >
                            {actionLabels[m.action]}
                          </span>
                        </td>
                        <td>{m.reason}</td>
                        <td>
                          {m.action === "retire"
                            ? "Removed; history retained"
                            : m.action === "repeat"
                              ? "New attempt under new criteria"
                              : m.action === "supplement"
                                ? "Submit only the added portion"
                                : m.action === "new"
                                  ? "New assignment"
                                  : "Carry accepted credit; pending stays pending"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <small className="table-caption">
              First 6 activities and all new ones; the remaining{" "}
              {Math.max(0, card.learner.tasks.length - 6)} have explicit
              carry-over rules. The new activity inherits TASK-05's required
              status; its deadline is assigned separately.
            </small>
            <div className="migration-score">
              <div>
                <span>NOW · v{card.learner.version}</span>
                <strong>
                  {beforeMetrics.accepted}/{beforeMetrics.total}
                </strong>
                <small>
                  {fmt(beforeMetrics.percent, "%")} of assigned weight
                </small>
              </div>
              <span>→</span>
              <div>
                <span>AFTER MIGRATION · v{target}</span>
                <strong>
                  {afterMetrics.accepted}/{afterMetrics.total}
                </strong>
                <small>{fmt(afterMetrics.percent, "%")} of the new track</small>
              </div>
            </div>
          </>
        )}
        <Hint>
          “Supplement” retains the previous attempt in history and assigns only
          the missing work. “Repeat” requires a new attempt. Carry-over keeps
          evidence and compatible scores without fabricating a Moodle attempt. A
          v1 → v3 jump needs an explicit v1 → v3 mapping; compatibility is not
          assumed to be transitive.
        </Hint>
      </Section>
      <Section number="D" title="Manual decisions or configured automation">
        <Graph
          title="Version migration decision flow"
          height={450}
          nodes={[
            {
              id: "compare",
              x: 25,
              y: 170,
              w: 200,
              title: "Job: compare manifest",
              sub: "student version → latest tag",
            },
            {
              id: "critical",
              x: 330,
              y: 170,
              w: 230,
              title: "Critical changes?",
              sub: "by rule, not version number",
              tone: "red",
            },
            {
              id: "stay",
              x: 730,
              y: 30,
              w: 280,
              title: "Stay on the pinned version",
              sub: "a new tag leaves progress unchanged",
            },
            {
              id: "decision",
              x: 730,
              y: 170,
              w: 280,
              title: "LearningAtlas: highlight",
              sub: "manual decision / automatic policy",
              tone: "red",
            },
            {
              id: "commit",
              x: 730,
              y: 340,
              w: 280,
              title: "DB: version + track + history",
              sub: "one transaction + delivery queue",
              tone: "dark",
            },
          ]}
          edges={[
            { from: "compare", to: "critical", label: "check" },
            { from: "critical", to: "stay", label: "no" },
            { from: "critical", to: "decision", label: "yes" },
            { from: "decision", to: "commit", label: "conditions satisfied" },
          ]}
        />
        <div className="lab-controls">
          <label>
            Mode
            <select
              aria-label="Migration mode"
              value={automatic ? "auto" : "manual"}
              onChange={(e) => {
                setAutomatic(e.target.value === "auto");
                setAuthorized(false);
              }}
            >
              <option value="manual">Manual · instructor</option>
              <option value="auto">Automatic · policy@1</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
            />
            {automatic
              ? "Course owner enabled automatic policy"
              : "Authorized instructor approved migration"}
          </label>
          {automatic && (
            <label>
              <input
                type="checkbox"
                checked={allowNew}
                onChange={(e) => setAllowNew(e.target.checked)}
              />
              Allow repeated and new assignments
            </label>
          )}
        </div>
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={incomplete}
              onChange={(e) => setIncomplete(e.target.checked)}
            />
            Manifest mapping is incomplete
          </label>
          <label>
            <input
              type="checkbox"
              checked={stale}
              onChange={(e) => setStale(e.target.checked)}
            />
            Student data is stale
          </label>
        </div>
        <div className="compact-inspector" aria-live="polite">
          <strong>
            {applied
              ? "No migration needed"
              : block
                ? "Migration blocked"
                : "Conditions satisfied"}
          </strong>
          <span>
            {applied
              ? "Open statistics or synchronize the projections below."
              : (block ??
                (automatic
                  ? "A job can apply policy@1 without a separate decision for each student."
                  : "The instructor can save the displayed preview."))}
          </span>
        </div>
        <button
          className="button primary"
          disabled={!!block || applied}
          onClick={apply}
        >
          {applied
            ? "Version already pinned"
            : automatic
              ? "Run automatic migration"
              : "Approve manual migration"}
        </button>
        <div className="local-message" role="status">
          {feedback ||
            "This changes the shared demo record. History and statistics remain available across chapters until the page reloads."}
        </div>
        <div className="history-strip">
          {card.history.map((h) => (
            <div key={h.revision}>
              <strong>
                R{h.revision} · v{h.learner.version}:{" "}
                {metrics([h.learner]).accepted}/{metrics([h.learner]).total}
              </strong>
              <span>{h.reason} · previous attempts and grades retained</span>
            </div>
          ))}
          <div>
            <strong>
              Current R{card.revision} · v{card.learner.version}
            </strong>
            <a href={`#statistics/${card.learner.id}`}>
              Open this student record in statistics →
            </a>
          </div>
        </div>
        {card.audit.length > 0 && (
          <details className="reference">
            <summary>Decision audit · {card.audit.length}</summary>
            <pre>{JSON.stringify(card.audit, null, 2)}</pre>
          </details>
        )}
      </Section>
      <Section
        number="E"
        title="Version delivery: database authority, GitLab and Moodle projections"
      >
        <Flow label="Reconcile systems after a decision">
          {[
            <Block
              title={`Database: R${card.revision}`}
              sub={`v${card.learner.version} · decision committed`}
              tone="dark"
            />,
            <Block
              title="Delivery queue · outbox"
              sub={`${card.outbox.filter((o) => !o.materials || !o.moodle).length} updates awaiting acknowledgement`}
            />,
            <Block
              title={`GitLab: R${card.mirrors.materials}`}
              sub="Protected version pin document"
            />,
            <Block
              title={`Moodle: R${card.mirrors.moodle}`}
              sub="Version and personal track"
              tone="blue"
            />,
          ]}
        </Flow>
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={failGitlab}
              onChange={(e) => setFailGitlab(e.target.checked)}
            />
            GitLab unavailable during delivery
          </label>
          <button className="button secondary" onClick={synchronize}>
            Synchronize GitLab and Moodle
          </button>
        </div>
        <div className="json-panel">
          <span>
            student-course-versions.json projection · no names or grades
          </span>
          <pre>
            {JSON.stringify(
              {
                student_id: card.learner.id,
                course_id: "course-demo",
                projection_revision: card.mirrors.materials,
                database_revision: card.revision,
                course_tag:
                  card.mirrors.materials === card.revision
                    ? `course-v${card.learner.version}`
                    : "previous tag; update pending",
                access: "private; only service account",
              },
              null,
              2,
            )}
          </pre>
        </div>
        <Hint>
          LearningAtlas commands include an expected revision and unique
          request_id. The database saves the change and outbox together; jobs
          retry failed delivery. Duplicate commands do not repeat the migration,
          and delayed events cannot roll a projection back. Moodle and GitLab do
          not independently choose a new version.
        </Hint>
      </Section>
      <Section
        number="F"
        title="What happens if the delivery component is unavailable"
      >
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={!available}
              onChange={(e) => setAvailable(!e.target.checked)}
            />
            Delivery component unavailable
          </label>
          <label>
            <input
              type="checkbox"
              checked={cacheRevision === card.revision}
              onChange={(e) =>
                setCacheRevision(e.target.checked ? card.revision : null)
              }
            />
            Verified cache of the current pin exists
          </label>
        </div>
        <div className="compact-inspector">
          <strong>{path ? `Open ${path}` : "Do not launch the lesson"}</strong>
          <span>
            {path
              ? "Verified pin; access is checked before serving the artifact."
              : "No available verified pin. Retry later; never substitute latest."}
          </span>
        </div>
      </Section>
    </>
  );
}
