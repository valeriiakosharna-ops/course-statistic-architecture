import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Database,
  FileCode2,
  FileText,
  Flag,
  GitBranch,
  GraduationCap,
  Layers,
  LayoutGrid,
  Link2,
  LockKeyhole,
  Menu,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { decisions, groups, scenarios, stages, terms } from "./data";
import type { Page, Scenario, ScenarioId } from "./data";
import {
  completion,
  groupPlan,
  linkEvidence,
  migrationTasks,
  previewMigration,
  resolveVersion,
  uniqueLinkedTasks,
} from "./model";

const nav: {
  id: Page;
  label: string;
  icon: ComponentType<{ size?: number }>;
  num: string;
}[] = [
  { id: "overview", label: "Обзор архитектуры", icon: LayoutGrid, num: "01" },
  { id: "glossary", label: "Словарь понятий", icon: BookOpen, num: "02" },
  { id: "scenarios", label: "Сценарии и системы", icon: Network, num: "03" },
  { id: "roadmap", label: "Линейка MVP", icon: Layers, num: "04" },
  {
    id: "decisions",
    label: "Решения и вопросы",
    icon: ClipboardCheck,
    num: "05",
  },
];
function route() {
  const [p, detail] = location.hash.slice(1).split("/");
  return {
    page: nav.some((n) => n.id === p) ? (p as Page) : ("overview" as Page),
    detail: detail ?? "",
  };
}
const href = (page: Page, detail?: string) =>
  `#${page}${detail ? `/${detail}` : ""}`;
