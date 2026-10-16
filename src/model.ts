export type Obligation = {
  id: string;
  required: boolean;
  weight: number;
  status: "unknown" | "submitted" | "accepted" | "not_started";
};
export function completion(plan: Obligation[]) {
  const required = plan.filter((t) => t.required);
  const denominator = required.reduce((sum, t) => sum + t.weight, 0);
  const accepted = required
    .filter((t) => t.status === "accepted")
    .reduce((sum, t) => sum + t.weight, 0);
  return {
    denominator,
    accepted,
    percent: denominator > 0 ? (accepted / denominator) * 100 : null,
  };
}
export function groupPlan(group: "A" | "B"): Obligation[] {
  return Array.from({ length: group === "A" ? 30 : 35 }, (_, i) => ({
    id: `JAVA-${i + 1}`,
    required: true,
    weight: 1,
    status: i < 18 ? "accepted" : i < 23 ? "submitted" : "not_started",
  }));
}
export function linkEvidence(
  links: Record<string, string[]>,
  evidenceId: string,
  taskIds: string[],
) {
  return { ...links, [evidenceId]: [...new Set(taskIds)] };
}
export function uniqueLinkedTasks(links: Record<string, string[]>) {
  return [...new Set(Object.values(links).flat())];
}
export function resolveVersion(locked: number | null, current: number) {
  return locked ?? current;
}
export type Transfer =
  | "CARRY_OVER"
  | "REASSESS"
  | "SUPPLEMENT"
  | "NEW_REQUIRED"
  | "RETIRED"
  | "MANUAL_REVIEW";
export const migrationTasks: {
  id: string;
  name: string;
  action: Transfer;
  reason: string;
  oldAccepted: boolean;
}[] = [
  {
    id: "AI-INTRO-001",
    name: "Введение в ИИ",
    action: "CARRY_OVER",
    reason: "Совместимость оценивания подтверждена явно.",
    oldAccepted: true,
  },
  {
    id: "AI-PROMPT-002",
    name: "Работа с запросами",
    action: "CARRY_OVER",
    reason: "Требования и версия оценивания совпадают.",
    oldAccepted: true,
  },
  {
    id: "AI-SAFETY-003",
    name: "Безопасность ИИ",
    action: "REASSESS",
    reason: "Изменились критерии оценки, требуется новая проверка.",
    oldAccepted: true,
  },
  {
    id: "AI-PRACTICE-004",
    name: "Практический разбор",
    action: "SUPPLEMENT",
    reason: "Нужно добавить анализ ошибок к прежнему решению.",
    oldAccepted: true,
  },
  {
    id: "AI-LEGACY-005",
    name: "Архивный инструмент",
    action: "RETIRED",
    reason: "Исключён из целевого плана; результат сохраняется.",
    oldAccepted: false,
  },
  {
    id: "AI-AGENTS-008",
    name: "Агенты и инструменты",
    action: "NEW_REQUIRED",
    reason: "Новая обязательная задача в целевой версии.",
    oldAccepted: false,
  },
  {
    id: "AI-ETHICS-009",
    name: "Разбор этического кейса",
    action: "MANUAL_REVIEW",
    reason: "Не хватает оснований для переноса — решает преподаватель.",
    oldAccepted: false,
  },
];
export function previewMigration(items = migrationTasks) {
  const old = items.filter((t) => t.action !== "NEW_REQUIRED");
  const target = items.filter((t) => t.action !== "RETIRED");
  const carried = target.filter(
    (t) => t.action === "CARRY_OVER" && t.oldAccepted,
  ).length;
  return {
    oldTotal: old.length,
    oldAccepted: old.filter((t) => t.oldAccepted).length,
    newTotal: target.length,
    carried,
    pending: target.length - carried,
  };
}
