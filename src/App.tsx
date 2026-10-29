import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  Database,
  GitBranch,
  Layers,
  ListTree,
  Menu,
  Network,
  Workflow,
  X,
} from "lucide-react";
import type { CourseMode } from "./lab";
import { modes } from "./lab";
import { createPlatform, type Card } from "./platform";
import Foundations from "./pages/Foundations";
import Ecosystems from "./pages/Ecosystems";
import DataFlow from "./pages/DataFlow";
import Versions from "./pages/Versions";
import Statistics from "./pages/Statistics";
import Roadmap from "./pages/Roadmap";
import Simulation from "./pages/Simulation";
import Scenarios from "./pages/Scenarios";
import { newRun, type SimulationCourse } from "./simulation";
const pages = [
  {
    id: "concepts",
    title: "Building blocks",
    sub: "Atoms → whole",
    icon: Boxes,
  },
  {
    id: "ecosystems",
    title: "Systems & connections",
    sub: "Roles and boundaries",
    icon: Network,
  },
  {
    id: "data",
    title: "How data flows",
    sub: "From source to metric",
    icon: Database,
  },
  {
    id: "versions",
    title: "How versions work",
    sub: "Releases, tracks, history",
    icon: GitBranch,
  },
  {
    id: "statistics",
    title: "Explore statistics",
    sub: "Try the examples",
    icon: ChartNoAxesCombined,
  },
  {
    id: "mvp",
    title: "MVP roadmap",
    sub: "Capabilities, step by step",
    icon: Layers,
  },
  {
    id: "simulation",
    title: "Learning journey",
    sub: "Triggers and data in motion",
    icon: Workflow,
  },
  {
    id: "scenarios",
    title: "Real-world scenarios",
    sub: "Situations before solutions",
    icon: ListTree,
  },
];
const legacy: Record<string, string> = {
  overview: "concepts",
  glossary: "concepts",
  roadmap: "mvp",
  decisions: "concepts",
};
function getRoute() {
  const [page, detail] = location.hash.slice(1).split("/");
  return {
    page: pages.some((p) => p.id === page)
      ? page
      : (legacy[page] ?? "concepts"),
    detail: detail ?? "",
  };
}
export default function App() {
  const [route, setRoute] = useState(getRoute),
    [mode, setMode] = useState<CourseMode>(() =>
      getRoute().page === "simulation" && getRoute().detail === "java"
        ? "java"
        : "ai",
    ),
    [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = () => {
      const next = getRoute();
      setRoute(next);
      if (next.page === "simulation")
        setMode((m) =>
          next.detail === "java"
            ? "java"
            : next.detail === "ai"
              ? "ai"
              : m === "java"
                ? "java"
                : "ai",
        );
      setOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const [runs, setRuns] = useState(() => ({ ai: newRun(), java: newRun() }));
  const [platform, setPlatform] = useState(createPlatform);
  const updateCard = (card: Card) =>
    setPlatform((p) => ({
      ...p,
      [mode]: p[mode].map((c) => (c.learner.id === card.learner.id ? card : c)),
    }));
  const cards = platform[mode];
  const index = pages.findIndex((p) => p.id === route.page);
  useEffect(() => {
    document.title = `${pages[index].title} — LearningAtlas`;
  }, [index]);
  return (
    <div className="app">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        {" "}
        Skip to content{" "}
      </a>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <a className="brand" href="#concepts">
          <span>
            <Layers size={24} />
          </span>
          <strong>
            learning<span>atlas</span>
            <small> ARCHITECTURE IN DIAGRAMS </small>
          </strong>
        </a>
        <div className="guide-label"> UNDERSTAND, STEP BY STEP </div>
        <nav aria-label="Architecture chapters">
          {pages.map((p, i) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              aria-current={route.page === p.id ? "page" : undefined}
              className={route.page === p.id ? "active" : ""}
            >
              <span className="nav-number">0{i + 1}</span>
              <div>
                <strong>{p.title}</strong>
                <small>{p.sub}</small>
              </div>
              <p.icon size={18} />
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="demo-badge"> Interactive model </span>
          <p>
            {" "}
            Select a block. <br /> Change a condition. <br /> See what
            changes.{" "}
          </p>
          <a href="#simulation">
            {" "}
            Try the learning journey <ArrowRight size={14} />
          </a>
        </div>
      </aside>
      {open && (
        <button
          className="menu-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span className="crumb"> Concept / </span>
            <strong>{pages[index].title}</strong>
          </div>
          {route.page === "scenarios" ? (
            <span className="scenario-course-scope">All course types</span>
          ) : (
            <label>
              {" "}
              Course type{" "}
              <select
                aria-label="Course type"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as CourseMode);
                  if (route.page === "simulation")
                    location.hash = `#simulation/${e.target.value}`;
                }}
              >
                {modes
                  .filter(
                    (m) =>
                      route.page !== "simulation" ||
                      m.id === "ai" ||
                      m.id === "java",
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="model-banner">
            <span>
              {route.page === "scenarios"
                ? "Real-world scenarios · DISCOVERY"
                : "Architecture concept · DEMO"}
            </span>
            <small>
              {" "}
              {route.page === "scenarios"
                ? "Open questions to explore before choosing a solution."
                : "No live connections. All examples use synthetic data."}{" "}
            </small>
          </div>
          <div key={`${route.page}-${mode}`}>
            {route.page === "concepts" && <Foundations detail={route.detail} />}
            {route.page === "ecosystems" && <Ecosystems mode={mode} />}
            {route.page === "data" && (
              <DataFlow mode={mode} card={cards[0]} onChange={updateCard} />
            )}
            {route.page === "versions" && (
              <Versions
                cards={cards}
                detail={route.detail}
                onChange={updateCard}
              />
            )}
            {route.page === "statistics" && (
              <Statistics
                mode={mode}
                setMode={setMode}
                detail={route.detail}
                cards={cards}
                onChange={updateCard}
              />
            )}
            {route.page === "mvp" && <Roadmap />}
            {route.page === "scenarios" && <Scenarios detail={route.detail} />}
            {route.page === "simulation" && (
              <Simulation
                course={mode === "java" ? "java" : "ai"}
                run={runs[mode === "java" ? "java" : "ai"]}
                onChange={(run) =>
                  setRuns((r) => ({
                    ...r,
                    [mode === "java" ? "java" : "ai"]: run,
                  }))
                }
                setCourse={(course: SimulationCourse) => {
                  setMode(course);
                  location.hash = `#simulation/${course}`;
                }}
                onInspect={(card) => {
                  updateCard(card);
                  location.hash = "#statistics/S-1";
                }}
              />
            )}
          </div>
          <div className="page-pagination">
            {index > 0 ? (
              <a href={`#${pages[index - 1].id}`}>
                <ArrowLeft size={17} />
                <span>
                  <small> BACK </small>
                  {pages[index - 1].title}
                </span>
              </a>
            ) : (
              <span />
            )}
            {index < pages.length - 1 && (
              <a href={`#${pages[index + 1].id}`}>
                <span>
                  <small> NEXT </small>
                  {pages[index + 1].title}
                </span>
                <ArrowRight size={17} />
              </a>
            )}
          </div>
          <footer>
            <span>
              {" "}
              LearningAtlas · from a learning task to a traceable metric{" "}
            </span>
            <details>
              <summary>
                {" "}
                Reference materials · original project archive{" "}
              </summary>
              <div>
                {[
                  ["Architecture", "01-architecture.md"],
                  ["Implementation plan", "02-implementation-plan.md"],
                  ["Data contracts", "03-data-contracts.md"],
                  ["Original product UI", "04-product-ui.md"],
                  ["Testing and open decisions", "05-testing-and-decisions.md"],
                ].map(([label, file]) => (
                  <a
                    key={file}
                    download
                    href={`${import.meta.env.BASE_URL}materials/docs/${file}`}
                  >
                    {label} ↓
                  </a>
                ))}
              </div>
            </details>
          </footer>
        </main>
      </div>
    </div>
  );
}
