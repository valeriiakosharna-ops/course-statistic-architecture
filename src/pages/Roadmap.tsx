import { useState } from "react";
import { Block, Flow, Heading, Hint, Section } from "../components/Diagram";
const stages = [
  {
    name: "Надёжная основа",
    flow: "GitLab материалов + Moodle → БД",
    title: "MVP 1 · Версия и личная карточка",
    metrics: "Теория, тесты, попытки, баллы, личный прогресс",
    check:
      "Первая активность закрепляет тег; повторная загрузка не удваивает результат",
    adds: "Стабильные ID, манифест, личный трек, исходники и история",
    complexity: 1,
  },
  {
    name: "Треки и группы",
    flow: "Sheets → назначения и сроки → БД",
    title: "MVP 2 · Разные обязательства и дедлайны",
    metrics:
      "Студент / группа / курс; сдачи в срок, просрочка, покрытие оценок",
    check: "Групповой шаблон и личное исключение дают объяснимый знаменатель",
    adds: "Табличные назначения, правила приоритета, ручное управление в LearningAtlas",
    complexity: 2,
  },
  {
    name: "Практика в GitLab",
    flow: "MR + CI + review → подтверждения",
    title: "MVP 3 · Практические работы и проверка",
    metrics:
      "Сдано / на review / принято; замечания и активность в репозитории",
    check: "Несколько MR одной задачи не создают несколько зачётов",
    adds: "Связь задач с MR и коммитами, автоматические тесты, отдельное решение о зачёте",
    complexity: 3,
  },
  {
    name: "Уточнения Discord",
    flow: "Сообщение → кандидат → решение → БД",
    title: "MVP 4 · Все семь систем в одном контуре",
    metrics:
      "Актуальные сроки, история уточнений, конфликты и свежесть источников",
    check:
      "Перенос срока имеет автора, цитату, область действия и подтверждённое основание",
    adds: "Discord-бот, структурированные команды; ИИ для свободного текста",
    complexity: 3,
  },
  {
    name: "Миграции",
    flow: "Манифест → предпросмотр → решение",
    title: "MVP 5 · Контролируемые миграции",
    metrics:
      "Критически устаревшие версии, покрытие новым курсом, новые обязательства",
    check:
      "Старая история воспроизводима; сбой GitLab не отменяет решение в БД",
    adds: "Ручной переход, перезачёт, очередь доставки и точная сборка в Moodle",
    complexity: 4,
  },
  {
    name: "Управляемая автоматика",
    flow: "Политика → job → аудит результата",
    title: "MVP 6 · Автотреки, автопереходы и помощь ИИ",
    metrics:
      "Решения по правилам, исключения для преподавателя, качество AI-review",
    check: "Неполный манифест или неясный результат идут на сверку",
    adds: "Настраиваемый автоматический перенос, Claude Code по рубрике, мониторинг качества",
    complexity: 5,
  },
];
export default function Roadmap() {
  const [selected, setSelected] = useState(0);
  const s = stages[selected];
  return (
    <>
      <Heading
        kicker="06 / ПОСТЕПЕННОЕ НАПОЛНЕНИЕ"
        title="От личного прогресса к управлению обучением"
        sub="Каждая версия сохраняет предыдущие возможности и добавляет следующий источник или уровень автоматизации."
      />
      <div className="mvp-staircase">
        {stages.map((item, i) => (
          <button
            key={item.name}
            aria-pressed={selected === i}
            className={selected === i ? "selected" : ""}
            onClick={() => setSelected(i)}
          >
            <span>{i + 1}</span>
            <div>
              <small>MVP {i + 1}</small>
              <strong>{item.name}</strong>
              <span>{item.flow}</span>
            </div>
            <span
              className="mvp-complexity"
              aria-label={`Сложность ${item.complexity} из 5`}
            >
              {"●".repeat(item.complexity)}
              {"○".repeat(5 - item.complexity)}
            </span>
          </button>
        ))}
      </div>
      <Section number={`0${selected + 1}`} title={s.title}>
        <Flow label="Результат выбранного MVP">
          {[
            <Block title="Добавляем" sub={s.adds} />,
            <Block title="Теперь видно" sub={s.metrics} tone="blue" />,
            <Block title="Критерий готовности" sub={s.check} tone="dark" />,
          ]}
        </Flow>
      </Section>
      <Section number="↗" title="Два конвейера развиваются вместе">
        <div className="architecture-pair">
          <div>
            <span className="eyebrow">УЧЕБНЫЕ ДАННЫЕ</span>
            <Flow label="Развитие статистики">
              {[
                <Block
                  title="Moodle → Sheets → GitLab → Discord"
                  sub="Общий формат карточки с первого MVP"
                />,
                <Block
                  title="БД → LearningAtlas"
                  sub="Студент, затем группа и весь курс"
                  tone="dark"
                />,
              ]}
            </Flow>
          </div>
          <div>
            <span className="eyebrow">ВЕРСИИ И УПРАВЛЕНИЕ</span>
            <Flow label="Развитие версионирования">
              {[
                <Block
                  title="Теги + закрепления с MVP 1"
                  sub="Каталог и история сразу версионируются"
                />,
                <Block
                  title="Ручной → автоматический перенос"
                  sub="MVP 5–6: по утверждённой карте манифеста"
                  tone="blue"
                />,
              ]}
            </Flow>
          </div>
        </div>
      </Section>
      <Hint>
        Семь систем — целевая архитектура. Подключения включаются по типу курса:
        для курса без кода не нужен поток студенческих MR. Discord остаётся
        частью модели; на первом этапе уточнения можно вводить через
        LearningAtlas вручную со ссылкой на сообщение. Сложность относительная,
        без обещаний по срокам.
      </Hint>
    </>
  );
}
