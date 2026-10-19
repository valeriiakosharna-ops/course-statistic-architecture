import { useState } from "react";
import type { CourseMode, Intake, Packet } from "../lab";
import { ingest, packetKey, packets, routePacket, sortFacts } from "../lab";
import { assignTrack, clarifyDeadline, type Card, systems } from "../platform";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";
const steps = [
  "Receive",
  "Store source",
  "Normalize fields",
  "Deduplicate",
  "Link IDs",
  "Classify",
  "Calculate",
];
const destinations: Record<string, string> = {
  evidence: "Completion evidence",
  "review-queue": "Review queue",
  "plan-proposal": "Proposed track",
  "course-config": "Versions and manifests",
  "clarification-proposal": "Proposed clarification",
  "grade-candidate": "Proposed grade",
};
const sourceNames = [
  "Moodle",
  "GitLab · students",
  "Sheets · assignments",
  "GitLab · materials",
  "Discord",
  "Sheets · grades",
];
export default function DataFlow({
  mode,
  card,
  onChange,
}: {
  mode: CourseMode;
  card: Card;
  onChange: (card: Card) => void;
}) {
  const [source, setSource] = useState(0),
    [step, setStep] = useState(0),
    [transport, setTransport] = useState("api");
  const [missing, setMissing] = useState(false),
    [verified, setVerified] = useState(false),
    [outage, setOutage] = useState(false);
  const [intake, setIntake] = useState<Intake>({ facts: [], duplicates: 0 }),
    [feedback, setFeedback] = useState("");
  const [track, setTrack] = useState<"individual" | "group">("individual"),
    [approved, setApproved] = useState(false);
  const [clarified, setClarified] = useState(false),
    [gradeChoice, setGradeChoice] = useState("moodle");
  const available =
    mode === "java"
      ? [0, 3, 1, 2, 4, 5]
      : mode === "sheets"
        ? [0, 3, 2, 4, 5]
        : [0, 3];
  const index = available.includes(source) ? source : 0;
  const original = packets[index];
  const packet: Packet = {
    ...original,
    learner: missing && !verified ? null : original.learner,
  };
  const destination = routePacket(packet);
  const facts = intake.facts.filter(
    (p) => p.source === packet.source && p.instance === packet.instance,
  );
  const raw =
    index === 0
      ? {
          id: 284,
          userid: 104,
          quiz: 12,
          sumgrades: 8,
          maxgrade: 10,
          timefinish: Date.parse(packet.eventTime) / 1000,
        }
      : index === 1
        ? {
            project_id: 23,
            iid: 42,
            author_id: 52,
            state: "merged",
            head_sha: "head-a3",
            task_hint: "TASK-01",
          }
        : index === 2
          ? {
              row_id: "row-12",
              group: "A",
              activity_id: "TASK-01",
              required: true,
              deadline: "20.10.2026 23:59",
              timezone: "Europe/Kyiv",
            }
          : index === 3
            ? {
                tag: "course-v3",
                commit: "demo-c3",
                manifest: "manifest.json",
                from: "v1",
                critical: true,
                mapping: { "TASK-01": "carry", "TASK-03": "repeat" },
              }
            : index === 4
              ? {
                  id: "message-105",
                  channel_id: "group-A",
                  author_id: "teacher-7",
                  content:
                    "For group A, TASK-01 is due on 22 October at 23:59 Europe/Kyiv",
                  edited_at: null,
                }
              : {
                  row_id: "grade-12",
                  student_id: "S-1",
                  activity_id: "TASK-01",
                  score: 9,
                  max: 10,
                  rubric: "assessment@1",
                  approved_by: "teacher-7",
                };
  const stages = [
    raw,
    {
      raw_ref: "raw/sync-17/object",
      fetched_at: "2026-10-16T12:00:00Z",
      payload_hash: packet.revision,
      original_preserved: true,
    },
    {
      source_key: packetKey(packet),
      learner_id: packet.learner,
      activity_id: packet.task,
      occurred_at: packet.eventTime,
      due_at_utc: index === 2 ? "2026-10-20T20:59:00Z" : null,
      authored_timezone: index === 2 ? "Europe/Kyiv" : null,
      score: packet.value,
    },
    {
      key: packetKey(packet),
      revision: packet.revision,
      same_revision: "skip",
      changed_revision: "append a revision; retain the previous one",
    },
    {
      account_map: verified
        ? "confirmed by a person"
        : missing
          ? "unmatched"
          : "stable IDs / group registry",
      student: packet.learner,
      activity: packet.task,
      course_version: `v${card.learner.version}`,
      track_revision: card.revision,
    },
    {
      destination: destinations[destination],
      auto_credit: false,
      rule: "record type + source permissions + course policy",
    },
    {
      snapshot_at: "2026-10-16T12:00:00Z",
      formula: "completion@1",
      denominator: "only the student's required track",
      source_watermark: outage ? "stale" : facts.length ? "loaded" : "unknown",
    },
  ];
  function receive() {
    if (outage) {
      setFeedback(
        facts.length
          ? "Source unavailable. Previous facts are retained; freshness is stale."
          : "Source unavailable. No successful load yet; freshness is unknown.",
      );
      return;
    }
    setIntake((previous) => ingest(previous, packet));
    setFeedback(
      "Record received. Repeating a key and revision creates no additional fact.",
    );
  }
  return (
    <>
      <Heading
        kicker="03 / COLLECT · ORGANIZE · DISTRIBUTE"
        title="Follow a single record"
        sub="Receive a record, repeat the load and see which database category receives it."
      />
      <Flow label="End-to-end data pipeline">
        {[
          <Block title="5 sources" sub="API / events / structured file" />,
          <Block
            title="Source data and links"
            sub="History + canonical IDs + deduplication"
          />,
          <Block
            title="Database student record"
            sub="Track + version + accepted facts"
            tone="dark"
          />,
          <Block
            title="LearningAtlas"
            sub="Student → group → course"
            tone="blue"
          />,
        ]}
      </Flow>
      <Section number="A" title="Where data comes from and how it is collected">
        <div
          className="source-matrix table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Sources and data formats"
        >
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>What is received</th>
                <th>How it is collected</th>
              </tr>
            </thead>
            <tbody>
              {systems
                .filter((s) => !["db", "atlas"].includes(s.id))
                .map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.title}</strong>
                    </td>
                    <td>{s.format}</td>
                    <td>{s.method}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Hint>
          Events speed up delivery; scheduled API jobs reconcile data. Each
          source has a cursor, pagination, retries and a last-successful-load
          marker. A Discord bot needs channel access and message permissions; an
          incoming Discord webhook cannot read chat history.
        </Hint>
      </Section>
      <Section
        number="B"
        title="Intake lab: receiving a record does not award credit"
      >
        <div className="source-controls">
          {available.map((i) => (
            <button
              key={i}
              aria-pressed={index === i}
              className={index === i ? "selected" : ""}
              onClick={() => {
                setSource(i);
                setVerified(false);
                setMissing(false);
                setFeedback("");
              }}
            >
              {sourceNames[i]}
            </button>
          ))}
        </div>
        <div className="tabs" aria-label="Collection method">
          <button
            aria-pressed={transport === "api"}
            className={transport === "api" ? "selected" : ""}
            onClick={() => setTransport("api")}
          >
            API / events
          </button>
          <button
            aria-pressed={transport === "csv"}
            className={transport === "csv" ? "selected" : ""}
            onClick={() => setTransport("csv")}
          >
            Manual pilot · CSV / JSON
          </button>
        </div>
        <div className="pipeline-steps">
          {steps.map((label, i) => (
            <button
              key={label}
              className={`pipeline-step ${step === i ? "selected" : ""}`}
              aria-pressed={step === i}
              onClick={() => setStep(i)}
            >
              <span>0{i + 1}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>
        <div className="json-panel">
          <span>
            {transport === "csv" && step === 0
              ? "Manual import: preserve file and origin"
              : `STEP ${step + 1} · ${steps[step]}`}
          </span>
          <pre>
            {transport === "csv" && step === 0 && index === 2
              ? "row_id,group,activity_id,required,deadline,timezone\nrow-12,A,TASK-01,true,20.10.2026 23:59,Europe/Kyiv"
              : JSON.stringify(stages[step], null, 2)}
          </pre>
        </div>
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={outage}
              onChange={(e) => setOutage(e.target.checked)}
            />
            Source unavailable
          </label>
          <label>
            <input
              type="checkbox"
              checked={missing}
              onChange={(e) => {
                setMissing(e.target.checked);
                setVerified(false);
              }}
            />
            Account could not be linked
          </label>
          <button
            className="button secondary"
            disabled={!missing || verified}
            onClick={() => setVerified(true)}
          >
            Confirm link
          </button>
          <button className="button primary" onClick={receive}>
            Receive record
          </button>
        </div>
        <div className="intake-counters">
          <div>
            <strong data-testid="unique-facts">{intake.facts.length}</strong>
            <span>Unique revisions</span>
          </div>
          <div>
            <strong data-testid="duplicates">{intake.duplicates}</strong>
            <span>Duplicates skipped</span>
          </div>
          <div>
            <strong>{destinations[destination]}</strong>
            <span>Destination of this record</span>
          </div>
          <div>
            <strong>
              {outage
                ? facts.length
                  ? "Stale"
                  : "Unknown"
                : facts.length
                  ? "Loaded"
                  : "Not loaded yet"}
            </strong>
            <span>Source freshness</span>
          </div>
        </div>
        <div className="local-message" role="status">
          {feedback ||
            "Choose a source and receive a record. This intake example is isolated; apply student record changes separately below."}
        </div>
        {intake.facts.length > 0 && (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Received records"
          >
            <table>
              <thead>
                <tr>
                  <th>Event time UTC ↑</th>
                  <th>Source / ID</th>
                  <th>Revision</th>
                  <th>Data category</th>
                </tr>
              </thead>
              <tbody>
                {sortFacts(intake.facts).map((p) => (
                  <tr key={packetKey(p) + p.revision}>
                    <td>{p.eventTime.slice(11, 16)}</td>
                    <td>
                      {p.source} / {p.externalId}
                    </td>
                    <td>{p.revision}</td>
                    <td>{destinations[routePacket(p)]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <Section number="C" title="How the database organizes data">
        <Graph
          title="Inside the database · source records, assignments and results stay distinct"
          height={520}
          nodes={[
            {
              id: "raw",
              x: 25,
              y: 210,
              w: 190,
              title: "Source data · raw",
              sub: "JSON / file / message",
            },
            {
              id: "identity",
              x: 335,
              y: 65,
              w: 230,
              title: "Account links",
              sub: "student_id ↔ external IDs",
            },
            {
              id: "class",
              x: 335,
              y: 210,
              w: 230,
              title: "Type + policy",
              sub: "check rights and meaning",
              tone: "blue",
            },
            {
              id: "queue",
              x: 335,
              y: 380,
              w: 230,
              title: "Review queue",
              sub: "missing ID / conflict / unclear",
              tone: "red",
            },
            {
              id: "facts",
              x: 760,
              y: 65,
              w: 250,
              title: "Completion evidence",
              sub: "attempts · MRs · grades",
            },
            {
              id: "plans",
              x: 760,
              y: 210,
              w: 250,
              title: "Assignments and deadlines",
              sub: "track + confirmed clarifications",
            },
            {
              id: "releases",
              x: 760,
              y: 380,
              w: 250,
              title: "Versions and transitions",
              sub: "tags · manifest · decisions",
            },
          ]}
          edges={[
            { from: "raw", to: "class", label: "normalize" },
            { from: "identity", to: "class", label: "identify student" },
            { from: "class", to: "queue", label: "ambiguous" },
            { from: "class", to: "facts", label: "result" },
            { from: "class", to: "plans", label: "obligation" },
            { from: "class", to: "releases", label: "course configuration" },
          ]}
        />
        <div className="architecture-pair">
          <Block
            title="Keys and ordering"
            sub="source + instance + type + external_id + revision; sort by event time, not ingestion time."
          />
          <Block
            title="Names alone do not establish identity"
            sub="Moodle, GitLab and Discord accounts link to one student_id. A person reviews uncertain matches."
          />
        </div>
      </Section>
      <Section
        number="D"
        title="Assign a track: manually or through a group rule"
      >
        <Flow label="From assignment to statistics">
          {[
            <Block
              title="Sheets / LearningAtlas"
              sub={
                track === "individual"
                  ? "Instructor's personal selection"
                  : "Group template rows"
              }
            />,
            <Block
              title="Check scope"
              sub="Course · version · student_id / group_id"
            />,
            <Block
              title={`Database: R${card.revision}`}
              sub={card.trackSource}
              tone="dark"
            />,
            <Block
              title="Moodle + statistics"
              sub="The required activity list changes"
              tone="blue"
            />,
          ]}
        </Flow>
        <div className="lab-controls">
          <label>
            Assignment method
            <select
              aria-label="Track assignment method"
              value={track}
              onChange={(e) => {
                setTrack(e.target.value as typeof track);
                setApproved(false);
              }}
            >
              <option value="individual">Manual: first 4 activities</option>
              <option value="group">Automatic: group template</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
            {track === "individual"
              ? "Instructor approved the assignment"
              : "Course owner enabled the group rule"}
          </label>
          <button
            className="button primary"
            disabled={!approved || (track === "group" && !card.learner.group)}
            onClick={() => {
              onChange(
                assignTrack(card, track, `track-${track}-R${card.revision}`),
              );
              setApproved(false);
            }}
          >
            Apply track to Student 01
          </button>
        </div>
        <div className="compact-inspector" data-testid="shared-track">
          <strong>Student 01 · R{card.revision}</strong>
          <span>
            {card.learner.tasks.filter((t) => t.required).length} required
            activities. <a href="#statistics">See the result in statistics →</a>
          </span>
        </div>
        <Hint>
          A group template expands into personal assignments. Explicit personal
          exceptions take priority until separately revoked. Unassigned
          activities can remain visible in Moodle's catalog without entering the
          progress denominator.
        </Hint>
      </Section>
      <Section
        number="E"
        title="Clarifications and grade conflicts: explicit decisions"
      >
        <div className="architecture-pair">
          <div className="decision-card">
            <span className="eyebrow">DISCORD → TASK-01 DEADLINE</span>
            <p>“For group A: 22 October, 23:59 Europe/Kyiv”</p>
            <Flow label="Clarification review">
              {[
                <Block
                  title="AI proposes"
                  sub="Activity · group · date · quotation"
                />,
                <Block
                  title="Policy / person"
                  sub="Authorized author? Clear time zone?"
                  tone="red"
                />,
              ]}
            </Flow>
            <button
              className="button secondary"
              disabled={
                clarified ||
                card.learner.group !== "A" ||
                card.audit.some(
                  (a) =>
                    a.requestId === "discord-message-105-" + card.learner.id,
                )
              }
              onClick={() => {
                const task = card.learner.tasks.find((t) => t.id === "TASK-01");
                if (!task || card.learner.group !== "A") return;
                onChange(clarifyDeadline(card));
                setClarified(true);
              }}
            >
              Confirm for Student 01 · group A
            </button>
            <small>
              {clarified
                ? "Student 01 deadline: 22 Oct 2026, 20:59 UTC. The original message remains in history."
                : "This demo applies the clarification to S-1 in group A. The self-paced course has no group."}
            </small>
          </div>
          <div className="decision-card">
            <span className="eyebrow">MOODLE 8/10 · SHEETS 9/10</span>
            <p>Two records describe the same result.</p>
            <label>
              Grade source policy
              <select
                aria-label="Grade priority"
                value={gradeChoice}
                onChange={(e) => setGradeChoice(e.target.value)}
              >
                <option value="moodle">Primary grade: Moodle</option>
                <option value="sheets">Approved correction: Sheets</option>
                <option value="review">Not configured → review</option>
              </select>
            </label>
            <strong className="decision-result">
              {gradeChoice === "moodle"
                ? "Result: 8/10; Sheets retained as a candidate"
                : gradeChoice === "sheets"
                  ? "Result: 9/10 + correction author and reason"
                  : "No selected result; conflict highlighted"}
            </strong>
            <small>
              Policy selection example; it does not modify the demo grade. The
              newest record is not automatically authoritative. Grades from
              different sources are not averaged.
            </small>
          </div>
        </div>
      </Section>
      <Section number="F" title="Where to use jobs, AI and people">
        <div className="automation-grid">
          <Block
            title="Pipelines and jobs"
            sub="APIs, JSON/CSV, IDs, UTC, deduplication, formulas, manifests, explicit credit transfer and projection reconciliation."
            tone="blue"
          />
          <Block
            title="AI proposes"
            sub="Parse Discord text, unstructured Sheets rows or MR-to-task links; Claude Code reviews against a rubric."
          />
          <Block
            title="A person or an approved policy"
            sub="Resolve ambiguity, authorize deadline changes, award practice credit and approve critical migrations. Record each decision and its evidence."
            tone="red"
          />
        </div>
        <Flow label="Automated practical checks">
          {[
            <Block
              title="Student MR"
              sub="Treat submitted code as input data"
            />,
            <Block
              title="CI: tests and analysis"
              sub="Isolated job, without production secrets"
            />,
            <Block
              title="Claude Code: review"
              sub="Rubric-based JSON + source line references"
            />,
            <Block
              title="Policy / instructor"
              sub="Recommendation → separate credit decision"
              tone="dark"
            />,
          ]}
        </Flow>
        <Hint>
          Exact IDs, formulas and version comparisons do not need AI. Automatic
          credit requires an approved, validated rubric. For text extraction,
          retain the quotation, model/prompt version, confidence and decision;
          send ambiguity to review.
        </Hint>
      </Section>
    </>
  );
}
