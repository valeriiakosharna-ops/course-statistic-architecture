import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const chapters = [
  ["concepts", "Від однієї дії до повного курсу"],
  ["ecosystems", "Кожна система має свою роль"],
  ["data", "Простежте шлях одного запису"],
  ["versions", "Версії змінюються за правилами, а не через вік"],
  ["statistics", "Змініть курс і дослідіть його статистику"],
  ["mvp", "Від індивідуального прогресу до навчальних рішень"],
  ["simulation/java", "Спостерігайте за навчанням і рухом даних"],
  ["scenarios", "Що може відбуватися під час навчання?"],
];

test("Ukrainian persists across every chapter with translated controls, local fonts and accessible diagrams", async ({
  page,
}) => {
  const errors: string[] = [],
    external: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (new URL(r.url()).hostname !== "127.0.0.1") external.push(r.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Українська", exact: true }).click();
  for (const [route, heading] of chapters) {
    await page.goto(`/#${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
    await expect(page.getByRole("group", { name: "Мова сайту" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(audit.violations, route).toEqual([]);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  await page.screenshot({
    path: `/tmp/bilingual-${test.info().project.name}.png`,
  });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("switching language preserves a running course, selected event, evidence and playback position", async ({
  page,
}) => {
  await page.goto("/#simulation/java");
  await page
    .getByRole("navigation", { name: "Journey events" })
    .getByRole("button")
    .filter({ hasText: "Run tests and AI-assisted review" })
    .click();
  const before = await page.getByTestId("simulation-live-summary").innerText();
  await page.getByText("Inspect example · JSON", { exact: true }).click();
  const evidence = await page.getByTestId("processing-sample").innerText();
  await page.getByRole("button", { name: "Українська", exact: true }).click();
  await expect(page.getByTestId("simulation-event")).toContainText(
    "Запустити тести та перевірку з допомогою ШІ",
  );
  await expect(
    page.getByRole("combobox", { name: "Тип курсу", exact: true }),
  ).toHaveValue("java");
  await expect(page.getByTestId("processing-sample")).toHaveText(evidence);
  await expect(page.getByTestId("processing-ai")).toContainText(
    "Перевірка ШІ необов’язкова",
  );
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByTestId("simulation-live-summary")).toHaveText(before, {
    useInnerText: true,
  });
  await expect(page.getByTestId("simulation-event")).toContainText(
    "Run tests and AI-assisted review",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("Ukrainian glossary and scenario search work, option values stay stable and downloads use the selected language", async ({
  page,
}) => {
  await page.goto("/#concepts");
  await page.getByRole("button", { name: "Українська", exact: true }).click();
  await page.getByRole("textbox", { name: "Знайти поняття" }).fill("маніфест");
  await expect(page.locator(".concept-chips button")).toHaveCount(1);
  await page.goto("/#scenarios");
  await page
    .getByRole("searchbox", { name: "Пошук сценаріїв" })
    .fill("назва MR");
  const cases = page.getByRole("navigation", { name: "Перелік сценаріїв" });
  await cases.getByRole("button", { name: /Назва MR не відповідає/ }).click();
  await expect(page.getByTestId("scenario-inspector")).toContainText(
    "початковий час отримання",
  );
  const count = await cases.getByRole("button").count();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("searchbox", { name: "Search scenarios" }),
  ).toHaveValue("назва MR");
  await expect(
    page
      .getByRole("navigation", { name: "Scenario cases" })
      .getByRole("button"),
  ).toHaveCount(count);
  await page.getByRole("button", { name: "Українська", exact: true }).click();
  await page.getByRole("button", { name: "Скинути фільтри" }).click();
  await page
    .getByRole("combobox", { name: "Вимір сценарію" })
    .selectOption("Deadlines");
  await expect(
    page.getByRole("combobox", { name: "Вимір сценарію" }),
  ).toHaveValue("Deadlines");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Завантажити всі сценарії" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("learning-scenarios.uk.md");
  const markdown = await readFile((await download.path())!, "utf8");
  expect(markdown.match(/^### /gm)).toHaveLength(64);
  expect(markdown).toContain("Навчання триває довше, ніж планувалося");
  expect(markdown).toContain(
    "Факти, які потрібно з’ясувати: Призначена версія та трек",
  );
  expect(markdown).not.toContain("A learner");
  expect(markdown).not.toContain("Required activities");
});

test("language switching remains available when local storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage unavailable");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  await page.goto("/#mvp");
  await page.getByRole("button", { name: "Українська", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Від індивідуального прогресу до навчальних рішень",
  );
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "From personal progress to learning decisions",
  );
});
