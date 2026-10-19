import { useState } from "react";
import type { CourseMode } from "../lab";
import { systems, type SystemId } from "../platform";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
  type GraphEdge,
} from "../components/Diagram";
const optional = (mode: CourseMode, id: SystemId) =>
  id === "work"
    ? mode !== "java"
    : id === "sheets" || id === "discord"
      ? mode !== "java" && mode !== "sheets"
      : false;
export default function Ecosystems({ mode }: { mode: CourseMode }) {
  const [selected, setSelected] = useState<SystemId>("db"),
    [layer, setLayer] = useState("facts");
  const system = systems.find((s) => s.id === selected)!;
  const edges: GraphEdge[] =
    layer === "facts"
      ? [
          ...(
            ["materials", "moodle", "work", "sheets", "discord"] as SystemId[]
          ).map((id) => ({
            from: id,
            to: "db",
            label:
              id === "materials"
                ? "versions + manifest"
                : id === "sheets"
                  ? "track / deadline / grade"
                  : id === "discord"
                    ? "clarification + author"
                    : id === "work"
                      ? "code / MR / review"
                      : "attempts / completions",
            dashed: optional(mode, id),
          })),
          { from: "db", to: "atlas", label: "records and metrics" },
        ]
      : layer === "versions"
        ? [
            { from: "atlas", to: "db", label: "migration decision" },
            { from: "db", to: "materials", label: "version pin projection" },
            { from: "db", to: "moodle", label: "student version" },
          ]
        : [
            { from: "sheets", to: "db", label: "group assignments" },
            { from: "discord", to: "db", label: "proposed clarification" },
            { from: "atlas", to: "db", label: "approval / policy" },
            { from: "db", to: "moodle", label: "personal track" },
          ];
  return (
    <>
      <Heading
        kicker="02 / EXACTLY SEVEN SYSTEMS"
        title="Each system has its own role"
        sub="Five sources → one database student record → LearningAtlas. Switch layers and select blocks."
      />
      <div className="tabs" aria-label="Architecture layer">
        {[
          ["facts", "Collect statistics"],
          ["versions", "Change version"],
          ["tracks", "Assign track"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={layer === id ? "selected" : ""}
            aria-pressed={layer === id}
            onClick={() => setLayer(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <Graph
        title="Seven systems · arrows show data direction"
        height={700}
        selected={selected}
        onSelect={(id) => setSelected(id as SystemId)}
        zones={[
          {
            x: 10,
            y: 10,
            w: 330,
            h: 675,
            title: "Learning data sources",
            sub: "Some connections depend on course type",
          },
          {
            x: 480,
            y: 230,
            w: 290,
            h: 230,
            title: "Aggregation and classification",
          },
          { x: 815, y: 230, w: 215, h: 230, title: "Reports and decisions" },
        ]}
        nodes={systems.map((s) => {
          const index = [
            "materials",
            "moodle",
            "work",
            "sheets",
            "discord",
          ].indexOf(s.id);
          return {
            id: s.id,
            x: s.id === "db" ? 505 : s.id === "atlas" ? 835 : 40,
            y: index >= 0 ? 75 + index * 120 : 310,
            w: s.id === "db" ? 240 : s.id === "atlas" ? 175 : 265,
            title: s.title,
            sub: s.role,
            tone:
              s.id === "db"
                ? ("dark" as const)
                : s.id === "atlas"
                  ? ("red" as const)
                  : ("blue" as const),
            inactive: optional(mode, s.id),
          };
        })}
        edges={edges}
      />
      <div className="concept-inspector" aria-live="polite">
        <div>
          <span className="eyebrow">
            {optional(mode, selected)
              ? "NOT CONNECTED FOR THIS COURSE TYPE"
              : "SYSTEM ROLE"}
          </span>
          <h3>{system.title}</h3>
          <p>{system.owns}</p>
        </div>
        <div>
          <span className="eyebrow">HOW DATA IS COLLECTED</span>
          <strong>{system.format}</strong>
          <small>{system.method}</small>
        </div>
      </div>
      <Section number="A" title="First activity: pin a version and deliver it">
        <Flow label="Version pinning at first activity">
          {[
            <Block title="Moodle" sub="Verified user_id + course_id" />,
            <Block
              title="Database: create pin"
              sub="Latest published tag; once"
              tone="dark"
            />,
            <Block
              title="Materials GitLab"
              sub="user → tag projection from the DB queue"
            />,
            <Block
              title="Moodle opens the build"
              sub="Plugin / service selects the exact tag"
              tone="blue"
            />,
          ]}
        </Flow>
        <Hint>
          A tagged static build cannot identify a student. Moodle sends verified
          context; a delivery component reads the database pin and returns the
          correct HTML. The protected GitLab mapping is a projection; a delayed
          update does not override the database pin.
        </Hint>
      </Section>
      <Section number="B" title="New release: compare, decide, synchronize">
        <Flow label="Moving between versions">
          {[
            <Block
              title="GitLab: new tag"
              sub="CI validated build and manifest"
            />,
            <Block
              title="Database background job"
              sub="Compare the student's version with manifest rules"
            />,
            <Block
              title="LearningAtlas"
              sub="Critical → manual or automatic policy"
              tone="red"
            />,
            <Block
              title="Database → GitLab + Moodle"
              sub="New version, track, transferred credit, history"
              tone="dark"
            />,
          ]}
        </Flow>
      </Section>
      <Section
        number="C"
        title="The track defines obligations; sources confirm completion"
      >
        <div className="architecture-pair">
          <div>
            <span className="eyebrow">WHAT MUST BE DONE</span>
            <Flow label="Assignments">
              {[
                <Block
                  title="Sheets / LearningAtlas"
                  sub="Group template or personal assignment"
                />,
                <Block
                  title="Database: track R2"
                  sub="Who · what · by when"
                  tone="blue"
                />,
              ]}
            </Flow>
          </div>
          <div>
            <span className="eyebrow">WHAT HAS BEEN DONE</span>
            <Flow label="Results">
              {[
                <Block title="Moodle / GitLab" sub="Attempts, MRs, evidence" />,
                <Block
                  title="Database: accepted result"
                  sub="Under this course's policy"
                  tone="dark"
                />,
              ]}
            </Flow>
          </div>
        </div>
        <Hint>
          Discord clarifies conditions. Messages are linked to an author, group
          and activity before approved changes apply. CI, jobs, the bot and
          delivery components belong inside these seven systems.
        </Hint>
      </Section>
    </>
  );
}
