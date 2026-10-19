import { useEffect, useState } from "react";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";
import { vocabulary } from "../platform";
const levels = [
  ["01", "What a student does", "Three kinds of learning work"],
  ["02", "How a course is built", "Activity → unit → module"],
  ["03", "What is assigned", "Version, track and transition rules"],
  ["04", "What is recorded", "Results, deadlines and evidence"],
  ["05", "What an instructor sees", "Everything linked in a student record"],
  ["06", "Where it lives", "Platforms form a separate branch of concepts"],
];
export default function Foundations({ detail }: { detail: string }) {
  const [selected, setSelected] = useState("theory"),
    [view, setView] = useState("structure"),
    [search, setSearch] = useState("");
  useEffect(() => {
    const alias = detail === "learning-plan" ? "track" : detail;
    if (vocabulary.some((t) => t.id === alias)) setSelected(alias);
  }, [detail]);
  const term = vocabulary.find((t) => t.id === selected) ?? vocabulary[0];
  return (
    <>
      <Heading
        kicker="01 / GLOSSARY · 22 CONCEPTS"
        title="From one action to a complete course"
        sub="Select a term. The diagrams connect content, assignments and results."
      />
      <div className="concept-levels">
        {levels.map(([n, name, sub], level) => (
          <div className="concept-level" key={n}>
            <span className="level-number">{n}</span>
            <div className="level-name">
              <strong>{name}</strong>
              <small>{sub}</small>
            </div>
            <div className="concept-chips">
              {vocabulary
                .filter(
                  (t) =>
                    t.level === level &&
                    (!search ||
                      t.name.toLowerCase().includes(search.toLowerCase())),
                )
                .map((t) => (
                  <button
                    key={t.id}
                    aria-pressed={selected === t.id}
                    onClick={() => setSelected(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="concept-inspector" aria-live="polite">
        <div>
          <span className="eyebrow">CONCEPT</span>
          <h3>{term.name}</h3>
          <p>{term.definition}</p>
        </div>
        <div>
          <span className="eyebrow">EXAMPLE</span>
          <strong>{term.example}</strong>
          <small>{term.lives}</small>
        </div>
      </div>
      <label className="glossary-search">
        Find a term{" "}
        <input
          aria-label="Find a term"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="For example: manifest"
        />
      </label>
      <Section
        number="A"
        title="Three relationships: contains / assigned / completed"
      >
        <div className="tabs" aria-label="Concept relationships">
          {[
            ["structure", "How a course is built"],
            ["track", "What the student needs"],
            ["result", "How a result appears"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={view === id}
              className={view === id ? "selected" : ""}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "structure" && (
          <Graph
            title="Content structure · parts belong to a whole"
            height={410}
            selected={selected}
            onSelect={setSelected}
            zones={[
              {
                x: 10,
                y: 10,
                w: 1020,
                h: 380,
                title:
                  "Materials GitLab stores the structure → Moodle presents activities",
              },
            ]}
            nodes={[
              { id: "theory", x: 40, y: 80, title: "Theory", sub: "study" },
              {
                id: "practice",
                x: 40,
                y: 190,
                title: "Practice",
                sub: "apply",
              },
              {
                id: "test",
                x: 40,
                y: 300,
                title: "Quiz",
                sub: "check knowledge",
              },
              {
                id: "activity",
                x: 315,
                y: 190,
                title: "Activity",
                sub: "one tracked step",
                tone: "blue",
                w: 195,
              },
              {
                id: "unit",
                x: 610,
                y: 190,
                title: "Unit",
                sub: "several activities",
              },
              {
                id: "module",
                x: 840,
                y: 190,
                title: "Module",
                sub: "several units",
              },
            ]}
            edges={[
              { from: "theory", to: "activity", label: "kind of" },
              { from: "practice", to: "activity", label: "kind of" },
              { from: "test", to: "activity", label: "kind of" },
              { from: "activity", to: "unit", label: "belongs to" },
              { from: "unit", to: "module", label: "belongs to" },
            ]}
          />
        )}
        {view === "track" && (
          <Graph
            title="The catalog is larger than a personal learning track"
            height={360}
            selected={selected}
            onSelect={setSelected}
            nodes={[
              {
                id: "version",
                x: 30,
                y: 70,
                w: 215,
                title: "Course version",
                sub: "catalog: 40 activities",
              },
              {
                id: "track",
                x: 395,
                y: 70,
                w: 230,
                title: "Learning track",
                sub: "S-1: 30 required",
                tone: "blue",
              },
              {
                id: "card",
                x: 800,
                y: 70,
                w: 210,
                title: "Student record",
                sub: "v1 · track R1 · 20/30",
                tone: "dark",
              },
              {
                id: "manifest",
                x: 395,
                y: 240,
                w: 230,
                title: "Manifest",
                sub: "transition v1 → v3",
              },
            ]}
            edges={[
              {
                from: "version",
                to: "track",
                label: "select relevant activities",
              },
              { from: "track", to: "card", label: "assign" },
              {
                from: "manifest",
                to: "track",
                label: "transfer on migration",
              },
            ]}
          />
        )}
        {view === "result" && (
          <Graph
            title="A result and deadline belong to a student's assignment"
            height={420}
            selected={selected}
            onSelect={setSelected}
            nodes={[
              {
                id: "activity",
                x: 30,
                y: 180,
                title: "Activity",
                sub: "assigned to S-1",
              },
              {
                id: "attempt",
                x: 335,
                y: 60,
                title: "Attempt",
                sub: "one submission",
              },
              { id: "point", x: 630, y: 60, title: "Score", sub: "8 / 10" },
              {
                id: "mr",
                x: 335,
                y: 180,
                title: "MR",
                sub: "practical solution",
              },
              {
                id: "comment",
                x: 630,
                y: 180,
                title: "Comment",
                sub: "feedback on the work",
              },
              {
                id: "deadline",
                x: 335,
                y: 310,
                title: "Deadline",
                sub: "assignment cutoff",
              },
              {
                id: "card",
                x: 850,
                y: 180,
                w: 175,
                title: "Student record",
                sub: "links + accepted result",
                tone: "dark",
              },
            ]}
            edges={[
              { from: "activity", to: "attempt", label: "submit" },
              { from: "attempt", to: "point", label: "grade" },
              { from: "activity", to: "mr", label: "provide code evidence" },
              { from: "mr", to: "comment", label: "discuss" },
              { from: "activity", to: "deadline", label: "set deadline" },
              { from: "point", to: "card", label: "include" },
              { from: "comment", to: "card", label: "save" },
              { from: "deadline", to: "card", label: "check timeliness" },
            ]}
          />
        )}
        <div className="compact-inspector">
          <strong>{term.name}</strong>
          <span>{term.definition}</span>
        </div>
      </Section>
      <Section number="B" title="One learning day, one connected flow">
        <Flow label="From activity to statistics">
          {[
            <Block
              title="Theory → quiz → practice"
              sub="Activities within a unit"
            />,
            <Block
              title="S-1 track, version v1"
              sub="These specific activities are assigned"
              tone="blue"
            />,
            <Block title="Attempt + MR + score" sub="Completion evidence" />,
            <Block
              title="Student record → LearningAtlas"
              sub="Progress against the assigned track"
              tone="dark"
            />,
          ]}
        </Flow>
      </Section>
      <Hint>
        Here, a unit is a small topic and a module groups units. Scores and
        attempts describe results, not content structure. PR is the GitHub term;
        both GitLab systems use MR.
      </Hint>
    </>
  );
}
