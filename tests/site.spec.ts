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
test("22 terms follow the learning hierarchy and diagrams support keyboard exploration", async ({
  page,
}) => {
  await page.goto("/#concepts");
  await expect(page.locator(".concept-chips button")).toHaveCount(22);
  await page
    .locator(".concept-chips")
    .first()
    .getByRole("button", { name: "Теория", exact: true })
    .click();
  await expect(page.locator(".concept-inspector")).toContainText(
    "Материал, который нужно изучить",
  );
  await page
    .getByRole("button", { name: "Как появляется результат", exact: true })
    .click();
  const node = page
    .locator(".graph-node[role=button]")
    .filter({ hasText: "Карточка студента" });
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".compact-inspector").first()).toContainText(
    "Связанные данные одного человека",
  );
  await page.getByRole("button", { name: "Увеличить схему" }).click();
  await expect(page.locator(".graph-toolbar")).toContainText("110%");
  await page.getByRole("textbox", { name: "Найти термин" }).fill("Манифест");
  await expect(page.locator(".concept-chips button")).toHaveCount(1);
  await page.goto("/#glossary/learning-plan");
  await expect(page.locator(".concept-inspector")).toContainText(
    "Учебный трек",
  );
});
test("exactly seven global systems expose separate collection, version and track flows", async ({
  page,
}) => {
  await page.goto("/#ecosystems");
  await expect(page.locator(".graph-node")).toHaveCount(7);
  await expect(page.locator(".graph-node.is-inactive")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Тип курса", exact: true })
    .selectOption("java");
  await expect(page.locator(".graph-node.is-inactive")).toHaveCount(0);
  await page
    .locator(".graph-node")
    .filter({ hasText: "GitLab · студенты" })
    .click();
  await expect(page.locator(".concept-inspector")).toContainText(
    "Merge сам по себе не равен зачёту",
  );
  await page.getByRole("button", { name: "Смена версии", exact: true }).click();
  await expect(page.locator(".graph-shell")).toContainText(
    "решение о переходе",
  );
  await page
    .getByRole("button", { name: "Назначение трека", exact: true })
    .click();
  await expect(page.locator(".graph-shell")).toContainText(
    "кандидат уточнения",
  );
  await page.goto("/#data");
  await expect(
    page
      .locator(".source-controls")
      .getByRole("button", { name: "Discord", exact: true }),
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
  await expect(page.locator(".intake-counters")).toContainText(
    "Подтверждения выполнения",
  );
  await page
    .locator(".source-controls")
    .getByRole("button", { name: "Sheets · назначения", exact: true })
    .click();
  await expect(page.locator(".intake-counters")).toContainText("Проект трека");
  await page.getByRole("button", { name: /Ручной пилот/ }).click();
  await expect(page.locator(".json-panel pre")).toContainText(
    "row_id,group,activity_id",
  );
});
test("first-start pinning, manual migration, partial delivery and shared statistics retain history", async ({
  page,
}) => {
  await page.goto("/#versions");
  const start = page.getByRole("button", {
    name: "Первая / повторная активность нового студента",
  });
  await start.click();
  await page
    .getByRole("button", { name: "Опубликовать v3 в примере старта" })
    .click();
  await start.click();
  await expect(page.getByText("Закреплено v2", { exact: true })).toBeVisible();
  await expect(page.getByTestId("old-version")).toHaveText("Закреплено v1");
  await page
    .getByRole("checkbox", { name: "Компонент доставки недоступен" })
    .check();
  await expect(
    page.getByText("Не запускать урок", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", {
      name: "Есть проверенный кеш текущего закрепления",
    })
    .check();
  await expect(
    page.getByText("Открыть course-v1/index.html", { exact: true }),
  ).toBeVisible();
  const apply = page.getByRole("button", { name: "Утвердить переход вручную" });
  await expect(apply).toBeDisabled();
  await page
    .getByRole("checkbox", {
      name: "Уполномоченный преподаватель подтвердил переход",
    })
    .check();
  await apply.click();
  await expect(page.getByTestId("old-version")).toHaveText("Закреплено v3");
  await expect(page.locator(".history-strip")).toContainText("R1 · v1: 4/6");
  await expect(page.locator(".history-strip")).toContainText("Текущая R2 · v3");
  await page
    .getByRole("checkbox", { name: "GitLab недоступен при доставке" })
    .check();
  await page
    .getByRole("button", { name: "Синхронизировать GitLab и Moodle" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Moodle обновлён. GitLab недоступен",
  );
  await expect(page.locator(".json-panel")).toContainText(
    '"projection_revision": 1',
  );
  await page
    .getByRole("checkbox", { name: "GitLab недоступен при доставке" })
    .uncheck();
  await page
    .getByRole("button", { name: "Синхронизировать GitLab и Moodle" })
    .click();
  await expect(page.locator(".json-panel")).toContainText(
    '"projection_revision": 2',
  );
  await page.locator(".history-strip").getByRole("link").click();
  await expect(page.getByTestId("student-card")).toContainText("v3 · R2");
  await expect(page.getByTestId("report-progress")).toHaveText("33,3%");
});
test("automatic migration needs an enabled policy, complete mapping and fresh facts", async ({
  page,
}) => {
  await page.goto("/#versions");
  await page
    .getByRole("combobox", { name: "Режим перехода" })
    .selectOption("auto");
  const apply = page.getByRole("button", {
    name: "Выполнить автоматический переход",
  });
  await page
    .getByRole("checkbox", { name: "Владелец разрешил автополитику" })
    .check();
  await expect(apply).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Разрешены повторные и новые задания" })
    .check();
  await expect(apply).toBeEnabled();
  for (const name of [
    "В манифесте не хватает сопоставления",
    "Данные студента устарели",
  ]) {
    await page.getByRole("checkbox", { name }).check();
    await expect(apply).toBeDisabled();
    await page.getByRole("checkbox", { name }).uncheck();
  }
  await apply.click();
  await expect(page.getByTestId("old-version")).toHaveText("Закреплено v3");
  await page.getByText("Аудит решений · 1", { exact: true }).click();
  await expect(
    page
      .locator(".reference")
      .filter({ hasText: "Аудит решений" })
      .locator("pre"),
  ).toContainText("policy@1");
});
test("a migration opened from statistics changes only the selected student", async ({
  page,
}) => {
  await page.goto("/#statistics");
  await page
    .getByRole("combobox", { name: "Тип курса", exact: true })
    .selectOption("java");
  await page
    .getByRole("combobox", { name: "Студент", exact: true })
    .selectOption("S-2");
  await page
    .getByTestId("student-card")
    .getByRole("link", { name: "Сравнить и перенести версию →" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Студент для перехода" }),
  ).toHaveValue("S-2");
  await page
    .getByRole("checkbox", {
      name: "Уполномоченный преподаватель подтвердил переход",
    })
    .check();
  await page.getByRole("button", { name: "Утвердить переход вручную" }).click();
  await page.locator(".history-strip").getByRole("link").click();
  await expect(
    page.getByRole("combobox", { name: "Студент", exact: true }),
  ).toHaveValue("S-2");
  await expect(page.getByTestId("student-card")).toContainText("v3 · R2");
  await page
    .getByRole("combobox", { name: "Студент", exact: true })
    .selectOption("S-1");
  await expect(page.getByTestId("student-card")).toContainText("v1 · R1");
});
test("track assignment and confirmed Discord deadlines update the same student card", async ({
  page,
}) => {
  await page.goto("/#data");
  await page
    .getByRole("combobox", { name: "Тип курса", exact: true })
    .selectOption("java");
  const apply = page.getByRole("button", {
    name: "Применить трек к Студенту 01",
  });
  await expect(apply).toBeDisabled();
  await page
    .getByRole("checkbox", { name: "Преподаватель утвердил назначение" })
    .check();
  await apply.click();
  await expect(page.getByTestId("shared-track")).toContainText(
    "4 обязательных",
  );
  await page
    .getByRole("button", { name: "Подтвердить для Студента 01 · группа A" })
    .click();
  await page.getByTestId("shared-track").getByRole("link").click();
  await expect(page.getByTestId("student-card")).toContainText("v1 · R3");
  await expect(page.locator(".metric-card").first()).toContainText("/ 4");
  await expect(
    page.locator("tbody tr").filter({ hasText: "TASK-01" }).first(),
  ).toContainText("10-22 20:59");
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
  await page.getByRole("button", { name: "Курс", exact: true }).click();
  await expect(page.locator(".student-bars>div")).toHaveCount(6);
  await expect(page.locator(".metric-card").first()).toContainText("/ 195");
  await expect(page.locator(".metric-card").nth(1)).toContainText("По версиям");
  await expect(page.getByTestId("student-card")).toContainText(
    "4 требуют решения",
  );
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
    page.getByRole("heading", { name: "MVP 5 · Контролируемые миграции" }),
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
