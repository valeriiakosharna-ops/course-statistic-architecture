import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("independent version/track map opens distinct cases and preserves deep-link history", async ({
  page,
}) => {
  await page.goto("/#scenarios");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "What can happen during a course?",
  );
  await expect(
    page.getByRole("combobox", { name: "Course type", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByText("Architecture coverage has not been assessed.", {
        exact: false,
      })
      .first(),
  ).toBeVisible();
  const matrix = page.getByRole("group", {
    name: "Version and track combinations",
  });
  const inspector = page.getByTestId("scenario-inspector");
  await matrix.getByRole("button", { name: /Same version.*New track/ }).click();
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText(
    "The track changes; the version stays",
  );
  await expect(inspector).toBeFocused();
  await matrix.getByRole("button", { name: /New version.*Same track/ }).click();
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText(
    "The version changes; the track stays",
  );
  await matrix.getByRole("button", { name: /New version.*New track/ }).click();
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText(
    "Both version and track change",
  );
  await page.reload();
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText(
    "Both version and track change",
  );
  await page
    .getByRole("group", { name: "Scenario groups", exact: true })
    .getByRole("button", { name: /Submissions & MR rules/ })
    .click();
  await page
    .getByRole("navigation", { name: "Scenario cases" })
    .getByRole("button", { name: /MR title does not follow/ })
    .click();
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText(
    "The MR title does not follow the naming rule",
  );
  await page.goBack();
  await expect(inspector.getByRole("heading", { level: 2 })).toHaveText(
    "Both version and track change",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("catalogue filters combine, search includes decision text and empty results recover", async ({
  page,
}) => {
  await page.goto("/#scenarios");
  await page
    .getByRole("group", { name: "Scenario groups", exact: true })
    .getByRole("button", { name: /A living spreadsheet/ })
    .click();
  await page
    .getByRole("combobox", { name: "Scenario dimension" })
    .selectOption("Deadlines");
  await page
    .getByRole("combobox", { name: "Scenario type" })
    .selectOption("change");
  const cases = page.getByRole("navigation", { name: "Scenario cases" });
  await expect(cases.getByRole("button")).toHaveCount(2);
  await page
    .getByRole("searchbox", { name: "Search scenarios" })
    .fill("  PERSONAL  GROUP ");
  await expect(cases.getByRole("button")).toHaveCount(1);
  await expect(page.getByTestId("scenario-inspector")).toContainText(
    "A group row conflicts with a personal row",
  );
  await page
    .getByRole("searchbox", { name: "Search scenarios" })
    .fill("no-such-situation");
  await expect(
    page.getByRole("heading", { name: "No matching situations" }),
  ).toBeVisible();
  await expect(page.getByTestId("scenario-inspector")).toHaveCount(0);
  await page.getByRole("button", { name: "Show all cases" }).click();
  await expect(cases.getByRole("button")).toHaveCount(64);
  await page
    .getByRole("group", { name: "Filter by learning stage" })
    .getByRole("button", { name: /Finish or return/ })
    .click();
  await expect(page.getByRole("status")).toContainText("Finish or return");
  await expect(cases.getByRole("button")).toHaveCount(4);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page
    .getByRole("searchbox", { name: "Search scenarios" })
    .fill("  ORIGINAL TITLE ");
  await expect(
    cases.getByRole("button", { name: /MR title does not follow/ }),
  ).toBeVisible();
});

test("MR exceptions show open policies, related combinations and a complete English review download", async ({
  page,
}) => {
  await page.goto("/#scenarios/wrong-mr-title");
  const inspector = page.getByTestId("scenario-inspector");
  await expect(inspector).toContainText("original receipt time");
  await expect(inspector).toContainText("valid hand-in");
  await expect(inspector).toContainText(
    "Possible policies to compare, not approved rules",
  );
  await expect(
    inspector.getByRole("group", {
      name: "Scenario: before, event and resulting situation",
    }),
  ).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await inspector
    .getByRole("button", { name: /on-time MR gets a valid title/ })
    .click();
  await expect(page).toHaveURL(/#scenarios\/title-fix-after-cutoff$/);
  await expect(inspector).toContainText("Content revision before the cutoff");
  await page
    .locator(".scenario-combination-cards")
    .getByRole("button", { name: /sheet changes after a practice/ })
    .click();
  await expect(inspector).toContainText("earlier submission");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download all cases" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("learning-scenarios.md");
  const markdown = await readFile((await download.path())!, "utf8");
  expect(markdown.match(/^### /gm)).toHaveLength(64);
  expect(markdown).toContain("longer-than-planned");
  expect(markdown).toContain("sheet-live-edits");
  expect(markdown).toContain("Architecture coverage has not been assessed");
  expect(markdown).not.toMatch(/\p{Script=Cyrillic}/u);
  await page.screenshot({
    path: `/tmp/scenarios-${test.info().project.name}.png`,
    fullPage: true,
  });
});
