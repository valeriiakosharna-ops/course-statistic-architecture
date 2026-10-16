import { useMemo, useState } from "react";
import { ArrowRight, Check, GitBranch } from "lucide-react";
import type { CourseMode, Learner } from "../lab";
import { fmt, learnersFor, metrics, modes } from "../lab";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";

const statusLabels = {
  accepted: "Принято",
  review: "На проверке",
  todo: "Не сдано",
  unknown: "Нет данных",
};
export default function Statistics({
  mode,
  setMode,
}: {
  mode: CourseMode;
  setMode: (m: CourseMode) => void;
}) {
  const [scope, setScope] = useState<"student" | "group">("student"),
    [group, setGroup] = useState("A"),
    [student, setStudent] = useState("S-1");
  const [status, setStatus] = useState("all"),
    [metric, setMetric] = useState("progress"),
    [sort, setSort] = useState("id");
  const [acceptedMr, setAcceptedMr] = useState(false),
    [linked, setLinked] = useState(false);
  const config = modes.find((m) => m.id === mode)!;
  const all = useMemo(() => learnersFor(mode), [mode]);
  const data: Learner[] = all.map((l) =>
    mode === "java" && l.id === "S-1" && acceptedMr
      ? {
          ...l,
          tasks: l.tasks.map((t) =>
            t.id === "TASK-21"
              ? { ...t, status: "accepted" as const, score: null }
              : t,
          ),
        }
      : l,
  );
  const activeScope = config.groups ? scope : "student";
  const current = data.find((l) => l.id === student) ?? data[0];
  const selection =
    activeScope === "student"
      ? [current]
      : data.filter((l) => l.group === group);
  const m = metrics(selection);
  const tasks = selection
    .flatMap((l) =>
      l.tasks.map((t) => ({
        ...t,
        learner: l.name,
        learnerId: l.id,
        plan: `v${l.version} / R1`,
      })),
    )
    .filter((t) => status === "all" || t.status === status)
    .sort((a, b) =>
      sort === "status"
        ? a.status.localeCompare(b.status)
        : sort === "due"
          ? (a.due ?? "z").localeCompare(b.due ?? "z")
          : a.learnerId.localeCompare(b.learnerId) || a.id.localeCompare(b.id),
    );
  const [selectedTask, setSelectedTask] = useState("TASK-01");
  const t =
    selection[0]?.tasks.find((t) => t.id === selectedTask) ??
    selection[0].tasks[0];
  const metricCards = [
    [
      "progress",
      "Прогресс",
      fmt(m.percent, "%"),
      `${m.accepted} / ${m.total} обязательного веса`,
    ],
    [
      "score",
      "Средняя оценка",
      fmt(m.score, "%"),
      `${m.graded} оценённых из ${selection.flatMap((l) => l.tasks.filter((t) => t.required)).length} назначений`,
    ],
    ["review", "На проверке", `${m.review}`, `${m.submitted} задач сданы`],
    ...(mode === "ai"
      ? [
          [
            "version",
            "Закреплённая версия",
            `v${current.version}`,
            "новый релиз её не меняет",
          ],
        ]
      : [["due", "Просрочено", `${m.backlog}`, "срок прошёл, результата нет"]]),
    ...(mode === "java"
      ? [
          [
            "gitlab",
            "Принято из GitLab",
            `${m.gitlab}`,
            "задачи, не количество MR",
          ],
        ]
      : []),
  ];
  const formulas: Record<string, [string, string, string]> = {
    progress: [
      `Принятый вес: ${m.accepted}`,
      `Обязательный вес плана: ${m.total}`,
      "Делим первое на второе × 100. Не считаем весь каталог Moodle.",
    ],
    score: [
      "Баллы / максимум каждой оценённой задачи",
      `${m.graded} оценённых назначений`,
      "Среднее нормированных оценок. Нет оценки — не ноль. Покрытие показано отдельно.",
    ],
    review: [
      `Сдано: ${m.submitted}`,
      `Ожидают принятия: ${m.review}`,
      "Сдача подтверждена, но принятого результата пока нет.",
    ],
    due: [
      `Не приняты и срок прошёл: ${m.backlog}`,
      "Только задачи с известными данными",
      "Неизвестные результаты не записываем автоматически в просрочку. Они видны отдельно.",
    ],
    version: [
      `Начал на v${current.version}`,
      `План R1 ссылается на v${current.version}`,
      "Изменить можно только явной миграцией.",
    ],
    gitlab: [
      `Принято задач: ${m.gitlab}`,
      "Считаем назначения, не MR",
      "Несколько MR одной задачи не создают несколько зачётов.",
    ],
  };
  const f =
    formulas[metricCards.some((c) => c[0] === metric) ? metric : "progress"];
  return (
    <>
      <Heading
        kicker="05 / ЧТО УВИДИТ ПРЕПОДАВАТЕЛЬ"
        title="Поменяйте курс — изменится статистика"
        sub="Все показатели ниже считаются из демонстрационных назначений. Нажмите на число, чтобы увидеть формулу."
      />
      <div className="mode-cards" aria-label="Тип курса в статистике">
        {modes.map((c) => (
          <button
            key={c.id}
            aria-pressed={mode === c.id}
            onClick={() => {
              setMode(c.id);
              setStatus("all");
              setMetric("progress");
              setAcceptedMr(false);
              setLinked(false);
            }}
            className={mode === c.id ? "selected" : ""}
          >
            <strong>{c.label}</strong>
            <span>{c.sources.join(" + ")}</span>
          </button>
        ))}
      </div>
      <div className="report-toolbar">
        <div className="tabs" aria-label="Масштаб отчёта">
          <button
            aria-pressed={activeScope === "student"}
            className={activeScope === "student" ? "selected" : ""}
            onClick={() => setScope("student")}
          >
            Студент
          </button>
          <button
            disabled={!config.groups}
            aria-pressed={activeScope === "group"}
            className={activeScope === "group" ? "selected" : ""}
            onClick={() => setScope("group")}
          >
            Группа
          </button>
        </div>
        {activeScope === "student" ? (
          <label>
            Кто
            <select
              aria-label="Студент"
              value={student}
              onChange={(e) => {
                setStudent(e.target.value);
                setSelectedTask("TASK-01");
              }}
            >
              {data.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.group ? ` · группа ${l.group}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Группа
            <select
              aria-label="Группа"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option>A</option>
              <option>B</option>
            </select>
          </label>
        )}
        <span className="demo-badge">DEMO · срез на 16.10.2026, 12:00 UTC</span>
      </div>
      {mode === "ai" && (
        <Hint>
          Самостоятельный курс: учебных групп нет. Здесь личный прогресс и
          версии; индивидуальные дедлайны в примере не заданы.
        </Hint>
      )}
      <div className="report-source">
        <span>Источники</span>
        {config.sources.map((s) => (
          <strong key={s}>{s}</strong>
        ))}
        <span>→</span>
        <strong>
          План{" "}
          {activeScope === "student"
            ? `${current.version} / R1`
            : "каждого студента"}
        </strong>
        <span>→</span>
        <strong>
          {activeScope === "student"
            ? current.name
            : `Группа ${group} · ${selection.length} студента`}
        </strong>
      </div>
      <div className="metric-grid">
        {metricCards.map(([id, label, value, caption]) => (
          <button
            key={id}
            aria-pressed={metric === id}
            className={`metric-card ${metric === id ? "selected" : ""}`}
            onClick={() => setMetric(id)}
          >
            <span>{label}</span>
            <strong
              data-testid={id === "progress" ? "report-progress" : undefined}
            >
              {value}
            </strong>
            <small>{caption}</small>
            <ArrowRight size={17} />
          </button>
        ))}
      </div>
      <div className="metric-explainer" aria-live="polite">
        <div>
          <span className="eyebrow">ИЗ ЧЕГО ПОЛУЧИЛОСЬ ЧИСЛО</span>
          <strong>{f[0]}</strong>
          <span>↓</span>
          <strong>{f[1]}</strong>
        </div>
        <p>{f[2]}</p>
        <small>
          Вес — вклад задачи; в демо у каждой вес 1 · формула completion@1 ·
          дата среза фиксирована
        </small>
      </div>
      <Section number="↔" title="Как распределились обязательные задачи">
        <div className="status-legend">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button key={key} onClick={() => setStatus(key)}>
              <i className={key} />
              {label}
            </button>
          ))}
        </div>
        <div className="student-bars">
          {selection.map((l) => {
            const tasks = l.tasks.filter((t) => t.required);
            return (
              <div key={l.id}>
                <button
                  className="link-button"
                  onClick={() => {
                    setStudent(l.id);
                    setScope("student");
                  }}
                >
                  {l.name}
                </button>
                <div
                  className="stacked-bar"
                  role="group"
                  aria-label={`Состояния задач ${l.name}`}
                >
                  {Object.entries(statusLabels).map(([key, label]) => {
                    const count = tasks.filter((t) => t.status === key).length;
                    return count ? (
                      <button
                        key={key}
                        style={{ width: `${(count / tasks.length) * 100}%` }}
                        className={key}
                        onClick={() => setStatus(key)}
                        aria-label={`${label}: ${count}`}
                        title={`${label}: ${count}`}
                      >
                        {count}
                      </button>
                    ) : null;
                  })}
                </div>
                <span>
                  {metrics([l]).accepted} / {tasks.length}
                </span>
              </div>
            );
          })}
        </div>
      </Section>
      <div className="quality-strip">
        <span>
          <strong>{m.unknown}</strong> назначений с неизвестным результатом
        </span>
        {mode !== "ai" && (
          <span>
            В срок:{" "}
            <strong>
              {m.onTime} / {m.deadlineSubmissions}
            </strong>{" "}
            сдач с известным сроком
          </span>
        )}
        <span>Сдано ≠ принято</span>
      </div>
      <Section
        number="А"
        title={
          activeScope === "student"
            ? "Задачи этого студента"
            : "Развёртка группы по студентам"
        }
      >
        {activeScope === "group" && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>План</th>
                  <th>Принято / назначено</th>
                  <th>Прогресс</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {selection.map((l) => {
                  const v = metrics([l]);
                  return (
                    <tr key={l.id}>
                      <td>{l.name}</td>
                      <td>v{l.version} / R1</td>
                      <td>
                        {v.accepted} / {v.total}
                      </td>
                      <td>{fmt(v.percent, "%")}</td>
                      <td>
                        <button
                          className="link-button"
                          onClick={() => {
                            setStudent(l.id);
                            setScope("student");
                          }}
                        >
                          Открыть студента →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-controls">
          <label>
            Показать
            <select
              aria-label="Фильтр статуса"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Все состояния</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Сортировать
            <select
              aria-label="Сортировка задач"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="id">Студент → ID задачи</option>
              <option value="status">По состоянию</option>
              <option value="due">По сроку</option>
            </select>
          </label>
          <span>{tasks.length} записей · дополнительные задачи тоже видны</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Кто / задача</th>
                <th>Назначение</th>
                <th>Состояние</th>
                <th>Источник</th>
                <th>Оценка</th>
                <th>Срок UTC</th>
                <th>Почему?</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={t.learnerId + t.id}>
                  <td>
                    <strong>{t.id}</strong>
                    <small>
                      {activeScope === "group" ? t.learner : t.plan}
                    </small>
                  </td>
                  <td>{t.required ? "Обязательно" : "Дополнительно"}</td>
                  <td>
                    <span
                      className={`badge ${t.status === "accepted" ? "blue" : t.status === "unknown" ? "red" : ""}`}
                    >
                      {statusLabels[t.status]}
                    </span>
                  </td>
                  <td>{t.source}</td>
                  <td>
                    {t.score === null
                      ? "Нет оценки"
                      : `${t.score} / ${t.maxScore}`}
                  </td>
                  <td>
                    {t.due ? t.due.slice(5, 16).replace("T", " ") : "Не задан"}
                  </td>
                  <td>
                    <button
                      className="link-button"
                      aria-label={`Цепочка ${t.learner} ${t.id}`}
                      onClick={() => {
                        setSelectedTask(t.id);
                        if (activeScope === "group") {
                          setStudent(t.learnerId);
                          setScope("student");
                        }
                        document
                          .getElementById("provenance")
                          ?.scrollIntoView({ block: "center" });
                      }}
                    >
                      Показать →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <p className="empty-state">В этом состоянии задач нет.</p>
          )}
        </div>
      </Section>
      <Section number="Б" title="От числа обратно к источнику">
        <div id="provenance">
          <Flow label="Происхождение результата">
            {[
              <Block
                title={t.id}
                sub={
                  t.required
                    ? "Входит в план R1"
                    : "Дополнительная, вне знаменателя"
                }
              />,
              <Block
                title={statusLabels[t.status]}
                sub={
                  t.status === "accepted"
                    ? "Принято по политике курса"
                    : "Результат не принят"
                }
                tone={t.status === "accepted" ? "blue" : ""}
              />,
              <Block
                title={t.evidence[0] ?? "Нет подтверждения"}
                sub={t.source}
              />,
              <Block
                title="Исходник + решение"
                sub="Время · хеш · правило"
                tone="dark"
              />,
            ]}
          </Flow>
        </div>
      </Section>
      {mode === "java" && (
        <Section number="В" title="Что изменится, если принять работу">
          <Graph
            title="Один MR может подтверждать несколько задач; несколько MR — одну задачу"
            height={320}
            zones={[
              { x: 10, y: 10, w: 250, h: 290, title: "GitLab · подтверждения" },
              { x: 380, y: 10, w: 260, h: 290, title: "План S-1 · назначения" },
            ]}
            nodes={[
              {
                id: "mr42",
                x: 35,
                y: 65,
                title: "MR !42",
                sub: "два файла с решениями",
                w: 200,
              },
              {
                id: "mr43",
                x: 35,
                y: 205,
                title: "MR !43",
                sub: "доработка первой задачи",
                w: 200,
              },
              {
                id: "task21",
                x: 410,
                y: 65,
                title: "TASK-21",
                sub: "одно обязательство",
                w: 200,
                tone: "blue",
              },
              {
                id: "task22",
                x: 410,
                y: 205,
                title: "TASK-22",
                sub: "другое обязательство",
                w: 200,
                tone: "blue",
              },
              {
                id: "decision",
                x: 800,
                y: 65,
                title: "Решение учителя",
                sub: "зачесть TASK-21 один раз",
                w: 215,
                tone: "red",
              },
            ]}
            edges={[
              { from: "mr42", to: "task21", label: "связь 1" },
              { from: "mr42", to: "task22", label: "связь 2" },
              { from: "mr43", to: "task21", label: "ещё подтверждение" },
              { from: "task21", to: "decision", label: "проверить качество" },
            ]}
          />
          <div className="mr-simulator">
            <div>
              <GitBranch size={24} />
              <strong>MR !42 · TASK-21 · Студент 01</strong>
              <span>GitLab: merged. В плане задача пока на проверке.</span>
            </div>
            <button
              className="button secondary"
              onClick={() => setLinked(true)}
              disabled={linked}
            >
              {linked ? "Связь подтверждена" : "1. Подтвердить связь"}
            </button>
            <button
              className="button primary"
              disabled={!linked || acceptedMr}
              onClick={() => setAcceptedMr(true)}
            >
              {acceptedMr ? "Работа принята" : "2. Принять работу"}
            </button>
            <button
              className="link-button"
              onClick={() => {
                setAcceptedMr(false);
                setLinked(false);
              }}
            >
              Сбросить
            </button>
          </div>
          <Hint>
            {acceptedMr
              ? "Теперь задача входит в принятый вес Студента 01. Оценку не выдумываем: её покрытие не увеличилось."
              : linked
                ? "Связь подтверждена. Прогресс не изменился — работа ещё не принята."
                : "Один MR может покрывать несколько задач. Здесь одно принятие добавит ровно одно назначение."}
          </Hint>
          <div className="local-message" role="status">
            <Check size={16} />
            Прогресс Студента 01: {fmt(metrics([data[0]]).percent, "%")}. Демо
            меняет только память страницы.
          </div>
        </Section>
      )}
    </>
  );
}
