import {
  learnersFor,
  type CourseMode,
  type Learner,
  type StudentTask,
} from "./lab";

export const latestVersion = 3;
export type SystemId =
  "materials" | "moodle" | "work" | "sheets" | "discord" | "db" | "atlas";
export const systems: {
  id: SystemId;
  title: string;
  role: string;
  format: string;
  method: string;
  owns: string;
}[] = [
  {
    id: "materials",
    title: "GitLab · материалы",
    role: "Теги, сборки, манифест",
    format: "Git tag + commit SHA · manifest.json · HTML",
    method:
      "CI проверяет манифест → собирает неизменяемый артефакт; job читает релизы",
    owns: "Содержание и совместимость версий. Закрепления студентов — защищённая копия из БД.",
  },
  {
    id: "moodle",
    title: "Moodle",
    role: "Учёба и первая активность",
    format: "Web Services JSON · события плагина · ссылки",
    method:
      "Плагин фиксирует старт; API/job забирает попытки, баллы и завершения",
    owns: "Попытки тестов, завершения теории, сдачи ссылок на практику.",
  },
  {
    id: "work",
    title: "GitLab · студенты",
    role: "Код, MR, проверки, Comment",
    format: "REST JSON · webhook · diff · CI-результат",
    method:
      "Webhook ускоряет доставку; регулярная сверка API восполняет пропуски",
    owns: "Код и review. Merge сам по себе не равен зачёту задания.",
  },
  {
    id: "sheets",
    title: "Google Spreadsheet",
    role: "Назначения, сроки, оценки",
    format: "Sheets API: строки → типизированный JSON · CSV",
    method: "Job читает диапазон со стабильным row_id; сверяет хеш строки",
    owns: "Утверждённые строки: student/group, activity_id, deadline, grade, revision.",
  },
  {
    id: "discord",
    title: "Discord",
    role: "Уточнения по заданиям и срокам",
    format: "message_id · channel_id · автор · текст · edited_at",
    method: "Бот: Gateway-события + REST-сверка доступных учебных каналов",
    owns: "Исходное сообщение и кандидат уточнения. Право автора и правило курса проверяются отдельно.",
  },
  {
    id: "db",
    title: "База Данных",
    role: "Единая карточка студента",
    format: "raw → факты → назначения → карточки → снимки",
    method:
      "Транзакции, уникальные ключи, история и очередь доставки изменений",
    owns: "Закреплённая версия, действующий трек, решения, связи и расчётный прогресс.",
  },
  {
    id: "atlas",
    title: "LearningAtlas",
    role: "Статистика и решения",
    format: "API карточек · команды с revision и request_id",
    method: "Студент / группа / курс; ручное решение или настроенное правило",
    owns: "Интерфейс решения. Сохраняет команду в БД, не ведёт отдельную копию истины.",
  },
];

