import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Download,
  GitBranch,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Block, Flow, Heading } from "../components/Diagram";
import { getLanguage, translateText } from "../i18n";
import {
  emptyScenarioFilters,
  filterScenarios,
  planChangeMatrix,
  scenarioDimensions,
  scenarioGroups,
  scenarioKindLabels,
  scenarioPhases,
  scenarios,
  type ScenarioFilters,
} from "../scenarios";

function downloadCatalogue() {
  const content = [
    translateText("# Learning scenarios — discovery catalogue"),
    translateText(
      "Real-world situations and open policy choices. Architecture coverage has not been assessed. This catalogue is a starting set, not an exhaustive enumeration of every combination.",
    ),
    ...scenarioGroups.flatMap((group) => [
      `## ${translateText(group.title)}`,
      ...scenarios
        .filter((s) => s.group === group.id)
        .map((s) =>
          [
            `### ${s.id} — ${translateText(s.title)}`,
            `Dimensions: ${s.dimensions.map((d) => translateText(d)).join(", ")}. Type: ${translateText(scenarioKindLabels[s.kind])}.`,
            `Before: ${s.flow[0]}`,
            `Event: ${s.flow[1]}`,
            `Situation: ${s.flow[2]}`,
            `Question: ${s.question}`,
            `Possible choice A: ${s.choices[0]}`,
            `Possible choice B: ${s.choices[1]}`,
            `Facts to establish: ${s.facts.map((fact) => translateText(fact)).join("; ")}.`,
            `Scenario link: #scenarios/${s.id}`,
          ]
            .map((line) => translateText(line))
            .join("\n\n"),
        ),
    ]),
  ].join("\n\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/markdown;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    getLanguage() === "uk"
      ? "learning-scenarios.uk.md"
      : "learning-scenarios.md";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Scenarios({ detail }: { detail: string }) {
  const [filters, setFilters] = useState<ScenarioFilters>(emptyScenarioFilters);
  const inspector = useRef<HTMLElement>(null);
  const caseList = useRef<HTMLElement>(null);
  const visible = filterScenarios(filters);
  const selected = visible.find((s) => s.id === detail) ?? visible[0];
  const unknownLink = detail && !scenarios.some((s) => s.id === detail);
  useEffect(() => {
    const list = caseList.current;
    const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (list && active)
      list.scrollTop = Math.max(
        0,
        active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2,
      );
  }, [selected?.id]);
  useEffect(() => {
    if (detail && scenarios.some((s) => s.id === detail)) {
      setFilters((current) =>
        filterScenarios(current).some((s) => s.id === detail)
          ? current
          : emptyScenarioFilters,
      );
      const frame = requestAnimationFrame(() => {
        inspector.current?.focus({ preventScroll: true });
        inspector.current?.scrollIntoView({ block: "start" });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [detail]);
  const update = <K extends keyof ScenarioFilters>(
    key: K,
    value: ScenarioFilters[K],
  ) => setFilters((current) => ({ ...current, [key]: value }));
  const openScenario = (id: string) => {
    setFilters(emptyScenarioFilters);
    if (detail === id) {
      inspector.current?.focus({ preventScroll: true });
      inspector.current?.scrollIntoView({ block: "start" });
    } else location.hash = `scenarios/${id}`;
  };
  const selectedNumber = selected ? scenarios.indexOf(selected) + 1 : 0;
  return (
    <div className="scenario-page">
      <Heading
        kicker="08 / REAL-WORLD SCENARIOS"
        title="What can happen during a course?"
        sub="Explore everyday journeys, changes and exceptions before deciding how to handle them."
      />
      <div className="scenario-scope">
        <div>
          <span className="eyebrow">DISCOVERY, BEFORE DESIGN</span>
          <strong>
            {scenarios.length} cases · {scenarioGroups.length} groups · many
            possible combinations
          </strong>
        </div>
        <p>
          Policy choices are open. Architecture coverage has not been assessed.
          Combine cases to explore more situations.
        </p>
        <button className="scenario-download" onClick={downloadCatalogue}>
          <Download size={16} /> Download all cases
        </button>
      </div>

      <section className="scenario-overview" aria-label="Scenario maps">
        <div className="scenario-lifecycle">
          <h2>A journey can change at any point</h2>
          <div
            className="scenario-phase-map"
            role="group"
            aria-label="Filter by learning stage"
          >
            {scenarioPhases.map((phase, i) => (
              <div key={phase.id}>
                <button
                  aria-pressed={filters.phase === phase.id}
                  onClick={() =>
                    update(
                      "phase",
                      filters.phase === phase.id ? "all" : phase.id,
                    )
                  }
                >
                  <small>0{i + 1}</small>
                  <strong>{phase.title}</strong>
                  <span>{phase.sub}</span>
                </button>
                {i < scenarioPhases.length - 1 && (
                  <ArrowRight
                    className="scenario-phase-arrow"
                    size={18}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
          <p>
            ↶ A learner can pause, go back, repeat or return. Select a stage to
            filter the cases.
          </p>
        </div>
        <div className="scenario-matrix">
          <h2>Version and track are separate changes</h2>
          <div
            className="scenario-matrix-grid"
            role="group"
            aria-label="Version and track combinations"
          >
            {planChangeMatrix.map((cell) => (
              <button
                key={cell.scenario}
                onClick={() => openScenario(cell.scenario)}
              >
                <span>
                  {cell.version} <span aria-hidden="true"> / </span>{" "}
                  {cell.track}
                </span>
                <strong>
                  {cell.label} <ArrowRight size={14} aria-hidden="true" />
                </strong>
              </button>
            ))}
          </div>
          <p>
            Any cell can also include a deadline, assignment or submission
            issue.
          </p>
        </div>
      </section>

      <section
        className="scenario-catalogue"
        aria-labelledby="scenario-catalogue-title"
      >
        <div className="scenario-section-heading">
          <span className="eyebrow">BROWSE REALITY</span>
          <h2 id="scenario-catalogue-title">Choose a situation</h2>
        </div>
        <div
          className="scenario-groups"
          role="group"
          aria-label="Scenario groups"
        >
          <button
            aria-pressed={filters.group === "all"}
            onClick={() => update("group", "all")}
          >
            <span>ALL CASES</span>
            <strong>Whole catalogue</strong>
            <small>{scenarios.length} situations</small>
          </button>
          {scenarioGroups.map((group) => (
            <button
              key={group.id}
              aria-pressed={filters.group === group.id}
              onClick={() => update("group", group.id)}
            >
              <span>
                {scenarios.filter((s) => s.group === group.id).length} CASES
              </span>
              <strong>{group.title}</strong>
              <small>{group.prompt}</small>
            </button>
          ))}
        </div>
        <div className="scenario-filters">
          <label className="scenario-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search scenarios</span>
            <input
              type="search"
              placeholder="Search: MR title, extension, Google Sheets…"
              value={filters.query}
              onChange={(e) => update("query", e.target.value)}
            />
          </label>
          <label>
            What changes?
            <select
              aria-label="Scenario dimension"
              value={filters.dimension}
              onChange={(e) =>
                update(
                  "dimension",
                  e.target.value as ScenarioFilters["dimension"],
                )
              }
            >
              <option value="all">All dimensions</option>
              {scenarioDimensions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Situation type
            <select
              aria-label="Scenario type"
              value={filters.kind}
              onChange={(e) =>
                update("kind", e.target.value as ScenarioFilters["kind"])
              }
            >
              <option value="all">All types</option>
              {Object.entries(scenarioKindLabels).map(([id, label]) => (
                <option value={id} key={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="scenario-reset"
            onClick={() => setFilters(emptyScenarioFilters)}
          >
            <SlidersHorizontal size={15} /> Reset filters
          </button>
        </div>
        <div className="scenario-results-summary" role="status">
          <span>
            {visible.length} of {scenarios.length} cases
            {filters.phase !== "all"
              ? ` · ${scenarioPhases.find((p) => p.id === filters.phase)!.title}`
              : ""}
          </span>
          <small>
            Filter groups and dimensions together. Select a case for its
            diagram.
          </small>
        </div>
        {unknownLink && (
          <p className="scenario-notice">
            This scenario link is not in the catalogue. Browse the cases below.
          </p>
        )}
        {visible.length === 0 ? (
          <div className="scenario-empty">
            <Search size={25} />
            <h3>No matching situations</h3>
            <p>Try a broader search or reset the filters.</p>
            <button onClick={() => setFilters(emptyScenarioFilters)}>
              Show all cases
            </button>
          </div>
        ) : (
          selected && (
            <div className="scenario-workspace">
              <nav
                className="scenario-case-list"
                aria-label="Scenario cases"
                ref={caseList}
              >
                {visible.map((s) => (
                  <button
                    key={s.id}
                    aria-pressed={selected.id === s.id}
                    onClick={() => {
                      if (detail === s.id) {
                        inspector.current?.focus({ preventScroll: true });
                        inspector.current?.scrollIntoView({ block: "start" });
                      } else location.hash = `scenarios/${s.id}`;
                    }}
                  >
                    <span className="scenario-case-meta">
                      <span>
                        CASE {String(scenarios.indexOf(s) + 1).padStart(2, "0")}
                      </span>
                      <span className={`scenario-kind kind-${s.kind}`}>
                        {scenarioKindLabels[s.kind]}
                      </span>
                    </span>
                    <strong>{s.title}</strong>
                    <small>{s.dimensions.join(" · ")}</small>
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                ))}
              </nav>
              <section
                className="scenario-inspector"
                ref={inspector}
                tabIndex={-1}
                aria-labelledby="selected-scenario-title"
                data-testid="scenario-inspector"
              >
                <div className="scenario-detail-heading">
                  <span className="eyebrow">
                    CASE {String(selectedNumber).padStart(2, "0")} /{" "}
                    {scenarioGroups.find((g) => g.id === selected.group)!.title}
                  </span>
                  <span className={`scenario-kind kind-${selected.kind}`}>
                    {scenarioKindLabels[selected.kind]}
                  </span>
                </div>
                <h2 id="selected-scenario-title">{selected.title}</h2>
                <div className="scenario-tags">
                  {selected.dimensions.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <Flow label="Scenario: before, event and resulting situation">
                  {[
                    <Block title="Before" sub={selected.flow[0]} />,
                    <Block
                      title="What happens"
                      sub={selected.flow[1]}
                      tone="blue"
                    />,
                    <Block
                      title="Situation to resolve"
                      sub={selected.flow[2]}
                      tone="dark"
                    />,
                  ]}
                </Flow>
                <div className="scenario-question">
                  <GitBranch size={21} aria-hidden="true" />
                  <div>
                    <span className="eyebrow">DECISION TO DISCUSS</span>
                    <h3>{selected.question}</h3>
                  </div>
                </div>
                <div
                  className="scenario-choices"
                  role="group"
                  aria-label="Possible policy choices"
                >
                  {selected.choices.map((choice, i) => (
                    <div key={choice}>
                      <span>{i === 0 ? "A" : "B"}</span>
                      <p>{choice}</p>
                    </div>
                  ))}
                </div>
                <p className="scenario-options-note">
                  Possible policies to compare, not approved rules. Other
                  choices may be appropriate.
                </p>
                <div className="scenario-facts">
                  <h3>Facts to establish</h3>
                  <ul>
                    {selected.facts.map((fact) => (
                      <li key={fact}>
                        <Check size={14} aria-hidden="true" />
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
                {selected.related && (
                  <div className="scenario-related">
                    <h3>Explore alongside</h3>
                    {selected.related.map((id) => (
                      <button key={id} onClick={() => openScenario(id)}>
                        {scenarios.find((s) => s.id === id)!.title}
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}
                <a
                  className="scenario-permalink"
                  href={`#scenarios/${selected.id}`}
                >
                  Link to this case <span>#{selected.id}</span>
                </a>
              </section>
            </div>
          )
        )}
      </section>

      <section
        className="scenario-combinations"
        aria-labelledby="scenario-combinations-title"
      >
        <span className="eyebrow">CASES CAN OVERLAP</span>
        <h2 id="scenario-combinations-title">One event rarely happens alone</h2>
        <div
          className="scenario-combination-flow"
          aria-label="Combine independent changes"
        >
          <span>Version or track change</span>
          <span aria-hidden="true">+</span>
          <span>Timing or assignment change</span>
          <span aria-hidden="true">+</span>
          <span>Work already in progress</span>
          <ArrowDown size={19} aria-hidden="true" />
        </div>
        <div className="scenario-combination-cards">
          {scenarios
            .filter((s) => s.group === "combined")
            .map((s) => (
              <button key={s.id} onClick={() => openScenario(s.id)}>
                <strong>{s.title}</strong>
                <span>{s.dimensions.join(" + ")}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ))}
        </div>
        <p>
          This catalogue is a starting set, not an exhaustive list. For another
          combination, ask: who is affected, what was agreed, when does it
          change, and what happens to earlier work?
        </p>
      </section>
    </div>
  );
}
