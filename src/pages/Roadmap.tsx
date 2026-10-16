import { useState } from "react";
import { stages } from "../data";
import { Block, Flow, Heading, Hint, Section } from "../components/Diagram";
const captions = [
  [
    "Проверенные примеры",
    "Что доступно в API?",
    "Объясним план и оценку одного студента",
  ],
  [
    "Надёжный сбор",
    "Источники → raw → реестр",
    "Повторная загрузка не создаёт дубли",
  ],
  [
    "Личная статистика",
    "План → принятые результаты → %",
    "Новый релиз не меняет старый знаменатель",
  ],
  [
    "Статистика групп",
    "Sheets + Moodle + MR",
    "Merge и связь с задачей ещё не зачёт",
  ],
  [
    "Версионный HTML",
    "CI → артефакты → резолвер",
    "Каждый открывает свою закреплённую версию",
  ],
  ["Миграции", "Сравнить → утвердить → R2", "История R1 и оценок сохраняется"],
  [
    "Помощь AI",
    "Предложение → проверка человеком",
    "Качество проверено на размеченных случаях",
  ],
  [
    "Новые источники",
    "Новый адаптер → прежняя модель",
    "Смысл действующих метрик не меняется",
  ],
];
export default function Roadmap() {
  const [selected, setSelected] = useState(2);
  const stage = stages[selected];
  return (
    <>
      <Heading
        kicker="06 / ОТ ПРОСТОГО К СЛОЖНОМУ"
        title="Как растёт статистика"
        sub="Каждый шаг добавляет одну проверяемую возможность."
      />
      <div className="mvp-staircase">
        {stages.map((s, i) => (
          <button
            key={s.id}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            className={selected === i ? "selected" : ""}
          >
            <span>{String(i).padStart(2, "0")}</span>
            <div>
              <small>{s.kind}</small>
              <strong>{captions[i][0]}</strong>
              <span>{captions[i][1]}</span>
            </div>
            <span className="mvp-complexity">
              {"●".repeat(s.effort)}
              {"○".repeat(5 - s.effort)}
            </span>
          </button>
        ))}
      </div>
      <Section number={String(selected).padStart(2, "0")} title={stage.title}>
        <Flow label="Результат выбранного этапа">
          {[
            <Block title="Добавляем" sub={captions[selected][1]} />,
            <Block
              title="Теперь видно"
              sub={stage.metrics.join(" · ")}
              tone="blue"
            />,
            <Block
              title="Можно идти дальше"
              sub={captions[selected][2]}
              tone="dark"
            />,
          ]}
        </Flow>
        <div className="compact-inspector">
          <strong>Зависимости</strong>
          <span>{stage.dependency}</span>
        </div>
      </Section>
      <Section number="↗" title="Два параллельных потока">
        <Flow label="Аналитика и доставка контента">
          {[
            <Block title="Сбор → личная статистика" sub="Этапы 0–2" />,
            <Block title="Группы и MR" sub="Этап 3" tone="blue" />,
            <Block title="Миграции и расширение" sub="Этапы 5–7" />,
          ]}
        </Flow>
        <div className="parallel-lane">
          <span>Отдельно</span>
          <strong>GitLab → манифест → версионный HTML → Moodle</strong>
          <small>Этап 4. Не блокирует первые дашборды.</small>
        </div>
      </Section>
      <Hint>
        AI и Discord не нужны первым MVP. Сложность качественная; сроки и бюджет
        определяются после обследования.
      </Hint>
    </>
  );
}