export type Term = {
  id: string;
  name: string;
  definition: string;
  example: string;
  level: number;
  lives: string;
};
export const vocabulary: Term[] = [
  {
    id: "theory",
    name: "Теория",
    definition: "Материал, который нужно изучить.",
    example: "Прочитать объяснение циклов.",
    level: 0,
    lives: "GitLab материалов → Moodle",
  },
  {
    id: "practice",
    name: "Практика",
    definition: "Задание, в котором студент применяет знания.",
    example: "Написать программу и сдать ссылку.",
    level: 0,
    lives: "Moodle + GitLab студентов",
  },
  {
    id: "test",
    name: "Тест",
    definition: "Проверка знаний с вопросами и правилами оценки.",
    example: "5 вопросов, максимум 10 баллов.",
    level: 0,
    lives: "Moodle",
  },
  {
    id: "activity",
    name: "Активность",
    definition:
      "Отдельное отслеживаемое действие в курсе: теория, практика или тест.",
    example: "activity_id=TASK-03; вид=тест.",
    level: 1,
    lives: "Moodle ↔ карточка в БД",
  },
  {
    id: "unit",
    name: "Юнит",
    definition: "Небольшая тема, объединяющая несколько активностей.",
    example: "«Циклы»: теория + тест + практика.",
    level: 1,
    lives: "Структура курса в GitLab и Moodle",
  },
  {
    id: "module",
    name: "Модуль",
    definition: "Раздел курса, состоящий из юнитов.",
    example: "«Основы программирования»: 4 юнита.",
    level: 1,
    lives: "Структура курса в GitLab и Moodle",
  },
  {
    id: "version",
    name: "Версия курса",
    definition: "Зафиксированная сборка содержания и правил курса по тегу.",
    example: "course-v3 → commit SHA → HTML + манифест.",
    level: 2,
    lives: "GitLab материалов; закрепление — в БД",
  },
  {
    id: "track",
    name: "Учебный трек",
    definition:
      "Конкретный набор обязательных активностей студента, их сроки и правила.",
    example: "Из каталога 40 активностей назначены 30.",
    level: 2,
    lives: "Sheets / LearningAtlas → БД → Moodle",
  },
  {
    id: "manifest",
    name: "Манифест",
    definition:
      "Правила перехода между версиями: что зачесть, дополнить, повторить или назначить впервые.",
    example: "v1 → v3: TASK-01 зачесть, TASK-03 повторить.",
    level: 2,
    lives: "Версионируемый файл в GitLab материалов",
  },
  {
    id: "attempt",
    name: "Попытка",
    definition: "Одна сдача теста или задания; не обязательно успешная.",
    example: "Попытка №2, 8 из 10; политика выбирает лучшую.",
    level: 3,
    lives: "Moodle; практические сдачи — также GitLab",
  },
  {
    id: "point",
    name: "Балл",
    definition: "Численная оценка с максимумом и правилом выставления.",
    example: "8 / 10 по рубрике assessment@1.",
    level: 3,
    lives: "Moodle / утверждённая Sheets-оценка → БД",
  },
  {
    id: "deadline",
    name: "Дедлайн",
    definition: "Крайний срок конкретного назначения с часовым поясом.",
    example: "20.10, 23:59 Europe/Kyiv = 20:59 UTC.",
    level: 3,
    lives: "Sheets; подтверждённое уточнение из Discord → БД",
  },
  {
    id: "pr",
    name: "PR",
    definition: "Pull Request: предложение изменений; термин GitHub.",
    example: "В GitLab эквивалент называется MR.",
    level: 3,
    lives: "GitHub; в этой архитектуре используем MR",
  },
  {
    id: "mr",
    name: "MR",
    definition: "Merge Request: предложение объединить изменения в GitLab.",
    example: "MR !42 связан с TASK-01 и TASK-02.",
    level: 3,
    lives: "GitLab студентов; связь с заданиями — в БД",
  },
  {
    id: "comment",
    name: "Comment",
    definition: "Комментарий к работе или обсуждению; сам по себе не оценка.",
    example: "«Добавь тест граничного случая» к MR !42.",
    level: 3,
    lives: "GitLab / Discord → БД с автором и ссылкой",
  },
  {
    id: "card",
    name: "Карточка студента",
    definition:
      "Связанные данные одного человека по курсу: версия, трек, результаты и история решений.",
    example: "S-1 · v1 · R1 · 20/30 · нужна смена версии.",
    level: 4,
    lives: "База Данных → LearningAtlas",
  },
  {
    id: "moodle",
    name: "Moodle",
    definition: "Платформа, где студент проходит назначенные активности.",
    example: "Каталог может быть шире личного трека.",
    level: 5,
    lives: "Система 1",
  },
  {
    id: "gitlab",
    name: "GitLab",
    definition: "Два раздельных контура: материалы курса и работы студентов.",
    example: "Тег курса ≠ ветка со студенческим решением.",
    level: 5,
    lives: "Системы 2 и 3",
  },
  {
    id: "spreadsheet",
    name: "Google Spreadsheet",
    definition: "Таблица назначений, дедлайнов и, при настройке, оценок.",
    example: "Строка: группа A, TASK-21, срок, revision.",
    level: 5,
    lives: "Система 4",
  },
  {
    id: "discord",
    name: "Discord",
    definition: "Учебные чаты с уточнениями заданий и сроков.",
    example: "«Для группы A срок TASK-21 перенесён».",
    level: 5,
    lives: "Система 5",
  },
  {
    id: "db",
    name: "База Данных",
    definition: "Хранилище исходников, фактов, связей, карточек и истории.",
    example: "Один студент связан с аккаунтами всех источников.",
    level: 5,
    lives: "Система 6",
  },
  {
    id: "atlas",
    name: "LearningAtlas",
    definition: "Сайт статистики и назначения треков / смены версии курса.",
    example: "Отчёт по студенту, группе и всему курсу.",
    level: 5,
    lives: "Система 7",
  },
];

export type MappingAction =
  "carry" | "repeat" | "supplement" | "retire" | "new";
