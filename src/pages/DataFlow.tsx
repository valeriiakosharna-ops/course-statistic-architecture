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
  "Получить",
  "Сохранить исходник",
  "Привести поля",
  "Убрать дубли",
  "Связать ID",
  "Классифицировать",
  "Посчитать",
];
const destinations: Record<string, string> = {
  evidence: "Подтверждения выполнения",
  "review-queue": "Очередь сверки",
  "plan-proposal": "Проект трека",
  "course-config": "Версии и манифесты",
  "clarification-proposal": "Проект уточнения",
  "grade-candidate": "Кандидат оценки",
};
const sourceNames = [
  "Moodle",
  "GitLab · студенты",
  "Sheets · назначения",
  "GitLab · материалы",
  "Discord",
  "Sheets · оценки",
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
                    "Для группы A срок TASK-01 — 22 октября, 23:59 по Киеву",
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
      same_revision: "пропустить",
      changed_revision: "новая запись, прежняя сохранена",
    },
    {
      account_map: verified
        ? "подтверждено человеком"
        : missing
          ? "не сопоставлен"
          : "стабильные ID / реестр группы",
      student: packet.learner,
      activity: packet.task,
      course_version: `v${card.learner.version}`,
      track_revision: card.revision,
    },
    {
      destination: destinations[destination],
      auto_credit: false,
      rule: "тип записи + права источника + политика курса",
    },
    {
      snapshot_at: "2026-10-16T12:00:00Z",
      formula: "completion@1",
      denominator: "только обязательный трек студента",
      source_watermark: outage ? "stale" : facts.length ? "loaded" : "unknown",
    },
  ];
  function receive() {
    if (outage) {
      setFeedback(
        facts.length
          ? "Источник недоступен. Последние факты сохранены; свежесть устарела."
          : "Источник недоступен. Успешной загрузки ещё не было; свежесть неизвестна.",
      );
      return;
    }
    setIntake((previous) => ingest(previous, packet));
    setFeedback(
      "Запись получена. Повтор ключа и revision не создаёт новый факт.",
    );
  }
  return (
    <>
      <Heading
        kicker="03 / СБОР · СИСТЕМАТИЗАЦИЯ · РАСПРЕДЕЛЕНИЕ"
        title="Пройдём путь одной записи"
        sub="Ниже можно получить запись, повторить загрузку и посмотреть, в какую часть БД она попадёт."
      />
      <Flow label="Общий конвейер данных">
        {[
          <Block
            title="5 источников"
            sub="API / события / структурированный файл"
          />,
          <Block
            title="Исходники и связи"
            sub="История + единые ID + проверка дублей"
          />,
          <Block
            title="Карточка в БД"
            sub="Трек + версия + принятые факты"
            tone="dark"
          />,
          <Block
            title="LearningAtlas"
            sub="Студент → группа → курс"
            tone="blue"
          />,
        ]}
      </Flow>
      <Section number="А" title="Откуда, в каком формате и за счёт чего">
        <div
          className="source-matrix table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Источники и форматы данных"
        >
          <table>
            <thead>
              <tr>
                <th>Источник</th>
                <th>Что получаем</th>
                <th>Как забираем</th>
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
          События ускоряют доставку, jobs регулярно сверяют данные через API. У
          каждого источника — курсор, постраничное чтение, повтор с задержкой и
          отметка последней успешной загрузки. Discord-боту нужны доступ к
          учебным каналам и разрешение читать сообщения; входящий webhook
          Discord этого не делает.
        </Hint>
      </Section>
      <Section
        number="Б"
        title="Лаборатория приёма: запись ещё не означает зачёт"
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
        <div className="tabs" aria-label="Способ загрузки">
          <button
            aria-pressed={transport === "api"}
            className={transport === "api" ? "selected" : ""}
            onClick={() => setTransport("api")}
          >
            API / события
          </button>
          <button
            aria-pressed={transport === "csv"}
            className={transport === "csv" ? "selected" : ""}
            onClick={() => setTransport("csv")}
          >
            Ручной пилот · CSV / JSON
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
              ? "Ручной импорт: сохраняем файл и источник"
              : `ШАГ ${step + 1} · ${steps[step]}`}
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
            Источник недоступен
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
            Не удалось связать аккаунт
          </label>
          <button
            className="button secondary"
            disabled={!missing || verified}
            onClick={() => setVerified(true)}
          >
            Подтвердить связь
          </button>
          <button className="button primary" onClick={receive}>
            Получить запись
          </button>
        </div>
        <div className="intake-counters">
          <div>
            <strong data-testid="unique-facts">{intake.facts.length}</strong>
            <span>Уникальных редакций</span>
          </div>
          <div>
            <strong data-testid="duplicates">{intake.duplicates}</strong>
            <span>Дублей пропущено</span>
          </div>
          <div>
            <strong>{destinations[destination]}</strong>
            <span>Куда направим выбранную запись</span>
          </div>
          <div>
            <strong>
              {outage
                ? facts.length
                  ? "Устарело"
                  : "Неизвестно"
                : facts.length
                  ? "Загружено"
                  : "Ещё не читали"}
            </strong>
            <span>Свежесть этого источника</span>
          </div>
        </div>
        <div className="local-message" role="status">
          {feedback ||
            "Выберите источник и получите запись. Это изолированный пример приёма; изменения карточки применяются отдельно ниже."}
        </div>
        {intake.facts.length > 0 && (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Принятые записи"
          >
            <table>
              <thead>
                <tr>
                  <th>Время события UTC ↑</th>
                  <th>Источник / ID</th>
                  <th>Revision</th>
                  <th>Класс данных</th>
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
      <Section number="В" title="Как БД раскладывает данные по полкам">
        <Graph
          title="Внутри БД · исходники не подменяют назначения и результаты"
          height={520}
          nodes={[
            {
              id: "raw",
              x: 25,
              y: 210,
              w: 190,
              title: "Исходники · raw",
              sub: "JSON / файл / сообщение",
            },
            {
              id: "identity",
              x: 335,
              y: 65,
              w: 230,
              title: "Связи аккаунтов",
              sub: "student_id ↔ внешние ID",
            },
            {
              id: "class",
              x: 335,
              y: 210,
              w: 230,
              title: "Тип + политика",
              sub: "проверить права и смысл",
              tone: "blue",
            },
            {
              id: "queue",
              x: 335,
              y: 380,
              w: 230,
              title: "Очередь сверки",
              sub: "нет ID / конфликт / неясно",
              tone: "red",
            },
            {
              id: "facts",
              x: 760,
              y: 65,
              w: 250,
              title: "Факты выполнения",
              sub: "попытки · MR · оценки",
            },
            {
              id: "plans",
              x: 760,
              y: 210,
              w: 250,
              title: "Назначения и сроки",
              sub: "трек + подтверждённые уточнения",
            },
            {
              id: "releases",
              x: 760,
              y: 380,
              w: 250,
              title: "Версии и переходы",
              sub: "теги · манифест · решения",
            },
          ]}
          edges={[
            { from: "raw", to: "class", label: "нормализовать" },
            { from: "identity", to: "class", label: "найти студента" },
            { from: "class", to: "queue", label: "неоднозначно" },
            { from: "class", to: "facts", label: "результат" },
            { from: "class", to: "plans", label: "обязательство" },
            { from: "class", to: "releases", label: "конфигурация курса" },
          ]}
        />
        <div className="architecture-pair">
          <Block
            title="Ключи и сортировка"
            sub="source + instance + type + external_id + revision; факты по времени события, не времени загрузки."
          />
          <Block
            title="Ничего не склеиваем по имени"
            sub="Аккаунт Moodle, GitLab и Discord связываем с единым student_id. Неясные связи проверяет человек."
          />
        </div>
      </Section>
      <Section number="Г" title="Назначить трек: вручную или по правилу группы">
        <Flow label="От назначения к статистике">
          {[
            <Block
              title="Sheets / LearningAtlas"
              sub={
                track === "individual"
                  ? "Личный выбор преподавателя"
                  : "Строки шаблона группы"
              }
            />,
            <Block
              title="Проверить область"
              sub="Курс · версия · student_id / group_id"
            />,
            <Block
              title={`БД: R${card.revision}`}
              sub={card.trackSource}
              tone="dark"
            />,
            <Block
              title="Moodle + статистика"
              sub="Меняется список обязательного"
              tone="blue"
            />,
          ]}
        </Flow>
        <div className="lab-controls">
          <label>
            Способ назначения
            <select
              aria-label="Способ назначения трека"
              value={track}
              onChange={(e) => {
                setTrack(e.target.value as typeof track);
                setApproved(false);
              }}
            >
              <option value="individual">Вручную: первые 4 активности</option>
              <option value="group">Автоматически: шаблон группы</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
            {track === "individual"
              ? "Преподаватель утвердил назначение"
              : "Правило группы разрешено владельцем курса"}
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
            Применить трек к Студенту 01
          </button>
        </div>
        <div className="compact-inspector" data-testid="shared-track">
          <strong>Студент 01 · R{card.revision}</strong>
          <span>
            {card.learner.tasks.filter((t) => t.required).length} обязательных
            активностей.{" "}
            <a href="#statistics">Посмотреть результат в статистике →</a>
          </span>
        </div>
        <Hint>
          Групповой шаблон разворачивается в личные назначения. Личное
          исключение имеет приоритет, пока не отменено отдельным решением. Не
          назначенная активность может быть видна в хрестоматии Moodle, но не
          входит в знаменатель прогресса.
        </Hint>
      </Section>
      <Section
        number="Д"
        title="Уточнения и конфликтующие оценки: без скрытых перезаписей"
      >
        <div className="architecture-pair">
          <div className="decision-card">
            <span className="eyebrow">DISCORD → ДЕДЛАЙН TASK-01</span>
            <p>«Для группы A — 22 октября, 23:59 по Киеву»</p>
            <Flow label="Проверка уточнения">
              {[
                <Block
                  title="ИИ предлагает"
                  sub="Задание · группа · дата · цитата"
                />,
                <Block
                  title="Правило / человек"
                  sub="Автор уполномочен? Часовой пояс ясен?"
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
              Подтвердить для Студента 01 · группа A
            </button>
            <small>
              {clarified
                ? "Дедлайн Студента 01: 22.10.2026, 20:59 UTC. Исходное сообщение сохранено в истории."
                : "Демо применяет уточнение к карточке S-1 группы A. Для самостоятельного курса группа не задана."}
            </small>
          </div>
          <div className="decision-card">
            <span className="eyebrow">MOODLE 8/10 · SHEETS 9/10</span>
            <p>Две записи об одном результате.</p>
            <label>
              Политика источника оценки
              <select
                aria-label="Приоритет оценки"
                value={gradeChoice}
                onChange={(e) => setGradeChoice(e.target.value)}
              >
                <option value="moodle">Основная оценка — Moodle</option>
                <option value="sheets">Утверждённая коррекция — Sheets</option>
                <option value="review">Не настроено → сверка</option>
              </select>
            </label>
            <strong className="decision-result">
              {gradeChoice === "moodle"
                ? "Итог: 8/10; Sheets сохранён как кандидат"
                : gradeChoice === "sheets"
                  ? "Итог: 9/10 + автор и причина коррекции"
                  : "Итог не выбран; конфликт подсвечен"}
            </strong>
            <small>
              Пример выбора политики; не изменяет демонстрационную оценку.
              Последняя по времени запись не становится автоматически истиной.
              Оценки не усредняются между источниками.
            </small>
          </div>
        </div>
      </Section>
      <Section number="Е" title="Где jobs, где ИИ, где человек">
        <div className="automation-grid">
          <Block
            title="Пайплайны и jobs"
            sub="API, JSON/CSV, ID, UTC, дубли, формулы, манифест, перенос по явной карте, сверка зеркал."
            tone="blue"
          />
          <Block
            title="ИИ предлагает"
            sub="Разобрать текст Discord, неструктурированную строку Sheets, связь MR с задачей; Claude Code — review по рубрике."
          />
          <Block
            title="Человек или заданная политика"
            sub="Подтвердить неоднозначность, право менять срок, зачёт практики, критический переход. Решение + основание — в аудит."
            tone="red"
          />
        </div>
        <Flow label="Автоматическая проверка практики">
          {[
            <Block
              title="Студенческий MR"
              sub="Код рассматривается как входные данные"
            />,
            <Block
              title="CI: тесты и анализ"
              sub="В изолированной job, без рабочих секретов"
            />,
            <Block
              title="Claude Code: review"
              sub="JSON по рубрике + ссылки на строки"
            />,
            <Block
              title="Политика / преподаватель"
              sub="Рекомендация → отдельный зачёт"
              tone="dark"
            />,
          ]}
        </Flow>
        <Hint>
          ИИ не нужен для точных ID, формул или сравнения версий. Автозачёт
          возможен только по заранее разрешённой и проверенной рубрике. Для
          текста сохраняем цитату, версию модели и шаблона, уверенность и
          решение; неясность отправляем на сверку.
        </Hint>
      </Section>
    </>
  );
}
