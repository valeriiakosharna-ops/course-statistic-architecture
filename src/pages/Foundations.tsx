import { useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { terms } from "../data";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";
import type { GraphEdge, GraphNode } from "../components/Diagram";

const levels = [
  {
    title: "Поля — маленькие значения",
    relation: "Поля складываются в запись",
    items: [
      ["field-id", "ID"],
      ["field-time", "Время"],
      ["field-value", "Значение"],
      ["field-source", "Источник"],
    ],
  },
  {
    title: "Учебные кирпичики",
    relation: "Из них составляют требования",
    items: [
      ["content-unit", "Материал"],
      ["task", "Задача"],
      ["assessment", "Правило проверки"],
    ],
  },
  {
    title: "Записи о работе",
    relation: "Ссылаются на студента и задачу",
    items: [
      ["assignment", "Назначение"],
      ["attempt", "Попытка"],
      ["evidence", "Подтверждение"],
      ["result", "Результат"],
    ],
  },
  {
    title: "Составные учебные объекты",
    relation: "Объединяют задачи и правила",
    items: [
      ["module", "Тема / модуль"],
      ["curriculum-version", "Версия программы"],
      ["learning-plan", "План студента"],
    ],
  },
  {
    title: "Обучение в целом",
    relation: "Объединяет планы и прохождения",
    items: [
      ["program", "Программа"],
      ["learning-instance", "Прохождение"],
      ["group", "Группа"],
    ],
  },
  {
    title: "Статистика",
    relation: "Вычисляется из принятых результатов",
    items: [
      ["metric-version", "Формула"],
      ["metric-snapshot", "Снимок метрик"],
      ["provenance", "Цепочка до источника"],
    ],
  },
];
const short: Record<string, [string, string, string]> = {
  "field-id": [
    "Идентификатор",
    "ID — это метка объекта, а не его название.",
    "TASK-01",
  ],
  "field-time": [
    "Время",
    "Когда произошло действие. Время получения храним отдельно.",
    "16 октября, 12:00 UTC",
  ],
  "field-value": [
    "Значение",
    "Одно число или состояние. Нет данных и ноль различаются.",
    "8 из 10; submitted",
  ],
  "field-source": [
    "Ссылка на источник",
    "Откуда пришла запись: система + экземпляр + тип + ID.",
    "Moodle / school / quiz_attempt / 284",
  ],
  "content-unit": [
    "Материал",
    "То, что студент читает или открывает.",
    "HTML-урок про циклы",
  ],
  task: [
    "Задача",
    "Что студент должен уметь сделать.",
    "Написать цикл для обработки списка",
  ],
  assessment: [
    "Правило проверки",
    "Как понять, что задача выполнена, и сколько дать баллов.",
    "Тест: 10 баллов, зачёт от 7",
  ],
  assignment: [
    "Назначение",
    "Эта задача назначена этому студенту, с весом и сроком.",
    "Студент 01 → TASK-01 → до 20 октября",
  ],
  attempt: [
    "Попытка",
    "Одна попытка выполнить проверку.",
    "Второй запуск теста: 8 из 10",
  ],
  evidence: [
    "Подтверждение",
    "Наблюдаемый факт: попытка, оценка, ссылка или MR.",
    "MR !42 с решением задачи",
  ],
  result: [
    "Принятый результат",
    "Работа зачтена по правилу курса или решению преподавателя.",
    "Преподаватель принял TASK-01",
  ],
  module: [
    "Тема / модуль",
    "Удобная группа материалов и задач. Необязательный уровень структуры.",
    "Тема «Циклы»: урок + 3 задачи",
  ],
  "curriculum-version": [
    "Версия программы",
    "Зафиксированный состав задач, материалов и правил.",
    "Java v2: 35 обязательных задач",
  ],
  "learning-plan": [
    "План студента",
    "Какие задачи обязательны именно этому студенту.",
    "У группы A — 30 задач, у B — 35",
  ],
  program: [
    "Программа",
    "Учебный продукт, у которого могут быть разные выпуски.",
    "«Основы ИИ», версии v1–v5",
  ],
  "learning-instance": [
    "Прохождение",
    "Одна попытка студента пройти программу по своему плану.",
    "Первый старт → план R1 → завершение",
  ],
  group: [
    "Группа",
    "Студенты с общими назначениями. Личные исключения остаются в плане.",
    "Группа Java A",
  ],
  "metric-version": [
    "Формула",
    "Точное правило расчёта показателя.",
    "Принятый обязательный вес ÷ весь обязательный вес",
  ],
  "metric-snapshot": [
    "Снимок метрик",
    "Результат расчёта на дату с версией плана и формулы.",
    "60% на 16 октября по R1",
  ],
  provenance: [
    "Цепочка до источника",
    "Возможность пройти от процента до исходной записи.",
    "60% → 18 задач → решения → оценки / MR",
  ],
};
const contentNodes: GraphNode[] = [
  {
    id: "content-unit",
    x: 25,
    y: 72,
    title: "Материал",
    sub: "что изучить",
    tone: "blue",
  },
  {
    id: "task",
    x: 25,
    y: 190,
    title: "Задача",
    sub: "что сделать",
    tone: "blue",
  },
  {
    id: "assessment",
    x: 25,
    y: 308,
    title: "Правило проверки",
    sub: "как зачесть",
    tone: "red",
  },
  {
    id: "module",
    x: 310,
    y: 190,
    title: "Тема / модуль",
    sub: "группа учебных единиц",
  },
  {
    id: "curriculum-version",
    x: 590,
    y: 190,
    title: "Версия программы",
    sub: "неизменяемый состав",
    w: 190,
    tone: "blue",
  },
  {
    id: "program",
    x: 845,
    y: 60,
    title: "Программа",
    sub: "все её выпуски",
    w: 170,
    tone: "dark",
  },
  {
    id: "learning-plan",
    x: 830,
    y: 315,
    title: "План студента",
    sub: "обязательства + сроки",
    w: 185,
    tone: "red",
  },
];
const contentEdges: GraphEdge[] = [
  { from: "content-unit", to: "module", label: "входит в" },
  { from: "task", to: "module", label: "входит в" },
  { from: "assessment", to: "task", label: "проверяет" },
  { from: "module", to: "curriculum-version", label: "входит в" },
  { from: "program", to: "curriculum-version", label: "выпускает" },
  { from: "curriculum-version", to: "learning-plan", label: "задаёт основу" },
];
const factNodes: GraphNode[] = [
  {
    id: "task",
    x: 20,
    y: 45,
    title: "Задача",
    sub: "постоянный ID",
    w: 170,
    tone: "blue",
  },
  {
    id: "assignment",
    x: 275,
    y: 45,
    title: "Назначение",
    sub: "задача + студент + срок",
    w: 205,
    tone: "blue",
  },
  {
    id: "learning-plan",
    x: 570,
    y: 45,
    title: "План студента",
    sub: "содержит назначения",
    w: 205,
    tone: "dark",
  },
  {
    id: "attempt",
    x: 20,
    y: 245,
    title: "Попытка / сдача",
    sub: "студент сделал действие",
    w: 190,
  },
  {
    id: "evidence",
    x: 290,
    y: 245,
    title: "Подтверждение",
    sub: "запись из источника",
    w: 190,
  },
  {
    id: "result",
    x: 575,
    y: 245,
    title: "Принятый результат",
    sub: "проверка по правилам",
    w: 200,
    tone: "red",
  },
  {
    id: "metric-snapshot",
    x: 850,
    y: 245,
    title: "Статистика",
    sub: "по своему плану",
    w: 170,
    tone: "blue",
  },
];
const factEdges: GraphEdge[] = [
  { from: "task", to: "assignment", label: "назначили" },
  { from: "assignment", to: "learning-plan", label: "входит в" },
  { from: "attempt", to: "evidence", label: "фиксируется" },
  { from: "evidence", to: "result", label: "правило / учитель" },
  { from: "assignment", to: "evidence", label: "связываем", dashed: true },
  {
    from: "learning-plan",
    to: "result",
    label: "применимые задачи",
    dashed: true,
  },
  { from: "result", to: "metric-snapshot", label: "считаем" },
];
export default function Foundations({ detail }: { detail: string }) {
  const [selected, setSelected] = useState(detail || "task");
  useEffect(() => {
    if (detail) setSelected(detail);
  }, [detail]);
  const [tab, setTab] = useState<"content" | "facts">("content");
  const [query, setQuery] = useState("");
  const known = terms.find((t) => t.id === selected);
  const entry =
    short[selected] ??
    (known ? [known.name, known.definition, known.example] : short.task);
  return (
    <>
      <Heading
        kicker="01 / ОТ АТОМОВ К СИСТЕМЕ"
        title="Из чего складывается учебная статистика"
        sub="Нажимайте на понятия. Стрелки объясняют связи, а подписи — смысл."
      />
      <div className="atom-strip">
        <span className="eyebrow">Самый маленький уровень — поле</span>
        <div>
          {levels[0].items.map(([id, name]) => (
            <button
              key={id}
              className={selected === id ? "selected" : ""}
              onClick={() => setSelected(id)}
            >
              {name}
              <small>
                {id === "field-id"
                  ? "TASK-01"
                  : id === "field-time"
                    ? "12:00 UTC"
                    : id === "field-value"
                      ? "8 / 10"
                      : "Moodle"}
              </small>
            </button>
          ))}
        </div>
        <ArrowRight size={20} />
        <span className="record-example">
          Запись попытки<code>кто · задача · время · балл · источник</code>
        </span>
      </div>
      <Section number="А" title="Кирпичики → составные объекты">
        <div className="concept-levels">
          {levels.slice(1).map((level, i) => (
            <div className="concept-level" key={level.title}>
              <span className="level-number">{i + 1}</span>
              <div className="level-name">
                <strong>{level.title}</strong>
                <small>{level.relation}</small>
              </div>
              <div className="concept-chips">
                {level.items.map(([id, name]) => (
                  <button
                    aria-pressed={selected === id}
                    className={selected === id ? "selected" : ""}
                    key={id}
                    onClick={() => setSelected(id)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="concept-inspector" aria-live="polite">
          <div>
            <span className="eyebrow">ВЫБРАННОЕ ПОНЯТИЕ</span>
            <h3>{entry[0]}</h3>
            <p>{entry[1]}</p>
          </div>
          <div>
            <span className="eyebrow">НА ПРИМЕРЕ</span>
            <strong>{entry[2]}</strong>
          </div>
        </div>
      </Section>
      <Section number="Б" title="Как понятия связаны">
        <div className="tabs" aria-label="Тип связей">
          <button
            className={tab === "content" ? "selected" : ""}
            aria-pressed={tab === "content"}
            onClick={() => setTab("content")}
          >
            Что входит в курс
          </button>
          <button
            className={tab === "facts" ? "selected" : ""}
            aria-pressed={tab === "facts"}
            onClick={() => setTab("facts")}
          >
            Как появляется результат
          </button>
        </div>
        <Graph
          title={
            tab === "content"
              ? "Учебная структура: «входит в» и «ссылается на»"
              : "Назначения и факты — разные ветки"
          }
          nodes={tab === "content" ? contentNodes : factNodes}
          edges={tab === "content" ? contentEdges : factEdges}
          height={tab === "content" ? 420 : 380}
          selected={selected}
          onSelect={setSelected}
        />
        <div className="compact-inspector">
          <strong>{entry[0]}</strong>
          <span>{entry[1]}</span>
        </div>
        <Hint>
          План содержит требования. Подтверждения связаны с требованиями.
          Принятый результат получается после проверки — это не простая сумма
          событий.
        </Hint>
      </Section>
      <Section number="В" title="Один пример целиком">
        <Flow label="Как получается 60%">
          {[
            <Block title="Задача на цикл" sub="Учебный кирпичик" />,
            <Block title="Назначили 30 задач" sub="Личный план R1" />,
            <Block
              title="18 работ приняты"
              sub="Не просто отправлены"
              tone="red"
            />,
            <Block
              title="18 ÷ 30 = 60%"
              sub="Каждый вес равен 1"
              tone="blue"
            />,
          ]}
        </Flow>
      </Section>
      <details className="reference">
        <summary>Технический словарь · {terms.length} понятий</summary>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Поиск технического понятия"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Термин на русском или английском"
          />
        </label>
        <div className="concept-chips">
          {terms
            .filter((t) =>
              `${t.name} ${t.en}`.toLowerCase().includes(query.toLowerCase()),
            )
            .map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                aria-pressed={selected === t.id}
              >
                {t.name}
              </button>
            ))}
        </div>
        <div className="compact-inspector">
          <strong>{entry[0]}</strong>
          <span>{entry[1]}</span>
        </div>
      </details>
    </>
  );
}
