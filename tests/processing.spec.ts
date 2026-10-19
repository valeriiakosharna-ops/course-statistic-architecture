import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const event = (page: Page, title: string) =>
  page
    .getByRole("navigation", { name: "Journey events" })
    .getByRole("button")
    .filter({ hasText: title });

test("processing guide follows API, projection file, HTML build and release pipeline boundaries", async ({
  page,
}) => {
  await page.goto("/#simulation/ai");
  await page
    .getByText("How to read formats, jobs and AI", { exact: true })
    .click();
  await expect(page.locator(".processing-key")).toContainText(
    "Format describes what moves",
  );
  await event(page, "Open the first learning activity").click();
  await page.getByRole("button", { name: "See data processing" }).click();
  await expect(page.getByTestId("processing-guide")).toBeFocused();
  await expect(page.getByTestId("transfer-format")).toContainText(
    "API / event JSON",
  );
  await expect(page.getByTestId("processing-guide")).toContainText(
    "Synchronous authenticated",
  );
  await expect(page.getByTestId("processing-ai")).toContainText("No AI needed");
  await event(page, "Deliver the pinned course build").click();
  await expect(page.getByTestId("transfer-format")).toContainText(
    "Generated JSON file",
  );
  await expect(page.getByTestId("processing-guide")).toContainText(
    "generated/student-course-versions.json",
  );
  await page.locator(".transfer-tabs button").nth(1).click();
  await expect(page.getByTestId("transfer-format")).toContainText(
    "API request",
  );
  await expect(page.getByTestId("processing-guide")).not.toContainText(
    "generated/student-course-versions.json",
  );
  await page.locator(".transfer-tabs button").nth(2).click();
  await expect(page.getByTestId("transfer-format")).toContainText("text/html");
  await page.getByText("Inspect example · HTML", { exact: true }).click();
  await expect(page.getByTestId("processing-sample")).toContainText("<article");
  await expect(page.getByTestId("processing-guide")).toContainText(
    "does not rebuild",
  );
  await event(page, "Publish a critical release, v3").click();
  await expect(page.getByTestId("processing-stages")).toContainText(
    "CI pipeline",
  );
  await expect(page.getByTestId("processing-stages")).toContainText(
    "Background job",
  );
  await expect(page.getByTestId("processing-guide")).toContainText(
    "course-v3/manifest.json",
  );
  await expect(page.getByTestId("processing-ai")).toContainText("No AI needed");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Discord compares AI text extraction with structured parsing while leaving deadline and progress unchanged", async ({
  page,
}) => {
  await page.goto("/#simulation/java");
  await event(page, "Read a deadline clarification").click();
  const before = await page.getByTestId("simulation-java-status").innerText();
  const progress = await page
    .getByTestId("simulation-live-summary")
    .innerText();
  await expect(page.getByTestId("processing-ai")).toContainText(
    "AI for free text",
  );
  await expect(page.getByTestId("processing-stages")).toContainText(
    "AI assistance",
  );
  await page
    .getByText("Inspect proposed clarification · JSON", { exact: true })
    .click();
  await expect(page.getByTestId("extraction-sample")).toContainText(
    '"model_version"',
  );
  await expect(page.getByTestId("extraction-sample")).toContainText(
    '"status": "requires_review"',
  );
  await expect(page.getByTestId("extraction-sample")).toContainText(
    '"changes_applied": false',
  );
  const freeText = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(freeText.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Structured command + parser", exact: true })
    .click();
  await expect(page.getByTestId("processing-ai")).toContainText("No AI needed");
  await expect(page.getByTestId("processing-stages")).not.toContainText(
    "AI assistance",
  );
  await expect(page.getByTestId("extraction-sample")).toContainText(
    '"method": "structured-parser"',
  );
  await expect(page.getByTestId("extraction-sample")).not.toContainText(
    '"model_version"',
  );
  await expect(page.getByTestId("simulation-java-status")).toHaveText(before, {
    useInnerText: true,
  });
  await expect(page.getByTestId("simulation-live-summary")).toHaveText(
    progress,
    { useInnerText: true },
  );
  await page.locator(".transfer-tabs button").nth(1).click();
  await expect(page.getByTestId("transfer-format")).toContainText(
    "API response",
  );
  await expect(page.getByTestId("processing-guide")).toContainText(
    "Read API + browser rendering",
  );
  const structured = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(structured.violations).toEqual([]);
  expect(await page.locator("main").innerText()).not.toMatch(
    /\p{Script=Cyrillic}/u,
  );
});

test("code review, internal policy jobs and failed delivery show their separate validation gates", async ({
  page,
}) => {
  await page.goto("/#simulation/java");
  await event(page, "Run tests and AI-assisted review").click();
  await expect(page.getByTestId("processing-ai")).toContainText(
    "AI review is optional",
  );
  await expect(page.getByTestId("processing-guide")).toContainText(
    "test-results.xml + review.json",
  );
  await page.getByText("Inspect example · JSON", { exact: true }).click();
  await expect(page.getByTestId("processing-sample")).toContainText(
    '"accepted": false',
  );
  await expect(page.getByTestId("processing-sample")).toContainText(
    '"head_sha": "demo-sha-a3"',
  );
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "2/30 accepted",
  );
  await page
    .getByRole("combobox", { name: "Simulation migration mode" })
    .selectOption("automatic");
  await event(page, "Run the automatic migration policy").click();
  await expect(page.getByTestId("transfer-format")).toContainText(
    "Database rows",
  );
  await expect(page.getByTestId("processing-ai")).toContainText("No AI needed");
  await expect(page.getByTestId("processing-guide")).toContainText(
    "Target after validation",
  );
  await page.getByText("Inspect example · PSEUDOCODE", { exact: true }).click();
  await expect(page.getByTestId("processing-sample")).toContainText(
    "ATOMIC COMMIT",
  );
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Pinned v1",
  );
  await page
    .getByRole("checkbox", {
      name: "Course owner enabled the automatic policy",
    })
    .check();
  await page
    .getByRole("checkbox", { name: "Policy allows reassessment and new work" })
    .check();
  await page
    .getByRole("checkbox", {
      name: "GitLab unavailable on first migration delivery",
    })
    .check();
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await page.locator(".transfer-tabs button").nth(1).click();
  await expect(page.getByTestId("transfer-format")).toContainText(
    "Generated JSON file",
  );
  await expect(page.getByTestId("processing-guide")).toContainText(
    "Target awaiting retry",
  );
  await expect(page.getByTestId("processing-guide")).toContainText(
    "has not acknowledged this projection",
  );
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Pinned v3",
  );
});
