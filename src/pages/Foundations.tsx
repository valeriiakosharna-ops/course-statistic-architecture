import { useEffect, useState } from "react";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";
import { vocabulary } from "../platform";
const levels = [
  ["01", "Что делает студент", "Три вида учебной работы"],
  ["02", "Как собран курс", "Активность → юнит → модуль"],
  ["03", "Что назначено", "Версия, трек и правила перехода"],
  ["04", "Что зафиксировано", "Результаты, сроки и подтверждения"],
  ["05", "Что видит преподаватель", "Всё связано в карточке"],
  ["06", "Где это существует", "Платформы — отдельная ветка понятий"],
];
export default function Foundations({ detail }: { detail: string }) {
  const [selected, setSelected] = useState("theory"),
    [view, setView] = useState("structure"),
    [search, setSearch] = useState("");
  useEffect(() => {
    const alias = detail === "learning-plan" ? "track" : detail;
    if (vocabulary.some((t) => t.id === alias)) setSelected(alias);
  }, [detail]);
  const term = vocabulary.find((t) => t.id === selected) ?? vocabulary[0];
  return (
    <>
      <Heading
        kicker="01 / СЛОВАРЬ · 22 ПОНЯТИЯ"
        title="От одного действия — к целому курсу"
        sub="Нажмите на понятие. Ниже — как содержание, назначения и результаты связаны друг с другом."
      />
      <div className="concept-levels">
        {levels.map(([n, name, sub], level) => (
          <div className="concept-level" key={n}>
            <span className="level-number">{n}</span>
            <div className="level-name">
              <strong>{name}</strong>
              <small>{sub}</small>
            </div>
            <div className="concept-chips">
              {vocabulary
                .filter(
                  (t) =>
                    t.level === level &&
                    (!search ||
                      t.name.toLowerCase().includes(search.toLowerCase())),
                )
                .map((t) => (
                  <button
                    key={t.id}
                    aria-pressed={selected === t.id}
                    onClick={() => setSelected(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="concept-inspector" aria-live="polite">
        <div>
          <span className="eyebrow">ПОНЯТИЕ</span>
          <h3>{term.name}</h3>
          <p>{term.definition}</p>
        </div>
        <div>
          <span className="eyebrow">НА ПРИМЕРЕ</span>
          <strong>{term.example}</strong>
          <small>{term.lives}</small>
        </div>
      </div>
      <label className="glossary-search">
        Найти термин{" "}
        <input
          aria-label="Найти термин"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Например: манифест"
        />
      </label>
      <Section
        number="А"
        title="Три разных отношения: состоит / назначено / выполнено"
      >
        <div className="tabs" aria-label="Связи понятий">
          {[
            ["structure", "Как собран курс"],
            ["track", "Что нужно студенту"],
            ["result", "Как появляется результат"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={view === id}
              className={view === id ? "selected" : ""}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "structure" && (
          <Graph
            title="Структура содержания · части входят в целое"
            height={410}
            selected={selected}
            onSelect={setSelected}
            zones={[
              {
                x: 10,
                y: 10,
                w: 1020,
                h: 380,
                title:
                  "GitLab материалов хранит структуру → Moodle показывает активности",
              },
            ]}
            nodes={[
              { id: "theory", x: 40, y: 80, title: "Теория", sub: "изучить" },
              {
                id: "practice",
                x: 40,
                y: 190,
                title: "Практика",
                sub: "применить",
              },
              {
                id: "test",
                x: 40,
                y: 300,
                title: "Тест",
                sub: "проверить знания",
              },
              {
                id: "activity",
                x: 315,
                y: 190,
                title: "Активность",
                sub: "один отслеживаемый шаг",
                tone: "blue",
                w: 195,
              },
              {
                id: "unit",
                x: 610,
                y: 190,
                title: "Юнит",
                sub: "несколько активностей",
              },
              {
                id: "module",
                x: 840,
                y: 190,
                title: "Модуль",
                sub: "несколько юнитов",
              },
            ]}
            edges={[
              { from: "theory", to: "activity", label: "вид" },
              { from: "practice", to: "activity", label: "вид" },
              { from: "test", to: "activity", label: "вид" },
              { from: "activity", to: "unit", label: "входит" },
              { from: "unit", to: "module", label: "входит" },
            ]}
          />
        )}
        {view === "track" && (
          <Graph
            title="Каталог шире персонального учебного трека"
            height={360}
            selected={selected}
            onSelect={setSelected}
            nodes={[
              {
                id: "version",
                x: 30,
                y: 70,
                w: 215,
                title: "Версия курса",
                sub: "каталог: 40 активностей",
              },
              {
                id: "track",
                x: 395,
                y: 70,
                w: 230,
                title: "Учебный трек",
                sub: "S-1: 30 обязательных",
                tone: "blue",
              },
              {
                id: "card",
                x: 800,
                y: 70,
                w: 210,
                title: "Карточка студента",
                sub: "v1 · трек R1 · 20/30",
                tone: "dark",
              },
              {
                id: "manifest",
                x: 395,
                y: 240,
                w: 230,
                title: "Манифест",
                sub: "переход v1 → v3",
              },
            ]}
            edges={[
              { from: "version", to: "track", label: "выбрать нужное" },
              { from: "track", to: "card", label: "назначить" },
              {
                from: "manifest",
                to: "track",
                label: "перенести при смене версии",
              },
            ]}
          />
        )}
        {view === "result" && (
          <Graph
            title="Результат и срок относятся к назначению студента"
            height={420}
            selected={selected}
            onSelect={setSelected}
            nodes={[
              {
                id: "activity",
                x: 30,
                y: 180,
                title: "Активность",
                sub: "назначена S-1",
              },
              {
                id: "attempt",
                x: 335,
                y: 60,
                title: "Попытка",
                sub: "одна сдача",
              },
              { id: "point", x: 630, y: 60, title: "Балл", sub: "8 / 10" },
              {
                id: "mr",
                x: 335,
                y: 180,
                title: "MR",
                sub: "практическое решение",
              },
              {
                id: "comment",
                x: 630,
                y: 180,
                title: "Comment",
                sub: "замечание к работе",
              },
              {
                id: "deadline",
                x: 335,
                y: 310,
                title: "Дедлайн",
                sub: "срок назначения",
              },
              {
                id: "card",
                x: 850,
                y: 180,
                w: 175,
                title: "Карточка студента",
                sub: "связи + принятый итог",
                tone: "dark",
              },
            ]}
            edges={[
              { from: "activity", to: "attempt", label: "сдать" },
              { from: "attempt", to: "point", label: "оценить" },
              { from: "activity", to: "mr", label: "подтвердить кодом" },
              { from: "mr", to: "comment", label: "обсудить" },
              { from: "activity", to: "deadline", label: "назначить срок" },
              { from: "point", to: "card", label: "учесть" },
              { from: "comment", to: "card", label: "сохранить" },
              { from: "deadline", to: "card", label: "проверить вовремя ли" },
            ]}
          />
        )}
        <div className="compact-inspector">
          <strong>{term.name}</strong>
          <span>{term.definition}</span>
        </div>
      </Section>
      <Section number="Б" title="Один учебный день — одна цепочка">
        <Flow label="От активности к статистике">
          {[
            <Block
              title="Теория → тест → практика"
              sub="Активности внутри юнита"
            />,
            <Block
              title="Трек S-1, версия v1"
              sub="Назначены именно эти активности"
              tone="blue"
            />,
            <Block title="Попытка + MR + балл" sub="Факты выполнения" />,
            <Block
              title="Карточка → LearningAtlas"
              sub="Прогресс по назначенному треку"
              tone="dark"
            />,
          ]}
        </Flow>
      </Section>
      <Hint>
        Здесь юнит — небольшая тема, модуль — набор юнитов. Балл и попытка
        описывают результат; они не являются частями учебного содержания. PR —
        термин GitHub, в двух контурах GitLab используется MR.
      </Hint>
    </>
  );
}
