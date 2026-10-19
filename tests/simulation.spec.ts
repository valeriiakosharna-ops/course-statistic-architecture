import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const event = (page: Page, title: string) =>
  page
    .getByRole("navigation", { name: "Journey events" })
    .getByRole("button")
    .filter({ hasText: title });

test("AI journey separates enrollment from pinning, preserves existing versions, migrates and exports a traceable result", async ({
  page,
}) => {
  await page.goto("/#simulation/ai");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Not enrolled",
  );
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Enrolled",
  );
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Version not pinned",
  );
  await event(page, "Open the first learning activity").click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Pinned v1",
  );
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "0/6 accepted",
  );
  await event(page, "Deliver the pinned course build").click();
  await expect(page.locator(".graph-node")).toHaveCount(7);
  await page.locator(".transfer-tabs button").nth(2).click();
  await expect(page.getByTestId("simulation-transfer")).toContainText(
    "Exact tagged HTML",
  );
  await page.getByText("Inspect example · HTML", { exact: true }).click();
  await expect(page.locator(".transfer-panel pre")).toContainText(
    "ai-foundations/course-v1/index.html",
  );
  await event(page, "Assign an individual learning track").click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "3/4 accepted · 75%",
  );
  await event(page, "Reopen a lesson after the new release").click();
  await expect(page.getByTestId("simulation-record")).toContainText(
    "Latest published: v2",
  );
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Pinned v1",
  );
  await event(page, "Flag the outdated student version").click();
  await expect(page.getByTestId("simulation-record")).toContainText(
    "Decision required",
  );
  await event(page, "Reconcile and retry pending delivery").click();
  await expect(page.getByTestId("simulation-event")).toContainText(
    "Waiting for an authorized instructor",
  );
  await expect(
    page.getByRole("button", { name: "Next event", exact: true }),
  ).toBeDisabled();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Pinned v1",
  );
  await page
    .getByRole("button", { name: "Approve this migration", exact: true })
    .click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Pinned v3 · track R3",
  );
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "2/4 accepted · 50%",
  );
  await page
    .getByRole("checkbox", {
      name: "GitLab unavailable on first migration delivery",
    })
    .check();
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(page.locator(".simulation-sync")).toContainText(
    "GitLab retry required",
  );
  await expect(
    page
      .locator(".simulation-sync > span")
      .filter({ hasText: "Moodle context" }),
  ).toContainText("v3");
  await expect(
    page
      .locator(".simulation-sync > span")
      .filter({ hasText: "GitLab projection" }),
  ).toContainText("v1");
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(page.locator(".simulation-sync")).toContainText("0 pending");
  await expect(
    page.getByRole("button", { name: "Next event", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Open this result in statistics" })
    .click();
  await expect(page.getByTestId("student-card")).toContainText("v3 · R3");
  await expect(page.getByTestId("report-progress")).toHaveText("50%");
});

test("Java includes group templates, non-credit MR review, confirmed Discord deadlines and independent course runs", async ({
  page,
}) => {
  await page.goto("/#simulation/java");
  await expect(
    page.getByRole("combobox", { name: "Course type", exact: true }),
  ).toHaveValue("java");
  await event(page, "Import the group assignment template").click();
  await expect(page.getByTestId("simulation-record")).toContainText(
    "Not pinned",
  );
  await event(page, "Run tests and AI-assisted review").click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "2/30 accepted",
  );
  await expect(page.getByTestId("simulation-java-status")).toContainText(
    "reviewed",
  );
  await expect(page.getByTestId("simulation-activities")).toContainText(
    "Under review",
  );
  await event(page, "Accept the practical assignment").click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "3/30 accepted",
  );
  const practice = page
    .getByTestId("simulation-activities")
    .locator(".block")
    .last();
  await expect(practice).toContainText("Accepted · No numeric grade");
  await event(page, "Read a deadline clarification").click();
  await expect(page.getByTestId("simulation-java-status")).toContainText(
    "proposed",
  );
  await expect(page.getByTestId("simulation-java-status")).not.toContainText(
    "2026-10-22",
  );
  await event(page, "Confirm the deadline change").click();
  await expect(page.getByTestId("simulation-java-status")).toContainText(
    "confirmed",
  );
  await expect(page.getByTestId("simulation-java-status")).toContainText(
    "2026-10-22 20:59:00 UTC",
  );
  await event(page, "Assign an individual learning track").click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "3/4 accepted",
  );
  await page
    .locator(".simulation-course-cards button")
    .filter({ hasText: "Foundations of AI" })
    .click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Not enrolled",
  );
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await page
    .locator(".simulation-course-cards button")
    .filter({ hasText: "Java Dual" })
    .click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "3/4 accepted",
  );
  await page.evaluate(() => {
    location.hash = "#concepts";
  });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "From one action to a complete course",
  );
  await page.evaluate(() => {
    location.hash = "#simulation/java";
  });
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "3/4 accepted",
  );
  await page.getByRole("button", { name: "Reset journey" }).click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Not enrolled",
  );
  await page
    .locator(".simulation-course-cards button")
    .filter({ hasText: "Foundations of AI" })
    .click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Enrolled",
  );
  expect(await page.locator("main").innerText()).not.toMatch(
    /\p{Script=Cyrillic}/u,
  );
});

