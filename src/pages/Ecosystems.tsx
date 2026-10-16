import { useState } from "react";
import type { CourseMode } from "../lab";
import { modes } from "../lab";
import {
  Block,
  Flow,
  Graph,
  Heading,
  Hint,
  Section,
} from "../components/Diagram";
import type { GraphNode } from "../components/Diagram";

const details: Record<string, [string, string, string]> = {
  moodle: [
    "Moodle · обучение",
    "Курс, аккаунты, тесты, gradebook, попытки.",
    "Права чтения + проверка доступных API и плагинов.",
  ],
  content: [
    "GitLab · материалы",
    "AsciiDoc, HTML-исходники, commit SHA, CI-сборка.",
    "Исходники собираются в неизменяемый HTML-артефакт.",
  ],
  work: [
    "GitLab · работы",
    "Репозиторий студента, MR, diff, review.",
    "API + submitted URL из Moodle; merge не означает зачёт.",
  ],
  sheets: [
    "Sheets · проект плана",
    "task_id, группа, обязательность, вес, срок, часовой пояс.",
    "Импорт создаёт предложение. Преподаватель утверждает новую ревизию.",
  ],
  collector: [
    "Коннекторы · чтение",
    "Moodle / GitLab / Sheets → JSON; CSV — ручной импорт.",
    "Плановое чтение 1–2 раза в сутки. Webhook только ускоряет сверку.",
  ],
  registry: [
    "Наш реестр · учебный смысл",
    "ID-связи, каталог задач, версии, планы, результаты.",
    "Именно здесь фиксируется, что должен выполнить каждый студент.",
  ],
  stats: [
    "Аналитика · вычисления",
    "Формула + свой план + принятые результаты.",
    "Снимок с датой и ссылками на исходные подтверждения.",
  ],
  storage: [
    "Хранилище контента",
    "HTML + ресурсы + версия + SHA-256.",
    "Хеш подтверждает неизменность. Доступ приватного контента проверяется отдельно.",
  ],
  plugin: [
    "Moodle · плагин запуска",
    "Проверенная Moodle-сессия → резолвер → точный HTML.",
    "Нужна отдельная доработка для доставки разных версий одному курсу.",
  ],
};
export default function Ecosystems({ mode }: { mode: CourseMode }) {
  const [selected, setSelected] = useState("registry");
  const hasContent = mode === "ai",
    hasWork = mode === "java",
    hasSheet = mode === "java" || mode === "sheets";
  const nodes: GraphNode[] = [
    {
      id: "moodle",
      x: 35,
      y: 80,
      w: 205,
      title: "Moodle",
      sub: "студенты · оценки · тесты",
      tone: "blue",
    },
    {
      id: "content",
      x: 35,
      y: 190,
      w: 205,
      title: "GitLab · материалы",
      sub: hasContent ? "AsciiDoc → CI → HTML" : "не нужен этому сценарию",
      inactive: !hasContent,
    },
    {
      id: "work",
      x: 35,
      y: 300,
      w: 205,
      title: "GitLab · работы",
      sub: hasWork ? "MR · файлы · review" : "не нужен этому сценарию",
      inactive: !hasWork,
    },
    {
      id: "sheets",
      x: 35,
      y: 410,
      w: 205,
      title: "Google Sheets",
      sub: hasSheet ? "задачи · группы · сроки" : "не нужен этому сценарию",
      inactive: !hasSheet,
    },
    {
      id: "collector",
      x: 355,
      y: 300,
      w: 205,
      title: "Коннекторы",
      sub: "только чтение источников",
      tone: "blue",
    },
    {
      id: "registry",
      x: 655,
      y: 300,
      w: 195,
      title: "Учебный реестр",
      sub: "связи · планы · результаты",
      tone: "dark",
    },
    {
      id: "stats",
      x: 655,
      y: 450,
      w: 195,
      title: "Статистика",
      sub: "студент / группа",
      tone: "red",
    },
    {
      id: "storage",
      x: 355,
      y: 85,
      w: 205,
      title: "Версионный HTML",
      sub: "артефакт + хеш",
      inactive: !hasContent,
    },
    {
      id: "plugin",
      x: 655,
      y: 85,
      w: 195,
      title: "Moodle · запуск",
      sub: hasContent ? "свой артефакт по плану" : "обычные активности",
      tone: "blue",
    },
  ];
  const edges = [
    { from: "moodle", to: "collector", label: "API: результаты" },
    ...(hasWork
      ? [{ from: "work", to: "collector", label: "API: MR / review" }]
      : []),
    ...(hasSheet
      ? [{ from: "sheets", to: "collector", label: "API / CSV: план" }]
      : []),
    ...(hasContent
      ? [
          { from: "content", to: "storage", label: "CI: сборка" },
          { from: "storage", to: "plugin", label: "точный артефакт" },
          {
            from: "registry",
            to: "plugin",
            label: "закреплённая версия",
            dashed: true,
          },
        ]
      : []),
    { from: "collector", to: "registry", label: "сохранить и связать" },
    { from: "registry", to: "stats", label: "рассчитать" },
  ];
  const info = details[selected];
  return (
    <>
      <Heading
        kicker="02 / КАРТА ЭКОСИСТЕМ"
        title="Что где живёт и кто с кем связан"
        sub={`Выбран ${modes.find((m) => m.id === mode)?.label}. Пунктирные блоки не нужны этому сценарию.`}
      />
      <Graph
        title="Граница источников, нашего ядра и доставки контента"
        nodes={nodes}
        edges={edges}
        selected={selected}
        onSelect={setSelected}
        height={570}
        zones={[
          { x: 15, y: 15, w: 245, h: 500, title: "Существующие системы" },
          {
            x: 320,
            y: 230,
            w: 560,
            h: 315,
            title: "Новое аналитическое ядро",
            sub: "только чтение · Moodle продолжает обучать",
          },
          {
            x: 320,
            y: 15,
            w: 560,
            h: 165,
            title: "Доставка контента",
            sub: "отдельный этап · не блокирует первые метрики",
          },
        ]}
      />
      <div className="concept-inspector" aria-live="polite">
        <div>
          <span className="eyebrow">
            {nodes.find((n) => n.id === selected)?.inactive
              ? "ОПЦИОНАЛЬНЫЙ БЛОК"
              : "ВЫБРАННАЯ СИСТЕМА"}
          </span>
          <h3>{info[0]}</h3>
          <p>{info[1]}</p>
        </div>
        <div>
          <span className="eyebrow">ЗА СЧЁТ ЧЕГО РАБОТАЕТ</span>
          <strong>{info[2]}</strong>
        </div>
      </div>
      <Section number="А" title="Кто за что отвечает">
        <div className="ownership-grid">
          <Block
            title="Moodle"
            sub="Где учатся и получают оценки"
            tone="blue"
          />
          <Block
            title="GitLab"
            sub={hasContent ? "Где создают материалы" : "Где хранят код и MR"}
          />
          <Block title="Sheets" sub="Где предлагают назначения" />
          <Block
            title="Наш реестр"
            sub="Где утверждён личный план"
            tone="dark"
          />
        </div>
        <Hint>
          Курс Moodle — контейнер активностей. Программа — учебный продукт. План
          — обязательства конкретного студента. Это три разных объекта.
        </Hint>
      </Section>
      <Section number="Б" title="Один человек в разных системах">
        <Flow label="Связывание аккаунтов">
          {[
            <Block
              title="Moodle user 104"
              sub="Главный учебный аккаунт"
              tone="blue"
            />,
            <Block
              title="Внутренний S-1"
              sub="Проверенная таблица связей"
              tone="dark"
            />,
            <Block title="GitLab user 52" sub="Аккаунт для MR" />,
          ]}
        </Flow>
        <Hint>
          Email помогает предложить совпадение. Подтверждённый source ID
          связывает аккаунты; email из URL не даёт доступ к данным.
        </Hint>
      </Section>
      <div className="next-page">
        <a href="#data">Теперь проследим путь одной записи →</a>
      </div>
    </>
  );
}