export const actionLabels: Record<MappingAction, string> = {
  carry: "Перезачесть",
  repeat: "Повторить",
  supplement: "Дополнить",
  retire: "Убрать из трека",
  new: "Назначить новое",
};
export type Manifest = {
  from: number;
  to: number;
  tag: string;
  hash: string;
  critical: boolean;
  approved: boolean;
  complete: boolean;
  mappings: { id: string; action: MappingAction; reason: string }[];
};
export function manifestFor(
  learner: Learner,
  target = latestVersion,
): Manifest {
  return {
    from: learner.version,
    to: target,
    tag: `course-v${target}`,
    hash: `demo-manifest-v${learner.version}-v${target}`,
    critical: learner.version < 3 && target === 3,
    approved: true,
    complete: true,
    mappings: [
      ...learner.tasks.map((t) => ({
        id: t.id,
        action: (target <= learner.version || target === 2
          ? "carry"
          : t.id === "TASK-03"
            ? "repeat"
            : t.id === "TASK-04"
              ? "supplement"
              : t.id === "TASK-05"
                ? "retire"
                : "carry") as MappingAction,
        reason:
          target <= learner.version || target === 2
            ? "Редактура, критерии сохранены"
            : t.id === "TASK-03"
              ? "Новые обязательные критерии"
              : t.id === "TASK-04"
                ? "Добавлен проверяемый навык"
                : t.id === "TASK-05"
                  ? "Активность заменена новой"
                  : "Содержание и критерии совместимы",
      })),
      ...(target > learner.version &&
      target === 3 &&
      !learner.tasks.some((t) => t.id === "NEW-01")
        ? [
            {
              id: "NEW-01",
              action: "new" as const,
              reason: "Новая активность вместо TASK-05",
            },
          ]
        : []),
    ],
  };
}
export type Card = {
  learner: Learner;
  revision: number;
  trackSource: string;
  history: { revision: number; learner: Learner; reason: string }[];
  audit: {
    requestId: string;
    reason: string;
    actor: string;
    manifest: string | null;
  }[];
  mirrors: { materials: number; moodle: number };
  outbox: { revision: number; materials: boolean; moodle: boolean }[];
};
export function createCard(learner: Learner): Card {
  return {
    learner,
    revision: 1,
    trackSource: "Начальный трек курса",
    history: [],
    audit: [],
    mirrors: { materials: 1, moodle: 1 },
    outbox: [],
  };
}
export const createPlatform = () =>
  Object.fromEntries(
    (["ai", "java", "moodle", "sheets"] as CourseMode[]).map((m) => [
      m,
      learnersFor(m).map(createCard),
    ]),
  ) as Record<CourseMode, Card[]>;
