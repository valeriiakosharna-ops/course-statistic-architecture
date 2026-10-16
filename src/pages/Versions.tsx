import { useState } from "react";
import { Check, LockKeyhole } from "lucide-react";
import { migrationTasks, previewMigration } from "../model";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";

const actions = {
  CARRY_OVER: "Перенести зачёт",
  REASSESS: "Проверить заново",
  SUPPLEMENT: "Дополнить работу",
  NEW_REQUIRED: "Новое обязательство",
  RETIRED: "Убрать из нового плана",
  MANUAL_REVIEW: "Решить вручную",
};
export default function Versions() {
  const [release, setRelease] = useState(1),
    [change, setChange] = useState("task");
  const [outage, setOutage] = useState(false),
    [cache, setCache] = useState(true);
  const [preview, setPreview] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [applied, setApplied] = useState(false);
  const [selected, setSelected] = useState("plan");
  const migration = previewMigration();
  const version = applied ? release : 1;
  const lane = [
    [
      "Контент",
      "HTML и оформление",
      change === "style"
        ? "Меняется сборка; оценивание прежнее"
        : "Артефакт хранится по неизменяемому URL",
    ],
    [
      "Оценивание",
      "Вопросы, порог, шкала",
      change === "assessment"
        ? "Нужна новая версия критериев"
        : "Совместимость подтверждают отдельно",
    ],
    [
      "Программа",
      "Состав и ссылки на версии",
      "Новый релиз не меняет старый план",
    ],
    [
      "План студента",
      "Обязательства, сроки, веса",
      "R2 создают только после утверждения",
    ],
    [
      "Формула метрики",
      "Как считаем результат",
      "Новая формула не стирает старые снимки",
    ],
  ];
  const nodes = [
    {
      id: "source",
      x: 20,
      y: 60,
      title: "GitLab · исходники",
      sub: "commit SHA",
    },
    {
      id: "build",
      x: 280,
      y: 60,
      title: "Автосборка (CI)",
      sub: "проверки + паспорт релиза",
    },
    {
      id: "store",
      x: 560,
      y: 60,
      title: "Хранилище",
      sub: "/unit/v1/hash/index.html",
      w: 220,
      tone: "blue" as const,
    },
    {
      id: "plan",
      x: 625,
      y: 270,
      title: "План студента R1",
      sub: "точные ссылки на версии",
      w: 200,
      tone: "dark" as const,
    },
    {
      id: "moodle",
      x: 20,
      y: 270,
      title: "Moodle-сессия",
      sub: "проверенный пользователь",
      w: 205,
    },
    {
      id: "resolver",
      x: 315,
      y: 270,
      title: "Резолвер версии",
      sub: "находит закрепление",
      w: 195,
      tone: "red" as const,
    },
    {
      id: "iframe",
      x: 850,
      y: 60,
      title: "HTML в iframe",
      sub: "именно свой артефакт",
      w: 170,
      tone: "blue" as const,
    },
  ];
  const explanations: Record<string, string> = {
    source:
      "Исходники можно менять. Каждый опубликованный артефакт связан с точным commit SHA.",
    build:
      "CI — автоматическая сборка. Манифест — паспорт релиза: задачи, обязательность, версии контента и оценивания, URL и контрольные суммы файлов.",
    store:
      "Выпущенный HTML не перезаписывают. Хеш проверяет байты; права доступа проверяются отдельно.",
    plan: "База хранит неизменяемую ревизию плана и точные версии. Указатель active_revision меняется явно.",
    moodle:
      "Плагин получает пользователя из серверной сессии Moodle, не из email или user_id в URL.",
    resolver:
      "Резолвер находит закреплённую версию и выдаёт точный URL с защищённым запуском. Не использует latest для старого студента.",
    iframe:
      "Загружается закреплённый HTML. Результаты проверяются сервером; произвольному score из браузера не доверяют.",
  };
  return (
    <>
      <Heading
        kicker="04 / ВЕРСИИ И ИСТОРИЯ"
        title="Новый курс — не новый план для всех"
        sub="v1/v2 — выпуски курса. R1/R2 — сохранённые версии личного плана студента."
      />
      <Section number="А" title="Что именно версионируем">
        <div className="version-lanes">
          {lane.map(([name, what, rule], i) => (
            <div key={name}>
              <span>0{i + 1}</span>
              <strong>{name}</strong>
              <span>{what}</span>
              <code>v1 → v2</code>
              <small>{rule}</small>
            </div>
          ))}
        </div>
      </Section>
      <Section number="Б" title="Где версия хранится и как доставляется">
        <Graph
          title="Публикация сверху; запуск студента снизу — это разные потоки"
          nodes={nodes}
          height={390}
          selected={selected}
          onSelect={setSelected}
          edges={[
            { from: "source", to: "build", label: "собрать" },
            { from: "build", to: "store", label: "неизменяемый HTML" },
            { from: "moodle", to: "resolver", label: "кто открывает" },
            {
              from: "plan",
              to: "resolver",
              label: "найти закрепление",
              dashed: true,
            },
            { from: "resolver", to: "store", label: "точная ссылка" },
            { from: "store", to: "iframe", label: "защищённый запуск" },
          ]}
        />
        <div className="compact-inspector">
          <strong>{nodes.find((n) => n.id === selected)?.title}</strong>
          <span>{explanations[selected]}</span>
        </div>
      </Section>
      <Section number="В" title="Попробуйте выпустить новую версию">
        <div className="lab-card">
          <div className="lab-controls">
            <label>
              Что меняем
              <select
                aria-label="Изменение релиза"
                value={change}
                onChange={(e) => setChange(e.target.value)}
              >
                <option value="style">Только оформление HTML</option>
                <option value="assessment">Критерии оценивания</option>
                <option value="task">Состав обязательных задач</option>
              </select>
            </label>
            <button
              className="button primary"
              disabled={release >= 5 || applied}
              onClick={() => {
                setRelease(release + 1);
                setPreview(false);
              }}
            >
              Опубликовать v{release + 1}
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setRelease(1);
                setApplied(false);
                setPreview(false);
                setReviewed(false);
                setOutage(false);
                setCache(true);
              }}
            >
              Сбросить демо
            </button>
          </div>
          <div className="release-track">
            {[1, 2, 3, 4, 5].map((v) => (
              <div key={v} className={v <= release ? "published" : ""}>
                <span>{v <= release ? <Check size={15} /> : v}</span>
                <strong>v{v}</strong>
                <small>
                  {v === 1
                    ? "Первый старт"
                    : v <= release
                      ? "Опубликован"
                      : "Ещё нет"}
                </small>
              </div>
            ))}
          </div>
          <div className="version-students">
            <Block
              title="Начал раньше"
              sub={`Версия v${version} · план ${applied ? "R2" : "R1"}`}
              tone="dark"
            >
              <LockKeyhole size={19} />
              <small data-testid="old-version">Закреплено v{version}</small>
            </Block>
            <Block
              title="Начинает сейчас"
              sub={`Версия v${release} · новый план R1`}
              tone="blue"
            >
              <small>Берёт текущий опубликованный выпуск</small>
            </Block>
          </div>
          <div className="change-note">
            {change === "style"
              ? "Оформление меняется отдельно от критериев. Старый студент всё равно видит свой точный артефакт."
              : change === "assessment"
                ? "Новые критерии требуют проверки совместимости. Иногда нужен отдельный grade item в Moodle."
                : "Добавленная задача попадает в новый план, а не молча в планы уже начавших."}
          </div>
        </div>
      </Section>
      <Section number="Г" title="Что происходит при сбое резолвера">
        <div className="simulation-controls">
          <label>
            <input
              type="checkbox"
              checked={outage}
              onChange={(e) => setOutage(e.target.checked)}
            />
            Резолвер недоступен
          </label>
          <label>
            <input
              type="checkbox"
              checked={cache}
              onChange={(e) => setCache(e.target.checked)}
            />
            Есть проверенный кеш закрепления
          </label>
        </div>
        <Flow label="Безопасное поведение при сбое">
          {[
            <Block
              title="Открыть урок"
              sub={`Студент закреплён на v${version}`}
            />,
            <Block
              title={outage ? "Резолвер не отвечает" : "Резолвер нашёл план"}
              tone={outage ? "red" : "blue"}
            />,
            <Block
              title={
                outage && !cache
                  ? "Не запускать урок"
                  : `Открыть точную v${version}`
              }
              sub={
                outage && !cache
                  ? "Объяснить ошибку и повторить позже"
                  : outage
                    ? "Из ранее проверенного кеша"
                    : "Из неизменяемого хранилища"
              }
              tone="dark"
            />,
          ]}
        </Flow>
        <Hint>
          При сбое нельзя подменять закреплённую версию на latest. Срок действия
          кеша и повторная проверка доступа задаются политикой.
        </Hint>
      </Section>
      <Section number="Д" title="Как безопасно перевести студента">
        <Flow label="Процесс миграции">
          {[
            <Block title="Сравнить версии" sub="Задачи + критерии" />,
            <Block
              title="Показать последствия"
              sub="Что перенесётся и что доделать"
              tone="blue"
            />,
            <Block
              title="Утвердить"
              sub="Ответственный преподаватель"
              tone="red"
            />,
            <Block title="Создать R2" sub="Сохранить R1 и аудит" tone="dark" />,
          ]}
        </Flow>
        <div className="migration-control">
          <button
            className="button primary"
            disabled={release < 5 || applied}
            onClick={() => setPreview(!preview)}
          >
            {release < 5
              ? "Сначала опубликуйте v2–v5"
              : applied
                ? "Миграция применена в демо"
                : preview
                  ? "Скрыть сравнение"
                  : "Сравнить v1 → v5"}
          </button>
          <small>
            Отдельный пример v1 → v5: задачи и критерии изменились; веса равны
          </small>
        </div>
        {preview && (
          <div className="migration-panel">
            <div className="migration-score">
              <div>
                <span>R1 · было</span>
                <strong>
                  {migration.oldAccepted}/{migration.oldTotal} ≈ 67%
                </strong>
              </div>
              <span>→</span>
              <div>
                <span>R2 · после переноса</span>
                <strong>
                  {migration.carried}/{migration.newTotal} ≈ 33%
                </strong>
              </div>
              <small>
                Проценты разных планов не объединяем в одну непрерывную линию.
              </small>
            </div>
            <div className="migration-grid">
              {migrationTasks.map((t) => (
                <div key={t.id}>
                  <code>{t.id}</code>
                  <strong>{t.name}</strong>
                  <span
                    className={`badge ${t.action === "CARRY_OVER" ? "blue" : "red"}`}
                  >
                    {actions[t.action]}
                  </span>
                  <small>{t.reason}</small>
                </div>
              ))}
            </div>
            <label className="approval">
              <input
                type="checkbox"
                checked={reviewed}
                disabled={applied}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              Преподаватель разобрал ручной случай: нового зачёта пока нет
            </label>
            <button
              className="button primary"
              disabled={!reviewed || applied}
              onClick={() => setApplied(true)}
            >
              {applied
                ? "R2 создана · повтор заблокирован"
                : "Утвердить R2 — только в этом демо"}
            </button>
            {applied && (
              <div className="history-strip" role="status">
                <span>R1: 4/6 · хранится в истории</span>
                <span>R2: 2/6 · активна</span>
                <span>Аудит: решение преподавателя</span>
              </div>
            )}
            <Hint>
              В рабочей системе: транзакция + expected_revision + idempotency
              key. Старые оценки и попытки не удаляются. Аналитический перенос
              не создаёт выдуманную попытку Moodle Quiz.
            </Hint>
          </div>
        )}
      </Section>
    </>
  );
}
