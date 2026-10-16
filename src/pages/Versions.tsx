import { useState } from "react";
import {
  actionLabels,
  latestVersion,
  manifestFor,
  migrate,
  migrationBlock,
  pinVersion,
  preview,
  resolveBuild,
  syncMirror,
  type Card,
  type Policy,
} from "../platform";
import { fmt, metrics } from "../lab";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";
export default function Versions({
  cards,
  detail,
  onChange,
}: {
  cards: Card[];
  detail: string;
  onChange: (card: Card) => void;
}) {
  const [student, setStudent] = useState(
    cards.some((c) => c.learner.id === detail) ? detail : "S-1",
  );
  const card = cards.find((c) => c.learner.id === student) ?? cards[0];
  const [target, setTarget] = useState(3),
    [automatic, setAutomatic] = useState(false),
    [allowNew, setAllowNew] = useState(false),
    [authorized, setAuthorized] = useState(false);
  const [incomplete, setIncomplete] = useState(false),
    [stale, setStale] = useState(false),
    [failGitlab, setFailGitlab] = useState(false);
  const [available, setAvailable] = useState(true),
    [cacheRevision, setCacheRevision] = useState<number | null>(null),
    [feedback, setFeedback] = useState("");
  const [newLock, setNewLock] = useState<number | null>(null),
    [published, setPublished] = useState(2);
  const manifest = {
    ...manifestFor(card.learner, target),
    complete: !incomplete,
  };
  const policy: Policy = {
    automatic,
    allowNewWork: allowNew,
    fresh: !stale,
    authorized,
  };
  const block = migrationBlock(card, manifest, policy);
  const after = preview(card, manifest),
    beforeMetrics = metrics([card.learner]),
    afterMetrics = metrics([after]);
  const path = resolveBuild(card, available, cacheRevision === card.revision);
  const applied = card.learner.version >= target;
  const requiredTarget = after.tasks.filter((t) => t.required);
  const coverage = [
    { label: "Совместимая часть", action: "carry", color: "var(--blue-ink)" },
    { label: "Повторить", action: "repeat", color: "var(--red)" },
    { label: "Дополнить", action: "supplement", color: "var(--red-ink)" },
    { label: "Новое", action: "new", color: "var(--ink)" },
  ].map((part) => ({
    ...part,
    count: requiredTarget.filter(
      (t) =>
        manifest.mappings.find((m) => m.id === t.id)?.action === part.action,
    ).length,
  }));
  function apply() {
    try {
      onChange(
        migrate(
          card,
          manifest,
          policy,
          card.revision,
          `migration-${card.learner.id}-v${manifest.from}-v${manifest.to}-R${card.revision}`,
        ),
      );
      setFeedback(
        "Переход сохранён одной транзакцией. История сохранена, доставка в GitLab и Moodle ожидает job.",
      );
    } catch (e) {
      setFeedback((e as Error).message);
    }
  }
  function synchronize() {
    let next = syncMirror(card, "moodle");
    if (!failGitlab) next = syncMirror(next, "materials");
    onChange(next);
    setFeedback(
      failGitlab
        ? "Moodle обновлён. GitLab недоступен: закрепление в БД сохранено, job повторит доставку."
        : "Проекции GitLab и Moodle синхронизированы с БД.",
    );
  }
  return (
    <>
      <Heading
        kicker="04 / ТЕГ → МАНИФЕСТ → ЗАКРЕПЛЕНИЕ → ПЕРЕХОД"
        title="Версия меняется по правилам, а не по возрасту"
        sub="Критичность задаёт манифест. Новый тег сам по себе не меняет курс действующего студента."
      />
      <div className="lab-controls">
        <label>
          Чья версия и учебный трек
          <select
            aria-label="Студент для перехода"
            value={student}
            onChange={(e) => {
              setStudent(e.target.value);
              setAuthorized(false);
              setCacheRevision(null);
              setFeedback("");
            }}
          >
            {cards.map((c) => (
              <option key={c.learner.id} value={c.learner.id}>
                {c.learner.name} · v{c.learner.version} · R{c.revision}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Section number="А" title="Как курс становится опубликованной версией">
        <Flow label="Публикация курса">
          {[
            <Block
              title="GitLab: тег course-v3"
              sub="Код и материалы зафиксированы commit SHA"
            />,
            <Block
              title="CI проверяет манифест"
              sub="Стабильные activity_id · полная карта перехода"
              tone="blue"
            />,
            <Block
              title="Неизменяемая сборка"
              sub="HTML + manifest + хеши → защищённый доступ"
            />,
            <Block
              title="Job → БД"
              sub="Релиз опубликован; доступны правила v1 → v3"
              tone="dark"
            />,
          ]}
        </Flow>
        <Hint>
          Тег защищён от перезаписи. Правка опубликованной версии выпускается
          новым тегом. У сборки, манифеста и критериев оценки — свои
          идентификаторы; источник решения всегда можно восстановить.
        </Hint>
      </Section>
      <Section
        number="Б"
        title="Первый старт закрепляет актуальную версию один раз"
      >
        <div className="lab-controls">
          <button
            className="button primary"
            onClick={() =>
              setNewLock((existing) => pinVersion(existing, published))
            }
          >
            Первая / повторная активность нового студента
          </button>
          <button
            className="button secondary"
            disabled={published === 3}
            onClick={() => setPublished(3)}
          >
            Опубликовать v3 в примере старта
          </button>
        </div>
        <Flow label="Закрепление нового студента">
          {[
            <Block
              title={`Актуальная: v${published}`}
              sub="Последний разрешённый релиз"
            />,
            <Block
              title={
                newLock === null
                  ? "Студент ещё не начал"
                  : `Закреплено v${newLock}`
              }
              sub="Уникально: student_id + course_id"
              tone="dark"
            />,
            <Block
              title="Повторный вход"
              sub="Всегда читает существующее закрепление"
              tone="blue"
            />,
          ]}
        </Flow>
        <Hint>
          Плагин Moodle вызывает создание закрепления в БД при первой учебной
          активности. Транзакция и уникальный ключ защищают от двух
          одновременных стартов. Эта миниатюра независима от выбранной карточки
          ниже.
        </Hint>
      </Section>
      <Section
        number="В"
        title="Манифест объясняет совместимость по каждой активности"
      >
        <div className="lab-controls">
          <label>
            Сравнить с версией
            <select
              aria-label="Целевая версия курса"
              value={target}
              onChange={(e) => {
                setTarget(Number(e.target.value));
                setFeedback("");
              }}
            >
              <option value="2">v2 · редактура, некритично</option>
              <option value="3">v3 · новые критерии, критично</option>
            </select>
          </label>
          <span className={`badge ${manifest.critical ? "red" : "blue"}`}>
            {applied
              ? "Эта версия уже пройдена или закреплена"
              : manifest.critical
                ? "Критическое отличие по манифесту"
                : "Совместимый релиз · можно остаться"}
          </span>
        </div>
        <div className="version-summary">
          <div>
            <span>{card.learner.name} · карточка БД</span>
            <strong data-testid="old-version">
              Закреплено v{card.learner.version}
            </strong>
            <small>
              Трек R{card.revision} · актуальная v{latestVersion}
            </small>
          </div>
          <div>
            <span>Переход</span>
            <strong>
              v{manifest.from} → v{manifest.to}
            </strong>
            <small>
              {manifest.tag} · {manifest.hash}
            </small>
          </div>
          <div>
            <span>Перезачёт совместимых</span>
            <strong>
              {
                manifest.mappings.filter(
                  (m) =>
                    m.action === "carry" &&
                    card.learner.tasks.find((t) => t.id === m.id)?.status ===
                      "accepted",
                ).length
              }{" "}
              активностей
            </strong>
            <small>Из принятых результатов текущего трека</small>
          </div>
        </div>
        {!applied && (
          <div className="coverage-panel">
            <span className="eyebrow">
              СКОЛЬКО НОВОГО ТРЕКА ПОКРЫВАЕТ ПРЕЖНЯЯ ВЕРСИЯ
            </span>
            <div
              className="coverage-bar"
              role="img"
              aria-label={coverage
                .map((p) => `${p.label}: ${p.count}`)
                .join("; ")}
            >
              {coverage
                .filter((p) => p.count)
                .map((p) => (
                  <div
                    key={p.action}
                    style={{
                      width: `${(p.count / requiredTarget.length) * 100}%`,
                      background: p.color,
                    }}
                  >
                    {p.count}
                  </div>
                ))}
            </div>
            <div className="coverage-legend">
              {coverage.map((p) => (
                <span key={p.action}>
                  <i style={{ background: p.color }} />
                  {p.label}: {p.count}/{requiredTarget.length}
                </span>
              ))}
            </div>
            <small>
              Это совместимость содержания, а не сданные работы студента. Его
              фактически принятый прогресс показан отдельно ниже.
            </small>
          </div>
        )}
        <details className="reference">
          <summary>Как выглядит манифест · пример JSON</summary>
          <pre>
            {JSON.stringify(
              {
                manifest_revision: "manifest@1",
                from: `v${manifest.from}`,
                to: manifest.tag,
                critical: manifest.critical,
                approved: manifest.approved,
                complete: manifest.complete,
                assessment_from: "assessment@1",
                assessment_to: target === 3 ? "assessment@2" : "assessment@1",
                mappings: manifest.mappings.slice(0, 6),
                note: "Остальные ID также перечисляются явно; в примере показан фрагмент.",
              },
              null,
              2,
            )}
          </pre>
        </details>
        {!applied && (
          <>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Правила переноса активностей"
            >
              <table>
                <thead>
                  <tr>
                    <th>Активность</th>
                    <th>Решение манифеста</th>
                    <th>Почему</th>
                    <th>В целевом треке</th>
                  </tr>
                </thead>
                <tbody>
                  {manifest.mappings
                    .filter((m, i) => i < 6 || m.action === "new")
                    .map((m) => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>
                          <span
                            className={`badge ${m.action === "carry" ? "blue" : "red"}`}
                          >
                            {actionLabels[m.action]}
                          </span>
                        </td>
                        <td>{m.reason}</td>
                        <td>
                          {m.action === "retire"
                            ? "Удалена; история остаётся"
                            : m.action === "repeat"
                              ? "Новая попытка по новым критериям"
                              : m.action === "supplement"
                                ? "Сдать только добавленную часть"
                                : m.action === "new"
                                  ? "Новое назначение"
                                  : "Принятое зачтётся, несданное останется"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <small className="table-caption">
              Первые 6 активностей и все новые; остальные{" "}
              {Math.max(0, card.learner.tasks.length - 6)} имеют явное правило
              «перезачесть». Новая активность наследует обязательность
              заменённой TASK-05; дедлайн назначается отдельно.
            </small>
            <div className="migration-score">
              <div>
                <span>СЕЙЧАС · v{card.learner.version}</span>
                <strong>
                  {beforeMetrics.accepted}/{beforeMetrics.total}
                </strong>
                <small>
                  {fmt(beforeMetrics.percent, "%")} назначенного веса
                </small>
              </div>
              <span>→</span>
              <div>
                <span>ПОСЛЕ ПЕРЕХОДА · v{target}</span>
                <strong>
                  {afterMetrics.accepted}/{afterMetrics.total}
                </strong>
                <small>{fmt(afterMetrics.percent, "%")} нового трека</small>
              </div>
            </div>
          </>
        )}
        <Hint>
          «Дополнить» оставляет старую попытку в истории и назначает недостающую
          часть; текущая активность будет принята после её сдачи. «Повторить»
          требует новой попытки. Перезачёт сохраняет основание и совместимые
          баллы, но не создаёт выдуманную попытку Moodle. Для скачка v1 → v3
          нужна явная карта v1 → v3: совместимость соседних версий не
          предполагается транзитивной.
        </Hint>
      </Section>
      <Section number="Г" title="Ручное решение или настроенная автоматика">
        <Graph
          title="Блок-схема решения о переходе"
          height={450}
          nodes={[
            {
              id: "compare",
              x: 25,
              y: 170,
              w: 200,
              title: "Job: сверить манифест",
              sub: "v студента → актуальный тег",
            },
            {
              id: "critical",
              x: 330,
              y: 170,
              w: 230,
              title: "Изменения критичны?",
              sub: "по правилам, не по номеру",
              tone: "red",
            },
            {
              id: "stay",
              x: 730,
              y: 30,
              w: 280,
              title: "Остаться на версии",
              sub: "новый тег не меняет прогресс",
            },
            {
              id: "decision",
              x: 730,
              y: 170,
              w: 280,
              title: "LearningAtlas: подсветить",
              sub: "ручное решение / автополитика",
              tone: "red",
            },
            {
              id: "commit",
              x: 730,
              y: 340,
              w: 280,
              title: "БД: версия + трек + история",
              sub: "одна транзакция + очередь доставки",
              tone: "dark",
            },
          ]}
          edges={[
            { from: "compare", to: "critical", label: "проверить" },
            { from: "critical", to: "stay", label: "нет" },
            { from: "critical", to: "decision", label: "да" },
            { from: "decision", to: "commit", label: "условия выполнены" },
          ]}
        />
        <div className="lab-controls">
          <label>
            Режим
            <select
              aria-label="Режим перехода"
              value={automatic ? "auto" : "manual"}
              onChange={(e) => {
                setAutomatic(e.target.value === "auto");
                setAuthorized(false);
              }}
            >
              <option value="manual">Ручной · преподаватель</option>
              <option value="auto">Автоматический · policy@1</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
            />
            {automatic
              ? "Владелец разрешил автополитику"
              : "Уполномоченный преподаватель подтвердил переход"}
          </label>
          {automatic && (
            <label>
              <input
                type="checkbox"
                checked={allowNew}
                onChange={(e) => setAllowNew(e.target.checked)}
              />
              Разрешены повторные и новые задания
            </label>
          )}
        </div>
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={incomplete}
              onChange={(e) => setIncomplete(e.target.checked)}
            />
            В манифесте не хватает сопоставления
          </label>
          <label>
            <input
              type="checkbox"
              checked={stale}
              onChange={(e) => setStale(e.target.checked)}
            />
            Данные студента устарели
          </label>
        </div>
        <div className="compact-inspector" aria-live="polite">
          <strong>
            {applied
              ? "Переход уже не требуется"
              : block
                ? "Переход остановлен"
                : "Условия выполнены"}
          </strong>
          <span>
            {applied
              ? "Можно открыть статистику или синхронизировать проекции ниже."
              : (block ??
                (automatic
                  ? "Job может применить переход по policy@1 без отдельного решения на каждого студента."
                  : "Преподаватель может сохранить показанный предпросмотр."))}
          </span>
        </div>
        <button
          className="button primary"
          disabled={!!block || applied}
          onClick={apply}
        >
          {applied
            ? "Версия уже закреплена"
            : automatic
              ? "Выполнить автоматический переход"
              : "Утвердить переход вручную"}
        </button>
        <div className="local-message" role="status">
          {feedback ||
            "Кнопка меняет общую демо-карточку. История и статистика доступны в других разделах до перезагрузки сайта."}
        </div>
        <div className="history-strip">
          {card.history.map((h) => (
            <div key={h.revision}>
              <strong>
                R{h.revision} · v{h.learner.version}:{" "}
                {metrics([h.learner]).accepted}/{metrics([h.learner]).total}
              </strong>
              <span>{h.reason} · прежние попытки и оценки сохранены</span>
            </div>
          ))}
          <div>
            <strong>
              Текущая R{card.revision} · v{card.learner.version}
            </strong>
            <a href={`#statistics/${card.learner.id}`}>
              Открыть эту карточку в статистике →
            </a>
          </div>
        </div>
        {card.audit.length > 0 && (
          <details className="reference">
            <summary>Аудит решений · {card.audit.length}</summary>
            <pre>{JSON.stringify(card.audit, null, 2)}</pre>
          </details>
        )}
      </Section>
      <Section
        number="Д"
        title="Доставка версии: БД — основа, GitLab и Moodle — проекции"
      >
        <Flow label="Согласование систем после решения">
          {[
            <Block
              title={`БД: R${card.revision}`}
              sub={`v${card.learner.version} · решение зафиксировано`}
              tone="dark"
            />,
            <Block
              title="Очередь доставки · outbox"
              sub={`${card.outbox.filter((o) => !o.materials || !o.moodle).length} изменений ждут подтверждения`}
            />,
            <Block
              title={`GitLab: R${card.mirrors.materials}`}
              sub="Защищённый документ закреплений"
            />,
            <Block
              title={`Moodle: R${card.mirrors.moodle}`}
              sub="Версия и личный трек"
              tone="blue"
            />,
          ]}
        </Flow>
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={failGitlab}
              onChange={(e) => setFailGitlab(e.target.checked)}
            />
            GitLab недоступен при доставке
          </label>
          <button className="button secondary" onClick={synchronize}>
            Синхронизировать GitLab и Moodle
          </button>
        </div>
        <div className="json-panel">
          <span>
            Проекция student-course-versions.json · пример без имён и оценок
          </span>
          <pre>
            {JSON.stringify(
              {
                student_id: card.learner.id,
                course_id: "course-demo",
                projection_revision: card.mirrors.materials,
                database_revision: card.revision,
                course_tag:
                  card.mirrors.materials === card.revision
                    ? `course-v${card.learner.version}`
                    : "прежний тег; обновление ожидается",
                access: "private; only service account",
              },
              null,
              2,
            )}
          </pre>
        </div>
        <Hint>
          Команда LearningAtlas содержит ожидаемую revision и уникальный
          request_id. БД сохраняет изменение и outbox вместе; job повторяет
          неудачную доставку. Повтор команды не создаёт ещё один перенос,
          запоздалое событие не откатывает новую revision. Moodle и GitLab не
          должны независимо выбирать студенту новую версию.
        </Hint>
      </Section>
      <Section
        number="Е"
        title="Что увидит студент, если компонент доставки недоступен"
      >
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={!available}
              onChange={(e) => setAvailable(!e.target.checked)}
            />
            Компонент доставки недоступен
          </label>
          <label>
            <input
              type="checkbox"
              checked={cacheRevision === card.revision}
              onChange={(e) =>
                setCacheRevision(e.target.checked ? card.revision : null)
              }
            />
            Есть проверенный кеш текущего закрепления
          </label>
        </div>
        <div className="compact-inspector">
          <strong>{path ? `Открыть ${path}` : "Не запускать урок"}</strong>
          <span>
            {path
              ? "Проверенное закрепление; артефакт выдаётся только после проверки доступа."
              : "Нет доступного закрепления. Просим повторить позже; не подставляем latest."}
          </span>
        </div>
      </Section>
    </>
  );
}
