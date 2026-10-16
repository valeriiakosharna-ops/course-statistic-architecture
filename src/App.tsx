import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  Database,
  GitBranch,
  Layers,
  Menu,
  Network,
  X,
} from "lucide-react";
import type { CourseMode } from "./lab";
import { modes } from "./lab";
import Foundations from "./pages/Foundations";
import Ecosystems from "./pages/Ecosystems";
import DataFlow from "./pages/DataFlow";
import Versions from "./pages/Versions";
import Statistics from "./pages/Statistics";
import Roadmap from "./pages/Roadmap";
const pages = [
  {
    id: "concepts",
    title: "Из чего состоит",
    sub: "Атомы → целое",
    icon: Boxes,
  },
  {
    id: "ecosystems",
    title: "Где это живёт",
    sub: "Системы и границы",
    icon: Network,
  },
  {
    id: "data",
    title: "Как идут данные",
    sub: "От источника до метрики",
    icon: Database,
  },
  {
    id: "versions",
    title: "Как работают версии",
    sub: "Релизы, планы, история",
    icon: GitBranch,
  },
  {
    id: "statistics",
    title: "Что покажет статистика",
    sub: "Попробовать на примере",
    icon: ChartNoAxesCombined,
  },
  {
    id: "mvp",
    title: "Как растёт MVP",
    sub: "Возможности по шагам",
    icon: Layers,
  },
];
const legacy: Record<string, string> = {
  overview: "concepts",
  glossary: "concepts",
  scenarios: "ecosystems",
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
    [mode, setMode] = useState<CourseMode>("ai"),
    [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = () => {
      setRoute(getRoute());
      setOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const index = pages.findIndex((p) => p.id === route.page);
  useEffect(() => {
    document.title = `${pages[index].title} — Learning Atlas`;
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
        Перейти к содержимому
      </a>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <a className="brand" href="#concepts">
          <span>
            <Layers size={24} />
          </span>
          <strong>
            learning<span>atlas</span>
            <small>АРХИТЕКТУРА В СХЕМАХ</small>
          </strong>
        </a>
        <div className="guide-label">ПОНИМАТЬ ПО ШАГАМ</div>
        <nav aria-label="Разделы концепции">
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
          <span className="demo-badge">Интерактивная модель</span>
          <p>
            Нажимайте на блоки.
            <br />
            Меняйте условия.
            <br />
            Смотрите, что меняется.
          </p>
          <a href="#statistics">
            Сразу к примеру статистики <ArrowRight size={14} />
          </a>
        </div>
      </aside>
      {open && (
        <button
          className="menu-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span className="crumb">Концепция /</span>
            <strong>{pages[index].title}</strong>
          </div>
          <label>
            Тип курса
            <select
              aria-label="Тип курса"
              value={mode}
              onChange={(e) => setMode(e.target.value as CourseMode)}
            >
              {modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="model-banner">
            <span>Модель для обсуждения · DEMO</span>
            <small>Источники не подключены. Все примеры синтетические.</small>
          </div>
          <div key={route.page}>
            {route.page === "concepts" && <Foundations detail={route.detail} />}
            {route.page === "ecosystems" && <Ecosystems mode={mode} />}
            {route.page === "data" && <DataFlow mode={mode} />}
            {route.page === "versions" && <Versions />}
            {route.page === "statistics" && (
              <Statistics mode={mode} setMode={setMode} />
            )}
            {route.page === "mvp" && <Roadmap />}
          </div>
          <div className="page-pagination">
            {index > 0 ? (
              <a href={`#${pages[index - 1].id}`}>
                <ArrowLeft size={17} />
                <span>
                  <small>НАЗАД</small>
                  {pages[index - 1].title}
                </span>
              </a>
            ) : (
              <span />
            )}
            {index < pages.length - 1 && (
              <a href={`#${pages[index + 1].id}`}>
                <span>
                  <small>ДАЛЬШЕ</small>
                  {pages[index + 1].title}
                </span>
                <ArrowRight size={17} />
              </a>
            )}
          </div>
          <footer>
            <span>Learning Atlas · от учебной задачи к проверяемому числу</span>
            <details>
              <summary>Исходные материалы</summary>
              <div>
                {[
                  ["Архитектура", "01-architecture.md"],
                  ["План реализации", "02-implementation-plan.md"],
                  ["Контракты", "03-data-contracts.md"],
                  ["UI исходного проекта", "04-product-ui.md"],
                  [
                    "Проверки и открытые вопросы",
                    "05-testing-and-decisions.md",
                  ],
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
