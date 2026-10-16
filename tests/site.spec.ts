import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const sections = [
  "concepts",
  "ecosystems",
  "data",
  "versions",
  "statistics",
  "mvp",
];
test("six visual chapters load without browser errors or page overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const section of sections) {
    await page.goto("/#" + section);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("atomic terms reveal a short definition and relationship diagrams can be explored with keyboard and zoom", async ({
  page,
}) => {
  await page.goto("/#concepts");
  await page
    .locator(".concept-chips")
    .first()
    .getByRole("button", { name: "Материал", exact: true })
    .click();
  await expect(page.locator(".concept-inspector")).toContainText(
    "То, что студент читает",
  );
  await page
    .getByRole("button", { name: "Как появляется результат", exact: true })
    .click();
  const node = page
    .locator(".graph-node[role=button]")
    .filter({ hasText: "Принятый результат" });
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".compact-inspector").first()).toContainText(
    "Работа зачтена",
  );
  await page.getByRole("button", { name: "Увеличить схему" }).click();
  await expect(page.locator(".graph-toolbar")).toContainText("110%");
  await page.getByText(/Технический словарь/, { exact: false }).click();
  await page
    .getByRole("textbox", { name: "Поиск технического понятия" })
    .fill("Evidence");
  await expect(page.locator(".reference .concept-chips button")).toHaveCount(1);
  await page.goto("/#glossary/learning-plan");
  await expect(page.locator(".concept-inspector")).toContainText(
    "План студента",
  );
});
test("course selection changes ecosystem connections and available data sources", async ({
  page,
}) => {
  await page.goto("/#ecosystems");
  await expect(page.locator(".graph-node.is-inactive")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Тип курса", exact: true })
    .selectOption("java");
  await expect(page.locator(".graph-node.is-inactive")).toHaveCount(2);
  await page
    .locator(".graph-node")
    .filter({ hasText: "GitLab · работы" })
    .click();
  await expect(page.locator(".concept-inspector")).toContainText(
    "MR, diff, review",
  );
  await page.goto("/#data");
  await expect(
    page
      .locator(".source-controls")
      .getByRole("button", { name: "Sheets", exact: true }),
  ).toBeVisible();
});
test("ingestion shows formats, suppresses duplicates, preserves records on outage, and routes unresolved identities", async ({
  page,
}) => {
  await page.goto("/#data");
  await page
    .getByRole("combobox", { name: "Тип курса", exact: true })
    .selectOption("java");
  await page
    .getByRole("button", { name: "Получить запись", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Получить запись", exact: true })
    .click();
  await expect(page.getByTestId("unique-facts")).toHaveText("1");
  await expect(page.getByTestId("duplicates")).toHaveText("1");
  await page.getByRole("checkbox", { name: "Источник недоступен" }).check();
  await page
    .getByRole("button", { name: "Получить запись", exact: true })
    .click();
  await expect(page.getByTestId("unique-facts")).toHaveText("1");
  await expect(page.getByRole("status")).toContainText(
    "Последние факты сохранены",
  );
  await page
    .getByRole("checkbox", { name: "Не удалось связать аккаунт" })
    .check();
  await expect(page.locator(".intake-counters")).toContainText(
    "Очередь сверки",
  );
  await page
    .getByRole("button", { name: "Подтвердить связь", exact: true })
    .click();
  await expect(page.locator(".intake-counters")).toContainText("Подтверждения");
  await page
    .locator(".source-controls")
    .getByRole("button", { name: "Sheets", exact: true })
    .click();
  await expect(page.locator(".intake-counters")).toContainText("Проект плана");
  await page.getByRole("button", { name: /Ручной пилот/ }).click();
  await expect(page.locator(".json-panel pre")).toContainText(
    "row,group,task_id",
  );
});
test("version locks survive releases, resolver never falls back to latest, and migration retains history", async ({
  page,
}) => {
  await page.goto("/#versions");
  for (let v = 2; v <= 5; v++)
    await page
      .getByRole("button", { name: `Опубликовать v${v}`, exact: true })
      .click();
  await expect(page.getByTestId("old-version")).toHaveText("Закреплено v1");
  await page.getByRole("checkbox", { name: "Резолвер недоступен" }).check();
  await page
    .getByRole("checkbox", { name: "Есть проверенный кеш закрепления" })
    .uncheck();
  await expect(
    page.getByRole("strong").filter({ hasText: "Не запускать урок" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Сравнить v1 → v5", exact: true })
    .click();
  await expect(page.locator(".migration-score")).toContainText("4/6");
  await expect(page.locator(".migration-score")).toContainText("2/6");
  const approve = page.getByRole("button", {
    name: "Утвердить R2 — только в этом демо",
  });
  await expect(approve).toBeDisabled();
  await page
    .getByRole("checkbox", { name: /Преподаватель разобрал ручной случай/ })
    .check();
  await approve.click();
  await expect(page.getByTestId("old-version")).toHaveText("Закреплено v5");
  await expect(page.locator(".history-strip")).toContainText("R1: 4/6");
  await expect(
    page.getByRole("button", { name: "R2 создана · повтор заблокирован" }),
  ).toBeDisabled();
});
test("student and group reports derive from course plans and MR acceptance is a separate action", async ({
  page,
}) => {
  await page.goto("/#statistics");
  await expect(
    page.getByRole("button", { name: "Группа", exact: true }),
  ).toBeDisabled();
  await page
    .locator(".mode-cards")
    .getByRole("button", { name: /Java Dual/ })
    .click();
  const before = await page.getByTestId("report-progress").textContent();
  await page.getByRole("button", { name: "1. Подтвердить связь" }).click();
  await expect(page.getByTestId("report-progress")).toHaveText(before!);
  await page.getByRole("button", { name: "2. Принять работу" }).click();
  await expect(page.getByTestId("report-progress")).not.toHaveText(before!);
  await page.getByRole("button", { name: "Группа", exact: true }).click();
  await expect(page.locator(".metric-card").first()).toContainText("/ 90");
  await page
    .getByRole("combobox", { name: "Группа", exact: true })
    .selectOption("B");
  await expect(page.locator(".metric-card").first()).toContainText("/ 105");
  await expect(page.locator(".student-bars>div")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Фильтр статуса" })
    .selectOption("unknown");
  await expect(
    page.locator(".table-scroll").last().locator("tbody tr"),
  ).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Сортировка задач" })
    .selectOption("due");
  await page
    .locator(".table-scroll")
    .first()
    .getByRole("button", { name: "Открыть студента →" })
    .first()
    .click();
  await expect(page.locator(".student-bars>div")).toHaveCount(1);
});
test("MVP steps expose their outcome and original materials remain accessible", async ({
  page,
  request,
}) => {
  await page.goto("/#mvp");
  await page
    .locator(".mvp-staircase button")
    .filter({ hasText: "Миграции" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Контролируемые миграции" }),
  ).toBeVisible();
  await page.locator("footer summary").click();
  for (const a of await page.locator("footer details a").all()) {
    expect((await request.get((await a.getAttribute("href"))!)).ok()).toBe(
      true,
    );
  }
});
test("mobile navigation works", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Mobile menu only");
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
  await page
    .locator("nav")
    .getByRole("link", { name: /Как идут данные/ })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Пройдём путь одной записи",
  );
  await expect(
    page.getByRole("button", { name: "Открыть меню" }),
  ).toHaveAttribute("aria-expanded", "false");
});
test("all chapters pass automated WCAG A/AA checks and use local assets only", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!["localhost", "127.0.0.1"].includes(new URL(r.url()).hostname))
      external.push(r.url());
  });
  for (const section of sections) {
    await page.goto("/#" + section);
    await page.evaluate(() => document.fonts.ready);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(audit.violations, section).toEqual([]);
  }
  expect(external).toEqual([]);
});
