import { useState } from "react";
import type { CourseMode } from "../lab";
import { systems, type SystemId } from "../platform";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
  type GraphEdge,
} from "../components/Diagram";
const optional = (mode: CourseMode, id: SystemId) =>
  id === "work"
    ? mode !== "java"
    : id === "sheets" || id === "discord"
      ? mode !== "java" && mode !== "sheets"
      : false;
export default function Ecosystems({ mode }: { mode: CourseMode }) {
  const [selected, setSelected] = useState<SystemId>("db"),
    [layer, setLayer] = useState("facts");
  const system = systems.find((s) => s.id === selected)!;
  const edges: GraphEdge[] =
    layer === "facts"
      ? [
          ...(
            ["materials", "moodle", "work", "sheets", "discord"] as SystemId[]
          ).map((id) => ({
            from: id,
            to: "db",
            label:
              id === "materials"
                ? "версии + манифест"
                : id === "sheets"
                  ? "трек / срок / оценка"
                  : id === "discord"
                    ? "уточнение + автор"
                    : id === "work"
                      ? "код / MR / review"
                      : "попытки / завершения",
            dashed: optional(mode, id),
          })),
          { from: "db", to: "atlas", label: "карточки и метрики" },
        ]
      : layer === "versions"
        ? [
            { from: "atlas", to: "db", label: "решение о переходе" },
            { from: "db", to: "materials", label: "копия закреплений" },
            { from: "db", to: "moodle", label: "версия студента" },
          ]
        : [
            { from: "sheets", to: "db", label: "назначения группы" },
            { from: "discord", to: "db", label: "кандидат уточнения" },
            { from: "atlas", to: "db", label: "утвердить / правило" },
            { from: "db", to: "moodle", label: "личный трек" },
          ];
  return (
    <>
      <Heading
        kicker="02 / РОВНО СЕМЬ СИСТЕМ"
        title="У каждой системы — своя роль"
        sub="Пять источников → одна карточка в БД → LearningAtlas. Переключайте слой и нажимайте на блоки."
      />
      <div className="tabs" aria-label="Слой архитектуры">
        {[
          ["facts", "Сбор статистики"],
          ["versions", "Смена версии"],
          ["tracks", "Назначение трека"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={layer === id ? "selected" : ""}
            aria-pressed={layer === id}
            onClick={() => setLayer(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <Graph
        title="Семь систем · стрелка показывает, куда передаются данные"
        height={700}
        selected={selected}
        onSelect={(id) => setSelected(id as SystemId)}
        zones={[
          {
            x: 10,
            y: 10,
            w: 330,
            h: 675,
            title: "Источники учебных данных",
            sub: "Не все нужны каждому типу курса",
          },
          {
            x: 480,
            y: 230,
            w: 290,
            h: 230,
            title: "Агрегация и классификация",
          },
          { x: 815, y: 230, w: 215, h: 230, title: "Отчёты и решения" },
        ]}
        nodes={systems.map((s) => {
          const index = [
            "materials",
            "moodle",
            "work",
            "sheets",
            "discord",
          ].indexOf(s.id);
          return {
            id: s.id,
            x: s.id === "db" ? 505 : s.id === "atlas" ? 835 : 40,
            y: index >= 0 ? 75 + index * 120 : 310,
            w: s.id === "db" ? 240 : s.id === "atlas" ? 175 : 265,
            title: s.title,
            sub: s.role,
            tone:
              s.id === "db"
                ? ("dark" as const)
                : s.id === "atlas"
                  ? ("red" as const)
                  : ("blue" as const),
            inactive: optional(mode, s.id),
          };
        })}
        edges={edges}
      />
      <div className="concept-inspector" aria-live="polite">
        <div>
          <span className="eyebrow">
            {optional(mode, selected)
              ? "ДЛЯ ЭТОГО ТИПА КУРСА НЕ ПОДКЛЮЧЕНО"
              : "РОЛЬ СИСТЕМЫ"}
          </span>
          <h3>{system.title}</h3>
          <p>{system.owns}</p>
        </div>
        <div>
          <span className="eyebrow">КАК ПОЛУЧАЕМ ДАННЫЕ</span>
          <strong>{system.format}</strong>
          <small>{system.method}</small>
        </div>
      </div>
      <Section
        number="А"
        title="Первый вход в активность: закрепить и показать"
      >
        <Flow label="Закрепление версии при первой активности">
          {[
            <Block title="Moodle" sub="Проверенный user_id + course_id" />,
            <Block
              title="БД: создать закрепление"
              sub="Последний опубликованный тег; один раз"
              tone="dark"
            />,
            <Block
              title="GitLab материалов"
              sub="Копия user → tag из очереди БД"
            />,
            <Block
              title="Moodle открывает сборку"
              sub="Плагин / сервис выбирает точный тег"
              tone="blue"
            />,
          ]}
        </Flow>
        <Hint>
          Сборка по тегу не определяет пользователя сама. Moodle передаёт
          проверенный контекст, компонент доставки читает закрепление в БД и
          отдаёт нужный HTML. Защищённый файл закреплений в GitLab — проекция
          БД; при задержке синхронизации работает закрепление из БД.
        </Hint>
      </Section>
      <Section
        number="Б"
        title="Новый релиз: сравнить, принять решение, синхронизировать"
      >
        <Flow label="Переход между версиями">
          {[
            <Block
              title="GitLab: новый тег"
              sub="CI проверил сборку и манифест"
            />,
            <Block
              title="Job в контуре БД"
              sub="Сравнить v студента с правилами манифеста"
            />,
            <Block
              title="LearningAtlas"
              sub="Критично → вручную или автополитика"
              tone="red"
            />,
            <Block
              title="БД → GitLab + Moodle"
              sub="Новая версия, трек, перенос и история"
              tone="dark"
            />,
          ]}
        </Flow>
      </Section>
      <Section
        number="В"
        title="Трек задаёт обязательства; источники подтверждают выполнение"
      >
        <div className="architecture-pair">
          <div>
            <span className="eyebrow">ЧТО НУЖНО СДЕЛАТЬ</span>
            <Flow label="Назначения">
              {[
                <Block
                  title="Sheets / LearningAtlas"
                  sub="Группа или личное назначение"
                />,
                <Block
                  title="БД: трек R2"
                  sub="Кто · что · к какому сроку"
                  tone="blue"
                />,
              ]}
            </Flow>
          </div>
          <div>
            <span className="eyebrow">ЧТО УЖЕ СДЕЛАНО</span>
            <Flow label="Результаты">
              {[
                <Block
                  title="Moodle / GitLab"
                  sub="Попытки, MR, подтверждения"
                />,
                <Block
                  title="БД: принятый итог"
                  sub="По правилам этого курса"
                  tone="dark"
                />,
              ]}
            </Flow>
          </div>
        </div>
        <Hint>
          Discord уточняет условия. Сообщение сначала связывается с автором,
          группой и заданием; затем применяется подтверждённое изменение. CI,
          jobs, бот и компонент доставки — части этих семи систем, а не
          дополнительные глобальные системы.
        </Hint>
      </Section>
    </>
  );
}