export function pinVersion(existing: number | null, latest: number) {
  return existing ?? latest;
}
export function critical(card: Card) {
  return (
    card.learner.version < latestVersion && manifestFor(card.learner).critical
  );
}
export function preview(card: Card, manifest: Manifest): Learner {
  const tasks: StudentTask[] = card.learner.tasks.flatMap((t) => {
    const action = manifest.mappings.find((m) => m.id === t.id)?.action;
    if (action === "retire") return [];
    if (action === "repeat" || action === "supplement")
      return [
        {
          ...t,
          status: "todo" as const,
          submitted: false,
          submittedAt: null,
          due: null,
          score: null,
          evidence: [],
          source: t.source,
        },
      ];
    return [{ ...t, evidence: [...t.evidence] }];
  });
  for (const mapping of manifest.mappings.filter((m) => m.action === "new")) {
    if (!tasks.some((t) => t.id === mapping.id))
      tasks.push({
        kind: "Практика",
        id: mapping.id,
        required:
          card.learner.tasks.find((t) => t.id === "TASK-05")?.required ?? true,
        weight: 1,
        status: "todo",
        submitted: false,
        due: null,
        submittedAt: null,
        score: null,
        maxScore: 10,
        source: "Moodle",
        evidence: [],
      });
  }
  return { ...card.learner, version: manifest.to, tasks };
}
export type Policy = {
  automatic: boolean;
  allowNewWork: boolean;
  fresh: boolean;
  authorized: boolean;
};
export function migrationBlock(
  card: Card,
  manifest: Manifest,
  policy: Policy,
): string | null {
  if (!policy.authorized) return "Нет права изменять версию";
  if (card.learner.version !== manifest.from || manifest.to <= manifest.from)
    return "Закрепление уже изменилось";
  if (!manifest.approved) return "Манифест не утверждён";
  if (
    !manifest.complete ||
    new Set(manifest.mappings.map((m) => m.id)).size !==
      manifest.mappings.length ||
    card.learner.tasks.some(
      (t) => !manifest.mappings.some((m) => m.id === t.id),
    )
  )
    return "Нет полного сопоставления активностей";
  if (!policy.fresh) return "Данные устарели: сначала синхронизация";
  if (
    policy.automatic &&
    !policy.allowNewWork &&
    manifest.mappings.some((m) =>
      ["repeat", "supplement", "new"].includes(m.action),
    )
  )
    return "Автополитика запрещает новые обязательства";
  return null;
}
function commit(
  card: Card,
  learner: Learner,
  reason: string,
  requestId: string,
  actor: string,
  manifest: string | null,
): Card {
  const revision = card.revision + 1;
  return {
    ...card,
    learner,
    revision,
    history: [
      ...card.history,
      {
        revision: card.revision,
        learner: structuredClone(card.learner),
        reason,
      },
    ],
    audit: [...card.audit, { requestId, reason, actor, manifest }],
    outbox: [...card.outbox, { revision, materials: false, moodle: false }],
  };
}
export function migrate(
  card: Card,
  manifest: Manifest,
  policy: Policy,
  expectedRevision: number,
  requestId: string,
): Card {
  if (card.audit.some((a) => a.requestId === requestId)) return card;
  if (card.revision !== expectedRevision)
    throw new Error("Карточка изменилась: обновите предпросмотр");
  const block = migrationBlock(card, manifest, policy);
  if (block) throw new Error(block);
  return commit(
    card,
    preview(card, manifest),
    `Переход v${manifest.from} → v${manifest.to}`,
    requestId,
    policy.automatic ? "policy@1" : "Преподаватель",
    manifest.hash,
  );
}
export function assignTrack(
  card: Card,
  kind: "individual" | "group",
  requestId: string,
): Card {
  if (card.audit.some((a) => a.requestId === requestId)) return card;
  const lastId = Math.max(
    ...card.learner.tasks
      .filter((t) => t.id.startsWith("TASK-"))
      .map((t) => Number(t.id.slice(5))),
  );
  const tasks = card.learner.tasks.map((t, i) => ({
    ...t,
    required:
      kind === "individual"
        ? i < Math.min(4, card.learner.tasks.length)
        : t.id === "NEW-01" || Number(t.id.slice(5)) <= lastId - 2,
  }));
  return {
    ...commit(
      card,
      { ...card.learner, tasks },
      kind === "individual"
        ? "Индивидуальный трек: первые 4 активности"
        : "Групповой шаблон трека",
      requestId,
      kind === "group" ? "group-rule@1" : "Преподаватель",
      null,
    ),
    trackSource:
      kind === "individual"
        ? "LearningAtlas · ручное назначение"
        : "Google Spreadsheet · правило группы",
  };
}
export function acceptPractice(card: Card, taskId: string): Card {
  if (card.learner.tasks.find((t) => t.id === taskId)?.status === "accepted")
    return card;
  return commit(
    card,
    {
      ...card.learner,
      tasks: card.learner.tasks.map((t) =>
        t.id === taskId ? { ...t, status: "accepted", score: null } : t,
      ),
    },
    `Зачёт ${taskId}`,
    `accept-${taskId}`,
    "Преподаватель",
    null,
  );
}
export function syncMirror(
  card: Card,
  target: "materials" | "moodle",
  revision = card.revision,
): Card {
  if (revision > card.revision || revision <= card.mirrors[target]) return card;
  return {
    ...card,
    mirrors: { ...card.mirrors, [target]: revision },
    outbox: card.outbox.map((o) =>
      o.revision <= revision ? { ...o, [target]: true } : o,
    ),
  };
}
export function resolveBuild(
  card: Card,
  available: boolean,
  verifiedCache: boolean,
) {
  if (!available && !verifiedCache) return null;
  return `course-v${card.learner.version}/index.html`;
}
export function clarifyDeadline(card: Card): Card {
  const requestId = "discord-message-105-" + card.learner.id;
  if (
    card.learner.group !== "A" ||
    card.audit.some((a) => a.requestId === requestId)
  )
    return card;
  return commit(
    card,
    {
      ...card.learner,
      tasks: card.learner.tasks.map((t) =>
        t.id === "TASK-01" ? { ...t, due: "2026-10-22T20:59:00Z" } : t,
      ),
    },
    "Discord message-105: teacher-7, группа A, Europe/Kyiv",
    requestId,
    "Преподаватель",
    null,
  );
}
export const taskKind = (task: StudentTask) =>
  task.kind ?? (task.source === "GitLab" ? "Практика" : "Тест");