test("automatic policy pauses when disabled or incomplete and the resumed journey remains accessible", async ({
  page,
}) => {
  await page.goto("/#simulation/ai");
  await page
    .getByRole("combobox", { name: "Simulation migration mode" })
    .selectOption("automatic");
  await event(page, "Run the automatic migration policy").click();
  await expect(page.getByTestId("simulation-event")).toContainText(
    "disabled by the course owner",
  );
  await page
    .getByRole("checkbox", {
      name: "Course owner enabled the automatic policy",
    })
    .check();
  await expect(page.getByTestId("simulation-event")).toContainText(
    "does not allow new obligations",
  );
  const waiting = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(waiting.violations).toEqual([]);
  await page
    .getByRole("checkbox", { name: "Policy allows reassessment and new work" })
    .check();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Pinned v3",
  );
  await expect(
    page.getByRole("button", { name: "Next event", exact: true }),
  ).toBeEnabled();
  await event(page, "Reconcile and retry pending delivery").click();
  const final = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(final.violations).toEqual([]);
  expect(await page.locator("main").innerText()).not.toMatch(
    /\p{Script=Cyrillic}/u,
  );
});

test("autoplay traverses transfers, can be paused, and reduced-motion disables moving arrows", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#simulation/ai");
  await page.getByRole("button", { name: "Play journey" }).click();
  await page.clock.runFor(2300);
  await expect(page.getByTestId("simulation-event")).toContainText(
    "Enroll in the course",
  );
  await page.clock.runFor(2300);
  await expect(
    page.locator(".transfer-tabs button[aria-pressed=true]"),
  ).toContainText("LearningAtlas");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const position = await page.getByTestId("simulation-position").innerText();
  await page.clock.runFor(30000);
  await expect(page.getByTestId("simulation-position")).toHaveText(position);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const animation = await page
    .locator(".graph-edge.edge-active path")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
  await page.getByRole("button", { name: "Previous event" }).click();
  await expect(page.getByTestId("simulation-live-summary")).toContainText(
    "Not enrolled",
  );
  await page
    .getByRole("combobox", { name: "Simulation migration mode" })
    .selectOption("automatic");
  await page
    .getByRole("checkbox", {
      name: "Course owner enabled the automatic policy",
    })
    .check();
  await page
    .getByRole("checkbox", { name: "Policy allows reassessment and new work" })
    .check();
  await event(page, "Reconcile and retry pending delivery").click();
  await page.getByRole("button", { name: "Play journey", exact: true }).click();
  await page.clock.runFor(2300);
  await expect(
    page.locator(".transfer-tabs button[aria-pressed=true]"),
  ).toContainText("Moodle");
  await page.clock.runFor(2300);
  await expect(
    page.locator(".transfer-tabs button[aria-pressed=true]"),
  ).toContainText("LearningAtlas");
  await expect(
    page.getByRole("button", { name: "Play journey", exact: true }),
  ).toBeDisabled();
});
