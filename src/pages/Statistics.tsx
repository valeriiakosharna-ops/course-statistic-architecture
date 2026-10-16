import { useState } from "react";
import { ArrowRight, Check, GitBranch } from "lucide-react";
import type { CourseMode, Learner } from "../lab";
import { fmt, metrics, modes } from "../lab";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";

import {
  acceptPractice,
  critical,
  latestVersion,
  taskKind,
  type Card,
} from "../platform";

const statusLabels = {
  accepted: "Принято",
  review: "На проверке",
  todo: "Не сдано",
  unknown: "Нет данных",
};
export default function Statistics({
  mode,
  setMode,
  cards,
  detail,
  onChange,
}: {
  mode: CourseMode;
  setMode: (m: CourseMode) => void;
  cards: Card[];
  detail: string;
  onChange: (card: Card) => void;
}) {
  const [scope, setScope] = useState<"student" | "group" | "course">("student"),
    [group, setGroup] = useState("A"),
    [student, setStudent] = useState(
      cards.some((c) => c.learner.id === detail) ? detail : "S-1",
    );
  const [status, setStatus] = useState("all"),
    [metric, setMetric] = useState("progress"),
    [sort, setSort] = useState("id");
  const [linked, setLinked] = useState(false);
  const config = modes.find((m) => m.id === mode)!;
  const data: Learner[] = cards.map((c) => c.learner);
  const acceptedMr =
    data[0].tasks.find((t) => t.id === "TASK-21")?.status === "accepted";
  const activeScope = !config.groups && scope === "group" ? "student" : scope;
  const current = data.find((l) => l.id === student) ?? data[0];
  const selection =
    activeScope === "student"
      ? [current]
      : activeScope === "course"
        ? data
        : data.filter((l) => l.group === group);
  const m = metrics(selection);
  const mixedRubrics =
    new Set(
      selection.map((l) => (l.version < 3 ? "assessment@1" : "assessment@2")),
    ).size > 1;
  const currentCard = cards.find((c) => c.learner.id === current.id)!;
  const selectedCards = cards.filter((c) =>
    selection.some((l) => l.id === c.learner.id),
  );
  const tasks = selection
    .flatMap((l) =>
      l.tasks.map((t) => ({
        ...t,
        learner: l.name,
        learnerId: l.id,
        plan: `v${l.version} / R${cards.find((c) => c.learner.id === l.id)!.revision}`,
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
      mixedRubrics ? "По версиям" : fmt(m.score, "%"),
      `${m.graded} оценённых из ${selection.flatMap((l) => l.tasks.filter((t) => t.required)).length} назначений`,
    ],
    ["review", "На проверке", `${m.review}`, `${m.submitted} задач сданы`],
    ...(mode === "ai"
      ? [
          [
            "version",
            activeScope === "student"
              ? "Закреплённая версия"
              : "Критичные версии",
            activeScope === "student"
              ? `v${current.version}`
              : `${selectedCards.filter(critical).length}`,
            activeScope === "student"
              ? "новый релиз её не меняет"
              : "по манифесту курса",
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
      mixedRubrics
        ? "В выборке разные критерии. Средние показываем отдельно по версии, общего числа нет."
        : "Среднее нормированных оценок по совместимым критериям. Нет оценки — не ноль.",
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
      activeScope === "student"
        ? `Закреплено v${current.version}`
        : `Критично устарели: ${selectedCards.filter(critical).length}`,
      activeScope === "student"
        ? `Трек R${currentCard.revision} ссылается на v${current.version}`
        : `Всего карточек: ${selection.length}`,
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
          <button
            aria-pressed={activeScope === "course"}
            className={activeScope === "course" ? "selected" : ""}
            onClick={() => setScope("course")}
          >
            Курс
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
        ) : activeScope === "group" ? (
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
        ) : (
          <strong>Весь курс · {data.length} студентов</strong>
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
            ? `${current.version} / R${currentCard.revision}`
            : "каждого студента"}
        </strong>
        <span>→</span>
        <strong>
          {activeScope === "student"
            ? current.name
            : activeScope === "course"
              ? `Курс · ${selection.length} студентов`
              : `Группа ${group} · ${selection.length} студента`}
        </strong>
      </div>
      <Section
        number="К"
        title={
          activeScope === "student"
            ? "Карточка студента в БД"
            : "Версии и треки выбранной выборки"
        }
      >
        <div className="version-summary" data-testid="student-card">
          <div>
            <span>Закрепление</span>
            <strong>
              {activeScope === "student"
                ? `v${current.version} · R${currentCard.revision}`
                : `${selection.length} карточек`}
            </strong>
            <small>
              {activeScope === "student"
                ? currentCard.trackSource
                : "Прогресс — по личному треку каждого"}
            </small>
          </div>
          <div className={selectedCards.some(critical) ? "critical-state" : ""}>
            <span>По манифесту · актуальная v{latestVersion}</span>
            <strong>
              {selectedCards.filter(critical).length} требуют решения
            </strong>
            <small>Критичное отличие, а не количество релизов</small>
          </div>
          <div>
            <span>История</span>
            <strong>
              {selectedCards.reduce((n, c) => n + c.audit.length, 0)} решений
            </strong>
            <a
              href={
                activeScope === "student"
                  ? `#versions/${current.id}`
                  : "#versions"
              }
            >
              Сравнить и перенести версию →
            </a>
          </div>
        </div>
        <div className="automation-grid">
          {["Теория", "Практика", "Тест"].map((kind) => {
            const kindMetrics = metrics(
              selection.map((l) => ({
                ...l,
                tasks: l.tasks.filter((t) => taskKind(t) === kind),
              })),
            );
            return (
              <Block
                key={kind}
                title={kind}
                sub={`${kindMetrics.accepted} / ${kindMetrics.total} назначенного веса принято`}
                tone={kind === "Тест" ? "blue" : ""}
              />
            );
          })}
        </div>
        {mixedRubrics && (
          <Hint>
            Оценки по разным критериям не объединяем.{" "}
            {Array.from(new Set(selection.map((l) => l.version)))
              .sort()
              .map(
                (v) =>
                  `v${v}: ${fmt(metrics(selection.filter((l) => l.version === v)).score, "%")}`,
              )
              .join(" · ")}
            . Прогресс объединяется как сумма принятых весов / сумма назначенных
            весов.
          </Hint>
        )}
      </Section>
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
            : activeScope === "course"
              ? "Весь курс по студентам"
              : "Развёртка группы по студентам"
        }
      >
        {activeScope !== "student" && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Версия / трек</th>
                  <th>Совместимость</th>
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
                      <td>
                        v{l.version} / R
                        {cards.find((c) => c.learner.id === l.id)!.revision}
                      </td>
                      <td>
                        <span
                          className={`badge ${critical(cards.find((c) => c.learner.id === l.id)!) ? "red" : "blue"}`}
                        >
                          {critical(cards.find((c) => c.learner.id === l.id)!)
                            ? "Нужен переход"
                            : "Актуальна"}
                        </span>
                      </td>
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
                      {activeScope !== "student" ? t.learner : t.plan}
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
                        if (activeScope !== "student") {
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
                    ? `Входит в трек R${currentCard.revision}`
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
              onClick={() => onChange(acceptPractice(cards[0], "TASK-21"))}
            >
              {acceptedMr ? "Работа принята" : "2. Принять работу"}
            </button>
            <button
              className="link-button"
              onClick={() => {
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
            обновляет общую карточку до перезагрузки сайта.
          </div>
        </Section>
      )}
    </>
  );
}
