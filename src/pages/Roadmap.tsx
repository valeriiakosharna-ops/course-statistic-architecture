import { useState } from "react";
import { Block, Flow, Heading, Hint, Section } from "../components/Diagram";
const stages = [
  {
    name: "Reliable foundation",
    flow: "Materials GitLab + Moodle → database",
    title: "MVP 1 · Version and personal record",
    metrics: "Theory, quizzes, attempts, scores, personal progress",
    check:
      "First activity pins a tag; repeated ingestion never doubles a result",
    adds: "Stable IDs, manifest, personal track, source data and history",
    complexity: 1,
  },
  {
    name: "Tracks and groups",
    flow: "Sheets → assignments and deadlines → database",
    title: "MVP 2 · Individual obligations and deadlines",
    metrics:
      "Student / group / course; timeliness, overdue work, grading coverage",
    check:
      "Group templates and personal exceptions produce an explainable denominator",
    adds: "Spreadsheet assignments, precedence rules and manual controls in LearningAtlas",
    complexity: 2,
  },
  {
    name: "Practice in GitLab",
    flow: "MR + CI + review → evidence",
    title: "MVP 3 · Practical work and assessment",
    metrics:
      "Submitted / under review / accepted; feedback and repository activity",
    check: "Several MRs for one activity do not create several credits",
    adds: "MR and commit links, automated tests, separate credit decisions",
    complexity: 3,
  },
  {
    name: "Discord clarifications",
    flow: "Message → proposal → decision → database",
    title: "MVP 4 · All seven systems connected",
    metrics:
      "Current deadlines, clarification history, conflicts and source freshness",
    check:
      "A deadline change has an author, quotation, scope and approved basis",
    adds: "Discord bot, structured commands; AI for free text",
    complexity: 3,
  },
  {
    name: "Migrations",
    flow: "Manifest → preview → decision",
    title: "MVP 5 · Controlled migrations",
    metrics:
      "Critically outdated versions, target course coverage and new obligations",
    check:
      "Old history remains reproducible; a GitLab outage does not undo a database decision",
    adds: "Manual migration, credit transfer, delivery queue and exact Moodle builds",
    complexity: 4,
  },
  {
    name: "Governed automation",
    flow: "Policy → job → decision audit",
    title: "MVP 6 · Automatic tracks, migrations and AI assistance",
    metrics: "Rule-based decisions, instructor exceptions, AI review quality",
    check: "Incomplete manifests and unclear results go to review",
    adds: "Configurable automatic migration, rubric-based Claude Code review, quality monitoring",
    complexity: 5,
  },
];
export default function Roadmap() {
  const [selected, setSelected] = useState(0);
  const s = stages[selected];
  return (
    <>
      <Heading
        kicker="06 / PROGRESSIVE CAPABILITIES"
        title="From personal progress to learning decisions"
        sub="Each MVP retains previous capabilities and adds another source or level of automation."
      />
      <div className="mvp-staircase">
        {stages.map((item, i) => (
          <button
            key={item.name}
            aria-pressed={selected === i}
            className={selected === i ? "selected" : ""}
            onClick={() => setSelected(i)}
          >
            <span>{i + 1}</span>
            <div>
              <small>MVP {i + 1}</small>
              <strong>{item.name}</strong>
              <span>{item.flow}</span>
            </div>
            <span
              className="mvp-complexity"
              aria-label={`Complexity ${item.complexity} of 5`}
            >
              {"●".repeat(item.complexity)}
              {"○".repeat(5 - item.complexity)}
            </span>
          </button>
        ))}
      </div>
      <Section number={`0${selected + 1}`} title={s.title}>
        <Flow label="Selected MVP outcome">
          {[
            <Block title="Add" sub={s.adds} />,
            <Block title="Now visible" sub={s.metrics} tone="blue" />,
            <Block title="Readiness criterion" sub={s.check} tone="dark" />,
          ]}
        </Flow>
      </Section>
      <Section number="↗" title="Two pipelines develop together">
        <div className="architecture-pair">
          <div>
            <span className="eyebrow">LEARNING DATA</span>
            <Flow label="Statistics evolution">
              {[
                <Block
                  title="Moodle → Sheets → GitLab → Discord"
                  sub="One student record format from the first MVP"
                />,
                <Block
                  title="Database → LearningAtlas"
                  sub="Student, then group and entire course"
                  tone="dark"
                />,
              ]}
            </Flow>
          </div>
          <div>
            <span className="eyebrow">VERSIONS AND DECISIONS</span>
            <Flow label="Versioning evolution">
              {[
                <Block
                  title="Tags + pins from MVP 1"
                  sub="Catalog and history are versioned from day one"
                />,
                <Block
                  title="Manual → automatic migration"
                  sub="MVPs 5–6: approved manifest mappings"
                  tone="blue"
                />,
              ]}
            </Flow>
          </div>
        </div>
      </Section>
      <Hint>
        Seven systems form the target architecture. Enable connections by course
        type: a course without code does not need student MR ingestion. Discord
        remains in the model; early MVPs can record clarifications manually in
        LearningAtlas with a source link. Complexity is relative, without
        delivery-date estimates.
      </Hint>
    </>
  );
}