function Pill({ children, tone = "" }: { children: ReactNode; tone?: string }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
function SectionHeading({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{label}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
function PageIntro({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow">АТЛАС / {number}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}
function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice">
      <CircleHelp size={19} />
      <p>{children}</p>
    </div>
  );
}

export default function App() {
  const [locationState, setLocationState] = useState(route);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handler = () => {
      setLocationState(route());
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const { page, detail } = locationState;
  useEffect(() => {
    document.title = `${nav.find((n) => n.id === page)?.label} — Learning Atlas`;
  }, [page]);
  return (
    <div className="app-shell">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Перейти к содержимому
      </a>
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <a className="brand" href="#overview">
          <span className="brand-mark">
            <Layers size={21} />
          </span>
          <span>
            learning<span className="brand-thin">atlas</span>
            <small>АРХИТЕКТУРА ОБУЧЕНИЯ</small>
          </span>
        </a>
        <div className="workspace-label">
          <span className="tiny-square" /> Учебная статистика{" "}
          <span className="version-label">v0.1</span>
        </div>
        <p className="nav-label">ИССЛЕДОВАТЬ КОНЦЕПЦИЮ</p>
        <nav aria-label="Основная навигация">
          {nav.map((n) => (
            <a
              key={n.id}
              href={href(n.id)}
              aria-current={page === n.id ? "page" : undefined}
              className={page === n.id ? "nav-item active" : "nav-item"}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              <small>{n.num}</small>
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="mini-icon">
            <GraduationCap size={20} />
          </span>
          <strong>
            Сначала смысл.
            <br />
            Затем метрики.
          </strong>
          <p>Единые понятия для команды, которая строит учебную аналитику.</p>
          <a href="#glossary">
            Начать со словаря <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Концепция для обсуждения
          <small>По материалам архитектурного пакета</small>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="menu-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span>Learning Analytics</span>
            <ChevronRight size={13} />
            <strong>{nav.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-label">
              <span /> Архитектурная модель
            </span>
            <a className="source-link" href="#decisions/sources">
              Материалы <ArrowUpRight size={15} />
            </a>
          </div>
        </header>
        <main id="main" tabIndex={-1} key={page}>
          {page === "overview" && <Overview />}
          {page === "glossary" && <Glossary detail={detail} />}
          {page === "scenarios" && <Scenarios detail={detail} />}
          {page === "roadmap" && <Roadmap />}
          {page === "decisions" && <Decisions detail={detail} />}
          <footer>
            <span>
              <span className="footer-mark">◈</span> Learning Atlas
            </span>
            <p>
              Проектируем систему. Все примеры синтетические, подключения не
              выполняются.
            </p>
            <a href="#decisions/sources">
              Исходные материалы <ArrowUpRight size={13} />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Overview() {
  return (
    <>
      <div className="overview-label">
        <span className="eyebrow">КОНЦЕПЦИЯ ПЛАТФОРМЫ</span>
        <Pill>
          <span className="status-dot" /> Предлагаемая архитектура
        </Pill>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">LEARNING ANALYTICS / BLUEPRINT</span>
          <h1>
            Разные системы.
            <br />
            Единая картина
            <br />
            <em>обучения.</em>
          </h1>
          <p>
            Как собрать учебные данные, понять их смысл
            <br className="desktop-break" /> и превратить в проверяемую
            статистику.
          </p>
          <a className="button lime" href="#scenarios">
            Разобрать сценарии <ArrowRight size={17} />
          </a>
          <a className="hero-secondary" href="#roadmap">
            От первых метрик к платформе <ArrowUpRight size={15} />
          </a>
        </div>
        <div
          className="hero-visual"
          aria-label="Источники Moodle, GitLab и Sheets объединяются в учебный план и проверяемые метрики"
        >
          <span className="visual-label">СВЯЗАТЬ ДАННЫЕ СО СМЫСЛОМ</span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="source-float moodle-float">
            <span className="source-logo moodle">m</span>
            <div>
              <strong>Moodle</strong>
              <small>Оценки и попытки</small>
            </div>
            <span className="float-dot" />
          </div>
          <div className="source-float gitlab-float">
            <span className="source-logo gitlab">
              <GitBranch size={18} />
            </span>
            <div>
              <strong>GitLab</strong>
              <small>Материалы и MR</small>
            </div>
            <span className="float-dot" />
          </div>
          <div className="source-float sheets-float">
            <span className="source-logo sheets">
              <FileText size={18} />
            </span>
            <div>
              <strong>Sheets</strong>
              <small>Назначения и сроки</small>
            </div>
            <span className="float-dot" />
          </div>
          <div className="visual-connector">
            <span />
            <span />
            <span />
          </div>
          <div className="plan-float">
            <div className="plan-float-top">
              <span>
                <Layers size={16} /> Индивидуальный план
              </span>
              <LockKeyhole size={15} />
            </div>
            <strong>
              У каждого студента —<br />
              свои обязательства.
            </strong>
            <div className="fake-bars">
              <i />
              <i />
              <i />
              <i />
              <i className="muted" />
              <i className="muted" />
            </div>
            <div className="plan-float-bottom">
              <span>Понятный знаменатель</span>
              <Check size={14} />
            </div>
          </div>
          <span className="visual-caption">
            ФАКТЫ → ПЛАН → ОБЪЯСНИМЫЙ РЕЗУЛЬТАТ
          </span>
        </div>
      </section>
      <div className="principle-strip">
        <span className="principle-number">01</span>
        <p>
          <strong>Прогресс — по плану студента.</strong>
          <span> Не по количеству активностей в Moodle.</span>
        </p>
        <a
          href="#glossary/learning-plan"
          aria-label="Открыть понятие индивидуального плана"
        >
          <ArrowUpRight size={20} />
        </a>
      </div>
      <section className="explore-grid">
        {[
          {
            icon: BookOpen,
            num: "01",
            title: "Говорить на одном языке",
            text: `${terms.length} понятий: от учебной задачи до происхождения данных.`,
            to: "glossary" as Page,
            label: "Открыть словарь",
          },
          {
            icon: Network,
            num: "02",
            title: "Разобрать путь данных",
            text: "Четыре конфигурации систем, настройки и правила расчёта.",
            to: "scenarios" as Page,
            label: "Изучить сценарии",
          },
          {
            icon: Layers,
            num: "03",
            title: "Двигаться поэтапно",
            text: "От обследования источников до версий, миграций и помощи AI.",
            to: "roadmap" as Page,
            label: "Посмотреть MVP",
          },
        ].map((c) => (
          <a className="explore-card" href={href(c.to)} key={c.num}>
            <div className="card-top">
              <c.icon size={22} />
              <span>{c.num}</span>
            </div>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
            <span className="text-link">
              {c.label}
              <ArrowRight size={16} />
            </span>
          </a>
        ))}
      </section>
      <section className="section-space">
        <SectionHeading
          label="ОТ ИСТОЧНИКА К РЕШЕНИЮ"
          title="Как устроена система"
        >
          <a className="subtle-link" href="#scenarios">
            Подробнее в сценариях <ArrowUpRight size={16} />
          </a>
        </SectionHeading>
        <ArchitectureFlow />
      </section>
      <section className="section-space">
        <SectionHeading
          label="ДВА ПИЛОТА · РАЗНЫЕ МОДЕЛИ"
          title="Одна архитектура, разное обучение"
        />
        <div className="pilot-grid">
          <a href="#scenarios/ai" className="pilot-card">
            <div className="pilot-heading">
              <span className="pilot-symbol">
                <Sparkles size={24} />
              </span>
              <Pill>SELF-PACED</Pill>
            </div>
            <h3>Основы ИИ</h3>
            <p>
              Индивидуальный темп, Moodle и HTML-интерактивности. Версия
              закрепляется при старте.
            </p>
            <div className="pilot-bottom">
              <span>
                Moodle <span className="muted-text">+ GitLab для контента</span>
              </span>
              <ArrowUpRight size={20} />
            </div>
          </a>
          <a href="#scenarios/java" className="pilot-card">
            <div className="pilot-heading">
              <span className="pilot-symbol peach">
                <FileCode2 size={24} />
              </span>
              <Pill>GROUP-BASED</Pill>
            </div>
            <h3>Java Dual Training</h3>
            <p>
              Групповые назначения, разные сроки и MR. Работа сдана,
              сопоставлена и принята — три разных факта.
            </p>
            <div className="pilot-bottom">
              <span>Moodle + GitLab + Sheets</span>
              <ArrowUpRight size={20} />
            </div>
          </a>
        </div>
      </section>
      <section className="callout">
        <ShieldCheck size={27} />
        <div>
          <h3>Начинаем с чтения, сохраняем историю</h3>
          <p>
            Первые MVP не меняют действующие курсы и оценки. Каждый показатель
            ведёт к своему плану, правилу и исходному подтверждению.
          </p>
        </div>
        <a href="#decisions">
          Принципы и вопросы <ArrowRight size={17} />
        </a>
      </section>
    </>
  );
}

const flowNodes = [
  {
    title: "Источники",
    sub: "Moodle · GitLab · Sheets",
    icon: Network,
    detail:
      "Системы продолжают выполнять свои роли. Moodle обучает и хранит оценки; GitLab содержит контент или студенческие MR; Sheets предлагает назначения. Состав источников зависит от сценария.",
  },
  {
    title: "Сбор и сверка",
    sub: "Read-only · исходные факты",
    icon: Database,
    detail:
      "Коннекторы сохраняют raw-снимки и журналы. Нормализация связывает IDs. Неоднозначные соответствия и аккаунты проверяются человеком; сбой источника не означает удаление задачи.",
  },
  {
    title: "Учебный реестр",
    sub: "Задачи · версии · планы",
    icon: Layers,
    detail:
      "Реестр фиксирует применимые обязательства и версии для каждого студента. Sheets — вход для предложений; источником истины для знаменателя служит утверждённая ревизия индивидуального плана.",
  },
  {
    title: "Проверяемые метрики",
    sub: "Формула · история · источник",
    icon: ClipboardCheck,
    detail:
      "Движок расчёта применяет версионные правила к принятой работе в закреплённом плане. Снимок хранит дату, формулу и качество данных. Из UI можно пройти до исходного подтверждения и решения преподавателя.",
  },
];
function ArchitectureFlow() {
  const [selected, setSelected] = useState(2);
  return (
    <div className="architecture-panel">
      <div className="flow-toolbar">
        <span>
          <span className="status-dot" /> ПРЕДЛАГАЕМОЕ ЯДРО
        </span>
        <small>Выберите блок, чтобы узнать его роль</small>
      </div>
      <div className="architecture-flow">
        {flowNodes.map((node, i) => (
          <div className="flow-item" key={node.title}>
            <button
              aria-pressed={selected === i}
              className={`flow-node ${selected === i ? "selected" : ""}`}
              onClick={() => setSelected(i)}
            >
              <node.icon size={23} />
              <strong>{node.title}</strong>
              <small>{node.sub}</small>
              <span className="node-index">0{i + 1}</span>
            </button>
            {i < 3 && <ArrowRight className="flow-arrow" size={19} />}
          </div>
        ))}
      </div>
      <div className="flow-detail" aria-live="polite">
        <span>0{selected + 1}</span>
        <p>
          <strong>{flowNodes[selected].title}.</strong>{" "}
          {flowNodes[selected].detail}
        </p>
      </div>
    </div>
  );
}

function Glossary({ detail }: { detail: string }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>(groups[0]);
  useEffect(() => {
    if (detail && terms.some((t) => t.id === detail)) {
      setQuery("");
      setGroup(groups[0]);
    }
  }, [detail]);
  useEffect(() => {
    if (!detail || query || group !== groups[0]) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled)
        document
          .getElementById(`term-${detail}`)
          ?.scrollIntoView({ block: "center" });
    });
    return () => {
      cancelled = true;
    };
  }, [detail, query, group]);
  const filtered = terms.filter(
    (t) =>
      (group === groups[0] || t.group === group) &&
      `${t.name} ${t.en} ${t.definition} ${t.example}`
        .toLocaleLowerCase("ru")
        .includes(query.trim().toLocaleLowerCase("ru")),
  );
  return (
    <>
      <PageIntro
        number="02 / ОБЩИЙ ЯЗЫК"
        title="Сначала договоримся о понятиях"
        text="Один термин — один смысл. Этот словарь задаёт язык, на котором будем обсуждать учебные системы, данные и статистику."
      />
      <div className="glossary-search">
        <Search size={21} />
        <input
          aria-label="Поиск по словарю"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти понятие, например: учебный план или evidence"
        />
        {query && (
          <button
            className="icon-button"
            aria-label="Очистить поиск"
            onClick={() => setQuery("")}
          >
            <X size={18} />
          </button>
        )}
        <span>{terms.length} понятий</span>
      </div>
      <div className="filter-row" aria-label="Категории понятий">
        {groups.map((g) => (
          <button
            key={g}
            aria-pressed={group === g}
            className={`filter-chip ${group === g ? "selected" : ""}`}
            onClick={() => setGroup(g)}
          >
            {g}
            {g === groups[0] && <small>{terms.length}</small>}
          </button>
        ))}
      </div>
      <div className="results-meta">
        <span>
          Найдено понятий: <strong>{filtered.length}</strong>
        </span>
        <span>РУССКИЙ ТЕРМИН / ENGLISH REFERENCE</span>
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={32} />
          <h3>Понятие не найдено</h3>
          <p>Попробуйте другой термин или выберите все категории.</p>
          <button
            className="button secondary"
            onClick={() => {
              setQuery("");
              setGroup(groups[0]);
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
      <div className="terms-grid">
        {filtered.map((t) => (
          <article
            id={`term-${t.id}`}
            key={t.id}
            className={`term-card ${detail === t.id ? "highlighted" : ""}`}
          >
            <div className="term-meta">
              <span>{t.group}</span>
              <a
                aria-label={`Ссылка на понятие: ${t.name}`}
                href={`#glossary/${t.id}`}
              >
                <Link2 size={15} />
              </a>
            </div>
            <h3>{t.name}</h3>
            <span className="term-en">{t.en}</span>
            <p>{t.definition}</p>
            <div className="term-example">
              <span>НА ПРИМЕРЕ</span>
              {t.example}
            </div>
            <a
              className="term-scenario"
              href={href(
                "scenarios",
                t.group === "Интеграции" ||
                  [
                    "assignment",
                    "group",
                    "submission",
                    "result",
                    "evidence",
                  ].includes(t.id)
                  ? "java"
                  : "ai",
              )}
            >
              В контексте сценария <ArrowUpRight size={14} />
            </a>
          </article>
        ))}
      </div>
      <Notice>
        Каноническое «назначение» (Assignment) и Moodle Assignment — разные
        объекты. Версия контента, версия оценивания, выпуск программы и ревизия
        плана также живут независимо.
      </Notice>
    </>
  );
}

function Scenarios({ detail }: { detail: string }) {
  const scenarioId: ScenarioId = scenarios.some((s) => s.id === detail)
    ? (detail as ScenarioId)
    : "ai";
  const s = scenarios.find((s) => s.id === scenarioId)!;
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
  }, [scenarioId]);
  return (
    <>
      <PageIntro
        number="03 / КОНФИГУРАЦИИ"
        title="От систем к учебной статистике"
        text="Выберите модель обучения: какие источники нужны, как их настроить и по каким правилам данные превращаются в результат."
      />
      <div className="scenario-picker" aria-label="Выбор сценария">
        {scenarios.map((item) => (
          <a
            key={item.id}
            aria-current={item.id === s.id ? "true" : undefined}
            href={href("scenarios", item.id)}
            className={`scenario-option ${item.id === s.id ? "selected" : ""}`}
          >
            <span>{item.tag}</span>
            <strong>{item.title}</strong>
            <small>{item.subtitle}</small>
          </a>
        ))}
      </div>
      <section className="scenario-summary">
        <div>
          <div className="inline-tags">
            <Pill tone="green">{s.tag}</Pill>
            {s.sources.map((src) => (
              <Pill key={src}>{src}</Pill>
            ))}
          </div>
          <h2>{s.title}</h2>
          <p>{s.lead}</p>
        </div>
        <div className="plan-note">
          <LockKeyhole size={21} />
          <h3>Что фиксирует план</h3>
          <p>{s.plan}</p>
          <a className="subtle-link" href="#glossary/learning-plan">
            Понятие учебного плана <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
      <SectionHeading label="ПУТЬ ДАННЫХ" title="Как работает сценарий">
        <Pill>Предлагаемая схема</Pill>
      </SectionHeading>
      <ScenarioDiagram scenario={s} active={step} setActive={setStep} />
      <div className="scenario-step-detail" aria-live="polite">
        <span className="step-count">0{step + 1} / 04</span>
        <div>
          <h3>{s.steps[step].title}</h3>
          <p>{s.steps[step].text}</p>
        </div>
        <div className="step-controls">
          <button
            className="icon-button"
            aria-label="Предыдущий шаг"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Следующий шаг"
            disabled={step === 3}
            onClick={() => setStep(step + 1)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <section className="section-space">
        <SectionHeading
          label="ПОДГОТОВКА ИСТОЧНИКОВ"
          title="Что настроить в каждой системе"
        />
        <div className="setup-grid">
          {s.setup.map((setup, i) => (
            <article className="setup-card" key={setup.system}>
              <span className="setup-index">0{i + 1}</span>
              <h3>{setup.system}</h3>
              <ul>
                {setup.items.map((item) => (
                  <li key={item}>
                    <Check size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="section-space">
        <SectionHeading
          label="ИНТЕРАКТИВНЫЙ ПРИМЕР"
          title={
            s.id === "ai"
              ? "Новый релиз ≠ новый план студента"
              : s.id === "java"
                ? "Сопоставить работу — ещё не принять"
                : "Знаменатель имеет значение"
          }
        >
          <Pill tone="orange">DEMO · синтетические данные</Pill>
        </SectionHeading>
        {s.id === "ai" ? (
          <VersionDemo />
        ) : s.id === "java" ? (
          <ReconciliationDemo />
        ) : (
          <PlanDemo />
        )}
      </section>
      {s.id === "java" && (
        <section className="section-space">
          <SectionHeading
            label="РАСЧЁТ ПО ПЛАНУ"
            title="Один курс — разные обязательства"
          />
          <PlanDemo />
        </section>
      )}
      <section className="section-space">
        <SectionHeading
          label="ЧТО ПОЛУЧИМ"
          title="Метрики и проверка сценария"
        />
        <div className="validation-grid">
          <div className="panel">
            <h3>Какие вопросы закрывает статистика</h3>
            <ul className="metric-list">
              {s.metrics.map((m) => (
                <li key={m}>
                  <span className="status-dot" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3>Критерии приёмки</h3>
            <ul className="check-list">
              {s.checks.map((c) => (
                <li key={c}>
                  <CheckCheck size={18} />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Notice>{s.risk}</Notice>
      </section>
      <div className="next-link">
        <span>Каким этапом это реализовать?</span>
        <a href="#roadmap">
          Посмотреть линейку MVP <ArrowRight size={17} />
        </a>
      </div>
    </>
  );
}

function ScenarioDiagram({
  scenario,
  active,
  setActive,
}: {
  scenario: Scenario;
  active: number;
  setActive: (n: number) => void;
}) {
  const labels =
    scenario.id === "ai"
      ? [
          "Moodle · первый старт",
          "Реестр · план R1",
          "Резолвер · артефакт",
          "История и метрики",
        ]
      : scenario.id === "java"
        ? [
            "Sheets → план",
            "Moodle + MR",
            "Ручная сверка",
            "Результат → метрики",
          ]
        : scenario.id === "sheets"
          ? [
              "Sheets · строки",
              "Проект изменений",
              "Утверждённый план",
              "Moodle → метрики",
            ]
          : [
              "Moodle · факты",
              "Назначения в плане",
              "Политика принятия",
              "Снимок метрик",
            ];
  return (
    <div className="scenario-diagram">
      <div className="diagram-caption">
        <span>
          <Network size={15} />{" "}
          {scenario.id === "ai"
            ? "Старт и запуск — синхронно. Аналитика — отдельно, по расписанию."
            : "Чтение источников → проверка → расчёт. Без записи оценок обратно."}
        </span>
      </div>
      <div className="scenario-flow">
        {labels.map((label, i) => (
          <div className="scenario-flow-item" key={label}>
            <button
              className={`scenario-node ${active === i ? "selected" : ""}`}
              aria-pressed={active === i}
              onClick={() => setActive(i)}
            >
              <span className="scenario-node-num">0{i + 1}</span>
              <strong>{label}</strong>
              <small>{scenario.steps[i].title}</small>
            </button>
            {i < labels.length - 1 && (
              <ArrowRight className="flow-arrow" size={19} />
            )}
          </div>
        ))}
      </div>
      <div className="diagram-legend">
        <span>
          <i /> Управляемое действие
        </span>
        <span>
          <i /> Подтверждения сохраняются
        </span>
        <span>
          <i /> История не перезаписывается
        </span>
      </div>
    </div>
  );
}

function PlanDemo() {
  const [group, setGroup] = useState<"A" | "B">("A");
  const [proposed, setProposed] = useState(false);
  const result = completion(groupPlan(group));
  return (
    <div className="plan-demo">
      <div className="demo-controls">
        <div>
          <span className="eyebrow">JAVA · ОДИН КАТАЛОГ MOODLE</span>
          <h3>100 активностей ≠ 100 обязательств</h3>
          <p>
            18 задач приняты, ещё 5 сданы на проверку. Вес каждой задачи — 1.
          </p>
        </div>
        <div className="segmented" aria-label="Группа">
          {(["A", "B"] as const).map((g) => (
            <button
              aria-pressed={g === group}
              className={g === group ? "selected" : ""}
              onClick={() => setGroup(g)}
              key={g}
            >
              Группа {g}
            </button>
          ))}
        </div>
      </div>
      <div className="plan-demo-main">
        <div className="progress-visual">
          <div
            className="progress-ring"
            style={
              { "--progress": `${result.percent}%` } as React.CSSProperties
            }
          >
            <div>
              <strong data-testid="completion">
                {result.percent?.toFixed(1).replace(".0", "")}%
              </strong>
              <span>принято по плану</span>
            </div>
          </div>
          <span className="muted-text">Ревизия R1 · группа {group}</span>
        </div>
        <div className="formula-panel">
          <span className="eyebrow">ФОРМУЛА ПРОГРЕССА</span>
          <div className="formula">
            <span>
              <strong>{result.accepted}</strong>
              <small>принятых</small>
            </span>
            <b>÷</b>
            <span>
              <strong>{result.denominator}</strong>
              <small>обязательных</small>
            </span>
            <b>× 100</b>
          </div>
          <p>
            Только принятые обязательные задачи. Дополнительные активности и
            количество MR не увеличивают числитель.
          </p>
          <button
            className="button secondary"
            onClick={() => setProposed(!proposed)}
          >
            {proposed
              ? "Сбросить предложение"
              : "Смоделировать +1 задачу из Sheet"}
            <ArrowRight size={15} />
          </button>
          {proposed && (
            <div className="inline-feedback" role="status">
              <LockKeyhole size={17} />
              <span>
                Предложение: {result.denominator} → {result.denominator + 1}{" "}
                задач. Действующий R1 и прогресс{" "}
                {result.percent?.toFixed(1).replace(".0", "")}% не изменились.
                Публикация новой ревизии требует отдельного решения.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VersionDemo() {
  const [current, setCurrent] = useState(1);
  const [preview, setPreview] = useState(false);
  const locked = resolveVersion(1, current);
  const migration = previewMigration();
  return (
    <div className="version-demo">
      <div className="demo-controls">
        <div>
          <span className="eyebrow">
            СИНТЕТИЧЕСКОЕ ПРОХОЖДЕНИЕ · DEMO-LI-1045
          </span>
          <h3>Студент начал на v1</h3>
          <p>
            Публикуйте новые выпуски и наблюдайте, какой план остаётся у
            студента.
          </p>
        </div>
        <Pill tone="green">
          <LockKeyhole size={13} /> Закреплено v{locked}
        </Pill>
      </div>
      <div className="release-timeline">
        {[1, 2, 3, 4, 5].map((v) => (
          <div key={v} className={`release ${v <= current ? "published" : ""}`}>
            <span className="release-dot">
              {v === 1 ? <LockKeyhole size={14} /> : <Check size={13} />}
            </span>
            <strong>v{v}.0</strong>
            <small>
              {v === 1
                ? "Старт · план R1"
                : v <= current
                  ? "Опубликован"
                  : "Ещё не выпущен"}
            </small>
          </div>
        ))}
      </div>
      <div className="version-demo-bottom">
        <div>
          <span>
            Для новых студентов <strong>v{current}.0</strong>
          </span>
          <span>
            Для начавшего студента <strong>v{locked}.0 · R1</strong>
          </span>
        </div>
        <button
          className="button primary"
          disabled={current === 5}
          onClick={() => {
            setCurrent(current + 1);
            setPreview(false);
          }}
        >
          {current === 5
            ? "Все 5 выпусков опубликованы"
            : `Опубликовать v${current + 1}.0`}
          <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="migration-trigger">
        <p>
          <ShieldCheck size={18} /> История результатов и знаменатель R1
          сохраняются.
        </p>
        <button
          className="subtle-link"
          disabled={current < 5}
          onClick={() => setPreview(!preview)}
          aria-expanded={preview}
        >
          {current < 5
            ? "Для предпросмотра опубликуйте v5"
            : preview
              ? "Скрыть предпросмотр"
              : "Предпросмотр перехода на v5"}
          <ChevronDown size={16} />
        </button>
      </div>
      {preview && (
        <div className="migration-preview">
          <div className="migration-header">
            <div>
              <Pill tone="orange">DRY RUN · только расчёт</Pill>
              <h3>План R1 → проект R2 на v{current}</h3>
            </div>
            <span>Равные веса задач</span>
          </div>
          <div className="migration-metrics">
            <div>
              <small>Было · R1</small>
              <strong>
                {migration.oldAccepted}/{migration.oldTotal}{" "}
                <span>
                  ≈{" "}
                  {Math.round(
                    (migration.oldAccepted / migration.oldTotal) * 100,
                  )}
                  %
                </span>
              </strong>
            </div>
            <ArrowRight size={23} />
            <div>
              <small>Переносится · проект R2</small>
              <strong>
                {migration.carried}/{migration.newTotal}{" "}
                <span>
                  ≈ {Math.round((migration.carried / migration.newTotal) * 100)}
                  %
                </span>
              </strong>
            </div>
            <div>
              <small>Требует решения / работы</small>
              <strong>
                {migration.pending} <span>задачи</span>
              </strong>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Задача</th>
                  <th>Решение</th>
                  <th>Основание</th>
                </tr>
              </thead>
              <tbody>
                {migrationTasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                      <small>{t.id}</small>
                    </td>
                    <td>
                      <Pill tone={t.action === "CARRY_OVER" ? "green" : ""}>
                        {t.action}
                      </Pill>
                    </td>
                    <td>{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Notice>
            Это локальная симуляция совместимости v1 → v5. Миграция не
            применяется. В реальной системе нужны матрица совместимости
            конкретных версий, утверждение и контроль текущей ревизии; старые
            оценки не заменяются.
          </Notice>
        </div>
      )}
    </div>
  );
}

function ReconciliationDemo() {
  const [links, setLinks] = useState<Record<string, string[]>>({});
  const [selectedTasks, setSelectedTasks] = useState(["JAVA-011"]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const linked = links["MR-42"] ?? [];
  return (
    <div className="reconciliation-demo">
      <div className="demo-controls">
        <div>
          <span className="eyebrow">СЛУЧАЙ RC-1042 · СИНТЕТИЧЕСКИЕ ДАННЫЕ</span>
          <h3>Один MR, две возможные задачи</h3>
          <p>
            Путь файла подсказывает связь, но не доказывает качество работы.
          </p>
        </div>
        <Pill tone={accepted.length ? "green" : "orange"}>
          {accepted.length ? "Есть принятые результаты" : "Нужна проверка"}
        </Pill>
      </div>
      <div className="review-grid">
        <div className="evidence-card">
          <span className="source-logo gitlab">
            <GitBranch size={19} />
          </span>
          <h3>MR !42 · практика Java</h3>
          <p>
            Статус GitLab: <strong>merged</strong>
          </p>
          <code>
            src/Task10.java
            <br />
            src/Task11.java
          </code>
          <div className="evidence-foot">
            <LockKeyhole size={15} /> Merge сам по себе не даёт зачёт.
          </div>
          <p className="muted-text">
            Ещё один MR может подтвердить ту же задачу — её вес в прогрессе
            останется единичным.
          </p>
        </div>
        <div className="review-actions">
          <span className="eyebrow">1. ВЫБРАТЬ И ПОДТВЕРДИТЬ СВЯЗИ</span>
          {["JAVA-010", "JAVA-011"].map((id) => (
            <label className="task-choice" key={id}>
              <input
                type="checkbox"
                checked={selectedTasks.includes(id)}
                onChange={(e) =>
                  setSelectedTasks(
                    e.target.checked
                      ? [...selectedTasks, id]
                      : selectedTasks.filter((t) => t !== id),
                  )
                }
              />
              <span>
                <strong>{id}</strong>
                <small>
                  {id.endsWith("010")
                    ? "Условия и ветвления"
                    : "Циклы и итерации"}
                </small>
              </span>
              <span className="candidate-label">Кандидат</span>
            </label>
          ))}
          <button
            className="button secondary"
            disabled={!selectedTasks.length}
            onClick={() => {
              setLinks(linkEvidence(links, "MR-42", selectedTasks));
              setAccepted(accepted.filter((t) => selectedTasks.includes(t)));
              setFeedback(
                "Связи подтверждены локально. Качество работы ещё требует отдельного решения.",
              );
            }}
          >
            <Link2 size={16} /> Подтвердить связи
          </button>
          <span className="eyebrow review-step-label">
            2. ОТДЕЛЬНО ПРИНЯТЬ РАБОТЫ
          </span>
          <button
            className="button primary"
            disabled={
              !linked.length || linked.every((t) => accepted.includes(t))
            }
            onClick={() => {
              setAccepted([...new Set([...accepted, ...linked])]);
              setFeedback(
                "В демо преподаватель принял связанные задачи. Решение отделено от подтверждения связей и статуса merge.",
              );
            }}
          >
            <ClipboardCheck size={16} /> Принять связанные задачи
          </button>
        </div>
      </div>
      <div className="review-summary" aria-live="polite">
        <span>
          Связано задач <strong>{uniqueLinkedTasks(links).length}</strong>
        </span>
        <span>
          Принято в прогресс{" "}
          <strong data-testid="accepted-count">{accepted.length}</strong>
        </span>
        <button
          className="subtle-link"
          onClick={() => {
            setLinks({});
            setSelectedTasks(["JAVA-011"]);
            setAccepted([]);
            setFeedback("Демонстрация сброшена.");
          }}
        >
          Сбросить демо
        </button>
      </div>
      {feedback && (
        <p className="local-feedback" role="status">
          <Check size={17} />
          {feedback} Изменения только в памяти страницы.
        </p>
      )}
    </div>
  );
}

function Roadmap() {
  const [active, setActive] = useState(2);
  const [query, setQuery] = useState("");
  const filtered = stages.filter((s) =>
    `${s.title} ${s.short} ${s.kind} ${s.question} ${s.deliverables.join(" ")} ${s.metrics.join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const stage = stages.find((s) => s.id === active)!;
  return (
    <>
      <PageIntro
        number="04 / ПОСТЕПЕННОЕ УСЛОЖНЕНИЕ"
        title="От первых фактов к зрелой аналитике"
        text="Каждый следующий этап добавляет данные и возможности. Переход определяет проверяемый результат, а не количество созданных экранов."
      />
      <div className="roadmap-banner">
        <Flag size={25} />
        <div>
          <strong>Первый полезный выпуск</strong>
          <p>
            Обследование + надёжный сбор + дашборд «Основ ИИ». Затем — групповые
            планы и Java. Модернизация контента развивается отдельным потоком.
          </p>
        </div>
        <Pill>Без записи в Moodle</Pill>
      </div>
      <div className="roadmap-toolbar">
        <span className="eyebrow">8 ЭТАПОВ · 4 ИНКРЕМЕНТА MVP</span>
        <label className="compact-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти этап или возможность"
            aria-label="Поиск этапов MVP"
          />
        </label>
      </div>
      <div className="roadmap-layout">
        <div className="stage-list" aria-label="Этапы реализации">
          {filtered.map((s) => (
            <button
              key={s.id}
              className={`stage-option ${active === s.id ? "selected" : ""}`}
              onClick={() => setActive(s.id)}
              aria-pressed={active === s.id}
            >
              <span className="stage-number">
                {String(s.id).padStart(2, "0")}
              </span>
              <span>
                <small>{s.kind}</small>
                <strong>{s.short}</strong>
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
          {!filtered.length && (
            <div className="empty-state">
              <p>Этапы не найдены.</p>
              <button className="subtle-link" onClick={() => setQuery("")}>
                Сбросить поиск
              </button>
            </div>
          )}
        </div>
        <article className="stage-detail" aria-live="polite">
          <div className="stage-detail-top">
            <Pill tone="green">
              Этап {stage.id} · {stage.kind}
            </Pill>
            <div className="effort">
              <span>Сложность</span>
              <span role="img" aria-label={`${stage.effort} из 5`}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <i key={v} className={v <= stage.effort ? "filled" : ""} />
                ))}
              </span>
            </div>
          </div>
          <h2>{stage.title}</h2>
          <p className="stage-question">{stage.question}</p>
          <div className="stage-input">
            <strong>На входе</strong>
            <p>{stage.inputs}</p>
          </div>
          <h3>Что появится</h3>
          <ul className="check-list">
            {stage.deliverables.map((d) => (
              <li key={d}>
                <Check size={17} />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <h3>Какие метрики доступны</h3>
          <div className="metric-pills">
            {stage.metrics.map((m) => (
              <Pill key={m}>{m}</Pill>
            ))}
          </div>
          <div className="stage-gate">
            <ShieldCheck size={23} />
            <div>
              <strong>Можно идти дальше, если…</strong>
              <p>{stage.gate}</p>
            </div>
          </div>
          <div className="stage-boundary">
            <h4>Граница этапа</h4>
            <p>{stage.boundary}</p>
          </div>
          <dl className="stage-meta">
            <div>
              <dt>Зависимости</dt>
              <dd>{stage.dependency}</dd>
            </div>
            <div>
              <dt>Ответственные роли</dt>
              <dd>{stage.owner}</dd>
            </div>
          </dl>
          <div className="stage-pagination">
            <button
              disabled={active === 0}
              className="subtle-link"
              onClick={() => setActive(active - 1)}
            >
              <ArrowLeft size={15} /> Предыдущий
            </button>
            <button
              disabled={active === 7}
              className="subtle-link"
              onClick={() => setActive(active + 1)}
            >
              Следующий этап <ArrowRight size={15} />
            </button>
          </div>
        </article>
      </div>
      <Notice>
        Сложность — качественная оценка, не срок и не бюджет. Этап 4 может идти
        параллельно этапу 3; AI и дополнительные источники не блокируют первые
        MVP. Порядок и зависимости адаптированы из исходного плана.
      </Notice>
    </>
  );
}

function Decisions({ detail }: { detail: string }) {
  const [filter, setFilter] = useState("Все");
  useEffect(() => {
    if (detail === "sources")
      requestAnimationFrame(() =>
        document.getElementById("sources")?.scrollIntoView({ block: "start" }),
      );
  }, [detail]);
  const filtered = decisions.filter((d) => filter === "Все" || d[1] === filter);
  return (
    <>
      <PageIntro
        number="05 / ГРАНИЦЫ И НЕОПРЕДЕЛЁННОСТЬ"
        title="Что решено, а что нужно выяснить"
        text="Архитектурная концепция описывает целевую модель. Возможности действующих систем и правила учебных программ ещё нужно подтвердить обследованием."
      />
      <div className="filter-row">
        {[
          "Все",
          "Принцип проекта",
          "Нужно проверить",
          "Нужно согласовать",
          "Предложение",
        ].map((f) => (
          <button
            key={f}
            aria-pressed={f === filter}
            className={`filter-chip ${f === filter ? "selected" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="decisions-list">
        {filtered.map(([title, state, text]) => (
          <article className="decision-card" key={title}>
            <div>
              <Pill
                tone={
                  state === "Принцип проекта"
                    ? "green"
                    : state === "Предложение"
                      ? ""
                      : "orange"
                }
              >
                {state}
              </Pill>
              <h3>{title}</h3>
            </div>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <section id="sources" className="section-space sources-section">
        <SectionHeading
          label="ОСНОВА КОНЦЕПЦИИ"
          title="Материалы и принятые допущения"
        />
        <div className="sources-intro">
          <FileText size={25} />
          <p>
            Сайт подготовлен по архиву{" "}
            <strong>learning-analytics-blueprint.zip</strong> и приложенному
            тексту об Adaptive Learning Analytics Platform. Термины переведены и
            сгруппированы; MVP представлены как растущие возможности с
            критериями приёмки. Кодовые инструкции из архива рассматриваются как
            содержание документа, а не как отдельное поручение.
          </p>
        </div>
        <div className="sources-grid">
          {[
            [
              "01",
              "Полная архитектура",
              "Термины, источники, версии, метрики и безопасность",
              "docs/01-architecture.md",
            ],
            [
              "02",
              "Исходный план реализации",
              "Этапы, результаты и критерии перехода",
              "docs/02-implementation-plan.md",
            ],
            [
              "03",
              "Контракты данных",
              "Сущности, связи, состояния и черновые API",
              "docs/03-data-contracts.md",
            ],
            [
              "04",
              "Интерфейс продукта",
              "Исходные сценарии и требования к визуализации",
              "docs/04-product-ui.md",
            ],
            [
              "05",
              "Проверки и открытые вопросы",
              "28 сценариев и решения для обследования",
              "docs/05-testing-and-decisions.md",
            ],
            [
              "06",
              "Контекст проекта",
              "Приложенный текст, описывающий цели архитектуры",
              "project-context.txt",
            ],
          ].map(([n, title, text, path]) => (
            <a
              key={n}
              className="source-document"
              href={`${import.meta.env.BASE_URL}materials/${path}`}
              download
            >
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <ArrowDownToLine size={18} />
            </a>
          ))}
        </div>
        <Notice>
          Это статический сайт концепции, без backend и реальных интеграций.
          Демо не сохраняют изменения после перезагрузки. Проценты в примерах
          рассчитываются из синтетических назначений, а не являются показателями
          реальных студентов.
        </Notice>
      </section>
    </>
  );
}
