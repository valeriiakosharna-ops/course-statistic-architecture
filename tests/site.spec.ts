import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("architecture explorer and all main pages render without overflow or browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Единая картина",
  );
  await page.getByRole("button", { name: /Сбор и сверка/ }).click();
  await expect(page.locator(".flow-detail")).toContainText("raw-снимки");
  for (const hash of [
    "overview",
    "glossary",
    "scenarios/ai",
    "scenarios/java",
    "scenarios/moodle",
    "scenarios/sheets",
    "roadmap",
    "decisions",
  ]) {
    await page.goto(`/#${hash}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("glossary searches Russian and English, handles empty results and term deep links", async ({
  page,
}) => {
  await page.goto("/#glossary");
  await page
    .getByRole("textbox", { name: "Поиск по словарю" })
    .fill("Evidence");
  await expect(page.locator(".term-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Подтверждение", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Поиск по словарю" })
    .fill("несуществующеепонятие");
  await expect(
    page.getByRole("heading", { name: "Понятие не найдено" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Сбросить фильтры" }).click();
  await page.getByRole("button", { name: "Аналитика", exact: true }).click();
  await expect(page.locator(".term-card")).toHaveCount(5);
  await page.goto("/#glossary/learning-plan");
  await expect(page.locator("#term-learning-plan")).toHaveClass(/highlighted/);
  await expect(page.locator("#term-learning-plan")).toBeInViewport();
});

test("sheet proposal preserves denominator and group selection changes applicable plan", async ({
  page,
}) => {
  await page.goto("/#scenarios/sheets");
  await expect(page.getByTestId("completion")).toHaveText("60%");
  await page.getByRole("button", { name: "Группа B" }).click();
  await expect(page.getByTestId("completion")).toHaveText("51.4%");
  await page
    .getByRole("button", { name: "Смоделировать +1 задачу из Sheet" })
    .click();
  await expect(page.getByRole("status")).toContainText("35 → 36");
  await expect(page.getByTestId("completion")).toHaveText("51.4%");
});

test("new releases preserve v1 lock and migration is a preview with old history", async ({
  page,
}) => {
  await page.goto("/#scenarios/ai");
  for (let v = 2; v <= 5; v++)
    await page.getByRole("button", { name: `Опубликовать v${v}.0` }).click();
  await expect(page.locator(".demo-controls .pill")).toContainText(
    "Закреплено v1",
  );
  await page
    .getByRole("button", { name: "Предпросмотр перехода на v5" })
    .click();
  await expect(page.locator(".migration-preview")).toContainText("4/6");
  await expect(page.locator(".migration-preview")).toContainText("2/6");
  await expect(page.locator(".migration-preview")).toContainText(
    "Миграция не применяется",
  );
});

test("merged MR and confirmed links do not accept work until separate teacher decision", async ({
  page,
}) => {
  await page.goto("/#scenarios/java");
  await expect(page.getByTestId("accepted-count")).toHaveText("0");
  await expect(
    page.getByRole("button", { name: "Принять связанные задачи" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /JAVA-010/ }).check();
  await page.getByRole("button", { name: "Подтвердить связи" }).click();
  await expect(page.getByTestId("accepted-count")).toHaveText("0");
  await page.getByRole("button", { name: "Принять связанные задачи" }).click();
  await expect(page.getByTestId("accepted-count")).toHaveText("2");
  await page.getByRole("button", { name: "Сбросить демо" }).click();
  await expect(page.getByTestId("accepted-count")).toHaveText("0");
});

test("roadmap includes acceptance gates, search and dependencies; materials are downloadable", async ({
  page,
  request,
}) => {
  await page.goto("/#roadmap");
  await page
    .getByRole("textbox", { name: "Поиск этапов MVP" })
    .fill("миграции");
  await page.locator(".stage-option").click();
  await expect(page.locator(".stage-detail h2")).toHaveText(
    "Контролируемые миграции",
  );
  await expect(page.locator(".stage-detail")).toContainText(
    "Можно идти дальше",
  );
  await expect(page.locator(".stage-detail")).toContainText("Зависимости");
  await page.goto("/#decisions/sources");
  for (const link of await page.locator(".source-document").all()) {
    const response = await request.get((await link.getAttribute("href"))!);
    expect(response.ok()).toBe(true);
    expect((await response.body()).length).toBeGreaterThan(100);
  }
});

test("mobile navigation opens and closes after selecting a page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-specific menu");
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .locator("nav")
    .getByRole("link", { name: /Словарь понятий/ })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Сначала договоримся о понятиях",
  );
  await expect(
    page.getByRole("button", { name: "Открыть меню" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("pages meet automated WCAG A/AA checks and load assets without external services", async ({
  page,
}) => {
  const remoteRequests: string[] = [];
  page.on("request", (request) => {
    if (!new URL(request.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))
      remoteRequests.push(request.url());
  });
  for (const hash of [
    "overview",
    "glossary",
    "scenarios/ai",
    "scenarios/java",
    "roadmap",
    "decisions",
  ]) {
    await page.goto(`/#${hash}`);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations, `Accessibility on ${hash}`).toEqual([]);
  }
  expect(remoteRequests).toEqual([]);
});
