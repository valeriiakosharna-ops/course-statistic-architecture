import { useMemo, useState } from "react";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import type { CourseMode, Intake, Packet } from "../lab";
import { ingest, packetKey, packets, routePacket, sortFacts } from "../lab";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";

const steps = [
  ["Получить", "Коннектор читает данные"],
  ["Сохранить", "Исходник + время + хеш"],
  ["Привести поля", "Единые ID и даты"],
  ["Проверить дубли", "Ключ + версия записи"],
  ["Найти связи", "Человек · задача · план"],
  ["Распределить", "Факт / проект / проверка"],
  ["Посчитать", "Снимок метрик на дату"],
];
export default function DataFlow({ mode }: { mode: CourseMode }) {
  const [source, setSource] = useState(0),
    [step, setStep] = useState(0);
  const [transport, setTransport] = useState("api");
  const [missing, setMissing] = useState(false),
    [verified, setVerified] = useState(false),
    [outage, setOutage] = useState(false);
  const [intake, setIntake] = useState<Intake>({ facts: [], duplicates: 0 });
  const [feedback, setFeedback] = useState("");
  const available =
    mode === "java" ? [0, 1, 2] : mode === "sheets" ? [0, 2] : [0];
  const sourceIndex = available.includes(source) ? source : 0;
  const original = packets[sourceIndex];
  const packet = useMemo<Packet>(
    () => ({
      ...original,
      learner:
        missing && !verified && original.source !== "Sheets"
          ? null
          : original.learner,
    }),
    [original, missing, verified],
  );
  const sourceFacts = intake.facts.filter(
    (p) => p.source === packet.source && p.instance === packet.instance,
  );
  const destination = routePacket(packet);
  const receive = () => {
    if (outage) {
      setFeedback(
        sourceFacts.length
          ? "Источник недоступен. Последние факты сохранены; свежесть помечена как устаревшая."
          : "Источник недоступен. Успешной загрузки ещё не было; качество данных неизвестно.",
      );
      return;
    }
    setIntake((previous) => ingest(previous, packet));
    setFeedback("Получено. Повтор той же версии не создаёт новый факт.");
  };
  const raw =
    original.source === "Moodle"
      ? {
          id: 284,
          userid: 104,
          quiz: 12,
          sumgrades: 8,
          maxgrade: 10,
          timefinish: Date.parse(packet.eventTime) / 1000,
        }
      : original.source === "GitLab"
        ? {
            project_id: 23,
            iid: 42,
            author_id: 52,
            state: "merged",
            head_sha: "head-a3",
            task_hint: "TASK-01",
          }
        : {
            row: 12,
            group: "A",
            task_id: "TASK-01",
            required: true,
            deadline: "20.10.2026 23:59",
            timezone: "Europe/Kyiv",
          };
  const stages = [
    raw,
    {
      raw_ref: "raw/demo/sync-17/object-284",
      fetched_at: "2026-10-16T12:00:00Z",
      payload_hash: packet.revision,
      sync_id: "sync-17",
      original_preserved: true,
    },
    {
      source_key: packetKey(packet),
      learner_id: packet.learner,
      task_id: packet.task,
      occurred_at: packet.eventTime,
      ...(packet.source === "Sheets"
        ? {
            due_at_utc: "2026-10-20T20:59:00Z",
            authored_timezone: "Europe/Kyiv",
          }
        : {
            score: packet.value,
            max_score: packet.source === "Moodle" ? 10 : null,
          }),
    },
    {
      object_key: packetKey(packet),
      revision: packet.revision,
      repeated_revision: "не добавляем повторно",
      changed_revision: "новая запись в истории",
      received_unique: intake.facts.length,
      duplicates: intake.duplicates,
    },
    {
      learner:
        packet.learner ??
        (packet.source === "Sheets"
          ? "назначения группы, ещё не студент"
          : "НЕ СОПОСТАВЛЕН"),
      task: packet.task,
      plan: packet.source === "Sheets" ? "проект изменения" : "S-1 / R1",
      method: verified
        ? "явно подтверждено преподавателем"
        : packet.source === "Moodle"
          ? "таблица Moodle ID → internal ID"
          : packet.source === "GitLab"
            ? "submitted URL + проверенный identity link"
            : "group + stable task_id",
    },
    {
      route: destination,
      result:
        destination === "evidence"
          ? "Подтверждение сохранено. Зачёт решает отдельная политика."
          : destination === "review-queue"
            ? "В очередь сверки. Прогресс не угадываем."
            : "Предложение плана. Активный знаменатель не меняется.",
    },
    {
      plan_revision: "R1",
      metric_definition: "completion@1",
      as_of: "2026-10-16T12:00:00Z",
      calculation: "принятый обязательный вес / весь обязательный вес",
      quality: outage
        ? sourceFacts.length
          ? "STALE: источник недоступен"
          : "UNKNOWN: успешной загрузки не было"
        : destination === "review-queue"
          ? "PARTIAL: есть неразрешённая связь"
          : "DEMO: расчёт только после проверки результатов",
    },
  ];
  return (
    <>
      <Heading
        kicker="03 / ОТКУДА БЕРУТСЯ ЦИФРЫ"
        title="Пройдём путь одной записи"
        sub="Выберите источник и нажимайте шаги. Внизу видно, что происходит с данными."
      />
      <div className="source-controls">
        <div className="tabs" aria-label="Источник записи">
          {available.map((i) => (
            <button
              key={i}
              className={sourceIndex === i ? "selected" : ""}
              aria-pressed={sourceIndex === i}
              onClick={() => {
                setSource(i);
                setStep(0);
                setMissing(false);
                setVerified(false);
                setFeedback("");
                setTransport("api");
              }}
            >
              {packets[i].source}
            </button>
          ))}
        </div>
        <span className="demo-badge">Синтетическая запись</span>
      </div>
      <div className="transport-grid">
        <button
          aria-pressed={transport === "api"}
          onClick={() => setTransport("api")}
          className={transport === "api" ? "transport selected" : "transport"}
        >
          <strong>Автоматически</strong>
          <span>
            {packet.source === "Moodle"
              ? "Moodle External API → JSON"
              : packet.source === "GitLab"
                ? "GitLab REST API → JSON"
                : "Sheets API → JSON"}
          </span>
          <small>Сервисная учётная запись · чтение 1–2 раза в сутки</small>
        </button>
        <button
          aria-pressed={transport === "file"}
          onClick={() => setTransport("file")}
          className={transport === "file" ? "transport selected" : "transport"}
        >
          <strong>Ручной пилот</strong>
          <span>Экспорт JSON / CSV → импорт</span>
          <small>Согласованная структура колонок + проверка файла</small>
        </button>
      </div>
      {packet.source === "GitLab" && (
        <Hint>
          Webhook — уведомление «что-то изменилось». API-сверка получает полную
          запись и восстанавливает пропущенные события.
        </Hint>
      )}
      <Section number="А" title="Семь шагов обработки">
        <div className="pipeline-steps">
          {steps.map(([name, subtitle], i) => (
            <button
              key={name}
              aria-pressed={step === i}
              className={`pipeline-step ${step === i ? "selected" : ""}`}
              onClick={() => setStep(i)}
            >
              <span>{i + 1}</span>
              <strong>{name}</strong>
              <small>{subtitle}</small>
              {i < 6 && <ChevronRight size={17} />}
            </button>
          ))}
        </div>
        <div className="pipeline-workbench">
          <div className="pipeline-explanation">
            <span className="eyebrow">
              ШАГ {step + 1} / 7 ·{" "}
              {transport === "api" ? "API → JSON" : "ФАЙЛ → ЕДИНАЯ ЗАПИСЬ"}
            </span>
            <h3>{steps[step][0]}</h3>
            {step === 0 ? (
              <Flow label="Как подключается источник">
                {[
                  <Block title={packet.source} sub="Исходные записи" />,
                  <Block
                    title={
                      transport === "api"
                        ? "Read-only API"
                        : "Валидатор импорта"
                    }
                    sub={
                      transport === "api" ? "Токен на сервере" : "JSON / CSV"
                    }
                    tone="blue"
                  />,
                  <Block title="Наша копия" sub="Ничего не меняем в LMS" />,
                ]}
              </Flow>
            ) : step === 1 ? (
              <Flow label="Хранение исходников">
                {[
                  <Block title="Ответ источника" />,
                  <Block
                    title="Исходные данные"
                    sub="Неизменяемая копия"
                    tone="dark"
                  />,
                  <Block title="Журнал загрузки" sub="Хеш · время · ошибка" />,
                ]}
              </Flow>
            ) : step === 2 ? (
              <div className="mapping-table">
                <div>
                  <code>
                    {packet.source === "Moodle"
                      ? "userid: 104"
                      : packet.source === "GitLab"
                        ? "author_id: 52"
                        : "group: A"}
                  </code>
                  <span>→</span>
                  <strong>
                    {packet.source === "Sheets"
                      ? "шаблон группы A"
                      : "learner_id: S-1"}
                  </strong>
                </div>
                <div>
                  <code>
                    {packet.source === "Sheets"
                      ? "20.10 23:59 Kyiv"
                      : "quiz / task_hint"}
                  </code>
                  <span>→</span>
                  <strong>
                    {packet.source === "Sheets"
                      ? "20.10 20:59 UTC + исходная зона"
                      : "task_id: TASK-01"}
                  </strong>
                </div>
                <div>
                  <code>Система + экземпляр + тип + ID</code>
                  <span>→</span>
                  <strong>Уникальный ключ источника</strong>
                </div>
              </div>
            ) : step === 3 ? (
              <Flow label="Различие повторов и изменений">
                {[
                  <Block title="Ключ + тот же хеш" sub="Дубль → пропустить" />,
                  <Block
                    title="Ключ + новый хеш"
                    sub="Изменение → сохранить версию"
                    tone="blue"
                  />,
                ]}
              </Flow>
            ) : step === 4 ? (
              <Flow label="Решение о сопоставлении">
                {[
                  <Block
                    title="Есть точные ID?"
                    sub="Да → связать"
                    tone="blue"
                  />,
                  <Block
                    title="Связь неясна?"
                    sub="Сохранить в очередь"
                    tone="red"
                  />,
                  <Block
                    title="Преподаватель"
                    sub="Подтвердит связь, не оценку"
                  />,
                ]}
              </Flow>
            ) : step === 5 ? (
              <div className="routing-choices">
                <Block
                  title="Подтверждения"
                  sub="Попытки, оценки, MR"
                  tone={destination === "evidence" ? "blue" : ""}
                />
                <Block
                  title="Проекты планов"
                  sub="Назначения из Sheets"
                  tone={destination === "plan-proposal" ? "blue" : ""}
                />
                <Block
                  title="Очередь сверки"
                  sub="Неясные связи"
                  tone={destination === "review-queue" ? "red" : ""}
                />
              </div>
            ) : (
              <Flow label="Расчёт по закреплённому плану">
                {[
                  <Block title="План R1" sub="Применимые задачи" />,
                  <Block title="Принятые результаты" sub="По политике курса" />,
                  <Block
                    title="Снимок на дату"
                    sub="Формула + качество + ссылки"
                    tone="blue"
                  />,
                ]}
              </Flow>
            )}
          </div>
          <div className="json-panel">
            <span>
              {step === 0
                ? "ВХОД · ПРИМЕР, НЕ РЕАЛЬНЫЙ API-ОТВЕТ"
                : "РЕЗУЛЬТАТ ШАГА · DEMO"}
            </span>
            <pre>
              {step === 0 && transport === "file"
                ? `${Object.keys(raw).join(",")}\n${Object.values(raw).join(",")}`
                : JSON.stringify(stages[step], null, 2)}
            </pre>
          </div>
        </div>
      </Section>
      <Section number="Б" title="Проверим сложные случаи">
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={outage}
              onChange={(e) => setOutage(e.target.checked)}
            />
            Источник недоступен
          </label>
          {packet.source !== "Sheets" && (
            <label>
              <input
                type="checkbox"
                checked={missing}
                onChange={(e) => {
                  setMissing(e.target.checked);
                  setVerified(false);
                  setStep(4);
                }}
              />
              Не удалось связать аккаунт
            </label>
          )}
          <button className="button primary" onClick={receive}>
            <RotateCcw size={16} />
            Получить запись
          </button>
          {missing && !verified && (
            <button
              className="button secondary"
              onClick={() => {
                setVerified(true);
                setStep(5);
                setFeedback(
                  "Связь аккаунта подтверждена. MR всё ещё не зачтён автоматически.",
                );
              }}
            >
              Подтвердить связь
            </button>
          )}
        </div>
        <div className="intake-counters" aria-live="polite">
          <span>
            Уникальных версий{" "}
            <strong data-testid="unique-facts">{intake.facts.length}</strong>
          </span>
          <span>
            Повторов отброшено{" "}
            <strong data-testid="duplicates">{intake.duplicates}</strong>
          </span>
          <span>
            Куда попадёт запись{" "}
            <strong>
              {destination === "evidence"
                ? "Подтверждения"
                : destination === "review-queue"
                  ? "Очередь сверки"
                  : "Проект плана"}
            </strong>
          </span>
          <span>
            Свежесть{" "}
            <strong>
              {outage
                ? sourceFacts.length
                  ? "Устарела"
                  : "Неизвестна"
                : sourceFacts.length
                  ? "Демо-срез 12:00 UTC"
                  : "Записей ещё нет"}
            </strong>
          </span>
        </div>
        {feedback && (
          <div className="local-message" role="status">
            <Check size={16} />
            {feedback}
          </div>
        )}
        {intake.facts.length > 0 && (
          <div className="fact-log">
            <span>Исходные события по времени · UTC</span>
            {sortFacts(intake.facts).map((p) => (
              <div key={packetKey(p) + p.revision}>
                <code>{p.eventTime}</code>
                <span>{p.source}</span>
                <strong>{p.externalId}</strong>
                <small>{p.revision}</small>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section number="В" title="Как данные систематизируются">
        <Graph
          title="Связи в реестре; группы — срез для отчёта"
          height={360}
          nodes={[
            { id: "p", x: 20, y: 45, title: "Программа" },
            {
              id: "s",
              x: 280,
              y: 45,
              title: "Студент / прохождение",
              w: 210,
              tone: "blue",
            },
            { id: "r", x: 600, y: 45, title: "План R1 / R2", tone: "dark" },
            { id: "a", x: 600, y: 215, title: "Назначения" },
            { id: "e", x: 850, y: 215, title: "Подтверждения", tone: "blue" },
            {
              id: "g",
              x: 280,
              y: 215,
              title: "Группа A / B",
              sub: "срез, не общий план",
              w: 210,
            },
            { id: "res", x: 850, y: 45, title: "Результаты", tone: "red" },
          ]}
          edges={[
            { from: "p", to: "s", label: "проходит" },
            { from: "s", to: "r", label: "свой снимок" },
            { from: "r", to: "a", label: "содержит" },
            { from: "a", to: "e", label: "связь M:N" },
            { from: "e", to: "res", label: "проверка" },
            { from: "g", to: "s", label: "группирует", dashed: true },
          ]}
        />
        <div className="rule-strip">
          <span>
            <b>Сортируем</b> по времени события
          </span>
          <span>
            <b>Фильтруем</b> по задаче, статусу, версии
          </span>
          <span>
            <b>Группируем</b> по программе и группе
          </span>
          <span>
            <b>Храним отдельно</b> время получения / решения
          </span>
        </div>
        <Hint>
          История не переписывается. «Что знали тогда» и «что пересчитали позже»
          — разные представления одной истории.
        </Hint>
      </Section>
      <details className="reference">
        <summary>Что проверить перед настоящим подключением</summary>
        <div className="check-grid">
          <span>Moodle: доступные API, плагины, попытки</span>
          <span>GitLab: приватные проекты, forks, IDs</span>
          <span>Sheets: колонки, владельцы, часовой пояс</span>
          <span>Политики: кто принимает работы и меняет планы</span>
        </div>
      </details>
    </>
  );
}
